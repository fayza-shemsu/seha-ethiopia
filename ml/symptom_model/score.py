import joblib
import pandas as pd
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# SETUP GROQ
# ============================================================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ============================================================
# LOAD MODEL
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "symptom_model.pkl")
model = joblib.load(MODEL_PATH)
FEATURE_COLUMNS = model.feature_names_in_.tolist()

# ============================================================
# TRIAGE RULES
# ============================================================
TRIAGE_MAP = {
    "Malaria": "HIGH", "Typhoid": "HIGH", "Tuberculosis": "HIGH",
    "Pneumonia": "HIGH", "Meningitis": "EMERGENCY", "Dengue": "HIGH",
    "Hepatitis B": "MEDIUM", "Hepatitis C": "MEDIUM", "Hepatitis D": "MEDIUM",
    "Hepatitis E": "MEDIUM", "AIDS": "HIGH", "Diabetes": "MEDIUM",
    "Hypertension": "MEDIUM", "Heart attack": "EMERGENCY", "Stroke": "EMERGENCY",
    "Jaundice": "MEDIUM", "Chickenpox": "LOW", "Common Cold": "LOW",
    "Fungal infection": "LOW", "Allergy": "LOW", "GERD": "LOW",
    "Chronic cholestasis": "MEDIUM", "Drug Reaction": "MEDIUM",
    "Peptic ulcer diseae": "MEDIUM", "Urinary tract infection": "MEDIUM",
    "Varicose veins": "LOW", "Hypothyroidism": "MEDIUM", "Hyperthyroidism": "MEDIUM",
    "Hypoglycemia": "HIGH", "Osteoarthristis": "LOW", "Arthritis": "LOW",
    "Paralysis (brain hemorrhage)": "EMERGENCY", "Acne": "LOW", "Urticaria": "LOW",
    "Psoriasis": "LOW", "Impetigo": "LOW", "Migraine": "MEDIUM",
    "Cervical spondylosis": "LOW", "Bronchial Asthma": "HIGH",
    "Dimorphic hemmorhoids(piles)": "LOW", "Gastroenteritis": "MEDIUM",
}

WHAT_TO_DO = {
    "HIGH":      "Please visit a health center or clinic as soon as possible.",
    "MEDIUM":    "Monitor your symptoms. See a doctor if they worsen.",
    "LOW":       "Rest and stay hydrated. Consult a pharmacist if needed.",
    "EMERGENCY": "Go to the nearest emergency room immediately!",
}

# ============================================================
# GROQ EXPLANATION
# ============================================================
def get_explanation(disease: str, triage: str) -> str:
    try:
        prompt = (
            f"Explain '{disease}' in simple language for a non-doctor in Ethiopia. "
            f"Keep it under 60 words total. "
            f"First one sentence in English. Then one sentence in Amharic. "
            f"Then: what to do next for triage level '{triage}'."
        )
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq error: {e}")
        return WHAT_TO_DO.get(triage, "Please consult a doctor.")

# ============================================================
# PREDICT FUNCTION
# ============================================================
def predict(symptoms: list) -> dict:
    input_row = {col: 0 for col in FEATURE_COLUMNS}
    for symptom in symptoms:
        key = symptom.strip().lower().replace(" ", "_")
        if key in input_row:
            input_row[key] = 1

    input_df = pd.DataFrame([input_row])
    probabilities = model.predict_proba(input_df)[0]
    classes = model.classes_

    sorted_results = sorted(
        zip(classes, probabilities),
        key=lambda x: x[1],
        reverse=True
    )[:3]

    predictions = []
    for disease, prob in sorted_results:
        if prob < 0.01:
            continue
        triage = TRIAGE_MAP.get(disease, "MEDIUM")
        explanation = get_explanation(disease, triage)
        predictions.append({
            "disease": disease,
            "probability": round(float(prob) * 100, 1),
            "triage": triage,
            "explanation": explanation,
            "what_to_do": WHAT_TO_DO[triage]
        })

    return {"predictions": predictions}
