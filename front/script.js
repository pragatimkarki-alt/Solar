const API_URL = "https://solar-rzmj.onrender.com/predict";

// 🔑 Replace with your actual API key
const WEATHER_API_KEY = "OPEN";

let chart;
let history = [];

// 🌡️ Get temperature automatically
async function getTemperature() {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Bangalore&appid=${WEATHER_API_KEY}&units=metric`
    );

    const data = await res.json();
    document.getElementById("temp").value = data.main.temp.toFixed(1);

  } catch (err) {
    alert("Failed to fetch temperature");
  }
}

// 🔮 Main function
async function getPrediction() {
  const sunlight = document.getElementById("sunlight").value;
  const temp = document.getElementById("temp").value;

  if (!sunlight || !temp) {
    alert("Please fill all fields");
    return;
  }

  // ☀️ Solar generation formula
  const solarGeneration = Number(sunlight) * 0.7 * 5;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        solar_kwh: solarGeneration,
        temperature: Number(temp),
        sunlight_hours: Number(sunlight)
      })
    });

    const data = await res.json();

    // 🔌 Grid calculation
    const gridUsage = Math.max(0, data.predicted_consumption - solarGeneration);

    // 📊 Display results
    document.getElementById("result").innerHTML = `
      <p><b>Solar Generation:</b> ${solarGeneration.toFixed(2)} kWh</p>
      <p><b>Consumption:</b> ${data.predicted_consumption} kWh</p>
      <p><b>Grid Usage:</b> ${gridUsage.toFixed(2)} kWh</p>
      <p><b>Status:</b> ${gridUsage > 0 ? "⚠️ Use Grid" : "✅ Solar sufficient"}</p>
    `;

    // Save history
    history.push({
      solar: solarGeneration,
      consumption: data.predicted_consumption,
      grid: gridUsage
    });

    updateChart();

  } catch (err) {
    alert("Backend not reachable (Render may be sleeping)");
  }
}

// 📈 Chart update
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
