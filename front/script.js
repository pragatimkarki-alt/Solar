const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart;
let history = [];

const weatherMap = {
  Sunny: 2,
  Cloudy: 1,
  Rainy: 0
};

// Solar calculation
function calculateSolar(sunlight, weather) {
  const factor = {
    Sunny: 1,
    Cloudy: 0.6,
    Rainy: 0.3
  };
  return sunlight * 0.7 * 5 * factor[weather];
}

// Suggestions
function generateSuggestion(solar, consumption, weather) {
  if (solar >= consumption)
    return "✅ Use appliances during daytime (solar sufficient)";
  else if (weather === "Rainy")
    return "⚠️ Rainy day → low solar → depend on grid";
  else if (weather === "Cloudy")
    return "🌥️ Moderate solar → avoid heavy loads";
  else
    return "⚠️ High consumption → optimize usage";
}

// Main function
async function getPrediction() {
  const temp = document.getElementById("temp").value;
  const sunlight = document.getElementById("sunlight").value;
  const weather = document.getElementById("weather").value;
  const costPerKwh = Number(document.getElementById("cost").value); // ✅ NEW

  // ✅ Updated validation
  if (!temp || !sunlight || !weather || !costPerKwh) {
    alert("Please fill all fields");
    return;
  }

  const solar = calculateSolar(Number(sunlight), weather);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        solar_kwh: solar,
        temperature: Number(temp),
        sunlight_hours: Number(sunlight),
        weather_encoded: weatherMap[weather]
      })
    });

    const data = await res.json();

    const consumption = data.predicted_consumption;

    // Grid usage
    const grid = Math.max(0, consumption - solar);

    // ✅ Cost calculation using user input
    const gridCost = grid * costPerKwh;
    const totalCostWithoutSolar = consumption * costPerKwh;
    const savings = totalCostWithoutSolar - gridCost;

    document.getElementById("result").innerHTML = `
      <b>Solar:</b> ${solar.toFixed(2)} kWh<br>
      <b>Consumption:</b> ${consumption.toFixed(2)} kWh<br>
      <b>Grid Usage:</b> ${grid.toFixed(2)} kWh<br><br>

      💰 <b>Grid Cost:</b> ₹${gridCost.toFixed(2)}<br>
      💡 <b>Savings:</b> ₹${savings.toFixed(2)}
    `;

    document.getElementById("suggestion").innerHTML =
      generateSuggestion(solar, consumption, weather);

    history.push({
      solar,
      consumption,
      grid
    });

    updateChart();

  } catch (err) {
    console.error(err);
    alert("Backend not reachable");
  }
}

// Chart
function updateChart() {
  const labels = history.map((_, i) => `Run ${i + 1}`);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Solar",
          data: history.map(h => h.solar)
        },
        {
          label: "Consumption",
          data: history.map(h => h.consumption)
        },
        {
          label: "Grid",
          data: history.map(h => h.grid)
        }
      ]
    },
    options: {
      responsive: true
    }
  });
}
