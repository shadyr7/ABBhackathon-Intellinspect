# IntelliInspect: Real-Time Predictive Quality Control

A full-stack, AI-powered web application designed for real-time predictive quality control on a production line. This project was developed for the IntellInspect Hackathon and demonstrates an end-to-end solution using Kaggle's Bosch Production Line Performance dataset. It features a modern microservices architecture with a responsive frontend, a robust backend orchestrator, and a dedicated machine learning service, all containerized for seamless deployment.

## System Architecture

The application is composed of three primary services orchestrated by Docker Compose:

1.  **Frontend (Angular):** A responsive single-page application that provides the user interface for data upload, configuration, and visualization of results.
2.  **Backend API (.NET Core 8):** The central orchestrator that handles user requests, manages the data processing lifecycle, and communicates with the machine learning service.
3.  **ML Service (Python/FastAPI):** A dedicated service that performs computationally intensive tasks, including data preprocessing, model training with LightGBM, and real-time inference.

All services communicate via REST APIs within a Docker network, ensuring a decoupled and scalable architecture.

## Prerequisites

To build and run this application, you will need the following installed on your local machine:

*   Git
*   Docker Desktop (must be running)

## Setup and Deployment Instructions

The entire application is containerized and can be run with a single command.

**1. Clone the Repository**
```bash
git clone <your-repository-url>
cd <repository-name>

## 2. Prepare the Sample Dataset

The full Kaggle dataset (`train_numeric.csv`) is over 2GB and is not suitable for development or for committing to Git. The application is designed to work with a smaller, representative sample.

A sample file named `bosch_train_sample_10k.csv` is required. If it is not present, you can create it from the original `train_numeric.csv` file by following these steps:

*   Download the original `train_numeric.csv` from the Kaggle competition page.
*   Open a PowerShell terminal in the directory containing the file.
*   Run the following command to create a 10,001-line sample (1 header + 10,000 data rows):

    ```powershell
    Get-Content train_numeric.csv -TotalCount 10001 | Set-Content bosch_train_sample_10k.csv
    ```
*   Place the resulting `bosch_train_sample_10k.csv` file in a location where you can easily find it for the upload step.

## 3. Build and Run with Docker Compose

From the root directory of the project, run the following command:

```bash
docker-compose up --build
This command will:
Build the Docker images for the frontend, backend, and ML service.
Create and start the containers for all three services.
Establish a network for the containers to communicate with each other.
The initial build may take several minutes.
4. Access the Application
Once the containers are running, open your web browser and navigate to:
http://localhost:4200
5. Stop the Application
To stop all running services, press Ctrl + C in the terminal where Docker Compose is running.
Usage Guide
Follow these steps to use the IntelliInspect application.
Step 1: Upload Dataset
On the "Upload Dataset" screen, click the upload card.
Select the bosch_train_sample_10k.csv file you created.
The application will process the file, add synthetic timestamps (one hour per row to create a meaningful date range), and display a summary of the dataset metadata.
Click "Next" to proceed.
Step 2: Configure Date Ranges
On the "Date Range Selection" screen, use the calendar pickers to define three sequential, non-overlapping date ranges for Training, Testing, and Simulation.
The available date range is displayed at the top, derived from the synthetic timestamps generated in the previous step.
Click "Validate Ranges". A summary of the record counts and a timeline bar chart visualizing the data distribution per month will appear.
Once validation is successful, the "Next" button will be enabled. Click it to proceed.
Step 3: Train Model
On the "Model Training & Evaluation" screen, click the "Train Model" button.
The application will send the training and testing data slices to the ML service.
The service will train a LightGBM classification model and evaluate its performance on the test set.
Upon completion, performance metrics (Accuracy, Precision, Recall, F1-Score) and visualizations (Confusion Matrix, Training vs. Validation Loss) will be displayed.
Note on Metrics: Due to the severe class imbalance in the dataset (~0.5% failures), it is expected for the model to achieve high accuracy but low precision and recall. This reflects a real-world data science challenge.
Click "Next" to proceed.
Step 4: Real-Time Simulation
On the "Real-Time Prediction Simulation" screen, click "Start Simulation".
The application will begin a real-time stream of predictions from the ML service, using the model trained in the previous step.
The UI will update live, showing one prediction per second in the table and updating the summary statistics.
Note: The current implementation streams dummy feature data to the saved model but correctly demonstrates the Server-Sent Events (SSE) streaming architecture.
The simulation will automatically complete, and the button will change to "Restart Simulation".
Technologies Used
Frontend: Angular
Backend API: ASP.NET Core 8
ML Service: Python 3.13, FastAPI
ML Framework: LightGBM, scikit-learn, Pandas
Deployment: Docker, Docker Compose
