# 🛴 VOI Driver Performance Dashboard

A comprehensive data system for tracking and visualizing driver performance across VOI electric scooter operations in Kiel, Flensburg, Rostock, and Schwerin.

## 📋 System Overview

This system provides:
- **Complete ETL Pipeline**: Ingests manual shift data and VOI reports
- **SQLite Database**: Three-layer architecture (Staging → Dimensions → Facts)
- **Interactive Dashboard**: Professional Streamlit interface with 4 main pages
- **Real-time Analytics**: KPIs, trends, comparisons, and leaderboards

## 🏗️ Architecture

### Database Design
- **Staging Tables**: Raw data ingestion with metadata tracking
- **Dimension Tables**: Cities, drivers, task types, calendar
- **Fact Tables**: Shift records and task counts with relationships
- **Views**: Pre-computed aggregations for dashboard performance

### Task Taxonomy
- **Battery Swap**: Standard battery replacements
- **Battery Bonus Swap**: High-priority battery replacements (flagged)
- **In-Field Quality Check**: Scooter inspection and maintenance
- **Deploy/Rescue/Repark**: Scooter positioning and recovery
- **Rebalance**: Strategic scooter redistribution
- **Transport**: Vehicle movement between locations

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the System
```bash
python run_system.py --full
```

### 3. Access Dashboard
The dashboard will automatically open in your browser at `http://localhost:8501`

## 📊 Dashboard Features

### 📈 Overview Page
- **KPIs**: Active drivers, total tasks, averages, best city
- **City Comparison**: Bar chart showing tasks by city
- **Task Distribution**: Pie chart of task types
- **Trend Analysis**: 30-day performance trends

### 👤 Individual Driver Page
- **Driver Selection**: Dropdown with city information
- **Performance Cards**: Today, week, month, hourly averages
- **Task Breakdown**: Detailed task type analysis
- **Bonus Ratio**: Gauge showing bonus task percentage
- **Trend Line**: 14-day performance visualization

### 🏙️ City & Team Page
- **Date Range Selection**: Flexible time period filtering
- **City KPIs**: Total tasks, active drivers, averages
- **Top Performers**: Leaderboard with rankings
- **Improvement Opportunities**: Bottom performers analysis

### 📊 Historical Comparison
- **Period Selection**: Compare any two time periods
- **Change Analysis**: Absolute and percentage changes
- **Top Improvers**: Best performing task types
- **Visual Comparison**: Side-by-side bar charts

## 🔧 Technical Details

### Data Sources
1. **Manual Shift Reports**: CSV files with driver input data
2. **VOI Daily Reports**: Automated daily task summaries
3. **VOI Monthly Reports**: Monthly aggregated statistics

### ETL Process
1. **Load Staging**: Read CSV files into staging tables
2. **Transform Dimensions**: Normalize cities, drivers, task types
3. **Transform Facts**: Generate shift and task count records
4. **Validate Data**: Quality checks and error handling
5. **Create Views**: Pre-computed aggregations

### File Structure
```
Driver Performance VOI/
├── database_schema.sql      # Complete database schema
├── etl_pipeline.py         # ETL processing logic
├── dashboard.py            # Streamlit dashboard application
├── run_system.py           # System runner script
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── data/raw/              # Input CSV files
│   ├── manual_shift_report_oct_2024.csv
│   ├── voi_daily_report_2024-10-05.csv
│   └── voi_monthly_report_september_2024.csv
└── driver_performance.db  # SQLite database (created by ETL)
```

## 🎯 Key Features

### Data Quality
- **Automatic Validation**: Checks for missing data, negative counts
- **Error Handling**: Rejected records logging with reasons
- **Audit Trail**: Complete ETL run tracking
- **Data Reconciliation**: VOI vs manual data validation

### Performance
- **Optimized Queries**: Indexed database for fast aggregations
- **Cached Views**: Pre-computed common queries
- **Efficient ETL**: Batch processing with progress tracking
- **Real-time Updates**: Dashboard refreshes with latest data

### User Experience
- **Professional UI**: Clean, modern interface design
- **Responsive Layout**: Works on different screen sizes
- **Interactive Charts**: Hover details, zoom, filtering
- **Color Coding**: Intuitive visual indicators
- **Delta Indicators**: Clear performance change visualization

## 📝 Usage Examples

### Run ETL Only
```bash
python run_system.py --etl
```

### Launch Dashboard Only
```bash
python run_system.py --dashboard
```

### Check Dependencies
```bash
python run_system.py --check-deps
```

### Interactive Mode
```bash
python run_system.py
```

## 🔍 Data Format

### Manual Shift Reports
```csv
Date,Driver Name,City,Akkutausch,Normale Swaps,Bonus Swaps,Multitask Swaps,Qualitätskontrolle,Rebalance,Transport
2024-10-01,Anna Müller,Kiel,15,25,8,3,12,5,2
```

### VOI Daily Reports
```csv
Driver,City,Date,Task Type,Count,Duration Minutes,Battery Usage,Bonus/Penalties
Anna Müller,Kiel,2024-10-04,battery_swap,43,180,85.2,120.5
```

### VOI Monthly Reports
```csv
Driver,City,Month,Task Type,Count,Duration Minutes,Battery Usage,Bonus/Penalties
Anna Müller,Kiel,202409,battery_swap,1250,5200,2450.5,3150.2
```

## 🛠️ Customization

### Adding New Cities
1. Update `dim_city` table in database
2. Add city data to CSV files
3. Restart ETL pipeline

### Adding New Task Types
1. Update `dim_task_type` table
2. Modify task mapping in `etl_pipeline.py`
3. Update CSV file formats

### Modifying Dashboard
1. Edit `dashboard.py` for new visualizations
2. Add new database views for complex queries
3. Update color schemes and styling

## 🐛 Troubleshooting

### Common Issues

**Database not found**
- Run ETL pipeline first: `python run_system.py --etl`

**Missing dependencies**
- Install requirements: `pip install -r requirements.txt`

**CSV file errors**
- Check file format matches expected schema
- Ensure proper encoding (UTF-8)
- Validate date formats

**Dashboard not loading**
- Check if port 8501 is available
- Verify Streamlit installation
- Check browser console for errors

### Log Files
- ETL logs: `etl_pipeline.log`
- Database: `driver_performance.db`
- Rejected records: Check `rejected_records` table

## 📈 Performance Metrics

The system tracks and visualizes:
- **Individual KPIs**: Daily/weekly/monthly task counts
- **Team Performance**: City-level aggregations
- **Trend Analysis**: Historical comparisons
- **Quality Metrics**: Bonus ratios, efficiency rates
- **Operational Insights**: Peak performance times, bottlenecks

## 🔒 Data Security

- **Local Processing**: All data stays on your machine
- **No External APIs**: Complete offline operation
- **Audit Trail**: Complete change tracking
- **Data Validation**: Input sanitization and error handling

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review log files for error details
3. Validate input data formats
4. Ensure all dependencies are installed

---

**Built with ❤️ for VOI Operations Excellence**
