
# 📁 Data Upload Guide - VOI Driver Performance Dashboard

## 📋 Supported File Formats

### 1. Manual Shift Reports
**File naming**: `*manual*.csv` (e.g., `manual_shift_report_nov_2025.csv`)

**Required columns:**
```csv
Date,Driver Name,City,Akkutausch,Normale Swaps,Bonus Swaps,Multitask Swaps,Qualitaetskontrolle,Rebalance,Transport
2025-10-11,Anna Müller,Kiel,16,28,9,4,14,6,2
2025-10-11,Max Schmidt,Flensburg,13,24,7,3,9,4,1
```

**Column descriptions:**
- `Date`: YYYY-MM-DD format
- `Driver Name`: Full name of the driver
- `City`: Kiel, Flensburg, Rostock, or Schwerin
- `Akkutausch`: Number of battery swaps
- `Normale Swaps`: Number of normal swaps
- `Bonus Swaps`: Number of bonus swaps
- `Multitask Swaps`: Number of multitask swaps
- `Qualitaetskontrolle`: Number of quality checks
- `Rebalance`: Number of rebalancing tasks
- `Transport`: Number of transport tasks

### 2. VOI Daily Reports
**File naming**: `*daily*.csv` (e.g., `voi_daily_report_2025-10-11.csv`)

**Required columns:**
```csv
Driver,City,Date,Task Type,Count,Duration Minutes,Battery Usage,Bonus_Penalties
Anna Müller,Kiel,2025-10-11,battery_swap,45,190,88.5,125.0
Max Schmidt,Flensburg,2025-10-11,quality_check,14,42,11.8,28.0
```

**Column descriptions:**
- `Driver`: Full name of the driver
- `City`: Kiel, Flensburg, Rostock, or Schwerin
- `Date`: YYYY-MM-DD format
- `Task Type`: battery_swap, quality_check, rebalance, transport, deploy, rescue, repark
- `Count`: Number of tasks completed
- `Duration Minutes`: Time spent on tasks
- `Battery Usage`: Battery consumption
- `Bonus_Penalties`: Bonus or penalty amount

### 3. VOI Monthly Reports
**File naming**: `*monthly*.csv` (e.g., `voi_monthly_report_october_2025.csv`)

**Required columns:**
```csv
Driver,City,Month,Task Type,Count,Duration Minutes,Battery Usage,Bonus_Penalties
Anna Müller,Kiel,202510,battery_swap,1350,5400,2520.5,3250.2
Max Schmidt,Flensburg,202510,quality_check,520,1480,480.2,780.0
```

**Column descriptions:**
- `Driver`: Full name of the driver
- `City`: Kiel, Flensburg, Rostock, or Schwerin
- `Month`: YYYYMM format (e.g., 202510 for October 2025)
- `Task Type`: Same as daily reports
- `Count`: Total tasks for the month
- `Duration Minutes`: Total time spent
- `Battery Usage`: Total battery consumption
- `Bonus_Penalties`: Total bonus/penalty amount

## 🚀 Upload Process

### Step 1: Prepare Your Data
1. Create CSV files with the exact column names and formats shown above
2. Ensure data quality:
   - No empty rows
   - Consistent date formats
   - Valid city names (Kiel, Flensburg, Rostock, Schwerin)
   - Numeric values for counts and durations

### Step 2: Add Files to System
1. Copy your CSV files to the `data/raw/` folder
2. Follow the naming conventions above

### Step 3: Run ETL Pipeline
```bash
# Run ETL to process new data
python3 run_system.py --etl

# Or run full system (ETL + Dashboard)
python3 run_system.py --full
```

### Step 4: Verify Data
- Check the dashboard at http://localhost:8501
- Use the "🔄 Reload Data" button to refresh
- Verify your new data appears in the visualizations

## 📊 Data Validation

The system automatically validates:
- ✅ Required columns are present
- ✅ Date formats are correct
- ✅ City names are valid
- ✅ Numeric values are non-negative
- ✅ Driver names are resolved (creates new drivers if needed)

## 🔧 Troubleshooting

### Common Issues:
1. **"No data showing"**: Check date formats (use YYYY-MM-DD)
2. **"City not found"**: Use exact city names: Kiel, Flensburg, Rostock, Schwerin
3. **"Driver not found"**: Driver will be automatically created
4. **"Invalid task type"**: Use exact task type names from the list above

### Error Logs:
- Check `etl_pipeline.log` for detailed error messages
- Check the `rejected_records` table in the database for failed records

## 📈 Best Practices

1. **File Organization**: Use descriptive file names with dates
2. **Data Quality**: Validate data before uploading
3. **Incremental Updates**: Add new data regularly for best insights
4. **Backup**: Keep original data files as backup
5. **Testing**: Test with small datasets first

## 🎯 Example Workflow

```bash
# 1. Add new data file
cp my_new_data.csv data/raw/manual_shift_report_nov_2025.csv

# 2. Process the data
python3 run_system.py --etl

# 3. Launch dashboard
python3 run_system.py --dashboard

# 4. View results at http://localhost:8501
```
