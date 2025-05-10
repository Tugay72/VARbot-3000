import pandas as pd
from collections import defaultdict
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib

# -------------------------------
# Elo güncelleme fonksiyonu
# -------------------------------
def update_elo(rating_a, rating_b, score_a, score_b, K=30):
    expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    actual_a = 1 if score_a > score_b else 0.5 if score_a == score_b else 0
    new_rating_a = rating_a + K * (actual_a - expected_a)
    new_rating_b = rating_b + K * ((1 - actual_a) - (1 - expected_a))
    return new_rating_a, new_rating_b

# -------------------------------
# Veri yükleme ve ön işleme
# -------------------------------
df = pd.read_csv("results.csv")

# Yıl ve nötr alan dönüştürmeleri
df['year'] = pd.to_datetime(df['date']).dt.year
df['neutral'] = df['neutral'].astype(str).str.upper().map({'FALSE': 0, 'TRUE': 1})

# Label encoding
le_home = LabelEncoder()
le_away = LabelEncoder()
le_tour = LabelEncoder()

df['home_team_enc'] = le_home.fit_transform(df['home_team'])
df['away_team_enc'] = le_away.fit_transform(df['away_team'])
df['tournament_enc'] = le_tour.fit_transform(df['tournament'])

# -------------------------------
# Elo hesaplama (tarihe göre sıralı)
# -------------------------------
elo_dict = defaultdict(lambda: 1500)
home_elos = []
away_elos = []

df = df.sort_values('date')

for _, row in df.iterrows():
    home = row['home_team']
    away = row['away_team']
    score_home = row['home_score']
    score_away = row['away_score']

    home_elo = elo_dict[home]
    away_elo = elo_dict[away]

    home_elos.append(home_elo)
    away_elos.append(away_elo)

    new_home_elo, new_away_elo = update_elo(home_elo, away_elo, score_home, score_away)
    elo_dict[home] = new_home_elo
    elo_dict[away] = new_away_elo

# ELO çarpanı (modelin daha iyi öğrenmesi için büyütüyoruz)
ELO_MULTIPLIER = 5.0
df['home_elo'] = [round(e * ELO_MULTIPLIER, 2) for e in home_elos]
df['away_elo'] = [round(e * ELO_MULTIPLIER, 2) for e in away_elos]
df['elo_diff'] = df['home_elo'] - df['away_elo']

# ELO sıralamasını CSV'ye kaydet
elo_df = pd.DataFrame(elo_dict.items(), columns=['team', 'elo_rating'])
elo_df = elo_df.sort_values(by='elo_rating', ascending=False)
elo_df.to_csv('team_elo_ratings.csv', index=False)
print("✅ Elo puanları 'team_elo_ratings.csv' dosyasına kaydedildi.")

# -------------------------------
# Özellik seçimi ve model verisi
# -------------------------------
features = ['home_team_enc', 'away_team_enc', 'tournament_enc', 'neutral', 'year', 'home_elo', 'away_elo', 'elo_diff']
X = df[features]
y_home = df['home_score']
y_away = df['away_score']

# -------------------------------
# Eğitim / test ayrımı
# -------------------------------
X_train_home, X_test_home, y_train_home, y_test_home = train_test_split(X, y_home, test_size=0.2, random_state=42)
X_train_away, X_test_away, y_train_away, y_test_away = train_test_split(X, y_away, test_size=0.2, random_state=42)

# -------------------------------
# Model eğitimi
# -------------------------------
model_home = RandomForestRegressor(n_estimators=300, max_depth=20, random_state=42)
model_away = RandomForestRegressor(n_estimators=300, max_depth=20, random_state=42)

model_home.fit(X_train_home, y_train_home)
model_away.fit(X_train_away, y_train_away)

# -------------------------------
# Kaydetme
# -------------------------------
joblib.dump(model_home, 'model_home.pkl')
joblib.dump(model_away, 'model_away.pkl')
joblib.dump(le_home, 'le_home.pkl')
joblib.dump(le_away, 'le_away.pkl')
joblib.dump(le_tour, 'le_tour.pkl')

print("✅ Modeller ve encoder'lar başarıyla kaydedildi.")
