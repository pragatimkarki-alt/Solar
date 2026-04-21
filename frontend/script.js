const API_URL = "https://solar-rzmj.onrender.com/predict";

let chart;
let history = [];

async function getPrediction() {
  const solar = document.getElementById("solar").value;
  const temp = document.getElementById("temp").value;
  const sunlight = document.getElementById("sunlight").value;

  if (!solar || !temp || !sunlight) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        solar_kwh: Number(solar),
        temperature: Number(temp),
        sunlight_hours: Number(sunlight)
      })
    });

    const data = await res.json();

    // Show result
    document.getElementById("result").innerHTML = `
      <p><strong>Consumption:</strong> ${data.predicted_consumption} kWh</p>
      <p><strong>Status:</strong> ${data.status}</p>
    `;

    if (data.status === "Use Grid") {
      alert("⚠️ Solar insufficient – using grid");
    }

    // Save history
    history.push({
      solar: Number(solar),
      consumption: data.predicted_consumption
    });

    updateChart();

  } catch (err) {
    alert("Backend not reachable (Render may be sleeping)");
  }
}

function updateChart() {
  const labels = history.map((_, i) => `Run ${i + 1}`);
  const solarData = history.map(h => h.solar);
  const consumptionData = history.map(h => h.consumption);

  if (chart) chart.destroy();

  const ctx = document.getElementById("chart").getContext("2d");

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Solar Input",
          data: solarData
        },
        {
          label: "Predicted Consumption",
          data: consumptionData
        }
      ]
    }
  });
}
