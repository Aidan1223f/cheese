@echo off
echo Installing RAG ingestion dependencies...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Install dependencies
echo Installing packages...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo Error installing dependencies. Trying individual packages...
    python install_dependencies.py
) else (
    echo ✅ Dependencies installed successfully!
)

echo.
echo Setup complete! You can now run your RAG ingestion scripts.
pause 