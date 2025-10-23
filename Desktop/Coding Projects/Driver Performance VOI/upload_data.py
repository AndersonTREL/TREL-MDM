#!/usr/bin/env python3
"""
Data Upload Script for VOI Driver Performance Dashboard

This script helps you upload new CSV data files to the system.
It validates the data format and processes it through the ETL pipeline.
"""

import os
import sys
import shutil
import pandas as pd
from pathlib import Path
from datetime import datetime

def validate_csv_format(file_path, expected_columns):
    """Validate CSV file format."""
    try:
        df = pd.read_csv(file_path)
        
        # Check if all required columns are present
        missing_cols = set(expected_columns) - set(df.columns)
        if missing_cols:
            print(f"❌ Missing columns: {', '.join(missing_cols)}")
            return False
        
        # Check for empty file
        if len(df) == 0:
            print("❌ File is empty")
            return False
        
        print(f"✅ File validated: {len(df)} records")
        return True
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

def upload_file(source_path, target_name):
    """Upload and process a CSV file."""
    
    # File format specifications
    formats = {
        'manual': {
            'columns': ['Date', 'Driver Name', 'City', 'Akkutausch', 'Normale Swaps', 
                       'Bonus Swaps', 'Multitask Swaps', 'Qualitaetskontrolle', 'Rebalance', 'Transport'],
            'description': 'Manual shift report'
        },
        'daily': {
            'columns': ['Driver', 'City', 'Date', 'Task Type', 'Count', 
                       'Duration Minutes', 'Battery Usage', 'Bonus_Penalties'],
            'description': 'VOI daily report'
        },
        'monthly': {
            'columns': ['Driver', 'City', 'Month', 'Task Type', 'Count', 
                       'Duration Minutes', 'Battery Usage', 'Bonus_Penalties'],
            'description': 'VOI monthly report'
        }
    }
    
    # Determine file type from name
    file_type = None
    if 'manual' in target_name.lower():
        file_type = 'manual'
    elif 'daily' in target_name.lower():
        file_type = 'daily'
    elif 'monthly' in target_name.lower():
        file_type = 'monthly'
    else:
        print("❌ Cannot determine file type. Please include 'manual', 'daily', or 'monthly' in filename")
        return False
    
    print(f"📋 Processing {formats[file_type]['description']}...")
    
    # Validate format
    if not validate_csv_format(source_path, formats[file_type]['columns']):
        return False
    
    # Create target path
    data_dir = Path("data/raw")
    data_dir.mkdir(exist_ok=True)
    target_path = data_dir / target_name
    
    # Copy file
    shutil.copy2(source_path, target_path)
    print(f"✅ File uploaded: {target_path}")
    
    return True

def run_etl():
    """Run the ETL pipeline."""
    print("\n🔄 Running ETL pipeline...")
    try:
        from etl_pipeline import ETLPipeline
        etl = ETLPipeline()
        etl.run_full_etl()
        print("✅ ETL pipeline completed successfully!")
        return True
    except Exception as e:
        print(f"❌ ETL pipeline failed: {e}")
        return False

def main():
    """Main upload function."""
    print("🛴 VOI Driver Performance Dashboard - Data Upload")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python3 upload_data.py <csv_file_path> [target_filename]")
        print("\nExamples:")
        print("  python3 upload_data.py my_data.csv manual_shift_report_nov_2025.csv")
        print("  python3 upload_data.py daily_data.csv voi_daily_report_2025-10-11.csv")
        print("  python3 upload_data.py monthly_data.csv voi_monthly_report_oct_2025.csv")
        print("\nFile naming conventions:")
        print("  - Manual reports: *manual*.csv")
        print("  - Daily reports: *daily*.csv") 
        print("  - Monthly reports: *monthly*.csv")
        return
    
    source_path = sys.argv[1]
    target_name = sys.argv[2] if len(sys.argv) > 2 else Path(source_path).name
    
    # Check if source file exists
    if not os.path.exists(source_path):
        print(f"❌ Source file not found: {source_path}")
        return
    
    print(f"📁 Source file: {source_path}")
    print(f"📁 Target file: {target_name}")
    
    # Upload file
    if not upload_file(source_path, target_name):
        print("❌ Upload failed")
        return
    
    # Ask if user wants to run ETL
    response = input("\n🔄 Run ETL pipeline now? (y/n): ").strip().lower()
    if response in ['y', 'yes']:
        if run_etl():
            print("\n🎉 Data upload and processing completed!")
            print("🚀 Launch dashboard with: python3 run_system.py --dashboard")
        else:
            print("\n❌ ETL processing failed")
    else:
        print("\n✅ File uploaded successfully!")
        print("🔄 Run ETL later with: python3 run_system.py --etl")

if __name__ == "__main__":
    main()
