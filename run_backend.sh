#!/bin/bash

echo "Starting backend server manually..."
cd /home/engine/project

# Try to run the server directly
source venv/bin/activate
echo "Running: python app.py"
python app.py