-- Driver Performance Dashboard - SQLite Database Schema
-- VOI Operations: Kiel, Flensburg, Rostock, Schwerin

-- ========================================
-- STAGING TABLES
-- ========================================

CREATE TABLE stg_manual_shift_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    source_row_num INTEGER NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date TEXT,
    driver_name TEXT,
    city TEXT,
    shift_type TEXT CHECK (shift_type IN ('PM', 'N')),
    -- English column names (current format)
    battery_swap INTEGER DEFAULT 0,
    bonus_battery_swap INTEGER DEFAULT 0,
    multi_task INTEGER DEFAULT 0,
    deploy INTEGER DEFAULT 0,
    rebalance INTEGER DEFAULT 0,
    in_field_quality_check INTEGER DEFAULT 0,
    rescue INTEGER DEFAULT 0,
    repark INTEGER DEFAULT 0,
    transport INTEGER DEFAULT 0,
    -- KPI columns
    battery_swap_avg_time_min REAL DEFAULT 0,
    ifqc_avg_time_min REAL DEFAULT 0,
    task_per_hour REAL DEFAULT 0,
    -- Legacy German column names (for backward compatibility)
    akkutausch INTEGER DEFAULT 0,
    bonus_swaps INTEGER DEFAULT 0,
    multitask_swaps INTEGER DEFAULT 0,
    qualitaetskontrolle INTEGER DEFAULT 0
);

CREATE TABLE stg_voi_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    source_row_num INTEGER NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    driver TEXT,
    city TEXT,
    date TEXT,
    task_type TEXT,
    count INTEGER DEFAULT 0,
    duration_minutes REAL DEFAULT 0,
    battery_usage REAL DEFAULT 0,
    bonus_penalties REAL DEFAULT 0
);

CREATE TABLE stg_voi_monthly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file TEXT NOT NULL,
    source_row_num INTEGER NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    driver TEXT,
    city TEXT,
    month TEXT,
    task_type TEXT,
    count INTEGER DEFAULT 0,
    duration_minutes REAL DEFAULT 0,
    battery_usage REAL DEFAULT 0,
    bonus_penalties REAL DEFAULT 0
);

-- ========================================
-- SHIFT PLANNING TABLE
-- ========================================

CREATE TABLE dim_shift_schedule (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('PM', 'N')),
    team TEXT,
    city TEXT CHECK (city IN ('Kiel', 'Flensburg', 'Rostock', 'Schwerin')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES dim_driver(driver_id)
);

-- ========================================
-- DIMENSION TABLES
-- ========================================

CREATE TABLE dim_city (
    city_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dim_driver (
    driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    alias_list TEXT, -- JSON array of aliases
    active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dim_task_type (
    task_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type_key TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_swap BOOLEAN DEFAULT FALSE,
    is_bonus BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dim_calendar (
    date_key TEXT PRIMARY KEY, -- YYYYMMDD format
    date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    week INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    is_month_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- FACT TABLES
-- ========================================

CREATE TABLE fact_shift (
    shift_id TEXT PRIMARY KEY, -- hash(driver_id + city_id + shift_date + source)
    driver_id INTEGER NOT NULL,
    city_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    shift_type TEXT CHECK (shift_type IN ('PM', 'N')),
    source TEXT NOT NULL, -- 'manual' or 'voi_daily' or 'voi_monthly'
    source_doc_id TEXT NOT NULL, -- hash(source_file + row_num)
    start_time TIME,
    end_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES dim_driver(driver_id),
    FOREIGN KEY (city_id) REFERENCES dim_city(city_id),
    UNIQUE (driver_id, shift_date, source, source_doc_id)
);

CREATE TABLE fact_task_count (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id TEXT NOT NULL,
    task_type_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    source_doc_id TEXT NOT NULL,
    task_count INTEGER NOT NULL DEFAULT 0,
    duration_minutes REAL DEFAULT 0,
    is_multitask BOOLEAN DEFAULT FALSE,
    is_bonus BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES fact_shift(shift_id),
    FOREIGN KEY (task_type_id) REFERENCES dim_task_type(task_type_id),
    CHECK (task_count >= 0),
    CHECK (duration_minutes >= 0),
    UNIQUE (shift_id, task_type_id, source, source_doc_id)
);

-- ========================================
-- AUDIT AND ERROR TABLES
-- ========================================

CREATE TABLE etl_audit (
    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    inserted INTEGER DEFAULT 0,
    updated INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rejected_records (
    record_hash TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    raw_payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- VIEWS FOR DASHBOARD
-- ========================================

-- Driver daily performance view
CREATE VIEW v_driver_daily AS
SELECT 
    d.full_name as driver_name,
    c.name as city_name,
    fs.shift_date,
    SUM(ftc.task_count) as total_tasks,
    SUM(ftc.duration_minutes) as total_duration,
    COUNT(DISTINCT ftc.task_type_id) as task_types,
    SUM(CASE WHEN ftc.is_bonus = 1 THEN ftc.task_count ELSE 0 END) as bonus_tasks,
    SUM(CASE WHEN dt.is_swap = 1 THEN ftc.task_count ELSE 0 END) as swap_tasks,
    ROUND(SUM(ftc.task_count) * 60.0 / NULLIF(SUM(ftc.duration_minutes), 0), 2) as tasks_per_hour
FROM fact_shift fs
JOIN dim_driver d ON fs.driver_id = d.driver_id
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
LEFT JOIN dim_task_type dt ON ftc.task_type_id = dt.task_type_id
WHERE fs.shift_date >= DATE('now', '-30 days')
GROUP BY d.full_name, c.name, fs.shift_date;

-- City daily performance view
CREATE VIEW v_city_daily AS
SELECT 
    c.name as city_name,
    fs.shift_date,
    COUNT(DISTINCT fs.driver_id) as active_drivers,
    SUM(ftc.task_count) as total_tasks,
    SUM(ftc.duration_minutes) as total_duration,
    ROUND(AVG(ftc.task_count), 2) as avg_tasks_per_driver,
    ROUND(SUM(ftc.task_count) * 60.0 / NULLIF(SUM(ftc.duration_minutes), 0), 2) as tasks_per_hour
FROM fact_shift fs
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
WHERE fs.shift_date >= DATE('now', '-30 days')
GROUP BY c.name, fs.shift_date;

-- Driver monthly performance view
CREATE VIEW v_driver_monthly AS
SELECT 
    d.full_name as driver_name,
    c.name as city_name,
    strftime('%Y-%m', fs.shift_date) as month,
    SUM(ftc.task_count) as total_tasks,
    SUM(ftc.duration_minutes) as total_duration,
    COUNT(DISTINCT fs.shift_date) as days_worked,
    ROUND(AVG(ftc.task_count), 2) as avg_tasks_per_day,
    SUM(CASE WHEN ftc.is_bonus = 1 THEN ftc.task_count ELSE 0 END) as bonus_tasks,
    SUM(CASE WHEN dt.is_swap = 1 THEN ftc.task_count ELSE 0 END) as swap_tasks,
    ROUND(SUM(CASE WHEN ftc.is_bonus = 1 THEN ftc.task_count ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN dt.is_swap = 1 THEN ftc.task_count ELSE 0 END), 0), 2) as bonus_ratio
FROM fact_shift fs
JOIN dim_driver d ON fs.driver_id = d.driver_id
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
LEFT JOIN dim_task_type dt ON ftc.task_type_id = dt.task_type_id
WHERE fs.shift_date >= DATE('now', '-365 days')
GROUP BY d.full_name, c.name, strftime('%Y-%m', fs.shift_date);

-- City monthly performance view
CREATE VIEW v_city_monthly AS
SELECT 
    c.name as city_name,
    strftime('%Y-%m', fs.shift_date) as month,
    COUNT(DISTINCT fs.driver_id) as active_drivers,
    SUM(ftc.task_count) as total_tasks,
    SUM(ftc.duration_minutes) as total_duration,
    ROUND(AVG(ftc.task_count), 2) as avg_tasks_per_driver,
    COUNT(DISTINCT fs.shift_date) as days_active
FROM fact_shift fs
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
WHERE fs.shift_date >= DATE('now', '-365 days')
GROUP BY c.name, strftime('%Y-%m', fs.shift_date);

-- Daily leaderboard view
CREATE VIEW v_leaderboard_daily AS
SELECT 
    fs.shift_date,
    d.full_name as driver_name,
    c.name as city_name,
    SUM(ftc.task_count) as total_tasks,
    RANK() OVER (PARTITION BY fs.shift_date ORDER BY SUM(ftc.task_count) DESC) as daily_rank
FROM fact_shift fs
JOIN dim_driver d ON fs.driver_id = d.driver_id
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
WHERE fs.shift_date >= DATE('now', '-30 days')
GROUP BY fs.shift_date, d.full_name, c.name;

-- Delta comparison view
CREATE VIEW v_deltas AS
SELECT 
    d.full_name as driver_name,
    c.name as city_name,
    fs.shift_date,
    SUM(ftc.task_count) as total_tasks,
    LAG(SUM(ftc.task_count)) OVER (PARTITION BY d.full_name, c.name ORDER BY fs.shift_date) as prev_day_tasks,
    SUM(ftc.task_count) - LAG(SUM(ftc.task_count)) OVER (PARTITION BY d.full_name, c.name ORDER BY fs.shift_date) as day_delta,
    ROUND((SUM(ftc.task_count) - LAG(SUM(ftc.task_count)) OVER (PARTITION BY d.full_name, c.name ORDER BY fs.shift_date)) * 100.0 / 
          NULLIF(LAG(SUM(ftc.task_count)) OVER (PARTITION BY d.full_name, c.name ORDER BY fs.shift_date), 0), 2) as day_delta_pct
FROM fact_shift fs
JOIN dim_driver d ON fs.driver_id = d.driver_id
JOIN dim_city c ON fs.city_id = c.city_id
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
WHERE fs.shift_date >= DATE('now', '-30 days')
GROUP BY d.full_name, c.name, fs.shift_date;

-- KPI summary view
CREATE VIEW v_kpis AS
SELECT 
    DATE('now') as current_date,
    COUNT(DISTINCT CASE WHEN fs.shift_date = DATE('now') THEN fs.driver_id END) as active_drivers_today,
    SUM(CASE WHEN fs.shift_date = DATE('now') THEN ftc.task_count ELSE 0 END) as total_tasks_today,
    ROUND(AVG(CASE WHEN fs.shift_date >= DATE('now', '-7 days') THEN ftc.task_count END), 2) as avg_tasks_7d,
    ROUND(AVG(CASE WHEN fs.shift_date >= DATE('now', '-30 days') THEN ftc.task_count END), 2) as avg_tasks_30d,
    (SELECT city_name FROM v_city_daily 
     WHERE shift_date = DATE('now') 
     ORDER BY total_tasks DESC LIMIT 1) as best_city_today
FROM fact_shift fs
LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Staging table indexes
CREATE INDEX idx_stg_manual_source ON stg_manual_shift_reports(source_file, source_row_num);
CREATE INDEX idx_stg_voi_daily_source ON stg_voi_daily(source_file, source_row_num);
CREATE INDEX idx_stg_voi_monthly_source ON stg_voi_monthly(source_file, source_row_num);

-- Dimension table indexes
CREATE INDEX idx_dim_driver_name ON dim_driver(full_name);
CREATE INDEX idx_dim_driver_active ON dim_driver(active);
CREATE INDEX idx_dim_city_active ON dim_city(active);
CREATE INDEX idx_dim_task_type_key ON dim_task_type(task_type_key);
CREATE INDEX idx_dim_calendar_date ON dim_calendar(date);

-- Fact table indexes
CREATE INDEX idx_fact_shift_date ON fact_shift(shift_date);
CREATE INDEX idx_fact_shift_driver ON fact_shift(driver_id);
CREATE INDEX idx_fact_shift_city ON fact_shift(city_id);
CREATE INDEX idx_fact_shift_source ON fact_shift(source);
CREATE INDEX idx_fact_task_count_shift ON fact_task_count(shift_id);
CREATE INDEX idx_fact_task_count_type ON fact_task_count(task_type_id);

-- Composite indexes for common queries
CREATE INDEX idx_fact_shift_driver_date ON fact_shift(driver_id, shift_date);
CREATE INDEX idx_fact_shift_city_date ON fact_shift(city_id, shift_date);
CREATE INDEX idx_fact_task_count_shift_type ON fact_task_count(shift_id, task_type_id);

-- ========================================
-- INITIAL DATA POPULATION
-- ========================================

-- Insert cities
INSERT INTO dim_city (name) VALUES 
('Kiel'), ('Flensburg'), ('Rostock'), ('Schwerin');

-- Insert task types with canonical mapping
INSERT INTO dim_task_type (task_type_key, display_name, is_swap, is_bonus) VALUES
('battery_swap', 'Battery Swap', TRUE, FALSE),
('battery_bonus_swap', 'Bonus Battery Swap', TRUE, TRUE),
('multi_task', 'Multi Task', FALSE, FALSE),
('deploy', 'Deploy', FALSE, FALSE),
('rebalance', 'Rebalance', FALSE, FALSE),
('quality_check', 'In Field Quality Check', FALSE, FALSE),
('rescue', 'Rescue', FALSE, FALSE),
('repark', 'Repark', FALSE, FALSE),
('transport', 'Transport', FALSE, FALSE);

-- Populate calendar dimension for the next 2 years
INSERT INTO dim_calendar (date_key, date, day_of_week, week, month, year, is_month_end)
SELECT 
    strftime('%Y%m%d', date('now', '+' || value || ' days')) as date_key,
    date('now', '+' || value || ' days') as date,
    CASE strftime('%w', date('now', '+' || value || ' days'))
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
    END as day_of_week,
    strftime('%W', date('now', '+' || value || ' days')) as week,
    CAST(strftime('%m', date('now', '+' || value || ' days')) AS INTEGER) as month,
    CAST(strftime('%Y', date('now', '+' || value || ' days')) AS INTEGER) as year,
    CASE 
        WHEN date('now', '+' || value || ' days') = date(date('now', '+' || value || ' days', 'start of month', '+1 month', '-1 day')) 
        THEN TRUE 
        ELSE FALSE 
    END as is_month_end
FROM (
    WITH RECURSIVE counter(x) AS (
        SELECT 0
        UNION ALL
        SELECT x+1 FROM counter WHERE x < 730
    )
    SELECT x as value FROM counter
);
