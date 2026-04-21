from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load trained model
model = joblib.load("energy_model_1.pkl")

@app.route("/")
def home():
    return "Solar Energy API Running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        solar = float(data["solar_kwh"])
        temp = float(data["temperature"])
        sunlight = float(data["sunlight_hours"])
        weather = float(data["weather_encoded"])  # ✅ ADD THIS

        input_df = pd.DataFrame({
            "solar_kwh": [solar],
            "temperature": [temp],
            "sunlight_hours": [sunlight],
            "weather_encoded": [weather]  # ✅ ADD THIS
        })

        prediction = model.predict(input_df)[0]

        status = "Solar sufficient" if solar >= prediction else "Use Grid"

        return jsonify({
            "timestamp": str(datetime.now()),
            "predicted_consumption": round(prediction, 2),
            "solar_input": solar,
            "status": status
        })

    except Exception as e:
        print(e)  # 🔥 IMPORTANT (see error in logs)
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)







