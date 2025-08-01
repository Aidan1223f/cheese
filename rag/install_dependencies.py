#!/usr/bin/env python3
"""
Script to install dependencies for RAG ingestion system
"""

import subprocess
import sys
import os

def install_requirements():
    """Install dependencies from requirements.txt"""
    try:
        print("Installing RAG ingestion dependencies...")
        
        # Install from requirements.txt
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        
        print("✅ Dependencies installed successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    except FileNotFoundError:
        print("❌ requirements.txt not found in current directory")
        return False
    
    return True

def install_individual_packages():
    """Install packages individually as fallback"""
    packages = [
        "python-dotenv>=1.0.0",
        "openai>=1.0.0",
        "chromadb>=0.4.0",
        "sentence-transformers>=2.2.0",
        "pinecone-client>=2.2.0",
        "langchain-pinecone>=0.1.0",
        "pypdf2>=3.0.0",
        "python-docx>=0.8.11",
        "markdown>=3.4.0",
        "beautifulsoup4>=4.12.0",
        "langchain>=0.1.0",
        "langchain-openai>=0.1.0",
        "langchain-community>=0.1.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "tqdm>=4.65.0"
    ]
    
    print("Installing packages individually...")
    
    for package in packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package
            ])
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    print("✅ All packages installed successfully!")
    return True

def main():
    """Main installation function"""
    print("🚀 Setting up RAG ingestion dependencies...")
    
    # Try installing from requirements.txt first
    if os.path.exists("requirements.txt"):
        if install_requirements():
            return
    
    # Fallback to individual package installation
    print("Falling back to individual package installation...")
    install_individual_packages()

if __name__ == "__main__":
    main() 