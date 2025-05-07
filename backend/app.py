from flask import Flask, request, jsonify # type: ignore
from flask_cors import CORS  # type: ignore # Flask-CORS'i içe aktarın
import joblib # type: ignore
import numpy as np
import math

app = Flask(__name__)

# CORS'u etkinleştir
CORS(app)

# Modelleri ve encoder'ları yükle
model_home = joblib.load('model_home.pkl')
model_away = joblib.load('model_away.pkl')
le_home = joblib.load('le_home.pkl')
le_away = joblib.load('le_away.pkl')
le_tour = joblib.load('le_tour.pkl')

# Poisson olasılıklarını hesaplama fonksiyonu
def calculate_poisson_probability(lambda_, k):
    return (math.pow(lambda_, k) * math.exp(-lambda_)) / math.factorial(k)

# Olasılıkları normalize etme fonksiyonu
def normalize_probabilities(probs):
    total_prob = sum(probs.values())
    normalized_probs = {goal: (prob / total_prob) * 100 for goal, prob in probs.items()}
    return normalized_probs

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    
    # Girdi verilerini al ve encode et
    home_team = le_home.transform([data['home_team']])[0]
    away_team = le_away.transform([data['away_team']])[0]
    tournament = le_tour.transform([data['tournament']])[0]
    neutral = data['neutral']
    year = data['year']
    
    # Özellikleri düzenle
    features = np.array([[home_team, away_team, tournament, neutral, year]])
    
    # Tahminleri al
    home_score = model_home.predict(features)[0]
    away_score = model_away.predict(features)[0]
    
    # Gol olasılıklarını hesapla (0-5 gol arası)
    home_goal_probs = {i: calculate_poisson_probability(home_score, i) for i in range(6)}
    away_goal_probs = {i: calculate_poisson_probability(away_score, i) for i in range(6)}
    
    # Olasılıkları normalize et
    normalized_home_probs = normalize_probabilities(home_goal_probs)
    normalized_away_probs = normalize_probabilities(away_goal_probs)
    
    # Sonuçları döndür
    return jsonify({
        'home_score': home_score,
        'away_score': away_score,
        'home_goal_probs': normalized_home_probs,
        'away_goal_probs': normalized_away_probs
    })

if __name__ == '__main__':
    app.run(debug=True)
