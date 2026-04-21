const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart;
let yearChart;
let history = [];

// Weather mapping
const weatherMap = {
  Sunny: 2,
  Cloudy: 1,
  Rainy: 0
};

// Solar calculation
function calculateSolar(sunlight, weather) {
  const factor = {
    Sunny: 1.0,
    Cloudy: 0.6,
    Rainy: 0.3
  };
  return sunlight * 0.7 * 5 * factor[weather];
}

// Smart suggestions
function generateSuggestion(solar, consumption, weather) {
  if (solar >= consumption) {
    return "✅ Use heavy appliances during daytime (Solar sufficient)";
  } else if (weather === "Rainy") {
    return "⚠️ Low solar generation. Use grid power carefully";
  } else if (weather === "Cloudy") {
    return "🌥️ Moderate solar. Avoid heavy loads";
  } else {
    return "⚠️ Consumption is high. Optimize usage";
  }
}

async function getPrediction() {
  const temp = document.getElementById("temp").value;
  const sunlight = document.getElementById("sunlight").value;
  const weather = document.getElementById("weather").value;

  if (!temp || !sunlight || !weather) {
    alert("Please fill all fields");
    return;
  }

  const solar = calculateSolar(Number(sunlight), weather);
  const weather_encoded = weatherMap[weather];

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        solar_kwh: solar,
        temperature: Number(temp),
        sunlight_hours: Number(sunlight),
        weather_encoded: weather_encoded
      })
    });

    const data = await res.json();

    const grid = Math.max(0, data.predicted_consumption - solar);

    document.getElementById("result").innerHTML = `
      <b>Solar:</b> ${solar.toFixed(2)} kWh<br>
      <b>Consumption:</b> ${data.predicted_consumption.toFixed(2)} kWh<br>
      <b>Grid:</b> ${grid.toFixed(2)} kWh<br>
      <b>Status:</b> ${grid > 0 ? "Use Grid" : "Solar sufficient"}
    `;

    document.getElementById("suggestion").innerHTML =
      generateSuggestion(solar, data.predicted_consumption, weather);

    history.push({
      solar,
      consumption: data.predicted_consumption,
      grid
    });

    updateChart();
    generateYearChart();

  } catch {
    alert("Backend not reachable");
  }
}

// Daily chart
function updateChart() {
  const labels = history.map((_, i) => `Run ${i + 1}`);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Solar", data: history.map(h => h.solar) },
        { label: "Consumption", data: history.map(h => h.consumption) },
        { label: "Grid", data: history.map(h => h.grid) }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// 1-year simulated chart
function generateYearChart() {
  const days = 365;

  let solar = [];
  let consumption = [];

  for (let i = 0; i < days; i++) {
    solar.push(Math.random() * 8);
    consumption.push(4 + Math.random() * 3);
  }

  if (yearChart) yearChart.destroy();

  yearChart = new Chart(document.getElementById("yearChart"), {
    type: "line",
    data: {
      labels: Array.from({ length: days }, (_, i) => i + 1),
      datasets: [
        { label: "Solar (Year)", data: solar },
        { label: "Consumption (Year)", data: consumption }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}
