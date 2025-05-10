from flask import Flask, request, jsonify  # type: ignore
from flask_cors import CORS  # type: ignore
import joblib  # type: ignore
import numpy as np
import math
import pandas as pd

app = Flask(__name__)
CORS(app)

# Modelleri ve encoder'ları yükle
model_home = joblib.load('model_home.pkl')
model_away = joblib.load('model_away.pkl')
le_home = joblib.load('le_home.pkl')
le_away = joblib.load('le_away.pkl')
le_tour = joblib.load('le_tour.pkl')

# Elo verilerini oku
elo_df = pd.read_csv('team_elo_ratings.csv')
team_elo_dict = dict(zip(elo_df['team'], elo_df['elo_rating']))

# Poisson ve normalizasyon fonksiyonları
def calculate_poisson_probability(lambda_, k):
    return (math.pow(lambda_, k) * math.exp(-lambda_)) / math.factorial(k)

def normalize_probabilities(probs):
    total_prob = sum(probs.values())
    normalized_probs = {goal: round((prob / total_prob) * 100, 2) for goal, prob in probs.items()}
    return normalized_probs

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # Takım isimlerini al
    home_team_name = data['home_team']
    away_team_name = data['away_team']

    # Elo'yu isimlerle al (fallback 1500)
    home_elo = data.get('home_elo', team_elo_dict.get(home_team_name, 1500))
    away_elo = data.get('away_elo', team_elo_dict.get(away_team_name, 1500))
    print("Elo değerleri:", home_team_name, home_elo, "|", away_team_name, away_elo)

    # LabelEncoder dönüşümü
    home_team = le_home.transform([home_team_name])[0]
    away_team = le_away.transform([away_team_name])[0]
    tournament = le_tour.transform([data['tournament']])[0]
    neutral = data['neutral']
    year = data['year']
    elo_diff = home_elo - away_elo

    # Özellik vektörü
    features = np.array([[home_team, away_team, tournament, neutral, year, home_elo, away_elo, elo_diff]])

    # Skor tahmini
    home_score = model_home.predict(features)[0]
    away_score = model_away.predict(features)[0]

    # Elo farkına göre manuel skor farkı ekle
    elo_boost_threshold = 100
    boost_strength = 0.07

    print(home_score, away_score)

    if abs(elo_diff) > elo_boost_threshold:
        boost = (abs(elo_diff) - elo_boost_threshold) * boost_strength / 10
        if elo_diff > 0:
            home_score += boost
            away_score = max(0, away_score - boost * 0.5)
        else:
            away_score += boost
            home_score = max(0, home_score - boost * 0.5)

    print(home_score, away_score)

    # Gol olasılıkları (Poisson)
    home_goal_probs = {i: calculate_poisson_probability(home_score, i) for i in range(8)}
    away_goal_probs = {i: calculate_poisson_probability(away_score, i) for i in range(8)}

    normalized_home_probs = normalize_probabilities(home_goal_probs)
    normalized_away_probs = normalize_probabilities(away_goal_probs)

    # En yüksek olasılığa sahip skor tahmini
    home_score_most_likely = max(normalized_home_probs, key=normalized_home_probs.get)
    away_score_most_likely = max(normalized_away_probs, key=normalized_away_probs.get)

    return jsonify({
        'home_score': home_score_most_likely,
        'away_score': away_score_most_likely,
        'home_goal_probs': normalized_home_probs,
        'away_goal_probs': normalized_away_probs
    })

if __name__ == '__main__':
    app.run(debug=True)
