# 🔄 VOI Driver Performance Report Processing Guide

## 📊 How the System Processes Reports

### **Step 1: Data Ingestion (EXTRACT)**
The ETL pipeline automatically scans the `data/raw/` folder and processes:

#### **Manual Shift Reports** (`*manual*.csv`)
```
Input: Driver fills out daily shift form
Format: Date, Driver Name, City, Akkutausch, Normale Swaps, Bonus Swaps, etc.
Processing: Direct mapping to fact tables
```

#### **VOI Daily Reports** (`*daily*.csv`) 
```
Input: Automated system data from VOI platform
Format: Driver, City, Date, Task Type, Count, Duration, Battery Usage
Processing: Task type standardization and aggregation
```

#### **VOI Monthly Reports** (`*monthly*.csv`)
```
Input: Monthly aggregated data from VOI systems
Format: Driver, City, Month, Task Type, Count, Duration, Battery Usage  
Processing: Monthly rollup and trend analysis
```

### **Step 2: Data Transformation (TRANSFORM)**

#### **German → English Task Mapping**
```
Akkutausch → Battery Swap
Normale Swaps → Battery Swap
Bonus Swaps → Battery Bonus Swap (is_bonus = true)
Multitask Swaps → Battery Swap (is_multitask = true)
Qualitätskontrolle → In-Field Quality Check
Rebalance → Rebalance
Transport → Transport
```

#### **Data Normalization**
- **Date Standardization**: All dates converted to YYYY-MM-DD format
- **Driver Name Resolution**: Handles aliases and variations
- **City Validation**: Ensures only valid cities (Kiel, Flensburg, Rostock, Schwerin)
- **Task Type Canonicalization**: Maps to standard task types

#### **Dimension Creation**
- **Cities**: Automatically created from data
- **Drivers**: Auto-created with alias support
- **Task Types**: Pre-defined with properties (is_swap, is_bonus)
- **Calendar**: Auto-generated for date relationships

### **Step 3: Data Loading (LOAD)**

#### **Staging Tables** (Raw Data Storage)
```sql
stg_manual_shift_reports    # Raw manual data
stg_voi_daily             # Raw daily VOI data  
stg_voi_monthly           # Raw monthly VOI data
```

#### **Dimension Tables** (Reference Data)
```sql
dim_city                  # Cities (Kiel, Flensburg, Rostock, Schwerin)
dim_driver                # Drivers with aliases
dim_task_type             # Task types with properties
dim_calendar              # Date dimension
```

#### **Fact Tables** (Performance Data)
```sql
fact_shift                # Shift records
fact_task_count           # Task counts with details
```

#### **Performance Views** (Pre-computed Aggregations)
```sql
v_driver_daily           # Daily driver performance
v_city_daily             # Daily city performance
v_driver_monthly         # Monthly driver performance
v_leaderboard_daily      # Daily rankings
v_deltas                 # Performance changes
v_kpis                   # Key performance indicators
```

## 📝 How to Upload/Fill Driver Performance Data

### **Method 1: Manual CSV Upload (Most Common)**

#### **For Daily Shift Reports:**
1. **Download template** or create CSV with these columns:
```csv
Date,Driver Name,City,Akkutausch,Normale Swaps,Bonus Swaps,Multitask Swaps,Qualitaetskontrolle,Rebalance,Transport
2025-10-15,Anna Müller,Kiel,18,32,11,6,16,8,3
```

2. **Upload using script:**
```bash
python3 upload_data.py my_shift_data.csv manual_shift_report_oct_2025.csv
```

3. **Process data:**
```bash
python3 run_system.py --etl
```

#### **For VOI Automated Data:**
1. **Export from VOI system** in CSV format
2. **Ensure correct columns:**
```csv
Driver,City,Date,Task Type,Count,Duration Minutes,Battery Usage,Bonus_Penalties
Anna Müller,Kiel,2025-10-15,battery_swap,45,190,88.5,125.0
```

3. **Upload and process:**
```bash
python3 upload_data.py voi_export.csv voi_daily_report_2025-10-15.csv
python3 run_system.py --etl
```

### **Method 2: Direct Database Input (Advanced)**

#### **Using SQLite Browser or Command Line:**
```sql
-- Insert new driver
INSERT INTO dim_driver (full_name, alias_list) 
VALUES ('New Driver', '["new_driver", "n.driver"]');

-- Insert new shift
INSERT INTO fact_shift (shift_id, driver_id, city_id, shift_date, source, source_doc_id)
VALUES ('hash_value', 1, 1, '2025-10-15', 'manual', 'doc_hash');

-- Insert task counts
INSERT INTO fact_task_count (shift_id, task_type_id, source, source_doc_id, task_count, duration_minutes)
VALUES ('hash_value', 1, 'manual', 'doc_hash', 25, 120.0);
```

### **Method 3: API Integration (Future Enhancement)**

#### **REST API Endpoints (To Be Implemented):**
```bash
# POST new shift data
curl -X POST http://localhost:8501/api/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "driver_name": "Anna Müller",
    "city": "Kiel", 
    "date": "2025-10-15",
    "tasks": {
      "akkutausch": 18,
      "normale_swaps": 32,
      "bonus_swaps": 11
    }
  }'
```

## 🔍 Data Validation and Quality Checks

### **Automatic Validations:**
- ✅ **Required Fields**: All mandatory columns present
- ✅ **Date Format**: YYYY-MM-DD format validation
- ✅ **City Names**: Must be valid cities
- ✅ **Numeric Values**: Non-negative task counts
- ✅ **Driver Resolution**: Auto-creates new drivers
- ✅ **Task Type Mapping**: Validates against known types

### **Error Handling:**
- ❌ **Rejected Records**: Logged to `rejected_records` table
- 📝 **Error Logging**: Detailed logs in `etl_pipeline.log`
- 🔄 **Audit Trail**: Complete ETL run tracking

### **Data Reconciliation:**
- 📊 **VOI vs Manual**: Compares overlapping data
- 🔍 **Duplicate Detection**: Prevents duplicate entries
- ✅ **Consistency Checks**: Validates data integrity

## 📊 Performance Views and Analytics

### **Real-time Dashboards:**
- **📈 Overview**: KPIs, city comparison, task distribution
- **👤 Individual**: Driver performance, trends, bonus ratios
- **🏙️ Team**: City performance, leaderboards
- **📊 Historical**: Period comparisons, trend analysis

### **Key Metrics Calculated:**
- **Total Tasks**: Sum of all task types per driver/city
- **Tasks per Hour**: Efficiency metric
- **Bonus Ratio**: Percentage of bonus tasks vs total swaps
- **Daily/Weekly/Monthly Averages**: Performance trends
- **Delta Changes**: Day-over-day, week-over-week comparisons

## 🚀 Best Practices for Data Management

### **Data Upload Frequency:**
- **Daily**: Upload shift reports daily for real-time insights
- **Weekly**: Process VOI daily reports weekly
- **Monthly**: Import monthly summaries for trend analysis

### **Data Quality:**
- **Consistent Naming**: Use exact driver names and city names
- **Complete Data**: Fill all available fields
- **Timely Upload**: Process data within 24-48 hours
- **Validation**: Check data before uploading

### **Backup and Maintenance:**
- **Regular Backups**: Export database regularly
- **Log Monitoring**: Check ETL logs for errors
- **Performance Tuning**: Monitor query performance
- **Data Archiving**: Archive old data periodically

## 🔧 Troubleshooting Common Issues

### **"No data showing in dashboard":**
- Check date formats (use YYYY-MM-DD)
- Verify city names (Kiel, Flensburg, Rostock, Schwerin)
- Run ETL pipeline: `python3 run_system.py --etl`

### **"Driver not found":**
- Driver will be auto-created
- Check driver name spelling
- Use consistent naming across files

### **"Invalid task type":**
- Use exact task type names from the list
- Check German→English mapping
- Validate against `dim_task_type` table

### **"ETL pipeline failed":**
- Check `etl_pipeline.log` for detailed errors
- Validate CSV format and column names
- Check for missing required fields

## 📈 Example Workflow

### **Daily Driver Performance Input:**
1. **Driver completes shift** → Fills out manual form
2. **CSV export** → Export to CSV format
3. **Upload** → `python3 upload_data.py shift_data.csv manual_shift_report_2025-10-15.csv`
4. **Process** → `python3 run_system.py --etl`
5. **View** → Dashboard automatically shows new data
6. **Analyze** → Real-time performance metrics available

### **Weekly VOI Data Import:**
1. **VOI system export** → Automated daily reports
2. **Batch upload** → Multiple CSV files
3. **ETL processing** → Bulk data transformation
4. **Dashboard refresh** → Updated analytics
5. **Performance review** → Team and individual insights
