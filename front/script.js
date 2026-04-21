const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart, yearChart;
let history = [];

let batteryCapacity = 10;
let batteryLevel = 5;

const costPerKwh = 6; // ₹

const weatherMap = { Sunny: 2, Cloudy: 1, Rainy: 0 };

function calculateSolar(sunlight, weather) {
  const factor = { Sunny: 1, Cloudy: 0.6, Rainy: 0.3 };
  return sunlight * 0.7 * 5 * factor[weather];
}

function generateSuggestion(solar, consumption) {
  if (solar >= consumption)
    return "✅ Use appliances during day to maximize solar usage";
  else
    return "⚠️ Reduce load or depend on grid";
}

function getSeasonalSunlight(day) {
  return 6 + 2 * Math.sin((2 * Math.PI * day) / 365);
}

async function getPrediction() {
  const temp = document.getElementById("temp").value;
  const sunlight = document.getElementById("sunlight").value;
  const weather = document.getElementById("weather").value;

  if (!temp || !sunlight || !weather) {
    alert("Fill all fields");
    return;
  }

  const solar = calculateSolar(Number(sunlight), weather);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      solar_kwh: solar,
      temperature: Number(temp),
      sunlight_hours: Number(sunlight),
      weather_encoded: weatherMap[weather]
    })
  });

  const data = await res.json();

  let consumption = data.predicted_consumption;
  let surplus = solar - consumption;
  let grid = 0;

  if (surplus > 0) {
    batteryLevel = Math.min(batteryCapacity, batteryLevel + surplus);
  } else {
    let need = Math.abs(surplus);
    if (batteryLevel >= need) batteryLevel -= need;
    else {
      grid = need - batteryLevel;
      batteryLevel = 0;
    }
  }

  // 💰 COST CALCULATION
  let gridCost = grid * costPerKwh;
  let totalCostWithoutSolar = consumption * costPerKwh;
  let savings = totalCostWithoutSolar - gridCost;

  document.getElementById("result").innerHTML = `
    Solar: ${solar.toFixed(2)} kWh <br>
    Consumption: ${consumption.toFixed(2)} kWh <br>
    Battery: ${batteryLevel.toFixed(2)} kWh <br>
    Grid: ${grid.toFixed(2)} kWh <br><br>

    💰 Grid Cost: ₹${gridCost.toFixed(2)} <br>
    💡 Savings: ₹${savings.toFixed(2)}
  `;

  document.getElementById("suggestion").innerHTML =
    generateSuggestion(solar, consumption);

  history.push({ solar, consumption, grid });

  updateChart();
  generateYearChart();
}

function updateChart() {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: history.map((_, i) => `Run ${i+1}`),
      datasets: [
        { label: "Solar", data: history.map(h => h.solar) },
        { label: "Consumption", data: history.map(h => h.consumption) },
        { label: "Grid", data: history.map(h => h.grid) }
      ]
    }
  });
}

async function generateYearChart() {
  let solarArr=[], consArr=[], gridArr=[], costArr=[];

  for (let i=0;i<365;i++) {
    let temp = 25 + Math.random()*10;
    let sunlight = getSeasonalSunlight(i);
    let weather = ["Sunny","Cloudy","Rainy"][Math.floor(Math.random()*3)];

    let solar = calculateSolar(sunlight, weather);

    let res = await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        solar_kwh:solar,
        temperature:temp,
        sunlight_hours:sunlight,
        weather_encoded:weatherMap[weather]
      })
    });

    let data = await res.json();

    let consumption = data.predicted_consumption;
    let grid = Math.max(0, consumption - solar);

    solarArr.push(solar);
    consArr.push(consumption);
    gridArr.push(grid);
    costArr.push(grid * costPerKwh);
  }

  if (yearChart) yearChart.destroy();

  yearChart = new Chart(document.getElementById("yearChart"), {
    type: "line",
    data: {
      labels: Array.from({length:365},(_,i)=>i+1),
      datasets: [
        { label:"Solar", data:solarArr },
        { label:"Consumption", data:consArr },
        { label:"Grid", data:gridArr },
        { label:"Cost (₹)", data:costArr }
      ]
    }
  });

  generateMonthlyAnalytics(solarArr, consArr, gridArr, costArr);
}

function generateMonthlyAnalytics(solar, cons, grid, cost) {
  let months = Array(12).fill(0).map(()=>({solar:0,cons:0,grid:0,cost:0}));

  for (let i=0;i<365;i++){
    let m=Math.floor(i/30);
    months[m].solar+=solar[i];
    months[m].cons+=cons[i];
    months[m].grid+=grid[i];
    months[m].cost+=cost[i];
  }

  let html="<h3>📊 Monthly Cost Analysis</h3>";

  months.forEach((m,i)=>{
    html+=`Month ${i+1} → ₹${m.cost.toFixed(0)} (Grid)<br>`;
  });

  document.getElementById("monthly").innerHTML=html;
}
