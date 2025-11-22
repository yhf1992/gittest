#!/bin/bash

# Xianxia Combat Engine - Development Start Script

echo "🏮 Xianxia Combat Engine - Development Server 🏮"
echo "=================================================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Start Backend Server
echo "🔥 Starting Backend Server..."
cd /home/engine/project

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

# Check if backend is already running
if check_port 5000; then
    echo "⚠️  Backend server is already running on port 5000"
else
    echo "Starting backend on port 5000..."
    python app.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Wait for backend to start
    sleep 3
    
    if check_port 5000; then
        echo "✅ Backend server started successfully"
    else
        echo "❌ Backend server failed to start"
        echo "Check backend.log for errors"
        exit 1
    fi
fi

# Start Frontend Development Server
echo "🎨 Starting Frontend Development Server..."
cd /home/engine/project/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check if frontend is already running
if check_port 3000; then
    echo "⚠️  Frontend server is already running on port 3000"
else
    echo "Starting frontend on port 3000..."
    npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
fi

echo ""
echo "🎉 Servers are ready!"
echo "====================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📖 API Docs: http://localhost:5000/health"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f /home/engine/project/backend.log"
echo "   Frontend: tail -f /home/engine/project/frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   pkill -f 'python app.py'"
echo "   pkill -f 'react-scripts start'"
echo ""
echo "✨ Begin your cultivation journey! ✨"