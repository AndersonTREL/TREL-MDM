"""
Driver Performance Dashboard - ETL Pipeline
VOI Operations: Kiel, Flensburg, Rostock, Schwerin

This module handles the complete ETL process:
1. Load data from CSV files into staging tables
2. Transform and normalize data into dimensions and facts
3. Validate data quality and handle errors
4. Create derived views for dashboard consumption
"""

import pandas as pd
import sqlite3
import hashlib
import json
import logging
import os
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ETLPipeline:
    """Main ETL pipeline class for driver performance data processing."""
    
    def __init__(self, db_path: str = "driver_performance.db", data_dir: str = "data/raw"):
        self.db_path = db_path
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Task type mapping from English column names to canonical names
        self.task_mapping = {
            # Manual shift reports - English headers
            'battery_swap': 'battery_swap',
            'bonus_battery_swap': 'battery_bonus_swap',
            'multi_task': 'multi_task',
            'deploy': 'deploy',
            'rebalance': 'rebalance',
            'in_field_quality_check': 'quality_check',
            'rescue': 'rescue',
            'repark': 'repark',
            'transport': 'transport',
            
            # Legacy German mappings (for backward compatibility)
            'akkutausch': 'battery_swap',
            'bonus_swaps': 'battery_bonus_swap',
            'multitask_swaps': 'multi_task',
            'qualitaetskontrolle': 'quality_check',
            
            # VOI reports (already in English typically)
            'battery_swap': 'battery_swap',
            'battery_bonus_swap': 'battery_bonus_swap',
            'multi_task': 'multi_task',
            'quality_check': 'quality_check',
            'rescue': 'rescue',
            'repark': 'repark',
            'rebalance': 'rebalance',
            'transport': 'transport',
            
            # VOI Monthly Report column mappings
            'nr_battery_swaps': 'battery_swap',
            'nr_bonus_swaps': 'battery_bonus_swap',
            'nr_deploys': 'deploy',  # Map deploys to deploy task type
            'nr_infqs': 'quality_check',
            'nr_rebalances': 'rebalance',
            'nr_reparks': 'repark',
            'nr_rescues': 'rescue',
            'nr_transports': 'transport'
        }
        
        # Driver aliases for name resolution
        self.driver_aliases = {
            # Add common aliases here - can be expanded
            'john_doe': ['john', 'j.doe', 'johndoe'],
            'jane_smith': ['jane', 'j.smith', 'janesmith'],
            # Add more as needed
        }
        
        self.run_id = None
        
    def initialize_database(self):
        """Initialize the database with schema."""
        logger.info("Initializing database...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Read and execute schema
            with open('database_schema.sql', 'r') as f:
                schema_sql = f.read()
            
            # Split by semicolon and execute each statement
            statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
            for statement in statements:
                try:
                    conn.execute(statement)
                except sqlite3.Error as e:
                    if "already exists" not in str(e):
                        logger.error(f"Error executing statement: {e}")
                        logger.error(f"Statement: {statement[:100]}...")
            
            conn.commit()
            logger.info("Database initialized successfully")
    
    def generate_id(self, *args) -> str:
        """Generate deterministic hash ID from arguments."""
        combined = '_'.join(str(arg) for arg in args if arg is not None)
        return hashlib.md5(combined.encode()).hexdigest()
    
    def normalize_date(self, date_str: str) -> Optional[str]:
        """Normalize date string to ISO format."""
        if pd.isna(date_str) or date_str == '':
            return None
            
        try:
            # Try different date formats
            for fmt in ['%Y-%m-%d', '%d.%m.%Y', '%d/%m/%Y', '%Y%m%d']:
                try:
                    parsed = datetime.strptime(str(date_str), fmt)
                    return parsed.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # If all formats fail, try pandas parsing
            parsed = pd.to_datetime(date_str, errors='coerce')
            if pd.notna(parsed):
                return parsed.strftime('%Y-%m-%d')
                
            logger.warning(f"Could not parse date: {date_str}")
            return None
            
        except Exception as e:
            logger.error(f"Error normalizing date {date_str}: {e}")
            return None
    
    def load_staging_data(self):
        """Load CSV files into staging tables."""
        logger.info("Loading staging data...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Load manual shift reports
            manual_files = list(self.data_dir.glob("*manual*.csv"))
            for file_path in manual_files:
                logger.info(f"Loading manual shift file: {file_path}")
                try:
                    df = pd.read_csv(file_path)
                    df['source_file'] = file_path.name
                    df['source_row_num'] = range(1, len(df) + 1)
                    df['ingested_at'] = datetime.now()
                    
                    # Normalize date column
                    if 'date' in df.columns:
                        df['date'] = df['date'].apply(self.normalize_date)
                    
                    # Clean column names and ensure proper data types
                    df.columns = df.columns.str.lower().str.replace(' ', '_')
                    
                    # Handle German umlauts in column names
                    df.columns = df.columns.str.replace('ä', 'ae').str.replace('ö', 'oe').str.replace('ü', 'ue')
                    
                    # Ensure numeric columns are properly typed
                    numeric_cols = ['battery_swap', 'bonus_battery_swap', 'multi_task', 'deploy', 'rebalance', 
                                  'in_field_quality_check', 'rescue', 'repark', 'transport',
                                  # KPI columns
                                  'battery_swap_avg_time_min', 'ifqc_avg_time_min', 'task_per_hour',
                                  # Legacy German columns for backward compatibility
                                  'akkutausch', 'bonus_swaps', 'multitask_swaps', 'qualitaetskontrolle']
                    for col in numeric_cols:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                    
                    df.to_sql('stg_manual_shift_reports', conn, if_exists='append', index=False)
                    logger.info(f"Loaded {len(df)} records from {file_path.name}")
                    
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
            
            # Load VOI daily reports
            daily_files = list(self.data_dir.glob("*daily*.csv"))
            for file_path in daily_files:
                logger.info(f"Loading VOI daily file: {file_path}")
                try:
                    df = pd.read_csv(file_path)
                    df['source_file'] = file_path.name
                    df['source_row_num'] = range(1, len(df) + 1)
                    df['ingested_at'] = datetime.now()
                    
                    # Normalize date column
                    if 'date' in df.columns:
                        df['date'] = df['date'].apply(self.normalize_date)
                    
                    # Clean column names
                    df.columns = df.columns.str.lower().str.replace(' ', '_')
                    
                    # Ensure numeric columns are properly typed
                    numeric_cols = ['count', 'duration_minutes', 'battery_usage', 'bonus_penalties']
                    for col in numeric_cols:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                    
                    df.to_sql('stg_voi_daily', conn, if_exists='append', index=False)
                    logger.info(f"Loaded {len(df)} records from {file_path.name}")
                    
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
            
            # Load VOI monthly reports
            monthly_files = list(self.data_dir.glob("*monthly*.csv"))
            for file_path in monthly_files:
                logger.info(f"Loading VOI monthly file: {file_path}")
                try:
                    df = pd.read_csv(file_path)
                    df['source_file'] = file_path.name
                    df['source_row_num'] = range(1, len(df) + 1)
                    df['ingested_at'] = datetime.now()
                    
                    # Clean column names
                    df.columns = df.columns.str.lower().str.replace(' ', '_')
                    
                    # Ensure numeric columns are properly typed
                    numeric_cols = ['count', 'duration_minutes', 'battery_usage', 'bonus_penalties']
                    for col in numeric_cols:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                    
                    df.to_sql('stg_voi_monthly', conn, if_exists='append', index=False)
                    logger.info(f"Loaded {len(df)} records from {file_path.name}")
                    
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")
            
            conn.commit()
            logger.info("Staging data loading completed")
    
    def transform_dimensions(self):
        """Transform and upsert dimension data."""
        logger.info("Transforming dimensions...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Get unique cities from all staging tables
            cities_query = """
            SELECT DISTINCT city FROM stg_manual_shift_reports WHERE city IS NOT NULL
            UNION
            SELECT DISTINCT city FROM stg_voi_daily WHERE city IS NOT NULL
            UNION
            SELECT DISTINCT city FROM stg_voi_monthly WHERE city IS NOT NULL
            """
            
            cities_df = pd.read_sql(cities_query, conn)
            for _, row in cities_df.iterrows():
                city_name = row['city'].strip()
                conn.execute(
                    "INSERT OR IGNORE INTO dim_city (name) VALUES (?)",
                    (city_name,)
                )
            
            # Get unique drivers and resolve aliases
            drivers_query = """
            SELECT DISTINCT driver_name as driver FROM stg_manual_shift_reports WHERE driver_name IS NOT NULL
            UNION
            SELECT DISTINCT driver as driver FROM stg_voi_daily WHERE driver IS NOT NULL
            UNION
            SELECT DISTINCT driver as driver FROM stg_voi_monthly WHERE driver IS NOT NULL
            """
            
            drivers_df = pd.read_sql(drivers_query, conn)
            for _, row in drivers_df.iterrows():
                driver_name = row['driver'].strip()
                
                # Check if driver already exists (case-insensitive)
                existing = conn.execute(
                    "SELECT driver_id, full_name FROM dim_driver WHERE LOWER(full_name) = LOWER(?)",
                    (driver_name,)
                ).fetchone()
                
                if not existing:
                    # Create new driver record
                    conn.execute(
                        "INSERT INTO dim_driver (full_name, alias_list) VALUES (?, ?)",
                        (driver_name, json.dumps([driver_name]))
                    )
                else:
                    # Update alias list if needed
                    alias_str = existing[1] or '[]'
                    if alias_str and alias_str.strip():
                        try:
                            current_aliases = json.loads(alias_str)
                        except json.JSONDecodeError:
                            current_aliases = []
                    else:
                        current_aliases = []
                    if driver_name not in current_aliases:
                        current_aliases.append(driver_name)
                        conn.execute(
                            "UPDATE dim_driver SET alias_list = ? WHERE driver_id = ?",
                            (json.dumps(current_aliases), existing[0])
                        )
            
            conn.commit()
            logger.info("Dimensions transformation completed")
    
    def transform_facts(self):
        """Transform staging data into fact tables."""
        logger.info("Transforming facts...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Process manual shift reports
            self._process_manual_shifts(conn)
            
            # Process VOI daily reports
            self._process_voi_daily(conn)
            
            # Process VOI monthly reports
            self._process_voi_monthly(conn)
            
            conn.commit()
            logger.info("Facts transformation completed")
    
    def _process_manual_shifts(self, conn):
        """Process manual shift data into fact tables."""
        query = "SELECT * FROM stg_manual_shift_reports"
        df = pd.read_sql(query, conn)
        
        for _, row in df.iterrows():
            try:
                # Get driver and city IDs
                driver_id = self._get_driver_id(conn, row['driver_name'])
                city_id = self._get_city_id(conn, row['city'])
                
                if not driver_id or not city_id:
                    self._reject_record(conn, row, "Missing driver or city")
                    continue
                
                # Generate shift ID
                shift_id = self.generate_id(driver_id, city_id, row['date'], 'manual')
                source_doc_id = self.generate_id(row['source_file'], row['source_row_num'])
                
                # Insert/update shift record
                shift_type = row.get('shift_type', None)
                conn.execute("""
                    INSERT OR REPLACE INTO fact_shift 
                    (shift_id, driver_id, city_id, shift_date, shift_type, source, source_doc_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (shift_id, driver_id, city_id, row['date'], shift_type, 'manual', source_doc_id))
                
                # Process each task type - English column names first, then legacy German
                task_mappings = [
                    # English column names
                    ('battery_swap', 'battery_swap', False, False),
                    ('bonus_battery_swap', 'battery_bonus_swap', False, True),
                    ('multi_task', 'multi_task', False, False),
                    ('deploy', 'deploy', False, False),
                    ('rebalance', 'rebalance', False, False),
                    ('in_field_quality_check', 'quality_check', False, False),
                    ('rescue', 'rescue', False, False),
                    ('repark', 'repark', False, False),
                    ('transport', 'transport', False, False),
                    # Legacy German mappings for backward compatibility
                    ('akkutausch', 'battery_swap', False, False),
                    ('bonus_swaps', 'battery_bonus_swap', False, True),
                    ('multitask_swaps', 'multi_task', False, False),
                    ('qualitaetskontrolle', 'quality_check', False, False)
                ]
                
                for col_name, task_type_key, is_multitask, is_bonus in task_mappings:
                    if col_name in row and pd.notna(row[col_name]) and row[col_name] > 0:
                        task_type_id = self._get_task_type_id(conn, task_type_key)
                        if task_type_id:
                            conn.execute("""
                                INSERT OR REPLACE INTO fact_task_count
                                (shift_id, task_type_id, source, source_doc_id, task_count, is_multitask, is_bonus)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            """, (shift_id, task_type_id, 'manual', source_doc_id, 
                                 int(row[col_name]), is_multitask, is_bonus))
                
            except Exception as e:
                logger.error(f"Error processing manual shift row: {e}")
                self._reject_record(conn, row, str(e))
    
    def _process_voi_daily(self, conn):
        """Process VOI daily data into fact tables."""
        query = "SELECT * FROM stg_voi_daily"
        df = pd.read_sql(query, conn)
        
        for _, row in df.iterrows():
            try:
                # Get driver and city IDs
                driver_id = self._get_driver_id(conn, row['driver'])
                city_id = self._get_city_id(conn, row['city'])
                
                if not driver_id or not city_id:
                    self._reject_record(conn, row, "Missing driver or city")
                    continue
                
                # Generate shift ID
                shift_id = self.generate_id(driver_id, city_id, row['date'], 'voi_daily')
                source_doc_id = self.generate_id(row['source_file'], row['source_row_num'])
                
                # Insert/update shift record
                conn.execute("""
                    INSERT OR REPLACE INTO fact_shift 
                    (shift_id, driver_id, city_id, shift_date, shift_type, source, source_doc_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (shift_id, driver_id, city_id, row['date'], None, 'voi_daily', source_doc_id))
                
                # Process task
                task_type_key = self.task_mapping.get(row['task_type'], row['task_type'])
                task_type_id = self._get_task_type_id(conn, task_type_key)
                
                if task_type_id and pd.notna(row['count']) and row['count'] > 0:
                    conn.execute("""
                        INSERT OR REPLACE INTO fact_task_count
                        (shift_id, task_type_id, source, source_doc_id, task_count, duration_minutes)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (shift_id, task_type_id, 'voi_daily', source_doc_id, 
                         int(row['count']), float(row.get('duration_minutes', 0))))
                
            except Exception as e:
                logger.error(f"Error processing VOI daily row: {e}")
                self._reject_record(conn, row, str(e))
    
    def _process_voi_monthly(self, conn):
        """Process VOI monthly data into fact tables."""
        query = "SELECT * FROM stg_voi_monthly"
        df = pd.read_sql(query, conn)
        
        for _, row in df.iterrows():
            try:
                # Get driver and city IDs - handle both old and new formats
                driver_name = row.get('driver', row.get('employee_or_month', ''))
                city_name = row.get('city', '')
                
                driver_id = self._get_driver_id(conn, driver_name)
                city_id = self._get_city_id(conn, city_name)
                
                if not driver_id or not city_id:
                    self._reject_record(conn, row, f"Missing driver_id ({driver_id}) or city_id ({city_id})")
                    continue
                
                # Extract month from file name or use provided month
                month_str = None
                if 'source_file' in row and row['source_file']:
                    # Extract month from filename like "voi_monthly_report_september_2024.csv"
                    filename = row['source_file']
                    if 'september' in filename.lower():
                        month_str = '202509'  # Updated to 2025
                    elif 'october' in filename.lower():
                        month_str = '202510'
                    elif 'november' in filename.lower():
                        month_str = '202511'
                    elif 'december' in filename.lower():
                        month_str = '202512'
                    elif 'august' in filename.lower():
                        month_str = '202508'
                    elif 'january' in filename.lower():
                        month_str = '202501'
                    elif 'february' in filename.lower():
                        month_str = '202502'
                    elif 'march' in filename.lower():
                        month_str = '202503'
                    elif 'april' in filename.lower():
                        month_str = '202504'
                    elif 'may' in filename.lower():
                        month_str = '202505'
                    elif 'june' in filename.lower():
                        month_str = '202506'
                    elif 'july' in filename.lower():
                        month_str = '202507'
                
                if month_str:
                    shift_date = f"{month_str[:4]}-{month_str[4:6]}-01"
                else:
                    # For monthly data, we'll use the first day of the month as shift_date
                    month_str = str(row.get('month', '202510'))  # Default to October 2025
                    if len(month_str) == 6:  # YYYYMM format
                        shift_date = f"{month_str[:4]}-{month_str[4:6]}-01"
                    else:
                        shift_date = row.get('month', '2025-10-01')
                
                # Generate shift ID
                shift_id = self.generate_id(driver_id, city_id, shift_date, 'voi_monthly')
                source_doc_id = self.generate_id(row['source_file'], row['source_row_num'])
                
                # Insert/update shift record
                conn.execute("""
                    INSERT OR REPLACE INTO fact_shift 
                    (shift_id, driver_id, city_id, shift_date, shift_type, source, source_doc_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (shift_id, driver_id, city_id, shift_date, None, 'voi_monthly', source_doc_id))
                
                # Process each task type column from VOI monthly report
                task_mappings = [
                    ('nr_battery_swaps', 'battery_swap'),
                    ('nr_bonus_swaps', 'battery_bonus_swap'),
                    ('nr_deploys', 'deploy'),  # Map deploys to deploy task type
                    ('nr_infqs', 'quality_check'),
                    ('nr_rebalances', 'rebalance'),
                    ('nr_reparks', 'repark'),
                    ('nr_rescues', 'rescue'),
                    ('nr_transports', 'transport')
                ]
                
                for col_name, task_type_key in task_mappings:
                    if col_name in row and pd.notna(row[col_name]) and row[col_name] > 0:
                        task_type_id = self._get_task_type_id(conn, task_type_key)
                        if task_type_id:
                            conn.execute("""
                                INSERT OR REPLACE INTO fact_task_count
                                (shift_id, task_type_id, source, source_doc_id, task_count, duration_minutes)
                                VALUES (?, ?, ?, ?, ?, ?)
                            """, (shift_id, task_type_id, 'voi_monthly', source_doc_id, 
                                 int(row[col_name]), 0))  # Duration not available in monthly report
                
                # Handle legacy format if present
                if 'task_type' in row and 'count' in row:
                    task_type_key = self.task_mapping.get(row['task_type'], row['task_type'])
                    task_type_id = self._get_task_type_id(conn, task_type_key)
                    
                    if task_type_id and pd.notna(row['count']) and row['count'] > 0:
                        conn.execute("""
                            INSERT OR REPLACE INTO fact_task_count
                            (shift_id, task_type_id, source, source_doc_id, task_count, duration_minutes)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, (shift_id, task_type_id, 'voi_monthly', source_doc_id, 
                             int(row['count']), float(row.get('duration_minutes', 0))))
                
            except Exception as e:
                logger.error(f"Error processing VOI monthly row: {e}")
                self._reject_record(conn, row, str(e))
    
    def _get_driver_id(self, conn, driver_name: str) -> Optional[int]:
        """Get driver ID by name (case-insensitive with alias support)."""
        if not driver_name or pd.isna(driver_name):
            return None
        
        # First try exact match
        result = conn.execute(
            "SELECT driver_id FROM dim_driver WHERE LOWER(full_name) = LOWER(?)",
            (driver_name.strip(),)
        ).fetchone()
        
        if result:
            return result[0]
        
        # Try alias matching
        try:
            result = conn.execute(
                "SELECT driver_id FROM dim_driver WHERE alias_list LIKE ?",
                (f'%"{driver_name.strip()}"%',)
            ).fetchone()
        except:
            result = None
        
        return result[0] if result else None
    
    def _get_city_id(self, conn, city_name: str) -> Optional[int]:
        """Get city ID by name."""
        if not city_name or pd.isna(city_name):
            return None
        
        result = conn.execute(
            "SELECT city_id FROM dim_city WHERE LOWER(name) = LOWER(?)",
            (city_name.strip(),)
        ).fetchone()
        
        return result[0] if result else None
    
    def _get_task_type_id(self, conn, task_type_key: str) -> Optional[int]:
        """Get task type ID by key."""
        if not task_type_key:
            return None
        
        result = conn.execute(
            "SELECT task_type_id FROM dim_task_type WHERE task_type_key = ?",
            (task_type_key,)
        ).fetchone()
        
        return result[0] if result else None
    
    def _reject_record(self, conn, row, reason: str):
        """Add record to rejected_records table."""
        record_hash = self.generate_id(str(row.to_dict()))
        conn.execute("""
            INSERT OR IGNORE INTO rejected_records (record_hash, reason, raw_payload)
            VALUES (?, ?, ?)
        """, (record_hash, reason, json.dumps(row.to_dict())))
    
    def validate_data(self):
        """Perform data validation and quality checks."""
        logger.info("Validating data...")
        
        with sqlite3.connect(self.db_path) as conn:
            # Check for NULL task_type_id in fact_task_count
            null_task_types = conn.execute("""
                SELECT COUNT(*) FROM fact_task_count WHERE task_type_id IS NULL
            """).fetchone()[0]
            
            if null_task_types > 0:
                logger.warning(f"Found {null_task_types} records with NULL task_type_id")
            
            # Check for negative counts
            negative_counts = conn.execute("""
                SELECT COUNT(*) FROM fact_task_count WHERE task_count < 0
            """).fetchone()[0]
            
            if negative_counts > 0:
                logger.warning(f"Found {negative_counts} records with negative task counts")
            
            # Check for rejected records
            rejected_count = conn.execute("""
                SELECT COUNT(*) FROM rejected_records
            """).fetchone()[0]
            
            if rejected_count > 0:
                logger.warning(f"Found {rejected_count} rejected records")
            
            # Reconcile VOI vs Manual totals (if both exist for same date/driver)
            reconciliation_query = """
            SELECT 
                fs.driver_id,
                fs.shift_date,
                SUM(CASE WHEN fs.source = 'manual' THEN ftc.task_count ELSE 0 END) as manual_total,
                SUM(CASE WHEN fs.source = 'voi_daily' THEN ftc.task_count ELSE 0 END) as voi_total
            FROM fact_shift fs
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            WHERE fs.shift_date >= DATE('now', '-30 days')
            GROUP BY fs.driver_id, fs.shift_date
            HAVING manual_total > 0 AND voi_total > 0
            """
            
            reconciliation_df = pd.read_sql(reconciliation_query, conn)
            if not reconciliation_df.empty:
                logger.info(f"Reconciliation check: {len(reconciliation_df)} date/driver combinations have both manual and VOI data")
        
        logger.info("Data validation completed")
    
    def audit_etl_run(self, table_name: str, row_count: int, inserted: int = 0, updated: int = 0):
        """Log ETL run statistics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO etl_audit (table_name, row_count, inserted, updated)
                VALUES (?, ?, ?, ?)
            """, (table_name, row_count, inserted, updated))
    
    def run_full_etl(self):
        """Run the complete ETL pipeline."""
        logger.info("Starting full ETL pipeline...")
        start_time = datetime.now()
        
        try:
            # Initialize database if needed
            if not os.path.exists(self.db_path):
                self.initialize_database()
            
            # Load staging data
            self.load_staging_data()
            
            # Transform dimensions
            self.transform_dimensions()
            
            # Transform facts
            self.transform_facts()
            
            # Validate data
            self.validate_data()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info(f"ETL pipeline completed successfully in {duration}")
            
            # Audit the run
            self.audit_etl_run('full_pipeline', 0, 0, 0)
            
        except Exception as e:
            logger.error(f"ETL pipeline failed: {e}")
            raise
    
    def get_kpi_summary(self) -> Dict:
        """Get current KPI summary for dashboard."""
        with sqlite3.connect(self.db_path) as conn:
            kpi_query = """
            SELECT 
                active_drivers_today,
                total_tasks_today,
                avg_tasks_7d,
                avg_tasks_30d,
                best_city_today
            FROM v_kpis
            """
            
            result = conn.execute(kpi_query).fetchone()
            if result:
                return {
                    'active_drivers_today': result[0] or 0,
                    'total_tasks_today': result[1] or 0,
                    'avg_tasks_7d': result[2] or 0,
                    'avg_tasks_30d': result[3] or 0,
                    'best_city_today': result[4] or 'N/A'
                }
            else:
                return {
                    'active_drivers_today': 0,
                    'total_tasks_today': 0,
                    'avg_tasks_7d': 0,
                    'avg_tasks_30d': 0,
                    'best_city_today': 'N/A'
                }

def main():
    """Main function to run ETL pipeline."""
    etl = ETLPipeline()
    etl.run_full_etl()
    
    # Print summary
    kpis = etl.get_kpi_summary()
    print("\n=== ETL Pipeline Summary ===")
    print(f"Active drivers today: {kpis['active_drivers_today']}")
    print(f"Total tasks today: {kpis['total_tasks_today']}")
    print(f"Average tasks (7d): {kpis['avg_tasks_7d']}")
    print(f"Average tasks (30d): {kpis['avg_tasks_30d']}")
    print(f"Best city today: {kpis['best_city_today']}")

if __name__ == "__main__":
    main()
