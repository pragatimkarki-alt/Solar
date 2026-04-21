import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  const [solar, setSolar] = useState("");
  const [temp, setTemp] = useState("");
  const [sunlight, setSunlight] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const getPrediction = async () => {
    try {
      if (!solar || !temp || !sunlight) {
        alert("Please fill all fields");
        return;
      }

      const res = await fetch("https://solar-rzmj.onrender.com/predict", {
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

    } catch (err) {
      alert("Backend not reachable");
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

      <input type="number" placeholder="Solar kWh" value={solar} onChange={(e) => setSolar(e.target.value)} /><br /><br />
      <input type="number" placeholder="Temperature" value={temp} onChange={(e) => setTemp(e.target.value)} /><br /><br />
      <input type="number" placeholder="Sunlight Hours" value={sunlight} onChange={(e) => setSunlight(e.target.value)} /><br /><br />

      <button onClick={getPrediction}>Predict</button>

      {result && (
        <div>
          <h3>{result.predicted_consumption} kWh</h3>
          <h2>{result.status}</h2>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ width: "60%", margin: "auto" }}>
          <Bar data={chartData} />
        </div>
      )}
    </div>
  );
}

export default App;
