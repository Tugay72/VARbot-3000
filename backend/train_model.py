import pandas as pd # type: ignore
from sklearn.model_selection import train_test_split # type: ignore
from sklearn.ensemble import RandomForestRegressor # type: ignore
from sklearn.preprocessing import LabelEncoder # type: ignore
import joblib # type: ignore

# CSV'yi oku
df = pd.read_csv("results.csv")

# Tarihi yıla çevir, neutral kolonunu sayısala çevir
df['year'] = pd.to_datetime(df['date']).dt.year
df['neutral'] = df['neutral'].astype(str).str.upper().map({'FALSE': 0, 'TRUE': 1})

# Label encoding
le_home = LabelEncoder()
le_away = LabelEncoder()
le_tour = LabelEncoder()

df['home_team_enc'] = le_home.fit_transform(df['home_team'])
df['away_team_enc'] = le_away.fit_transform(df['away_team'])
df['tournament_enc'] = le_tour.fit_transform(df['tournament'])

# Özellikler
features = ['home_team_enc', 'away_team_enc', 'tournament_enc', 'neutral', 'year']
X = df[features]
y_home = df['home_score']
y_away = df['away_score']

# Home için train-test split
X_train_home, X_test_home, y_train_home, y_test_home = train_test_split(
    X, y_home, test_size=0.2, random_state=42
)

# Away için train-test split
X_train_away, X_test_away, y_train_away, y_test_away = train_test_split(
    X, y_away, test_size=0.2, random_state=42
)

# Model eğitimleri
model_home = RandomForestRegressor(n_estimators=100, random_state=42)
model_away = RandomForestRegressor(n_estimators=100, random_state=42)

model_home.fit(X_train_home, y_train_home)
model_away.fit(X_train_away, y_train_away)

# Kaydet
joblib.dump(model_home, 'model_home.pkl')
joblib.dump(model_away, 'model_away.pkl')
joblib.dump(le_home, 'le_home.pkl')
joblib.dump(le_away, 'le_away.pkl')
joblib.dump(le_tour, 'le_tour.pkl')

print("Modeller ve encoder'lar başarıyla kaydedildi.")
