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

