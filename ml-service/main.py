from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io, base64, time, json, os
from typing import List, Dict, Any

app = FastAPI()

# --- MODELS ---
class TrainingData(BaseModel):
    trainingData: List[Dict[str, Any]]
    testingData: List[Dict[str, Any]]

class SimPayload(BaseModel):
    simulationStart: str
    simulationEnd: str

# --- FILE PATHS ---
MODEL_PATH = "/data/bosch_lgbm_model.txt"

# --- PLOTTING FUNCTIONS ---
def create_confusion_matrix_image(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = (cm.ravel()[0], 0, 0, 0) if len(cm.ravel()) == 1 and pd.Series(y_true).unique()[0] == 0 else (0, 0, 0, cm.ravel()[0]) if len(cm.ravel()) == 1 else cm.ravel()
    fig, ax = plt.subplots(figsize=(6, 6))
    ax.pie([tn, fp, fn, tp], labels=['True Negative', 'False Positive', 'False Negative', 'True Positive'], colors=['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4'], autopct='%1.1f%%', startangle=90, wedgeprops=dict(width=0.4, edgecolor='w'))
    ax.set_title('Model Performance (Confusion Matrix)', pad=20)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def create_loss_chart_image(evals_result):
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(evals_result['train']['binary_logloss'], label='Training Loss')
    ax.plot(evals_result['eval']['binary_logloss'], label='Validation Loss')
    ax.set_title('Training vs. Validation Loss')
    ax.set_xlabel('Boosting Round')
    ax.set_ylabel('Binary LogLoss')
    ax.legend()
    ax.grid(True, linestyle='--', alpha=0.6)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# --- ENDPOINTS ---
@app.post("/train")
def train_model(data: TrainingData):
    try:
        train_df = pd.DataFrame(data.trainingData)
        test_df = pd.DataFrame(data.testingData)

        for df in [train_df, test_df]:
            for col in df.columns:
                if col not in ['Id', 'synthetic_timestamp', 'Response']:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
        
        train_df.dropna(subset=['Response'], inplace=True)
        test_df.dropna(subset=['Response'], inplace=True)
        y_train = train_df['Response'].astype(int)
        y_test = test_df['Response'].astype(int)
        
        feature_columns = [col for col in train_df.columns if col not in ['Id', 'Response', 'synthetic_timestamp']]
        X_train = train_df[feature_columns].fillna(0)
        X_test = test_df[feature_columns].fillna(0)
        
        shared_cols = list(set(X_train.columns) & set(X_test.columns))
        X_train, X_test = X_train[shared_cols], X_test[shared_cols]

        evals_result = {}
        model = lgb.train({'objective': 'binary', 'metric': 'binary_logloss', 'verbose': -1}, lgb.Dataset(X_train, y_train), num_boost_round=500,
                          valid_sets=[lgb.Dataset(X_train, y_train), lgb.Dataset(X_test, y_test)], valid_names=['train', 'eval'],
                          callbacks=[lgb.early_stopping(10, verbose=False), lgb.record_evaluation(evals_result)])
        
        model.save_model(MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")

        y_pred_binary = (model.predict(X_test, num_iteration=model.best_iteration) >= 0.5).astype(int)
        
        return { "accuracy": accuracy_score(y_test, y_pred_binary), "precision": precision_score(y_test, y_pred_binary, zero_division=0),
                 "recall": recall_score(y_test, y_pred_binary, zero_division=0), "f1Score": f1_score(y_test, y_pred_binary, zero_division=0),
                 "trainingChartData": create_loss_chart_image(evals_result), "confusionMatrixData": create_confusion_matrix_image(y_test, y_pred_binary) }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
def simulate(payload: SimPayload):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=404, detail="Model not found. Train a model first.")

    model = lgb.Booster(model_file=MODEL_PATH)
    print(f"Simulating from {payload.simulationStart} to {payload.simulationEnd}")
    
    def event_stream():
        total_predictions = 30
        for i in range(total_predictions):
            num_features = model.num_feature()
            random_features = np.random.rand(1, num_features)
            proba = model.predict(random_features)[0]
            prediction_label = "Pass" if proba < 0.5 else "Fail"
            confidence = (1 - proba if proba < 0.5 else proba) * 100

            data = { "timestamp": (pd.Timestamp.now() - pd.Timedelta(seconds=total_predictions-i)).strftime('%H:%M:%S'),
                     "sampleId": f"SAMPLE_{i+1:03d}", "prediction": prediction_label, "confidence": round(confidence, 2),
                     "temperature": round(np.random.uniform(25, 40), 1), "pressure": round(np.random.uniform(1000, 1015), 1),
                     "humidity": round(np.random.uniform(30, 60), 1) }
            
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(1)

        yield f"data: {json.dumps({'status': 'complete'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/")
def read_root():
    return {"message": "Intellinspect ML Service is running."}