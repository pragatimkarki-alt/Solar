const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart;
let history = [];

const costPerKwh = 6;

const weatherMap = {
  Sunny: 2,
  Cloudy: 1,
  Rainy: 0
};

// Appliance power ratings
const power = {
  fan: 75,
  light: 10,
  tv: 100,
  fridge: 150,
  ac: 1500,
  geyser: 2000
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

// Appliance consumption
function getApplianceConsumption(name) {
  let checked = document.getElementById(name + "Check").checked;
  if (!checked) return 0;

  let count = Number(document.getElementById(name + "Count").value || 0);
  let hours = Number(document.getElementById(name + "Hours").value || 0);

  return (power[name] * count * hours) / 1000;
}

// Suggestions
function generateSuggestion(solar, consumption, weather) {
  if (solar >= consumption)
    return "✅ Solar sufficient – Use appliances during daytime";
  else if (weather === "Rainy")
    return "⚠️ Rainy day – Depend more on grid";
  else if (weather === "Cloudy")
    return "🌥️ Moderate solar – Avoid heavy loads";
  else
    return "⚠️ High consumption – Reduce usage";
}

// Main function
async function getPrediction() {

  const temp = document.getElementById("temp").value;
  const sunlight = document.getElementById("sunlight").value;
  const weather = document.getElementById("weather").value;

  if (!temp || !sunlight || !weather) {
    alert("Please fill all fields");
    return;
  }

  const solar = calculateSolar(Number(sunlight), weather);

  // Appliance consumption
  let applianceConsumption = 0;

  applianceConsumption += getApplianceConsumption("fan");
  applianceConsumption += getApplianceConsumption("light");
  applianceConsumption += getApplianceConsumption("tv");
  applianceConsumption += getApplianceConsumption("fridge");
  applianceConsumption += getApplianceConsumption("ac");
  applianceConsumption += getApplianceConsumption("geyser");

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

    const mlConsumption = data.predicted_consumption;

    const consumption = applianceConsumption > 0 ? applianceConsumption : mlConsumption;

    const grid = Math.max(0, consumption - solar);

    const gridCost = grid * costPerKwh;
    const totalCost = consumption * costPerKwh;
    const savings = totalCost - gridCost;

    document.getElementById("result").innerHTML = `
      <b>Solar:</b> ${solar.toFixed(2)} kWh<br>
      <b>Appliance Consumption:</b> ${applianceConsumption.toFixed(2)} kWh<br>
      <b>ML Prediction:</b> ${mlConsumption.toFixed(2)} kWh<br>
      <b>Final Consumption:</b> ${consumption.toFixed(2)} kWh<br>
      <b>Grid Usage:</b> ${grid.toFixed(2)} kWh<br><br>

      💰 <b>Grid Cost:</b> ₹${gridCost.toFixed(2)}<br>
      💡 <b>Savings:</b> ₹${savings.toFixed(2)}
    `;

    document.getElementById("suggestion").innerHTML =
      generateSuggestion(solar, consumption, weather);

    history.push({ solar, consumption, grid });

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
        { label: "Solar", data: history.map(h => h.solar) },
        { label: "Consumption", data: history.map(h => h.consumption) },
        { label: "Grid", data: history.map(h => h.grid) }
      ]
    },
    options: {
      responsive: true
    }
  });
}
