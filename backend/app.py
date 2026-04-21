from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load trained model
model = joblib.load("energy_model.pkl")

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

        input_df = pd.DataFrame({
            "solar_kwh": [solar],
            "temperature": [temp],
            "sunlight_hours": [sunlight]
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
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
