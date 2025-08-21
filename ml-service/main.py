from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from typing import List, Dict, Any
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

app = FastAPI()

class TrainingData(BaseModel):
    trainingData: List[Dict[str, Any]]
    testingData: List[Dict[str, Any]]

def create_confusion_matrix_image(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    # Ensure we have all 4 values, even if some are 0
    if len(cm.ravel()) == 1: # Only one class predicted
        if y_true.unique()[0] == 0: # Only negatives
            tn, fp, fn, tp = cm.ravel()[0], 0, 0, 0
        else: # Only positives
            tn, fp, fn, tp = 0, 0, 0, cm.ravel()[0]
    else:
        tn, fp, fn, tp = cm.ravel()

    fig, ax = plt.subplots(figsize=(6, 6))
    labels = ['True Negative', 'False Positive', 'False Negative', 'True Positive']
    sizes = [tn, fp, fn, tp]
    colors = ['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4']
    
    ax.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90, wedgeprops=dict(width=0.4, edgecolor='w'))
    ax.set_title('Model Performance (Confusion Matrix)', pad=20)
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

@app.post("/train")
def train_model(data: TrainingData):
    try:
        print(f"Received {len(data.trainingData)} training records and {len(data.testingData)} testing records.")

        train_df = pd.DataFrame(data.trainingData)
        test_df = pd.DataFrame(data.testingData)

        # --- ROBUST DATA PREPARATION ---
        # Convert all columns to numeric, coercing errors. This is KEY.
        for col in train_df.columns:
            if col not in ['Id', 'synthetic_timestamp']:
                train_df[col] = pd.to_numeric(train_df[col], errors='coerce')
        for col in test_df.columns:
             if col not in ['Id', 'synthetic_timestamp']:
                test_df[col] = pd.to_numeric(test_df[col], errors='coerce')

        train_df.dropna(subset=['Response'], inplace=True)
        test_df.dropna(subset=['Response'], inplace=True)
        
        # Ensure target is integer
        y_train = train_df['Response'].astype(int)
        y_test = test_df['Response'].astype(int)
        
        # Use only numeric feature columns
        feature_columns = [col for col in train_df.columns if col not in ['Id', 'Response', 'synthetic_timestamp'] and pd.api.types.is_numeric_dtype(train_df[col])]
        
        X_train = train_df[feature_columns].fillna(0)
        X_test = test_df[feature_columns].fillna(0)

        print(f"Training with {len(X_train.columns)} features.")

        # --- Train LightGBM Model ---
        model = lgb.LGBMClassifier(objective='binary', random_state=42)
        model.fit(X_train, y_train)
        print("Model training complete.")

        # --- Evaluate ---
        y_pred_binary = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred_binary)
        precision = precision_score(y_test, y_pred_binary, zero_division=0)
        recall = recall_score(y_test, y_pred_binary, zero_division=0)
        f1 = f1_score(y_test, y_pred_binary, zero_division=0)
        print(f"Evaluation complete. Accuracy: {accuracy:.4f}")

        # --- Generate Visualizations ---
        confusion_matrix_b64 = create_confusion_matrix_image(y_test, y_pred_binary)
        
        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1Score": f1,
            "trainingChartData": "placeholder_for_now",
            "confusionMatrixData": confusion_matrix_b64
        }
    except Exception as e:
        print(f"ERROR in ML Service: {e}")
        return {"error": str(e)}, 500

@app.get("/")
def read_root():
    return {"message": "Intellinspect ML Service is running."}