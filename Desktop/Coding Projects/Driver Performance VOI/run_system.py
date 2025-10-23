#!/usr/bin/env python3
"""
Driver Performance Dashboard - System Runner
VOI Operations: Kiel, Flensburg, Rostock, Schwerin

This script provides a command-line interface to run the complete system:
1. Initialize database
2. Run ETL pipeline
3. Launch dashboard
"""

import argparse
import sys
import subprocess
import os
from pathlib import Path

def run_etl():
    """Run the ETL pipeline."""
    print("🔄 Running ETL Pipeline...")
    try:
        from etl_pipeline import ETLPipeline
        
        etl = ETLPipeline()
        etl.run_full_etl()
        
        print("✅ ETL Pipeline completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ ETL Pipeline failed: {e}")
        return False

def run_dashboard():
    """Launch the Streamlit dashboard."""
    print("🚀 Launching Dashboard...")
    try:
        # Check if streamlit is installed
        subprocess.run([sys.executable, "-m", "streamlit", "run", "dashboard.py"], check=True)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Dashboard launch failed: {e}")
        print("Make sure Streamlit is installed: pip install streamlit")
        return False
    except FileNotFoundError:
        print("❌ Streamlit not found. Please install it: pip install streamlit")
        return False

def check_dependencies():
    """Check if all required dependencies are installed."""
    print("🔍 Checking dependencies...")
    
    required_packages = ['streamlit', 'pandas', 'plotly']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    print("✅ All dependencies are installed!")
    return True

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="VOI Driver Performance Dashboard System")
    parser.add_argument("--etl", action="store_true", help="Run ETL pipeline only")
    parser.add_argument("--dashboard", action="store_true", help="Launch dashboard only")
    parser.add_argument("--full", action="store_true", help="Run ETL then launch dashboard")
    parser.add_argument("--check-deps", action="store_true", help="Check dependencies only")
    
    args = parser.parse_args()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    if args.check_deps:
        success = check_dependencies()
        sys.exit(0 if success else 1)
    
    if not check_dependencies():
        sys.exit(1)
    
    if args.etl:
        success = run_etl()
        sys.exit(0 if success else 1)
    
    elif args.dashboard:
        success = run_dashboard()
        sys.exit(0 if success else 1)
    
    elif args.full:
        print("🚀 Running Full System...")
        
        # Run ETL
        if not run_etl():
            sys.exit(1)
        
        # Launch dashboard
        if not run_dashboard():
            sys.exit(1)
    
    else:
        # Interactive mode
        print("🛴 VOI Driver Performance Dashboard System")
        print("=" * 50)
        
        while True:
            print("\nOptions:")
            print("1. Check Dependencies")
            print("2. Run ETL Pipeline")
            print("3. Launch Dashboard")
            print("4. Run Full System (ETL + Dashboard)")
            print("5. Exit")
            
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == "1":
                check_dependencies()
            
            elif choice == "2":
                run_etl()
            
            elif choice == "3":
                run_dashboard()
            
            elif choice == "4":
                if run_etl():
                    run_dashboard()
            
            elif choice == "5":
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
