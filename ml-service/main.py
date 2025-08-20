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

# Initialize the FastAPI app
app = FastAPI()

# Define the structure of the incoming data
class TrainingData(BaseModel):
    trainingData: List[Dict[str, Any]]
    testingData: List[Dict[str, Any]]

def create_confusion_matrix_image(y_true, y_pred):
    """Generates a confusion matrix plot and returns it as a base64 encoded string."""
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Using a donut chart style for visualization as per spec
    fig, ax = plt.subplots(figsize=(6, 6))
    
    labels = ['True Negative', 'False Positive', 'False Negative', 'True Positive']
    sizes = [tn, fp, fn, tp]
    colors = ['#2ca02c', '#d62728', '#ff7f0e', '#1f77b4'] # Green, Red, Orange, Blue
    
    ax.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90,
           wedgeprops=dict(width=0.4, edgecolor='w'))
           
    ax.set_title('Model Performance (Confusion Matrix)', pad=20)
    
    # Save plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    
    # Encode buffer to base64
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# Define the main training endpoint at /train
@app.post("/train")
def train_model(data: TrainingData):
    print(f"Received {len(data.trainingData)} training records and {len(data.testingData)} testing records.")

    train_df = pd.DataFrame(data.trainingData)
    test_df = pd.DataFrame(data.testingData)

    # --- Prepare Data ---
    train_df['Response'] = pd.to_numeric(train_df['Response'])
    test_df['Response'] = pd.to_numeric(test_df['Response'])
    train_df.dropna(subset=['Response'], inplace=True)
    test_df.dropna(subset=['Response'], inplace=True)
    
    feature_columns = [col for col in train_df.columns if col not in ['Id', 'Response', 'synthetic_timestamp']]
    
    X_train = train_df[feature_columns]
    y_train = train_df['Response']
    X_test = test_df[feature_columns]
    y_test = test_df['Response']

    # Align columns to ensure consistency
    train_cols = X_train.columns
    test_cols = X_test.columns
    shared_cols = list(set(train_cols) & set(test_cols))
    X_train = X_train[shared_cols]
    X_test = X_test[shared_cols]
    
    print(f"Training with {len(X_train.columns)} features.")

    # --- Train a High-Performance LightGBM Model ---
    lgb_train = lgb.Dataset(X_train, y_train)
    lgb_eval = lgb.Dataset(X_test, y_test, reference=lgb_train)

    # Parameters for LightGBM - optimized for speed and reasonable accuracy
    params = {
        'objective': 'binary',
        'metric': ['binary_logloss', 'auc'],
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'verbose': -1 # Suppress verbose output
    }

    print("Starting LightGBM model training...")
    evals_result = {} # To store training metrics
    model = lgb.train(params,
                      lgb_train,
                      num_boost_round=500, # Max number of rounds
                      valid_sets=[lgb_train, lgb_eval],
                      valid_names=['train', 'eval'],
                      callbacks=[lgb.early_stopping(10, verbose=False),
                                 lgb.record_evaluation(evals_result)])
    print("Model training complete.")

    # --- Evaluate the Model ---
    # Predict probabilities, then convert to binary prediction (0 or 1)
    y_pred_proba = model.predict(X_test, num_iteration=model.best_iteration)
    y_pred_binary = np.round(y_pred_proba).astype(int)

    accuracy = accuracy_score(y_test, y_pred_binary)
    precision = precision_score(y_test, y_pred_binary, zero_division=0)
    recall = recall_score(y_test, y_pred_binary, zero_division=0)
    f1 = f1_score(y_test, y_pred_binary, zero_division=0)
    print(f"Evaluation complete. Accuracy: {accuracy:.4f}")

    # --- Generate Visualizations ---
    # Create the confusion matrix donut chart
    confusion_matrix_b64 = create_confusion_matrix_image(y_test, y_pred_binary)
    
    # Create the training vs. validation loss chart (placeholder for now, can be expanded)
    # For simplicity, we'll just send back the metrics data for now.
    # A full implementation would plot evals_result['train']['binary_logloss'] vs evals_result['eval']['binary_logloss']
    training_chart_b64 = "placeholder_for_training_chart" # Placeholder for now

    # --- Return the Results ---
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1Score": f1,
        "trainingChartData": training_chart_b64,
        "confusionMatrixData": confusion_matrix_b64 # Send the real base64 image
    }

@app.get("/")
def read_root():
    return {"message": "Intellinspect ML Service is running."}