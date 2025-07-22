# Child Booklet - Start Both Frontend and Backend
Write-Host "🚀 Starting Child Booklet Application..." -ForegroundColor Green
Write-Host ""

# Define paths
$frontendPath = "C:\Users\Harsh\Documents\GitHub\Hackathon\childBooklet"
$backendPath = "C:\Users\Harsh\Documents\GitHub\Hackathon\childBooklet\backend"

# Function to start backend
function Start-Backend {
    Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔗 Backend Server Starting...' -ForegroundColor Green; npm start"
}

# Function to start frontend  
function Start-Frontend {
    Write-Host "🎨 Starting Frontend (Expo)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '📱 Frontend Starting...' -ForegroundColor Green; npx expo start --offline"
}

# Start backend first
Start-Backend
Write-Host "⏳ Waiting 5 seconds for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Then start frontend
Start-Frontend

Write-Host ""
Write-Host "✅ Both services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor White
Write-Host "   🔧 Backend API: http://localhost:5001" -ForegroundColor Yellow
Write-Host "   🌐 Frontend Web: http://localhost:8081" -ForegroundColor Cyan
Write-Host "   📱 Mobile: Scan QR code with Expo Go app" -ForegroundColor Magenta
Write-Host ""
Write-Host "⚠️  Two new PowerShell windows will open - don't close them!" -ForegroundColor Red
Write-Host "   - One for Backend (Node.js server)"
Write-Host "   - One for Frontend (Expo development server)"
Write-Host ""
Write-Host "🛑 To stop both services:" -ForegroundColor Red
Write-Host "   Press Ctrl+C in each window or close the windows"
Write-Host ""

# Keep this window open for instructions
Write-Host "Press any key to exit this startup script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
