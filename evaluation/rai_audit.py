import pandas as pd
import joblib
import json
import shap
import numpy as np
from sklearn.metrics import accuracy_score

# ============================================================
# LOAD MODEL AND TEST DATA
# ============================================================
model = joblib.load("ml/symptom_model/symptom_model.pkl")

test_df = pd.read_csv("data/processed/symptoms_test.csv")
X_test = test_df.drop("disease", axis=1)
y_test = test_df["disease"]

# ============================================================
# OVERALL ACCURACY
# ============================================================
predictions = model.predict(X_test)
accuracy = round(accuracy_score(y_test, predictions) * 100, 2)
print(f"Model Accuracy: {accuracy}%")

# ============================================================
# SHAP — TOP 10 SYMPTOMS
# ============================================================
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

shap_array = np.abs(shap_values)
if shap_array.ndim == 3:
    mean_shap = shap_array.mean(axis=(0, 2))
else:
    mean_shap = shap_array.mean(axis=0)

feature_names = X_test.columns.tolist()
shap_df = pd.DataFrame({
    "symptom": feature_names,
    "importance": mean_shap
}).sort_values("importance", ascending=False)

top_10 = shap_df.head(10)
print("\nTop 10 symptoms driving predictions:")
print(top_10.to_string(index=False))
top_features = top_10["symptom"].tolist()

# ============================================================
# FAIRNESS CHECK — per disease group
# ============================================================
test_df = test_df.copy()
test_df["prediction"] = predictions
fairness_flags = []
group_accuracies = {}

for disease, group in test_df.groupby("disease"):
    acc = round((group["prediction"] == group["disease"]).mean() * 100, 2)
    group_accuracies[disease] = acc
    if acc < (accuracy - 5):
        fairness_flags.append({
            "disease": disease,
            "group_accuracy": acc,
            "overall_accuracy": accuracy,
            "gap": round(accuracy - acc, 2)
        })

if fairness_flags:
    print(f"\n Fairness flags ({len(fairness_flags)} diseases below threshold):")
    for f in fairness_flags:
        print(f"  {f['disease']}: {f['group_accuracy']}% (gap: {f['gap']}%)")
else:
    print("\n No fairness issues — all diseases within 5% of overall accuracy")

# ============================================================
# SAVE OUTPUTS
# ============================================================
rai_summary = {
    "model_accuracy": accuracy,
    "top_features": top_features,
    "fairness_flags": fairness_flags
}

fairness_report = {
    "overall_accuracy": accuracy,
    "per_disease_accuracy": group_accuracies,
    "flagged_diseases": fairness_flags
}

with open("evaluation/rai_summary.json", "w") as f:
    json.dump(rai_summary, f, indent=4)

with open("evaluation/fairness_report.json", "w") as f:
    json.dump(fairness_report, f, indent=4)

print("\n Saved: evaluation/rai_summary.json")
print(" Saved: evaluation/fairness_report.json")
