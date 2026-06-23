from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)

def test_check_symptoms_returns_predictions():
    """Normal case: a few symptoms should return predictions."""
    response = client.post("/symptoms/check", json={
        "symptoms": ["fever", "chills", "headache"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) > 0
    assert "disease" in data["predictions"][0]
    assert "triage" in data["predictions"][0]

def test_check_symptoms_empty_list():
    """Edge case: empty symptoms list should return 400."""
    response = client.post("/symptoms/check", json={"symptoms": []})
    assert response.status_code == 400

def test_check_symptoms_single_symptom():
    """Edge case: a single symptom should still work."""
    response = client.post("/symptoms/check", json={"symptoms": ["fever"]})
    assert response.status_code == 200
    assert "predictions" in response.json()

def test_check_symptoms_many_symptoms():
    """Edge case: a large number of symptoms should still work."""
    many_symptoms = [
        "fever", "chills", "headache", "nausea", "vomiting",
        "fatigue", "joint_pain", "skin_rash", "cough", "diarrhoea",
        "abdominal_pain", "dizziness", "weakness_in_limbs", "muscle_pain",
        "loss_of_appetite", "dehydration", "sweating", "back_pain",
        "constipation", "high_fever"
    ]
    response = client.post("/symptoms/check", json={"symptoms": many_symptoms})
    assert response.status_code == 200
    assert "predictions" in response.json()

def test_check_symptoms_invalid_symptom_ignored():
    """Edge case: unknown symptom names should be ignored, not crash."""
    response = client.post("/symptoms/check", json={
        "symptoms": ["not_a_real_symptom", "fever"]
    })
    assert response.status_code == 200
    assert "predictions" in response.json()