import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement);

function App() {
  const [solar, setSolar] = useState("");
  const [temp, setTemp] = useState("");
  const [sunlight, setSunlight] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const getPrediction = async () => {
    const res = await fetch("http://127.0.0.1:5000/predict", {
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
    setResult(data);

    // Store history for chart
    setHistory(prev => [
      ...prev,
      {
        solar: Number(solar),
        consumption: data.predicted_consumption
      }
    ]);

    if (data.status === "Use Grid") {
      alert("⚠️ Solar insufficient – using grid");
    }
  };

  const chartData = {
    labels: history.map((_, i) => `Run ${i + 1}`),
    datasets: [
      {
        label: "Solar Input",
        data: history.map(h => h.solar)
      },
      {
        label: "Predicted Consumption",
        data: history.map(h => h.consumption)
      }
    ]
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>🌞 Solar Energy Dashboard</h1>

      <input
        placeholder="Solar kWh"
        value={solar}
        onChange={(e) => setSolar(e.target.value)}
      /><br /><br />

      <input
        placeholder="Temperature (°C)"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
      /><br /><br />

      <input
        placeholder="Sunlight Hours"
        value={sunlight}
        onChange={(e) => setSunlight(e.target.value)}
      /><br /><br />

      <button onClick={getPrediction}>Predict</button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Consumption: {result.predicted_consumption} kWh</h3>
          <h2>{result.status}</h2>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ width: "60%", margin: "auto", marginTop: "40px" }}>
          <Bar data={chartData} />
        </div>
      )}
    </div>
  );
}

export default App;
