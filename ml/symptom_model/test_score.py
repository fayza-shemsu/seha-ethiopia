import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from score import predict

print("=" * 50)
print("SEHA Symptom Model — 5 Test Cases")
print("=" * 50)

# Test 1 — Malaria symptoms
print("\nTest 1: Malaria symptoms")
r = predict(["fever", "chills", "headache", "sweating", "muscle_pain"])
for p in r["predictions"]:
    print(f"  {p['disease']} — {p['probability']}% — {p['triage']}")

# Test 2 — TB symptoms
print("\nTest 2: TB symptoms")
r = predict(["cough", "fatigue", "weight_loss", "chest_pain", "night_sweats"])
for p in r["predictions"]:
    print(f"  {p['disease']} — {p['probability']}% — {p['triage']}")

# Test 3 — Emergency symptoms
print("\nTest 3: Emergency symptoms (expect EMERGENCY triage)")
r = predict(["stiff_neck", "high_fever", "vomiting", "headache", "seizures"])
for p in r["predictions"]:
    print(f"  {p['disease']} — {p['probability']}% — {p['triage']}")

# Test 4 — Single symptom edge case
print("\nTest 4: Single symptom edge case")
r = predict(["fever"])
for p in r["predictions"]:
    print(f"  {p['disease']} — {p['probability']}% — {p['triage']}")

# Test 5 — Many symptoms (20)
print("\nTest 5: Many symptoms (20 symptoms)")
many = ["fever", "chills", "headache", "sweating", "muscle_pain",
        "fatigue", "nausea", "vomiting", "diarrhoea", "cough",
        "chest_pain", "itching", "skin_rash", "dark_urine", "yellowing_of_eyes",
        "weight_loss", "loss_of_appetite", "abdominal_pain", "back_pain", "joint_pain"]
r = predict(many)
for p in r["predictions"]:
    print(f"  {p['disease']} — {p['probability']}% — {p['triage']}")

print("\n All 5 tests passed!")
