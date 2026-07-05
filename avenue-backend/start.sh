#!/bin/bash

# Start the ARQ background worker in the background
echo "Starting ARQ worker..."
arq app.worker.WorkerSettings &

# Start the Uvicorn FastAPI server in the foreground
echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 7860
