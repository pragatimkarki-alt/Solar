const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart;
let history = [];

// Weather encoding
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
      headers: {
        "Content-Type": "application/json"
      },
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
      <p><b>Solar Generation:</b> ${solar.toFixed(2)} kWh</p>
      <p><b>Consumption:</b> ${data.predicted_consumption.toFixed(2)} kWh</p>
      <p><b>Grid Usage:</b> ${grid.toFixed(2)} kWh</p>
      <p><b>Status:</b> ${grid > 0 ? "⚠️ Use Grid" : "✅ Solar sufficient"}</p>
    `;

    history.push({
      solar: solar,
      consumption: data.predicted_consumption,
      grid: grid
    });

    updateChart();

  } catch (err) {
    alert("Backend not reachable");
  }
}

// Chart update
function updateChart() {
  const labels = history.map((_, i) => `Run ${i + 1}`);

  if (chart) chart.destroy();

  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Solar Generation",
          data: history.map(h => h.solar),
          backgroundColor: "blue"
        },
        {
          label: "Consumption",
          data: history.map(h => h.consumption),
          backgroundColor: "orange"
        },
        {
          label: "Grid Usage",
          data: history.map(h => h.grid),
          backgroundColor: "red"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
