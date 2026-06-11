
"""
SEHA Ethiopia Symptom Prediction Model

Dataset Structure:
- Each row represents a patient case.
- Symptom columns are binary encoded (1 = present, 0 = absent).
- Disease column is the target label.
- Data is split using stratified sampling:
  80% training, 20% testing.
"""




import pandas as pd
from sklearn.model_selection import train_test_split

# Load processed dataset
df = pd.read_csv("data/processed/symptoms_cleaned.csv")

# Features
X = df.drop("disease", axis=1)

# Target
y = df["disease"]

# Stratified split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

# Rebuild datasets
train_df = X_train.copy()
train_df["disease"] = y_train

test_df = X_test.copy()
test_df["disease"] = y_test

print("Train Shape:")
print(train_df.shape)

print("\nTest Shape:")
print(test_df.shape)

print("\nTrain Disease Distribution:")
print(y_train.value_counts())

print("\nTest Disease Distribution:")
print(y_test.value_counts())

# Save train dataset
train_df.to_csv(
    "data/processed/symptoms_train.csv",
    index=False
)

# Save test dataset
test_df.to_csv(
    "data/processed/symptoms_test.csv",
    index=False
)

print("\nTrain and test datasets saved successfully!")