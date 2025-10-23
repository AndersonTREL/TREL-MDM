"""
Professional Driver Performance Dashboard
A sleek, modern, and data-driven interface for operations managers, 
city supervisors, and regional leads to monitor driver performance.

Features:
- Real-time KPI monitoring
- Interactive trend analysis
- Geospatial performance mapping
- Driver ranking and insights
- Responsive design
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import sqlite3
from datetime import datetime, date, timedelta
import json
from typing import Dict, List, Optional
import os
import warnings

# Suppress warnings for clean output
warnings.filterwarnings("ignore")
os.environ['PYTHONWARNINGS'] = 'ignore'

# Page configuration
st.set_page_config(
    page_title="Driver Performance Dashboard",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Modern Dark Theme CSS Design
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    /* Global Dark Theme Styles */
    .main .block-container {
        padding-top: 0;
        padding-bottom: 0;
        max-width: 1600px;
    }
    
    .stApp {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #f8fafc;
    }
    
    /* Hide Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* Dark theme overrides for all Streamlit components */
    .stSelectbox > div > div {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    
    .stSelectbox label {
        color: #f8fafc !important;
    }
    
    .stTextInput > div > div > input {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    
    .stTextInput label {
        color: #f8fafc !important;
    }
    
    .stNumberInput > div > div > input {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    
    .stNumberInput label {
        color: #f8fafc !important;
    }
    
    .stDateInput > div > div > input {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
        border-radius: 8px !important;
    }
    
    .stDateInput label {
        color: #f8fafc !important;
    }
    
    .stButton > button {
        background-color: #4B6BFB !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }
    
    .stButton > button:hover {
        background-color: #3b5bf0 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(75, 107, 251, 0.3) !important;
    }
    
    .stTabs [data-baseweb="tab-list"] {
        background-color: #1e293b !important;
        border-radius: 8px !important;
        padding: 4px !important;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: transparent !important;
        color: #94a3b8 !important;
        border-radius: 6px !important;
        margin: 2px !important;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: #4B6BFB !important;
        color: white !important;
    }
    
    .stFileUploader > div {
        background-color: #1e293b !important;
        border: 2px dashed #334155 !important;
        border-radius: 8px !important;
        color: #f8fafc !important;
    }
    
    .stFileUploader label {
        color: #f8fafc !important;
    }
    
    .stDataFrame {
        background-color: #1e293b !important;
        border-radius: 8px !important;
        border: 1px solid #334155 !important;
    }
    
    .stJson {
        background-color: #1e293b !important;
        border-radius: 8px !important;
        border: 1px solid #334155 !important;
        color: #f8fafc !important;
    }
    
    .stMetric {
        background-color: #1e293b !important;
        border-radius: 8px !important;
        border: 1px solid #334155 !important;
        padding: 1rem !important;
    }
    
    .stMetric > div {
        color: #f8fafc !important;
    }
    
    .stSuccess {
        background-color: #065f46 !important;
        color: #d1fae5 !important;
        border: 1px solid #10b981 !important;
        border-radius: 8px !important;
    }
    
    .stError {
        background-color: #7f1d1d !important;
        color: #fecaca !important;
        border: 1px solid #dc2626 !important;
        border-radius: 8px !important;
    }
    
    .stInfo {
        background-color: #1e3a8a !important;
        color: #dbeafe !important;
        border: 1px solid #3b82f6 !important;
        border-radius: 8px !important;
    }
    
    .stWarning {
        background-color: #78350f !important;
        color: #fef3c7 !important;
        border: 1px solid #f59e0b !important;
        border-radius: 8px !important;
    }
    
    /* Global Header - Dark Theme */
    .global-header {
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        padding: 1rem 2rem;
        margin: -1rem -1rem 2rem -1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        position: sticky;
        top: 0;
        z-index: 100;
        border-bottom: 1px solid #334155;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1600px;
        margin: 0 auto;
        position: relative;
    }
    
    .header-center {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .logo-container {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4B6BFB, #3b5bf0);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(75, 107, 251, 0.3);
    }
    
    .logo-icon {
        font-size: 1.2rem;
        color: white;
    }
    
    .header-title {
        color: #f8fafc;
        font-size: 1.3rem;
        font-weight: 600;
        margin: 0;
    }
    
    .header-subtitle {
        color: #cbd5e1;
        font-size: 0.9rem;
        font-weight: 400;
        opacity: 0.8;
        margin: 0;
    }
    
    .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .data-freshness {
        color: #94a3b8;
        font-size: 0.85rem;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .user-profile {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4B6BFB, #3b5bf0);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(75, 107, 251, 0.3);
    }
    
    .user-profile:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(75, 107, 251, 0.4);
    }
    
    /* Filter Bar - Dark Theme */
    .filter-bar {
        background: #1e293b;
        padding: 1rem 2rem;
        margin: 0 -1rem 2rem -1rem;
        border-bottom: 1px solid #334155;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .filter-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1600px;
        margin: 0 auto;
        gap: 2rem;
    }
    
    .filter-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #f8fafc;
    }
    
    .filter-right {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: #f8fafc;
    }
    
    /* KPI Cards - Dark Theme */
    .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .kpi-card {
        background: #1e293b;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #334155;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
    }
    
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        border-color: #4B6BFB;
    }
    
    .kpi-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--kpi-color, #4B6BFB);
    }
    
    .kpi-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }
    
    .kpi-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        background: var(--kpi-bg, #334155);
        color: var(--kpi-color, #4B6BFB);
    }
    
    .kpi-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #f8fafc;
        font-family: 'JetBrains Mono', monospace;
        margin-bottom: 0.5rem;
        line-height: 1;
    }
    
    .kpi-change {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .kpi-change.positive {
        color: #10b981;
    }
    
    .kpi-change.negative {
        color: #ef4444;
    }
    
    .kpi-change.neutral {
        color: #94a3b8;
    }
    
    /* Chart Containers - Dark Theme */
    .chart-container {
        background: #1e293b;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #334155;
        margin-bottom: 2rem;
    }
    
    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #334155;
    }
    
    .chart-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #f8fafc;
    }
    
    .chart-subtitle {
        font-size: 0.875rem;
        color: #94a3b8;
        margin-top: 0.25rem;
    }
    
    /* Table Styles - Dark Theme */
    .data-table {
        background: #1e293b;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #334155;
    }
    
    /* Alert Panel - Dark Theme */
    .alert-panel {
        background: #1e293b;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #334155;
        margin-bottom: 2rem;
    }
    
    .alert-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 4px solid;
    }
    
    .alert-item.warning {
        background: #451a03;
        border-left-color: #f59e0b;
        color: #fef3c7;
    }
    
    .alert-item.error {
        background: #7f1d1d;
        border-left-color: #dc2626;
        color: #fecaca;
    }
    
    .alert-item.info {
        background: #1e3a8a;
        border-left-color: #3b82f6;
        color: #dbeafe;
    }
    
    .alert-icon {
        font-size: 1.2rem;
    }
    
    .alert-content {
        flex: 1;
    }
    
    .alert-title {
        font-weight: 600;
        color: #f8fafc;
        margin-bottom: 0.25rem;
    }
    
    .alert-description {
        font-size: 0.875rem;
        color: #cbd5e1;
    }
    
    /* Chart Styling for Dark Theme */
    .js-plotly-plot .plotly .modebar {
        background-color: #1e293b !important;
    }
    
    .js-plotly-plot .plotly .modebar-btn {
        color: #f8fafc !important;
    }
    
    .js-plotly-plot .plotly .modebar-btn:hover {
        background-color: #334155 !important;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            gap: 1rem;
        }
        
        .filter-content {
            flex-direction: column;
            gap: 1rem;
        }
        
        .kpi-grid {
            grid-template-columns: 1fr;
        }
    }
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f5f9;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
</style>
""", unsafe_allow_html=True)

class ProfessionalDashboard:
    def __init__(self):
        self.db_path = "driver_performance.db"
        self.initialize_session_state()
    
    def initialize_session_state(self):
        """Initialize session state variables."""
        if 'selected_city' not in st.session_state:
            st.session_state.selected_city = "All Cities"
        if 'selected_team' not in st.session_state:
            st.session_state.selected_team = "All Teams"
        if 'date_range' not in st.session_state:
            st.session_state.date_range = [date.today() - timedelta(days=7), date.today()]
    
    def get_database_connection(self):
        """Get database connection."""
        try:
            return sqlite3.connect(self.db_path)
        except Exception as e:
            st.error(f"Database connection error: {e}")
            return None
    
    def get_real_data(self, selected_team=None, selected_city=None, time_period="All Time"):
        """Get real data from the database."""
        conn = self.get_database_connection()
        if not conn:
            return self.generate_sample_data()
        
        try:
            # Calculate date range based on time period
            today = date.today()
            if time_period == "This Week":
                start_date = today - timedelta(days=today.weekday())
                end_date = start_date + timedelta(days=6)
            elif time_period == "Last Week":
                start_date = today - timedelta(days=today.weekday() + 7)
                end_date = start_date + timedelta(days=6)
            elif time_period == "This Month":
                start_date = today.replace(day=1)
                if today.month == 12:
                    end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            else:  # All Time
                start_date = None
                end_date = None
            # Get driver performance data with optional team and city filtering
            driver_query = """
            SELECT 
                d.full_name as name,
                d.team,
                c.name as city,
                COUNT(DISTINCT fs.shift_id) as shifts_count,
                SUM(COALESCE(ftc.task_count, 0)) as tasks_completed,
                AVG(COALESCE(sms.battery_swap_avg_time_min, 0)) as battery_swap_avg_time,
                AVG(COALESCE(sms.ifqc_avg_time_min, 0)) as ifqc_avg_time,
                AVG(COALESCE(sms.task_per_hour, 0)) as task_per_hour,
                CASE WHEN d.active = 1 THEN 'Active' ELSE 'Inactive' END as status
            FROM dim_driver d
            LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
            LEFT JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE 1=1
            """
            
            params = []
            if selected_team and selected_team != "All Teams":
                driver_query += " AND d.team = ?"
                params.append(selected_team)
            
            if selected_city and selected_city != "All Cities":
                driver_query += " AND c.name = ?"
                params.append(selected_city)
            
            # Add date filtering if time period is specified
            if start_date and end_date:
                driver_query += " AND fs.shift_date BETWEEN ? AND ?"
                params.extend([start_date, end_date])
            
            driver_query += """
            GROUP BY d.driver_id, d.full_name, d.team, c.name, d.active
            ORDER BY tasks_completed DESC
            """
            
            drivers_df = pd.read_sql_query(driver_query, conn, params=params)
            
            # Get daily performance data with optional team and city filtering
            daily_query = """
            SELECT 
                fs.shift_date as date,
                COUNT(DISTINCT fs.driver_id) as active_drivers,
                SUM(COALESCE(ftc.task_count, 0)) as total_tasks,
                SUM(COALESCE(ftc.task_count, 0)) as completed_tasks,
                AVG(COALESCE(sms.task_per_hour, 0)) as efficiency,
                0 as incidents
            FROM fact_shift fs
            JOIN dim_driver d ON fs.driver_id = d.driver_id
            LEFT JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE 1=1
            """
            
            daily_params = []
            if selected_team and selected_team != "All Teams":
                daily_query += " AND d.team = ?"
                daily_params.append(selected_team)
            
            if selected_city and selected_city != "All Cities":
                daily_query += " AND c.name = ?"
                daily_params.append(selected_city)
            
            daily_query += """
            GROUP BY fs.shift_date
            ORDER BY fs.shift_date DESC
            LIMIT 30
            """
            
            daily_df = pd.read_sql_query(daily_query, conn, params=daily_params)
            
            daily_df['date'] = pd.to_datetime(daily_df['date'])
            
            # Get hourly data (simplified for now)
            hourly_data = []
            for hour in range(24):
                hourly_data.append({
                    'hour': hour,
                    'city': 'All Cities',
                    'tasks': np.random.randint(5, 25),  # Placeholder - would need more complex query
                    'efficiency': np.random.uniform(80, 95),
                    'active_drivers': np.random.randint(3, 15)
                })
            
            hourly_df = pd.DataFrame(hourly_data)
            
            conn.close()
            return drivers_df, hourly_df, daily_df
            
        except Exception as e:
            st.error(f"Error fetching data: {e}")
            conn.close()
            return self.generate_sample_data()
    
    def generate_sample_data(self):
        """Generate comprehensive sample data for demonstration."""
        cities = ['Kiel', 'Flensburg', 'Rostock', 'Schwerin']
        teams = ['Team KI/FL', 'Team HRO/SW']
        
        # Generate driver data
        drivers = []
        for i in range(50):
            driver = {
                'id': f'D{i+1:03d}',
                'name': f'Driver {i+1}',
                'city': np.random.choice(cities),
                'team': np.random.choice(teams),
                'tasks_completed': np.random.randint(20, 100),
                'efficiency': np.random.uniform(85, 98),
                'avg_task_time': np.random.uniform(3, 8),
                'safety_score': np.random.uniform(90, 100),
                'rating': np.random.uniform(4.0, 5.0),
                'status': np.random.choice(['Active', 'Inactive', 'On Break'], p=[0.8, 0.1, 0.1])
            }
            drivers.append(driver)
        
        # Generate hourly data for trends
        hourly_data = []
        for hour in range(24):
            for city in cities:
                hourly_data.append({
                    'hour': hour,
                    'city': city,
                    'tasks': np.random.randint(10, 50),
                    'efficiency': np.random.uniform(80, 95),
                    'active_drivers': np.random.randint(5, 20)
                })
        
        # Generate daily historical data
        daily_data = []
        for i in range(30):
            date_val = date.today() - timedelta(days=29-i)
            daily_data.append({
                'date': date_val,
                'total_tasks': np.random.randint(800, 1200),
                'completed_tasks': np.random.randint(700, 1100),
                'efficiency': np.random.uniform(85, 95),
                'active_drivers': np.random.randint(80, 120),
                'incidents': np.random.randint(0, 5)
            })
        
        return pd.DataFrame(drivers), pd.DataFrame(hourly_data), pd.DataFrame(daily_data)
    
    def create_global_header(self):
        """Create the global header with logo, title, and user profile."""
        st.markdown("""
        <div class="global-header">
            <div class="header-content">
                <div class="header-center">
                    <div class="logo-container">
                        <div class="logo-icon">🛴</div>
                    </div>
                    <div>
                        <div class="header-title">Driver Performance Dashboard</div>
                        <div class="header-subtitle">Real-time Analytics & Insights</div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="data-freshness">Last updated: """ + datetime.now().strftime("%H:%M:%S") + """</div>
                    <div class="user-profile">AM</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    def create_filter_bar(self):
        """Create the global filter bar."""
        st.markdown("""
        <div class="filter-bar">
            <div class="filter-content">
                <div class="filter-left">
                    <span style="font-weight: 600; color: #1e293b;">Filters:</span>
                </div>
                <div class="filter-right">
                    <span style="color: #64748b; font-size: 0.875rem;">Quick Actions</span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Filter controls
        col1, col2, col3, col4 = st.columns([2, 2, 2, 1])
        
        with col1:
            date_range = st.date_input(
                "Date Range",
                value=(date.today() - timedelta(days=7), date.today()),
                key="date_filter"
            )
        
        with col2:
            # Get cities from database
            conn = self.get_database_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("SELECT DISTINCT name FROM dim_city ORDER BY name")
                    db_cities = [row[0] for row in cursor.fetchall()]
                    conn.close()
                    city_options = ["All Cities"] + db_cities
                except:
                    city_options = ["All Cities", "Kiel", "Flensburg", "Rostock", "Schwerin"]
            else:
                city_options = ["All Cities", "Kiel", "Flensburg", "Rostock", "Schwerin"]
            
            city = st.selectbox(
                "City",
                city_options,
                key="city_filter"
            )
        
        with col3:
            # Get teams from database
            conn = self.get_database_connection()
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("SELECT DISTINCT team FROM dim_driver WHERE team IS NOT NULL ORDER BY team")
                    db_teams = [row[0] for row in cursor.fetchall()]
                    conn.close()
                    team_options = ["All Teams"] + db_teams
                except:
                    team_options = ["All Teams", "Team KI/FL", "Team HRO/SW"]
            else:
                team_options = ["All Teams", "Team KI/FL", "Team HRO/SW"]
            
            team = st.selectbox(
                "Team",
                team_options,
                key="team_filter"
            )
        
        with col4:
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("🔄 Refresh", key="refresh_btn"):
                st.rerun()
    
    def create_kpi_cards(self, drivers_df, daily_df):
        """Create the KPI summary cards."""
        st.markdown('<div class="kpi-grid">', unsafe_allow_html=True)
        
        # Calculate KPIs
        total_drivers = len(drivers_df[drivers_df['status'] == 'Active'])
        total_tasks = daily_df['total_tasks'].iloc[-1] if len(daily_df) > 0 else 0
        avg_task_per_hour = drivers_df['task_per_hour'].mean() if 'task_per_hour' in drivers_df.columns else 0
        avg_battery_time = drivers_df['battery_swap_avg_time'].mean() if 'battery_swap_avg_time' in drivers_df.columns else 0
        avg_ifqc_time = drivers_df['ifqc_avg_time'].mean() if 'ifqc_avg_time' in drivers_df.columns else 0
        
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #3b82f6; --kpi-bg: #dbeafe;">
                <div class="kpi-header">
                    <div class="kpi-title">Active Drivers</div>
                    <div class="kpi-icon">👥</div>
                </div>
                <div class="kpi-value">{total_drivers}</div>
                <div class="kpi-change positive">
                    <span>↗</span>
                    <span>+3 from yesterday</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #059669; --kpi-bg: #d1fae5;">
                <div class="kpi-header">
                    <div class="kpi-title">Tasks Today</div>
                    <div class="kpi-icon">📋</div>
                </div>
                <div class="kpi-value">{total_tasks:,}</div>
                <div class="kpi-change positive">
                    <span>↗</span>
                    <span>+12.5% vs yesterday</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #7c3aed; --kpi-bg: #ede9fe;">
                <div class="kpi-header">
                    <div class="kpi-title">Task per Hour</div>
                    <div class="kpi-icon">⚡</div>
                </div>
                <div class="kpi-value">{avg_task_per_hour:.1f}</div>
                <div class="kpi-change positive">
                    <span>↗</span>
                    <span>+2.1 improvement</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #dc2626; --kpi-bg: #fee2e2;">
                <div class="kpi-header">
                    <div class="kpi-title">Battery Swap Avg Time</div>
                    <div class="kpi-icon">⏱️</div>
                </div>
                <div class="kpi-value">{avg_battery_time:.1f}m</div>
                <div class="kpi-change negative">
                    <span>↘</span>
                    <span>+0.3m slower</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col5:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #f59e0b; --kpi-bg: #fef3c7;">
                <div class="kpi-header">
                    <div class="kpi-title">IFQC Avg Time</div>
                    <div class="kpi-icon">🔍</div>
                </div>
                <div class="kpi-value">{avg_ifqc_time:.1f}m</div>
                <div class="kpi-change positive">
                    <span>↗</span>
                    <span>-0.2m faster</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    def create_trend_charts(self, hourly_df, daily_df):
        """Create trend and time-series charts."""
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div class="chart-container">
                <div class="chart-header">
                    <div>
                        <div class="chart-title">Tasks Completed per Day</div>
                        <div class="chart-subtitle">Daily task completion trends</div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Daily tasks chart - Bar Chart
            fig_daily = px.bar(
                daily_df,
                x='date',
                y='total_tasks',
                title="",
                height=350
            )
            
            fig_daily.update_layout(
                plot_bgcolor='#1e293b',
                paper_bgcolor='#1e293b',
                font=dict(family='Inter', size=12, color='#f8fafc'),
                xaxis=dict(
                    title="Date",
                    showgrid=True,
                    gridcolor='#334155',
                    color='#f8fafc'
                ),
                yaxis=dict(
                    title="Tasks Completed",
                    showgrid=True,
                    gridcolor='#334155',
                    color='#f8fafc'
                ),
                margin=dict(l=0, r=0, t=0, b=0)
            )
            
            fig_daily.update_traces(
                marker_color='#4B6BFB',
                marker_line_color='#2563eb',
                marker_line_width=1
            )
            
            st.plotly_chart(fig_daily, use_container_width=True)
        
        with col2:
            st.markdown("""
            <div class="chart-container">
                <div class="chart-header">
                    <div>
                        <div class="chart-title">Task per Hour Trends (30 Days)</div>
                        <div class="chart-subtitle">Daily task per hour performance</div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Task per hour trend chart - Bar Chart
            fig_task_per_hour = px.bar(
                daily_df,
                x='date',
                y='efficiency',  # This column contains task_per_hour data
                title="",
                height=350
            )
            
            fig_task_per_hour.update_layout(
                plot_bgcolor='#1e293b',
                paper_bgcolor='#1e293b',
                font=dict(family='Inter', size=12, color='#f8fafc'),
                xaxis=dict(
                    title="Date",
                    showgrid=True,
                    gridcolor='#334155',
                    color='#f8fafc'
                ),
                yaxis=dict(
                    title="Task per Hour",
                    showgrid=True,
                    gridcolor='#334155',
                    color='#f8fafc'
                ),
                margin=dict(l=0, r=0, t=0, b=0)
            )
            
            fig_task_per_hour.update_traces(
                marker_color='#7c3aed',
                marker_line_color='#6d28d9',
                marker_line_width=1
            )
            
            st.plotly_chart(fig_task_per_hour, use_container_width=True)
    
    def create_geospatial_map(self, drivers_df):
        """Create geospatial visualization."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">Driver Performance by City</div>
                    <div class="chart-subtitle">Geographic distribution and performance heatmap</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # City performance summary
        if 'task_per_hour' in drivers_df.columns and 'tasks_completed' in drivers_df.columns:
            city_performance = drivers_df.groupby('city').agg({
                'task_per_hour': 'mean',
                'tasks_completed': 'sum',
                'name': 'count'
            }).reset_index()
            city_performance.columns = ['City', 'Avg Task/Hour', 'Total Tasks', 'Driver Count']
        else:
            # Fallback for sample data
            city_performance = drivers_df.groupby('city').agg({
                'tasks_completed': 'sum',
                'name': 'count'
            }).reset_index()
            city_performance.columns = ['City', 'Total Tasks', 'Driver Count']
            city_performance['Avg Task/Hour'] = 0
        
        # Create a simple bar chart as map alternative
        fig_city = px.bar(
            city_performance,
            x='City',
            y='Avg Task/Hour',
            color='Total Tasks',
            title="",
            color_continuous_scale='Viridis',
            height=300
        )
        
        fig_city.update_layout(
            plot_bgcolor='#1e293b',
            paper_bgcolor='#1e293b',
            font=dict(family='Inter', size=12, color='#f8fafc'),
            xaxis=dict(showgrid=True, gridcolor='#334155', color='#f8fafc'),
            yaxis=dict(showgrid=True, gridcolor='#334155', color='#f8fafc'),
            margin=dict(l=0, r=0, t=0, b=0)
        )
        
        st.plotly_chart(fig_city, use_container_width=True)
    
    def create_driver_table(self, drivers_df):
        """Create driver ranking table."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">Driver Performance Ranking</div>
                    <div class="chart-subtitle">Top performers and detailed metrics</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Add time period selector
        col_period1, col_period2 = st.columns([1, 3])
        
        with col_period1:
            time_period = st.selectbox(
                "Time Period",
                ["All Time", "This Week", "Last Week", "This Month"],
                key="ranking_time_period"
            )
        
        with col_period2:
            if time_period == "This Week":
                st.info("📅 Showing performance for current week")
            elif time_period == "Last Week":
                st.info("📅 Showing performance for previous week")
            elif time_period == "This Month":
                st.info("📅 Showing performance for current month")
            else:
                st.info("📅 Showing all-time performance")
        
        # Get data based on selected time period
        if time_period != "All Time":
            # Get filtered data for the selected time period
            drivers_df_filtered, _, _ = self.get_real_data(
                selected_team=st.session_state.get('team_filter', None),
                selected_city=st.session_state.get('city_filter', None),
                time_period=time_period
            )
        else:
            drivers_df_filtered = drivers_df.copy()
        
        # Sort by tasks completed and show top 20
        if 'tasks_completed' in drivers_df_filtered.columns:
            # Convert tasks_completed to numeric, handling any non-numeric values
            drivers_df_filtered['tasks_completed'] = pd.to_numeric(drivers_df_filtered['tasks_completed'], errors='coerce').fillna(0)
            top_drivers = drivers_df_filtered.nlargest(20, 'tasks_completed')
        else:
            top_drivers = drivers_df_filtered.head(20)
        
        # Create a styled dataframe with available columns
        available_cols = ['name', 'city', 'tasks_completed']
        if 'task_per_hour' in drivers_df_filtered.columns:
            available_cols.append('task_per_hour')
        if 'battery_swap_avg_time' in drivers_df_filtered.columns:
            available_cols.append('battery_swap_avg_time')
        if 'ifqc_avg_time' in drivers_df_filtered.columns:
            available_cols.append('ifqc_avg_time')
        
        display_df = top_drivers[available_cols].copy()
        
        # Convert numeric columns to proper data types
        numeric_columns = ['tasks_completed', 'task_per_hour', 'battery_swap_avg_time', 'ifqc_avg_time']
        for col in numeric_columns:
            if col in display_df.columns:
                display_df[col] = pd.to_numeric(display_df[col], errors='coerce').fillna(0)
        
        # Add ranking column
        display_df = display_df.reset_index(drop=True)
        display_df['Rank'] = range(1, len(display_df) + 1)
        
        # Reorder columns to put Rank first
        cols = ['Rank'] + [col for col in display_df.columns if col != 'Rank']
        display_df = display_df[cols]
        
        # Rename columns
        column_mapping = {
            'name': 'Driver',
            'city': 'City', 
            'tasks_completed': 'Tasks',
            'task_per_hour': 'Task/Hour',
            'battery_swap_avg_time': 'Battery Avg (min)',
            'ifqc_avg_time': 'IFQC Avg (min)'
        }
        display_df = display_df.rename(columns=column_mapping)
        
        # Format numeric columns
        for col in display_df.columns:
            if col in ['Task/Hour', 'Battery Avg (min)', 'IFQC Avg (min)']:
                display_df[col] = display_df[col].round(1)
        
        st.dataframe(
            display_df,
            use_container_width=True,
            hide_index=True
        )
    
    def create_alerts_panel(self, drivers_df, daily_df):
        """Create alerts and insights panel."""
        st.markdown("""
        <div class="alert-panel">
            <div class="chart-header">
                <div>
                    <div class="chart-title">Alerts & Insights</div>
                    <div class="chart-subtitle">Important notifications and performance insights</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Generate dynamic alerts based on real data
        alerts = self.generate_dynamic_alerts()
        
        for alert in alerts:
            st.markdown(f"""
            <div class="alert-item {alert['type']}">
                <div class="alert-icon">{alert['icon']}</div>
                <div class="alert-content">
                    <div class="alert-title">{alert['title']}</div>
                    <div class="alert-description">{alert['description']}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    def generate_dynamic_alerts(self):
        """Generate dynamic alerts based on real performance data."""
        alerts = []
        
        try:
            conn = self.get_database_connection()
            if not conn:
                return [{
                    'type': 'error',
                    'icon': '❌',
                    'title': 'Database Connection Error',
                    'description': 'Unable to connect to database - alerts unavailable'
                }]
            
            cursor = conn.cursor()
            
            # Alert 1: Low Performance Drivers
            cursor.execute("""
                SELECT d.full_name, d.team, c.name as city, 
                       COALESCE(AVG(ftc.task_count), 0) as avg_tasks,
                       COALESCE(AVG(sms.task_per_hour), 0) as avg_task_per_hour
                FROM dim_driver d
                LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
                LEFT JOIN dim_city c ON fs.city_id = c.city_id
                LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
                LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.id
                WHERE fs.shift_date >= date('now', '-7 days')
                GROUP BY d.driver_id, d.full_name, d.team, c.name
                HAVING avg_task_per_hour < 5 AND avg_task_per_hour > 0
                ORDER BY avg_task_per_hour ASC
                LIMIT 3
            """)
            
            low_performers = cursor.fetchall()
            if low_performers:
                performer_names = [row[0] for row in low_performers]
                alerts.append({
                    'type': 'warning',
                    'icon': '⚠️',
                    'title': 'Low Performance Alert',
                    'description': f"{len(performer_names)} drivers have low task/hour rate: {', '.join(performer_names[:2])}{'...' if len(performer_names) > 2 else ''}"
                })
            
            # Alert 2: High Performance Drivers
            cursor.execute("""
                SELECT d.full_name, d.team, c.name as city,
                       COALESCE(AVG(sms.task_per_hour), 0) as avg_task_per_hour
                FROM dim_driver d
                LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
                LEFT JOIN dim_city c ON fs.city_id = c.city_id
                LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.id
                WHERE fs.shift_date >= date('now', '-7 days')
                GROUP BY d.driver_id, d.full_name, d.team, c.name
                HAVING avg_task_per_hour > 15
                ORDER BY avg_task_per_hour DESC
                LIMIT 2
            """)
            
            high_performers = cursor.fetchall()
            if high_performers:
                performer_names = [row[0] for row in high_performers]
                alerts.append({
                    'type': 'info',
                    'icon': '🎯',
                    'title': 'Peak Performance',
                    'description': f"Excellent performance: {', '.join(performer_names)} achieving high task/hour rates"
                })
            
            # Alert 3: Team Performance Comparison
            cursor.execute("""
                SELECT d.team, 
                       COALESCE(AVG(sms.task_per_hour), 0) as avg_task_per_hour,
                       COUNT(DISTINCT d.driver_id) as driver_count
                FROM dim_driver d
                LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
                LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.id
                WHERE fs.shift_date >= date('now', '-7 days') AND d.team IS NOT NULL
                GROUP BY d.team
                HAVING avg_task_per_hour > 0
                ORDER BY avg_task_per_hour DESC
            """)
            
            team_performance = cursor.fetchall()
            if len(team_performance) >= 2:
                best_team = team_performance[0]
                worst_team = team_performance[-1]
                if best_team[1] > worst_team[1] * 1.2:  # 20% better
                    alerts.append({
                        'type': 'info',
                        'icon': '📈',
                        'title': 'Team Performance Gap',
                        'description': f"{best_team[0]} outperforming {worst_team[0]} by {((best_team[1] / worst_team[1] - 1) * 100):.0f}% in task efficiency"
                    })
            
            # Alert 4: Shift Completion Status
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT CASE WHEN ss.status = 'completed' THEN ss.schedule_id END) as completed,
                    COUNT(DISTINCT ss.schedule_id) as total,
                    COUNT(DISTINCT CASE WHEN ss.status = 'scheduled' AND ss.shift_date < date('now') THEN ss.schedule_id END) as overdue
                FROM dim_shift_schedule ss
                WHERE ss.shift_date >= date('now', '-7 days')
            """)
            
            shift_stats = cursor.fetchone()
            if shift_stats:
                completed, total, overdue = shift_stats
                completion_rate = (completed / total * 100) if total > 0 else 0
                
                if overdue > 0:
                    alerts.append({
                        'type': 'error',
                        'icon': '🚨',
                        'title': 'Overdue Shifts',
                        'description': f"{overdue} scheduled shifts are overdue and need attention"
                    })
                elif completion_rate < 70:
                    alerts.append({
                        'type': 'warning',
                        'icon': '⚠️',
                        'title': 'Low Shift Completion',
                        'description': f"Only {completion_rate:.0f}% of shifts completed this week"
                    })
                elif completion_rate > 90:
                    alerts.append({
                        'type': 'info',
                        'icon': '✅',
                        'title': 'Excellent Shift Completion',
                        'description': f"{completion_rate:.0f}% of shifts completed - great job!"
                    })
            
            # Alert 5: Battery Swap Performance
            cursor.execute("""
                SELECT 
                    COALESCE(AVG(sms.battery_swap_avg_time_min), 0) as avg_time,
                    COUNT(*) as swap_count
                FROM stg_manual_shift_reports sms
                WHERE sms.date >= date('now', '-7 days') AND sms.battery_swap_avg_time_min > 0
            """)
            
            battery_stats = cursor.fetchone()
            if battery_stats:
                avg_time, swap_count = battery_stats
                if avg_time > 0:
                    if avg_time > 10:  # More than 10 minutes average
                        alerts.append({
                            'type': 'warning',
                            'icon': '🔋',
                            'title': 'Slow Battery Swaps',
                            'description': f"Average battery swap time is {avg_time:.1f} minutes - consider training"
                        })
                    elif avg_time < 3:  # Less than 3 minutes average
                        alerts.append({
                            'type': 'info',
                            'icon': '⚡',
                            'title': 'Fast Battery Swaps',
                            'description': f"Excellent battery swap efficiency: {avg_time:.1f} minutes average"
                        })
            
            conn.close()
            
        except Exception as e:
            alerts.append({
                'type': 'error',
                'icon': '❌',
                'title': 'Alert System Error',
                'description': f'Error generating alerts: {str(e)[:100]}...'
            })
        
        # If no alerts generated, show a positive message
        if not alerts:
            alerts.append({
                'type': 'info',
                'icon': '✅',
                'title': 'All Systems Normal',
                'description': 'No performance issues detected - operations running smoothly'
            })
        
        return alerts
    
    def create_historical_comparison(self, daily_df):
        """Create historical comparison panel."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">Historical Comparison</div>
                    <div class="chart-subtitle">Current month vs previous month performance</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Create comparison chart
        fig_comparison = go.Figure()
        
        # Current month data (last 15 days)
        current_data = daily_df.tail(15)
        previous_data = daily_df.head(15)
        
        fig_comparison.add_trace(go.Bar(
            x=['Current Month', 'Previous Month'],
            y=[current_data['efficiency'].mean(), previous_data['efficiency'].mean()],
            name='Average Efficiency',
            marker_color=['#4B6BFB', '#64748b']
        ))
        
        fig_comparison.update_layout(
            plot_bgcolor='#1e293b',
            paper_bgcolor='#1e293b',
            font=dict(family='Inter', size=12, color='#f8fafc'),
            xaxis=dict(showgrid=True, gridcolor='#334155', color='#f8fafc'),
            yaxis=dict(showgrid=True, gridcolor='#334155', title='Efficiency (%)', color='#f8fafc'),
            height=300,
            margin=dict(l=0, r=0, t=0, b=0)
        )
        
        st.plotly_chart(fig_comparison, use_container_width=True)
    
    def create_shift_planning_section(self):
        """Create shift planning section for scheduling shifts."""
        st.markdown("### 📅 Shift Planning")
        st.markdown("Plan and manage driver shifts for upcoming days.")
        
        # Add tabs for different planning views
        planning_tab1, planning_tab2 = st.tabs(["📅 Weekly Planning", "📋 Individual Shifts"])
        
        with planning_tab1:
            self.create_weekly_planning_view()
        
        with planning_tab2:
            # Create two columns for planning and viewing
            col1, col2 = st.columns([1, 1])
            
            with col1:
                st.markdown("#### ➕ Schedule New Shift")
                
                with st.form("shift_planning_form"):
                    # Get available drivers
                    try:
                        conn = self.get_database_connection()
                        if conn:
                            cursor = conn.cursor()
                            cursor.execute("SELECT driver_id, full_name, team FROM dim_driver WHERE active = 1 ORDER BY full_name")
                            drivers = [(row[0], row[1], row[2]) for row in cursor.fetchall()]
                            conn.close()
                        else:
                            drivers = []
                    except:
                        drivers = []
                    
                    if drivers:
                        # Driver selection
                        driver_options = [f"{name} ({team})" for driver_id, name, team in drivers]
                        selected_driver_idx = st.selectbox("Select Driver", range(len(driver_options)), format_func=lambda x: driver_options[x])
                        selected_driver_id, selected_driver_name, selected_team = drivers[selected_driver_idx]
                        
                        # Date selection
                        shift_date = st.date_input("Shift Date", value=date.today() + timedelta(days=1), min_value=date.today())
                        
                        # Shift type selection
                        shift_type = st.selectbox("Shift Type", ["PM", "N"], help="PM = Afternoon/Evening shift, N = Night shift")
                        
                        # City selection
                        city = st.selectbox("City", ["Kiel", "Flensburg", "Rostock", "Schwerin"], help="Select the city where the driver will work")
                        
                        # All new shifts are scheduled
                        status = "scheduled"
                        
                        # Add submit button
                        if st.form_submit_button("📅 Schedule Shift", type="primary"):
                            try:
                                conn = self.get_database_connection()
                                if conn:
                                    cursor = conn.cursor()
                                    
                                    # Check if shift already exists
                                    cursor.execute("""
                                        SELECT schedule_id FROM dim_shift_schedule 
                                        WHERE driver_id = ? AND shift_date = ? AND shift_type = ?
                                    """, (selected_driver_id, shift_date, shift_type))
                                    
                                    if cursor.fetchone():
                                        st.warning("⚠️ A shift for this driver, date, and type already exists!")
                                    else:
                                        # Insert new shift
                                        cursor.execute("""
                                            INSERT INTO dim_shift_schedule (driver_id, shift_date, shift_type, team, status, city)
                                            VALUES (?, ?, ?, ?, ?, ?)
                                        """, (selected_driver_id, shift_date, shift_type, selected_team, status, city))
                                        
                                        conn.commit()
                                        conn.close()
                                        
                                        st.success(f"✅ Shift scheduled for {selected_driver_name} on {shift_date} ({shift_type} shift) in {city}")
                                        st.rerun()
                                else:
                                    st.error("❌ Unable to connect to database")
                            except Exception as e:
                                st.error(f"❌ Error scheduling shift: {e}")
                    else:
                        st.warning("⚠️ No drivers available. Please add drivers first.")
        
        with col2:
            st.markdown("#### 📋 Upcoming Shifts")
            
            # Date range selection
            col_date1, col_date2 = st.columns(2)
            with col_date1:
                start_date = st.date_input("From", value=date.today(), key="shift_start_date")
            with col_date2:
                end_date = st.date_input("To", value=date.today() + timedelta(days=7), key="shift_end_date")
            
            # Filter by team
            try:
                conn = self.get_database_connection()
                if conn:
                    cursor = conn.cursor()
                    cursor.execute("SELECT DISTINCT team FROM dim_shift_schedule WHERE team IS NOT NULL ORDER BY team")
                    teams = [row[0] for row in cursor.fetchall()]
                    
                    if teams:
                        selected_team_filter = st.selectbox("Filter by Team", ["All"] + teams, key="shift_team_filter")
                    else:
                        selected_team_filter = "All"
                    
                    # Get shifts
                    if selected_team_filter == "All":
                        cursor.execute("""
                            SELECT ss.schedule_id, d.full_name, ss.shift_date, ss.shift_type, ss.team, ss.city, ss.status, ss.created_at
                            FROM dim_shift_schedule ss
                            JOIN dim_driver d ON ss.driver_id = d.driver_id
                            WHERE ss.shift_date BETWEEN ? AND ?
                            ORDER BY ss.shift_date, d.full_name
                        """, (start_date, end_date))
                    else:
                        cursor.execute("""
                            SELECT ss.schedule_id, d.full_name, ss.shift_date, ss.shift_type, ss.team, ss.city, ss.status, ss.created_at
                            FROM dim_shift_schedule ss
                            JOIN dim_driver d ON ss.driver_id = d.driver_id
                            WHERE ss.shift_date BETWEEN ? AND ? AND ss.team = ?
                            ORDER BY ss.shift_date, d.full_name
                        """, (start_date, end_date, selected_team_filter))
                    
                    shifts = cursor.fetchall()
                    conn.close()
                    
                    if shifts:
                        # Create DataFrame for display
                        shift_df = pd.DataFrame(shifts, columns=[
                            'ID', 'Driver', 'Date', 'Type', 'Team', 'City', 'Status', 'Created'
                        ])
                        
                        # Format the display
                        shift_df['Date'] = pd.to_datetime(shift_df['Date']).dt.strftime('%Y-%m-%d')
                        shift_df['Created'] = pd.to_datetime(shift_df['Created']).dt.strftime('%Y-%m-%d %H:%M')
                        
                        # Color code by status
                        def color_status(val):
                            if val == 'completed':
                                return 'background-color: #d4edda; color: #155724'
                            elif val == 'scheduled':
                                return 'background-color: #d1ecf1; color: #0c5460'
                            elif val == 'in_progress':
                                return 'background-color: #fff3cd; color: #856404'
                            elif val == 'cancelled':
                                return 'background-color: #f8d7da; color: #721c24'
                            return ''
                        
                        styled_df = shift_df[['Driver', 'Date', 'Type', 'Team', 'City', 'Status', 'Created']].style.applymap(color_status, subset=['Status'])
                        st.dataframe(styled_df, use_container_width=True, hide_index=True)
                        
                        # Summary statistics
                        st.markdown("#### 📊 Summary")
                        col_sum1, col_sum2, col_sum3, col_sum4 = st.columns(4)
                        
                        with col_sum1:
                            total_shifts = len(shift_df)
                            st.metric("Total Shifts", total_shifts)
                        
                        with col_sum2:
                            completed = len(shift_df[shift_df['Status'] == 'completed'])
                            st.metric("Completed", completed)
                        
                        with col_sum3:
                            scheduled = len(shift_df[shift_df['Status'] == 'scheduled'])
                            st.metric("Scheduled", scheduled)
                        
                        with col_sum4:
                            completion_rate = (completed / total_shifts * 100) if total_shifts > 0 else 0
                            st.metric("Completion Rate", f"{completion_rate:.1f}%")
                    else:
                        st.info("No shifts found for the selected date range.")
                else:
                    st.error("❌ Unable to connect to database")
            except Exception as e:
                st.error(f"❌ Error loading shifts: {e}")

    def create_weekly_planning_view(self):
        """Create weekly planning view with calendar grid."""
        st.markdown("#### 📅 Weekly Shift Planning")
        st.markdown("Plan shifts for the entire week with an easy-to-use calendar interface.")
        
        # Week navigation
        col_nav1, col_nav2, col_nav3 = st.columns([1, 2, 1])
        
        with col_nav1:
            if st.button("⬅️ Previous Week", key="prev_week"):
                if 'current_week_start' not in st.session_state:
                    st.session_state.current_week_start = date.today() - timedelta(days=date.today().weekday())
                st.session_state.current_week_start -= timedelta(days=7)
                st.rerun()
        
        with col_nav2:
            if 'current_week_start' not in st.session_state:
                st.session_state.current_week_start = date.today() - timedelta(days=date.today().weekday())
            
            week_start = st.session_state.current_week_start
            week_end = week_start + timedelta(days=6)
            st.markdown(f"### Week of {week_start.strftime('%B %d')} - {week_end.strftime('%B %d, %Y')}")
        
        with col_nav3:
            if st.button("Next Week ➡️", key="next_week"):
                if 'current_week_start' not in st.session_state:
                    st.session_state.current_week_start = date.today() - timedelta(days=date.today().weekday())
                st.session_state.current_week_start += timedelta(days=7)
                st.rerun()
        
        # Get drivers
        try:
            conn = self.get_database_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("SELECT driver_id, full_name, team FROM dim_driver WHERE active = 1 ORDER BY team, full_name")
                drivers = [(row[0], row[1], row[2]) for row in cursor.fetchall()]
                conn.close()
            else:
                drivers = []
        except:
            drivers = []
        
        if not drivers:
            st.warning("⚠️ No drivers available. Please add drivers first.")
            return
        
        # Create week grid
        week_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        week_dates = [week_start + timedelta(days=i) for i in range(7)]
        
        # Get existing shifts for the week
        existing_shifts = {}
        try:
            conn = self.get_database_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT ss.shift_date, ss.shift_type, d.full_name, ss.status, ss.schedule_id, ss.city
                    FROM dim_shift_schedule ss
                    JOIN dim_driver d ON ss.driver_id = d.driver_id
                    WHERE ss.shift_date BETWEEN ? AND ?
                    ORDER BY ss.shift_date, ss.shift_type
                """, (week_start, week_end))
                
                for row in cursor.fetchall():
                    shift_date, shift_type, driver_name, status, schedule_id, city = row
                    key = f"{shift_date}_{shift_type}"
                    if key not in existing_shifts:
                        existing_shifts[key] = []
                    existing_shifts[key].append({
                        'driver': driver_name,
                        'status': status,
                        'schedule_id': schedule_id,
                        'city': city
                    })
                conn.close()
        except Exception as e:
            st.error(f"Error loading existing shifts: {e}")
        
        # Create the weekly grid
        st.markdown("### 📊 Weekly Schedule")
        
        # Create form for bulk planning
        with st.form("weekly_planning_form"):
            # Create grid layout
            grid_cols = st.columns(7)
            
            for i, (day_name, day_date) in enumerate(zip(week_days, week_dates)):
                with grid_cols[i]:
                    st.markdown(f"**{day_name}**")
                    st.markdown(f"*{day_date.strftime('%m/%d')}*")
                    
                    # PM Shift
                    st.markdown("**PM Shift**")
                    pm_key = f"{day_date}_PM"
                    pm_drivers = existing_shifts.get(pm_key, [])
                    
                    if pm_drivers:
                        for shift in pm_drivers:
                            status_color = {
                                'scheduled': '🟡',
                                'in_progress': '🟠', 
                                'completed': '🟢',
                                'cancelled': '🔴'
                            }.get(shift['status'], '⚪')
                            st.markdown(f"{status_color} {shift['driver']} ({shift['city']})")
                    else:
                        st.markdown("*No driver assigned*")
                    
                    # Night Shift
                    st.markdown("**Night Shift**")
                    n_key = f"{day_date}_N"
                    n_drivers = existing_shifts.get(n_key, [])
                    
                    if n_drivers:
                        for shift in n_drivers:
                            status_color = {
                                'scheduled': '🟡',
                                'in_progress': '🟠',
                                'completed': '🟢', 
                                'cancelled': '🔴'
                            }.get(shift['status'], '⚪')
                            st.markdown(f"{status_color} {shift['driver']} ({shift['city']})")
                    else:
                        st.markdown("*No driver assigned*")
            
            st.markdown("---")
            
            # Bulk assignment section
            st.markdown("#### ➕ Add Shifts for the Week")
            
            col_assign1, col_assign2, col_assign3 = st.columns(3)
            
            with col_assign1:
                selected_driver = st.selectbox(
                    "Select Driver", 
                    [f"{name} ({team})" for driver_id, name, team in drivers],
                    key="weekly_driver_select"
                )
                selected_driver_id, selected_driver_name, selected_team = drivers[drivers.index(next(d for d in drivers if f"{d[1]} ({d[2]})" == selected_driver))]
            
            with col_assign2:
                shift_type = st.selectbox("Shift Type", ["PM", "N"], key="weekly_shift_type")
            
            with col_assign3:
                city = st.selectbox("City", ["Kiel", "Flensburg", "Rostock", "Schwerin"], key="weekly_city")
            
            # All new shifts are scheduled
            status = "scheduled"
            st.info("📅 All new shifts will be marked as 'scheduled'")
            
            # Day selection
            st.markdown("**Select Days to Assign:**")
            day_cols = st.columns(7)
            selected_days = []
            
            for i, (day_name, day_date) in enumerate(zip(week_days, week_dates)):
                with day_cols[i]:
                    if st.checkbox(day_name, key=f"day_{i}"):
                        selected_days.append(day_date)
            
            # Submit button
            if st.form_submit_button("📅 Assign Shifts", type="primary"):
                if selected_days:
                    try:
                        conn = self.get_database_connection()
                        if conn:
                            cursor = conn.cursor()
                            assigned_count = 0
                            
                            for day_date in selected_days:
                                # Check if shift already exists
                                cursor.execute("""
                                    SELECT schedule_id FROM dim_shift_schedule 
                                    WHERE driver_id = ? AND shift_date = ? AND shift_type = ?
                                """, (selected_driver_id, day_date, shift_type))
                                
                                if not cursor.fetchone():
                                    # Insert new shift
                                    cursor.execute("""
                                        INSERT INTO dim_shift_schedule (driver_id, shift_date, shift_type, team, status, city)
                                        VALUES (?, ?, ?, ?, ?, ?)
                                    """, (selected_driver_id, day_date, shift_type, selected_team, status, city))
                                    assigned_count += 1
                            
                            conn.commit()
                            conn.close()
                            
                            st.success(f"✅ Assigned {assigned_count} shifts for {selected_driver_name} in {city}")
                            st.rerun()
                        else:
                            st.error("❌ Unable to connect to database")
                    except Exception as e:
                        st.error(f"❌ Error assigning shifts: {e}")
                else:
                    st.warning("⚠️ Please select at least one day to assign shifts.")
        
        # Export schedule section
        st.markdown("### 📤 Export Schedule")
        
        col_export1, col_export2 = st.columns([1, 1])
        
        with col_export1:
            if st.button("📋 Export Weekly Schedule", type="secondary"):
                try:
                    conn = self.get_database_connection()
                    if conn:
                        cursor = conn.cursor()
                        
                        # Get all shifts for the current week
                        cursor.execute("""
                            SELECT 
                                ss.shift_date,
                                CASE 
                                    WHEN strftime('%w', ss.shift_date) = '1' THEN 'Monday'
                                    WHEN strftime('%w', ss.shift_date) = '2' THEN 'Tuesday'
                                    WHEN strftime('%w', ss.shift_date) = '3' THEN 'Wednesday'
                                    WHEN strftime('%w', ss.shift_date) = '4' THEN 'Thursday'
                                    WHEN strftime('%w', ss.shift_date) = '5' THEN 'Friday'
                                    WHEN strftime('%w', ss.shift_date) = '6' THEN 'Saturday'
                                    WHEN strftime('%w', ss.shift_date) = '0' THEN 'Sunday'
                                END as day_name,
                                d.full_name,
                                ss.shift_type,
                                d.team,
                                ss.city,
                                ss.status
                            FROM dim_shift_schedule ss
                            JOIN dim_driver d ON ss.driver_id = d.driver_id
                            WHERE ss.shift_date BETWEEN ? AND ?
                            ORDER BY ss.shift_date, ss.shift_type, d.full_name
                        """, (week_start, week_end))
                        
                        shifts = cursor.fetchall()
                        conn.close()
                        
                        if shifts:
                            # Create schedule text
                            schedule_text = f"📅 WEEKLY SCHEDULE - {week_start.strftime('%B %d')} to {week_end.strftime('%B %d, %Y')}\n"
                            schedule_text += "=" * 60 + "\n\n"
                            
                            current_date = None
                            for shift in shifts:
                                shift_date, day_name, driver_name, shift_type, team, city, status = shift
                                
                                if shift_date != current_date:
                                    current_date = shift_date
                                    # Convert string date to datetime object for strftime
                                    if isinstance(shift_date, str):
                                        shift_date_obj = datetime.strptime(shift_date, '%Y-%m-%d')
                                    else:
                                        shift_date_obj = shift_date
                                    schedule_text += f"\n📅 {day_name}, {shift_date_obj.strftime('%B %d, %Y')}\n"
                                    schedule_text += "-" * 40 + "\n"
                                
                                status_emoji = "✅" if status == "completed" else "📋" if status == "scheduled" else "⚠️"
                                shift_name = "PM Shift" if shift_type == "PM" else "Night Shift"
                                schedule_text += f"{status_emoji} {shift_name}: {driver_name} ({team}) - {city}\n"
                            
                            # Display the schedule
                            st.text_area("Weekly Schedule", schedule_text, height=300)
                            
                            # Create download button
                            st.download_button(
                                label="💾 Download Schedule as Text",
                                data=schedule_text,
                                file_name=f"weekly_schedule_{week_start.strftime('%Y%m%d')}.txt",
                                mime="text/plain"
                            )
                        else:
                            st.info("No shifts scheduled for this week.")
                    else:
                        st.error("❌ Unable to connect to database")
                except Exception as e:
                    st.error(f"❌ Error exporting schedule: {e}")
        
        with col_export2:
            st.markdown("**📱 How to use:**")
            st.markdown("""
            1. **Plan your shifts** using the weekly grid above
            2. **Click Export** to generate the schedule
            3. **Copy the text** or download the file
            4. **Send to your drivers** via WhatsApp, email, or text
            """)
        
        # Quick shift completion section
        st.markdown("### ✅ Mark Shifts as Completed")
        st.markdown("When drivers finish their shifts, you can quickly mark them as completed.")
        
        # Get scheduled shifts for completion first
        try:
            conn = self.get_database_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT ss.schedule_id, d.full_name, ss.shift_date, ss.shift_type, ss.team
                    FROM dim_shift_schedule ss
                    JOIN dim_driver d ON ss.driver_id = d.driver_id
                    WHERE ss.status = 'scheduled' 
                    AND ss.shift_date <= date('now')
                    ORDER BY ss.shift_date DESC, d.full_name
                    LIMIT 10
                """)
                scheduled_shifts = cursor.fetchall()
                conn.close()
            else:
                scheduled_shifts = []
        except:
            scheduled_shifts = []
        
        if scheduled_shifts:
            with st.form("shift_completion_form"):
                col_comp1, col_comp2 = st.columns(2)
                
                with col_comp1:
                    shift_options = [f"{row[1]} - {row[2]} ({row[3]})" for row in scheduled_shifts]
                    selected_shift_idx = st.selectbox("Select Shift to Complete", range(len(shift_options)), format_func=lambda x: shift_options[x])
                    selected_shift_id = scheduled_shifts[selected_shift_idx][0]
                
                with col_comp2:
                    if st.form_submit_button("✅ Mark as Completed", type="primary"):
                        try:
                            conn = self.get_database_connection()
                            if conn:
                                cursor = conn.cursor()
                                cursor.execute("""
                                    UPDATE dim_shift_schedule 
                                    SET status = 'completed', updated_at = CURRENT_TIMESTAMP
                                    WHERE schedule_id = ?
                                """, (selected_shift_id,))
                                conn.commit()
                                conn.close()
                                st.success("✅ Shift marked as completed!")
                                st.rerun()
                            else:
                                st.error("❌ Unable to connect to database")
                        except Exception as e:
                            st.error(f"❌ Error updating shift: {e}")
        else:
            st.info("📋 No scheduled shifts available for completion. Schedule some shifts first!")
        
        # Summary statistics
        st.markdown("### 📊 Week Summary")
        
        try:
            conn = self.get_database_connection()
            if conn:
                cursor = conn.cursor()
                
                # Get week statistics
                cursor.execute("""
                    SELECT 
                        shift_type,
                        status,
                        COUNT(*) as count
                    FROM dim_shift_schedule 
                    WHERE shift_date BETWEEN ? AND ?
                    GROUP BY shift_type, status
                    ORDER BY shift_type, status
                """, (week_start, week_end))
                
                stats = cursor.fetchall()
                conn.close()
                
                if stats:
                    # Create summary metrics
                    col_sum1, col_sum2, col_sum3, col_sum4 = st.columns(4)
                    
                    total_shifts = sum(count for _, _, count in stats)
                    pm_shifts = sum(count for shift_type, _, count in stats if shift_type == 'PM')
                    n_shifts = sum(count for shift_type, _, count in stats if shift_type == 'N')
                    completed_shifts = sum(count for _, status, count in stats if status == 'completed')
                    
                    with col_sum1:
                        st.metric("Total Shifts", total_shifts)
                    
                    with col_sum2:
                        st.metric("PM Shifts", pm_shifts)
                    
                    with col_sum3:
                        st.metric("Night Shifts", n_shifts)
                    
                    with col_sum4:
                        completion_rate = (completed_shifts / total_shifts * 100) if total_shifts > 0 else 0
                        st.metric("Completion Rate", f"{completion_rate:.1f}%")
                else:
                    st.info("No shifts scheduled for this week.")
        except Exception as e:
            st.error(f"Error loading week summary: {e}")

    def create_shift_management_section(self):
        """Create shift management section showing scheduled vs completed shifts."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">📅 Shift Management</div>
                    <div class="chart-subtitle">Scheduled vs completed shifts overview</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Get shift data from database
        conn = self.get_database_connection()
        if conn:
            try:
                # Get shift completion data
                shift_query = """
                SELECT 
                    fs.shift_date,
                    COUNT(DISTINCT fs.shift_id) as total_shifts,
                    COUNT(DISTINCT CASE WHEN ftc.task_count > 0 THEN fs.shift_id END) as completed_shifts,
                    COUNT(DISTINCT fs.driver_id) as active_drivers,
                    d.team
                FROM fact_shift fs
                JOIN dim_driver d ON fs.driver_id = d.driver_id
                LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
                WHERE fs.shift_date >= date('now', '-30 days')
                GROUP BY fs.shift_date, d.team
                ORDER BY fs.shift_date DESC
                """
                
                shift_df = pd.read_sql_query(shift_query, conn)
                
                if len(shift_df) > 0:
                    # Calculate completion rates
                    shift_df['completion_rate'] = (shift_df['completed_shifts'] / shift_df['total_shifts'] * 100).round(1)
                    shift_df['pending_shifts'] = shift_df['total_shifts'] - shift_df['completed_shifts']
                    
                    # Create summary cards
                    col1, col2, col3, col4 = st.columns(4)
                    
                    with col1:
                        total_shifts = shift_df['total_shifts'].sum()
                        st.metric(
                            label="Total Shifts (30 days)",
                            value=f"{total_shifts:,}",
                            help="Total number of shifts in the last 30 days"
                        )
                    
                    with col2:
                        completed_shifts = shift_df['completed_shifts'].sum()
                        st.metric(
                            label="Completed Shifts",
                            value=f"{completed_shifts:,}",
                            help="Number of shifts with completed tasks"
                        )
                    
                    with col3:
                        pending_shifts = shift_df['pending_shifts'].sum()
                        st.metric(
                            label="Pending Shifts",
                            value=f"{pending_shifts:,}",
                            help="Shifts without completed tasks"
                        )
                    
                    with col4:
                        avg_completion_rate = shift_df['completion_rate'].mean()
                        st.metric(
                            label="Avg Completion Rate",
                            value=f"{avg_completion_rate:.1f}%",
                            help="Average shift completion rate"
                        )
                    
                    # Create shift completion chart
                    st.markdown("### 📊 Shift Completion Trends")
                    
                    # Prepare data for chart
                    daily_shift_summary = shift_df.groupby('shift_date').agg({
                        'total_shifts': 'sum',
                        'completed_shifts': 'sum',
                        'pending_shifts': 'sum',
                        'completion_rate': 'mean'
                    }).reset_index()
                    
                    # Create bar chart for shift completion
                    fig_shifts = go.Figure()
                    
                    fig_shifts.add_trace(go.Bar(
                        name='Completed Shifts',
                        x=daily_shift_summary['shift_date'],
                        y=daily_shift_summary['completed_shifts'],
                        marker_color='#10b981',
                        text=daily_shift_summary['completed_shifts'],
                        textposition='auto'
                    ))
                    
                    fig_shifts.add_trace(go.Bar(
                        name='Pending Shifts',
                        x=daily_shift_summary['shift_date'],
                        y=daily_shift_summary['pending_shifts'],
                        marker_color='#f59e0b',
                        text=daily_shift_summary['pending_shifts'],
                        textposition='auto'
                    ))
                    
                    fig_shifts.update_layout(
                        title="Daily Shift Completion Status",
                        xaxis_title="Date",
                        yaxis_title="Number of Shifts",
                        barmode='stack',
                        plot_bgcolor='#1e293b',
                        paper_bgcolor='#1e293b',
                        font=dict(family='Inter', size=12, color='#f8fafc'),
                        xaxis=dict(
                            showgrid=True,
                            gridcolor='#334155',
                            color='#f8fafc'
                        ),
                        yaxis=dict(
                            showgrid=True,
                            gridcolor='#334155',
                            color='#f8fafc'
                        ),
                        height=400,
                        margin=dict(l=0, r=0, t=40, b=0)
                    )
                    
                    st.plotly_chart(fig_shifts, use_container_width=True)
                    
                    # Team performance breakdown
                    st.markdown("### 👥 Team Performance")
                    
                    team_shift_summary = shift_df.groupby('team').agg({
                        'total_shifts': 'sum',
                        'completed_shifts': 'sum',
                        'completion_rate': 'mean'
                    }).reset_index()
                    
                    if len(team_shift_summary) > 0:
                        team_shift_summary['pending_shifts'] = team_shift_summary['total_shifts'] - team_shift_summary['completed_shifts']
                        team_shift_summary['completion_rate'] = team_shift_summary['completion_rate'].round(1)
                        
                        # Display team performance table
                        st.dataframe(
                            team_shift_summary[['team', 'total_shifts', 'completed_shifts', 'pending_shifts', 'completion_rate']].rename(columns={
                                'team': 'Team',
                                'total_shifts': 'Total Shifts',
                                'completed_shifts': 'Completed',
                                'pending_shifts': 'Pending',
                                'completion_rate': 'Completion Rate (%)'
                            }),
                            use_container_width=True,
                            hide_index=True
                        )
                    
                    # Recent shifts table
                    st.markdown("### 📋 Recent Shifts")
                    
                    recent_shifts = shift_df.head(10)[['shift_date', 'team', 'total_shifts', 'completed_shifts', 'completion_rate']].rename(columns={
                        'shift_date': 'Date',
                        'team': 'Team',
                        'total_shifts': 'Total Shifts',
                        'completed_shifts': 'Completed',
                        'completion_rate': 'Completion Rate (%)'
                    })
                    
                    st.dataframe(
                        recent_shifts,
                        use_container_width=True,
                        hide_index=True
                    )
                
                else:
                    st.info("No shift data available for the last 30 days.")
                
                conn.close()
                
            except Exception as e:
                st.error(f"Error loading shift data: {e}")
        else:
            st.error("Unable to connect to database.")
    
    def create_data_upload_page(self):
        """Create the data upload and management page."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">📁 Data Upload & Management</div>
                    <div class="chart-subtitle">Upload driver performance data and manage task types</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Create tabs for different upload methods
        tab1, tab2, tab3, tab4, tab5 = st.tabs(["📤 Upload CSV", "✏️ Quick Entry", "📋 Templates", "📊 Task Types", "📅 Shift Planning"])
        
        with tab1:
            self.create_csv_upload_section()
        
        with tab2:
            self.create_quick_entry_section()
        
        with tab3:
            self.create_template_section()
        
        with tab4:
            self.create_task_types_section()
        
        with tab5:
            self.create_shift_planning_section()
    
    def create_csv_upload_section(self):
        """Create CSV upload section."""
        st.markdown("### 📤 Upload New Reports")
        
        uploaded_file = st.file_uploader(
            "Choose a CSV file",
            type=['csv'],
            help="Upload your driver performance data in CSV format"
        )
        
        if uploaded_file is not None:
            try:
                df = pd.read_csv(uploaded_file)
                st.success(f"Successfully uploaded {len(df)} records!")
                
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown("#### Data Preview")
                    st.dataframe(df.head(), use_container_width=True)
                
                with col2:
                    st.markdown("#### Data Summary")
                    st.json({
                        "Total Records": len(df),
                        "Columns": list(df.columns),
                        "Data Types": df.dtypes.to_dict()
                    })
                
                if st.button("🔄 Process Data", type="primary"):
                    # Save file to data/raw directory
                    os.makedirs("data/raw", exist_ok=True)
                    file_path = f"data/raw/{uploaded_file.name}"
                    df.to_csv(file_path, index=False)
                    st.success(f"Data saved to {file_path}")
                    
                    # Process with ETL pipeline
                    try:
                        from etl_pipeline import ETLPipeline
                        etl = ETLPipeline()
                        etl.run_full_pipeline()
                        st.success("✅ Data processed successfully!")
                        st.rerun()
                    except Exception as e:
                        st.error(f"ETL processing error: {e}")
                        
            except Exception as e:
                st.error(f"Error processing file: {e}")
    
    def create_quick_entry_section(self):
        """Create quick entry form section."""
        st.markdown("### ✏️ Quick Daily Performance Entry")
        
        with st.form("quick_entry_form"):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                entry_date = st.date_input("Date", value=date.today())
                
                # Get available drivers from database
                try:
                    conn = self.get_database_connection()
                    if conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT DISTINCT full_name FROM dim_driver WHERE active = 1 ORDER BY full_name")
                        drivers = [row[0] for row in cursor.fetchall()]
                        
                        # Get driver-city mapping for suggestions
                        cursor.execute("""
                            SELECT d.full_name, c.name, COUNT(*) as shift_count
                            FROM dim_driver d 
                            JOIN fact_shift fs ON d.driver_id = fs.driver_id 
                            JOIN dim_city c ON fs.city_id = c.city_id 
                            GROUP BY d.full_name, c.name 
                            ORDER BY d.full_name, shift_count DESC
                        """)
                        driver_city_map = {}
                        for row in cursor.fetchall():
                            driver, city, count = row
                            if driver not in driver_city_map:
                                driver_city_map[driver] = city
                        
                        conn.close()
                    else:
                        drivers = ["Patryk Dochniak", "Vukasin Roganovic", "Igor Dajic", "Nicolas Cristian", "Pufleani Cosmin", "Faeez Kirde", "Suhail Suhail", "Nenad Vlajic", "Dzenis Pirja", "Aleksander Gas", "Nedim Mujic", "Stefan Simic"]
                        driver_city_map = {}
                except:
                    drivers = ["Patryk Dochniak", "Vukasin Roganovic", "Igor Dajic", "Nicolas Cristian", "Pufleani Cosmin", "Faeez Kirde", "Suhail Suhail", "Nenad Vlajic", "Dzenis Pirja", "Aleksander Gas", "Nedim Mujic", "Stefan Simic"]
                    driver_city_map = {}
                
                driver_name = st.selectbox("Driver Name", drivers, key="driver_name_select")
                
                # Show driver info if available
                if driver_name and driver_city_map.get(driver_name):
                    primary_city = driver_city_map[driver_name]
                    st.info(f"💡 {driver_name} primarily works in {primary_city}")
                
                # Auto-suggest city based on driver's primary city
                suggested_city = driver_city_map.get(driver_name, "Kiel")
                city_index = ["Kiel", "Flensburg", "Rostock", "Schwerin"].index(suggested_city) if suggested_city in ["Kiel", "Flensburg", "Rostock", "Schwerin"] else 0
                city = st.selectbox("City", ["Kiel", "Flensburg", "Rostock", "Schwerin"], index=city_index, key="city_select")
                
                # Add shift type selection
                shift_type = st.selectbox("Shift Type", ["PM", "N"], key="shift_type_select", help="PM = Afternoon/Evening shift, N = Night shift")
            
            with col2:
                st.markdown("#### 🔄 Battery Tasks")
                battery_swap = st.number_input("Battery Swap", min_value=0, value=0)
                bonus_battery_swap = st.number_input("Bonus Battery Swap", min_value=0, value=0)
                multi_task = st.number_input("Multi Task", min_value=0, value=0)
            
            with col3:
                st.markdown("#### ⚙️ Operation Tasks")
                deploy = st.number_input("Deploy", min_value=0, value=0)
                quality_check = st.number_input("Quality Check", min_value=0, value=0)
                rebalance = st.number_input("Rebalance", min_value=0, value=0)
                rescue = st.number_input("Rescue", min_value=0, value=0)
                repark = st.number_input("Repark", min_value=0, value=0)
                transport = st.number_input("Transport", min_value=0, value=0)
            
            # Add KPI section
            st.markdown("#### 📊 Performance KPIs")
            col_kpi1, col_kpi2, col_kpi3 = st.columns(3)
            
            with col_kpi1:
                battery_swap_avg_time = st.number_input("Battery Swap Avg Time (min)", min_value=0.0, value=0.0, step=0.1, format="%.1f")
            
            with col_kpi2:
                ifqc_avg_time = st.number_input("IFQC Avg Time (min)", min_value=0.0, value=0.0, step=0.1, format="%.1f")
            
            with col_kpi3:
                task_per_hour = st.number_input("Task per Hour", min_value=0.0, value=0.0, step=0.1, format="%.1f")
            
            if st.form_submit_button("💾 Save Daily Performance", type="primary"):
                # Create CSV data
                data = {
                    'Date': [entry_date.strftime('%Y-%m-%d')],
                    'Driver Name': [driver_name],
                    'City': [city],
                    'Shift Type': [shift_type],
                    'Battery Swap': [battery_swap],
                    'Bonus Battery Swap': [bonus_battery_swap],
                    'Multi Task': [multi_task],
                    'Deploy': [deploy],
                    'Quality Check': [quality_check],
                    'Rebalance': [rebalance],
                    'Rescue': [rescue],
                    'Repark': [repark],
                    'Transport': [transport],
                    'Battery Swap Avg Time (min)': [battery_swap_avg_time],
                    'IFQC Avg Time (min)': [ifqc_avg_time],
                    'Task per Hour': [task_per_hour]
                }
                
                df = pd.DataFrame(data)
                
                # Save to file
                os.makedirs("data/raw", exist_ok=True)
                filename = f"manual_entry_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                file_path = f"data/raw/{filename}"
                df.to_csv(file_path, index=False)
                
                st.success(f"✅ Data saved to {filename}")
                
                # Process with ETL
                try:
                    from etl_pipeline import ETLPipeline
                    etl = ETLPipeline()
                    etl.run_full_pipeline()
                    st.success("✅ Data processed successfully!")
                    st.rerun()
                except Exception as e:
                    st.error(f"ETL processing error: {e}")
    
    def create_template_section(self):
        """Create template download section."""
        st.markdown("### 📋 Download Templates")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Manual Shift Report Template")
            
            # Create sample manual shift data
            manual_data = {
                'Date': ['2025-10-15', '2025-10-15'],
                'Driver Name': ['Patryk Dochniak', 'Vukasin Roganovic'],
                'City': ['Kiel', 'Flensburg'],
                'Shift Type': ['PM', 'N'],
                'Battery Swap': [18, 15],
                'Bonus Battery Swap': [11, 8],
                'Multi Task': [6, 4],
                'Deploy': [3, 2],
                'Quality Check': [16, 12],
                'Rebalance': [8, 6],
                'Rescue': [3, 2],
                'Repark': [2, 1],
                'Transport': [4, 3],
                'Battery Swap Avg Time (min)': [4.2, 3.8],
                'IFQC Avg Time (min)': [6.5, 7.2],
                'Task per Hour': [12.5, 11.8]
            }
            
            manual_df = pd.DataFrame(manual_data)
            csv_manual = manual_df.to_csv(index=False)
            
            st.download_button(
                label="📥 Download Manual Shift Template",
                data=csv_manual,
                file_name="template_manual_shift_report.csv",
                mime="text/csv"
            )
            
            st.dataframe(manual_df, use_container_width=True)
        
        with col2:
            st.markdown("#### VOI Daily Report Template")
            
            # Create sample VOI daily data
            voi_data = {
                'Driver': ['Anna Müller', 'Anna Müller', 'Max Schmidt'],
                'City': ['Kiel', 'Kiel', 'Flensburg'],
                'Date': ['2025-10-15', '2025-10-15', '2025-10-15'],
                'Task Type': ['battery_swap', 'quality_check', 'battery_swap'],
                'Count': [45, 16, 38],
                'Duration Minutes': [190, 48, 165],
                'Battery Usage': [88.5, 12.3, 75.2],
                'Bonus_Penalties': [125.0, 28.0, 95.0]
            }
            
            voi_df = pd.DataFrame(voi_data)
            csv_voi = voi_df.to_csv(index=False)
            
            st.download_button(
                label="📥 Download VOI Daily Template",
                data=csv_voi,
                file_name="template_voi_daily_report.csv",
                mime="text/csv"
            )
            
            st.dataframe(voi_df, use_container_width=True)
    
    def create_task_types_section(self):
        """Create task types management section."""
        st.markdown("### 📊 Current Task Types")
        
        # Define task types
        task_types = [
            {"key": "battery_swap", "name": "Battery Swap", "category": "🔄 Battery Tasks", "is_swap": True, "is_bonus": False},
            {"key": "battery_bonus_swap", "name": "Bonus Battery Swap", "category": "🔄 Battery Tasks", "is_swap": True, "is_bonus": True},
            {"key": "multi_task", "name": "Multi Task", "category": "⚙️ Operation Tasks", "is_swap": False, "is_bonus": False},
            {"key": "deploy", "name": "Deploy", "category": "⚙️ Operation Tasks", "is_swap": False, "is_bonus": False},
            {"key": "quality_check", "name": "In Field Quality Check", "category": "⚙️ Operation Tasks", "is_swap": False, "is_bonus": False},
            {"key": "rebalance", "name": "Rebalance", "category": "⚙️ Operation Tasks", "is_swap": False, "is_bonus": False},
            {"key": "rescue", "name": "Rescue", "category": "🚨 Service Tasks", "is_swap": False, "is_bonus": False},
            {"key": "repark", "name": "Repark", "category": "🚨 Service Tasks", "is_swap": False, "is_bonus": False},
            {"key": "transport", "name": "Transport", "category": "🚨 Service Tasks", "is_swap": False, "is_bonus": False}
        ]
        
        # Display task types in a nice format
        for task in task_types:
            with st.container():
                col1, col2, col3, col4 = st.columns([3, 2, 1, 1])
                
                with col1:
                    st.markdown(f"**{task['name']}**")
                    st.markdown(f"`{task['key']}`")
                
                with col2:
                    st.markdown(task['category'])
                
                with col3:
                    if task['is_swap']:
                        st.markdown("🔄 Swap")
                    else:
                        st.markdown("⚙️ Task")
                
                with col4:
                    if task['is_bonus']:
                        st.markdown("⭐ Bonus")
                    else:
                        st.markdown("📋 Regular")
                
                st.markdown("---")
        
        # Data management section
        st.markdown("### 📊 Data Management")
        
        try:
            conn = self.get_database_connection()
            if conn:
                # Get current data stats
                stats_query = """
                SELECT 
                    COUNT(DISTINCT d.full_name) as total_drivers,
                    COUNT(DISTINCT c.name) as total_cities,
                    COUNT(*) as total_shifts,
                    SUM(ftc.task_count) as total_tasks
                FROM fact_shift fs
                JOIN dim_driver d ON fs.driver_id = d.driver_id
                JOIN dim_city c ON fs.city_id = c.city_id
                JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
                """
                
                stats_df = pd.read_sql_query(stats_query, conn)
                
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("Total Drivers", stats_df['total_drivers'].iloc[0] if len(stats_df) > 0 else 0)
                
                with col2:
                    st.metric("Total Cities", stats_df['total_cities'].iloc[0] if len(stats_df) > 0 else 0)
                
                with col3:
                    st.metric("Total Shifts", stats_df['total_shifts'].iloc[0] if len(stats_df) > 0 else 0)
                
                with col4:
                    st.metric("Total Tasks", stats_df['total_tasks'].iloc[0] if len(stats_df) > 0 else 0)
                
                conn.close()
        except Exception as e:
            st.error(f"Database connection error: {e}")
    
    def run_dashboard(self):
        """Main dashboard runner."""
        # Create navigation
        self.create_global_header()
        
        # Create page selector
        page = st.selectbox(
            "Select Page",
            ["📊 Overview", "📁 Data Upload/Shift Planning", "🏙️ City & Team", "📈 Historical Analysis", "👔 Executive Dashboard"],
            key="page_selector"
        )
        
        if page == "📊 Overview":
            self.create_filter_bar()
            
            # Get selected team and city for filtering
            selected_team = None
            if 'team_filter' in st.session_state and st.session_state.team_filter != "All Teams":
                selected_team = st.session_state.team_filter
            
            selected_city = None
            if 'city_filter' in st.session_state and st.session_state.city_filter != "All Cities":
                selected_city = st.session_state.city_filter
            
            # Get real data from database with team and city filtering
            drivers_df, hourly_df, daily_df = self.get_real_data(selected_team, selected_city)
            
            self.create_kpi_cards(drivers_df, daily_df)
            self.create_trend_charts(hourly_df, daily_df)
            self.create_geospatial_map(drivers_df)
            
            col1, col2 = st.columns(2)
            with col1:
                self.create_driver_table(drivers_df)
            with col2:
                self.create_alerts_panel(drivers_df, daily_df)
            
            # Shift Management Section
            self.create_shift_management_section()
        
        elif page == "📁 Data Upload/Shift Planning":
            self.create_data_upload_page()
        
        elif page == "🏙️ City & Team":
            self.create_city_team_page()
        
        elif page == "📈 Historical Analysis":
            self.create_historical_analysis_page()
        
        elif page == "👔 Executive Dashboard":
            self.create_executive_dashboard()
        
    def create_executive_dashboard(self):
        """Create executive-level dashboard with high-level KPIs and strategic insights."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">👔 Executive Dashboard</div>
                    <div class="chart-subtitle">Strategic overview and performance insights for executive decision making</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Get comprehensive data for executive view
        drivers_df, daily_df, hourly_df = self.get_real_data()
        
        # Executive KPI Cards
        self.create_executive_kpi_cards(drivers_df, daily_df)
        
        # Strategic Visualizations
        self.create_strategic_visualizations(drivers_df, daily_df)
        
        # Team Performance Comparison
        self.create_team_performance_comparison(drivers_df, daily_df)
        
        # Report Generation Section
        self.create_executive_report_generation(drivers_df, daily_df)
        
        # Mobile Executive View
        self.create_mobile_executive_view(drivers_df, daily_df)

    def create_executive_kpi_cards(self, drivers_df, daily_df):
        """Create high-level KPI cards for executive view."""
        st.markdown("### 📊 Executive KPIs")
        
        # Debug information removed - dashboard should work now
        
        # Calculate executive metrics with safe column access
        total_drivers = len(drivers_df)
        
        # Safe column access for daily_df
        if not daily_df.empty:
            if 'tasks' in daily_df.columns:
                total_tasks = daily_df['tasks'].sum()
            elif 'total_tasks' in daily_df.columns:
                total_tasks = daily_df['total_tasks'].sum()
            elif 'completed_tasks' in daily_df.columns:
                total_tasks = daily_df['completed_tasks'].sum()
            else:
                total_tasks = 0
        else:
            total_tasks = 0
        
        # Safe column access for drivers_df
        avg_task_per_hour = 0
        if not drivers_df.empty and 'task_per_hour' in drivers_df.columns:
            avg_task_per_hour = drivers_df['task_per_hour'].mean()
        
        avg_battery_swap_time = 0
        if not drivers_df.empty and 'battery_swap_avg_time' in drivers_df.columns:
            avg_battery_swap_time = drivers_df['battery_swap_avg_time'].mean()
        
        avg_ifqc_time = 0
        if not drivers_df.empty and 'ifqc_avg_time' in drivers_df.columns:
            avg_ifqc_time = drivers_df['ifqc_avg_time'].mean()
        
        # Team performance
        team_ki_fl = drivers_df[drivers_df['team'] == 'Team KI/FL']
        team_hro_sw = drivers_df[drivers_df['team'] == 'Team HRO/SW']
        
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #4B6BFB; --kpi-bg: #1e3a8a;">
                <div class="kpi-header">
                    <div class="kpi-title">Total Drivers</div>
                    <div class="kpi-icon">👥</div>
                </div>
                <div class="kpi-value">{total_drivers}</div>
                <div class="kpi-change neutral">
                    <span>Active workforce</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #10b981; --kpi-bg: #065f46;">
                <div class="kpi-header">
                    <div class="kpi-title">Total Tasks</div>
                    <div class="kpi-icon">📋</div>
                </div>
                <div class="kpi-value">{total_tasks:,}</div>
                <div class="kpi-change neutral">
                    <span>All time completed</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #f59e0b; --kpi-bg: #78350f;">
                <div class="kpi-header">
                    <div class="kpi-title">Avg Task/Hour</div>
                    <div class="kpi-icon">⚡</div>
                </div>
                <div class="kpi-value">{avg_task_per_hour:.1f}</div>
                <div class="kpi-change neutral">
                    <span>Productivity rate</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #ef4444; --kpi-bg: #7f1d1d;">
                <div class="kpi-header">
                    <div class="kpi-title">Battery Swap Time</div>
                    <div class="kpi-icon">🔋</div>
                </div>
                <div class="kpi-value">{avg_battery_swap_time:.1f}m</div>
                <div class="kpi-change neutral">
                    <span>Average efficiency</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col5:
            st.markdown(f"""
            <div class="kpi-card" style="--kpi-color: #8b5cf6; --kpi-bg: #581c87;">
                <div class="kpi-header">
                    <div class="kpi-title">IFQC Time</div>
                    <div class="kpi-icon">🔍</div>
                </div>
                <div class="kpi-value">{avg_ifqc_time:.1f}m</div>
                <div class="kpi-change neutral">
                    <span>Quality control</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    def get_weekly_shift_schedule(self):
        """Get weekly shift schedule data from the database."""
        conn = self.get_database_connection()
        query = """
        SELECT
            strftime('%Y-%W', shift_date) AS week_of_year,
            COUNT(schedule_id) AS scheduled_shifts
        FROM
            dim_shift_schedule
        WHERE
            status = 'scheduled'
        GROUP BY
            week_of_year
        ORDER BY
            week_of_year;
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df

    def create_strategic_visualizations(self, drivers_df, daily_df):
        """Create strategic visualizations for trend analysis."""
        st.markdown("### 📈 Strategic Performance Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Shifts Scheduled Per Week Chart
            weekly_shifts_df = self.get_weekly_shift_schedule()
            if not weekly_shifts_df.empty:
                fig_shifts = px.bar(
                    weekly_shifts_df,
                    x='week_of_year',
                    y='scheduled_shifts',
                    title="Shifts Scheduled Per Week",
                    labels={'week_of_year': 'Week', 'scheduled_shifts': 'Number of Shifts'},
                    color_discrete_sequence=['#4B6BFB']
                )
                fig_shifts.update_layout(
                    plot_bgcolor='#1e293b',
                    paper_bgcolor='#1e293b',
                    font=dict(color='#f8fafc'),
                    xaxis=dict(color='#f8fafc'),
                    yaxis=dict(color='#f8fafc')
                )
                st.plotly_chart(fig_shifts, use_container_width=True)
            else:
                st.info("No scheduled shifts data available for weekly trends.")
        
        with col2:
            # Team Performance Comparison
            if not drivers_df.empty:
                team_performance = drivers_df.groupby('team').agg({
                    'tasks_completed': 'sum',
                    'task_per_hour': 'mean'
                }).reset_index()
                
                fig_teams = px.bar(
                    team_performance,
                    x='team',
                    y='task_per_hour',
                    title="Team Performance Comparison (Avg Task/Hour)",
                    labels={'team': 'Team', 'task_per_hour': 'Average Task per Hour'},
                    color='task_per_hour',
                    color_continuous_scale='Viridis'
                )
                fig_teams.update_layout(
                    plot_bgcolor='#1e293b',
                    paper_bgcolor='#1e293b',
                    font=dict(color='#f8fafc'),
                    xaxis=dict(color='#f8fafc'),
                    yaxis=dict(color='#f8fafc')
                )
                st.plotly_chart(fig_teams, use_container_width=True)

    def create_team_performance_comparison(self, drivers_df, daily_df):
        """Create detailed team performance comparison."""
        st.markdown("### 🏆 Team Performance Deep Dive")
        
        if not drivers_df.empty:
            # Team statistics
            team_stats = drivers_df.groupby('team').agg({
                'tasks_completed': ['sum', 'mean'],
                'task_per_hour': 'mean',
                'battery_swap_avg_time': 'mean',
                'ifqc_avg_time': 'mean'
            }).round(2)
            
            team_stats.columns = ['Total Tasks', 'Avg Tasks/Driver', 'Avg Task/Hour', 'Avg Battery Time', 'Avg IFQC Time']
            
            st.dataframe(
                team_stats,
                use_container_width=True,
                height=200
            )

    def create_executive_report_generation(self, drivers_df, daily_df):
        """Create executive report generation system."""
        st.markdown("### 📋 Executive Report Generation")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### 📊 Generate Executive Report")
            
            report_type = st.selectbox(
                "Report Type",
                ["Daily Summary", "Weekly Performance", "Monthly Strategic Review", "Team Comparison"],
                key="exec_report_type"
            )
            
            date_range = st.date_input(
                "Date Range",
                value=(date.today() - timedelta(days=30), date.today()),
                key="exec_date_range"
            )
            
            if st.button("📄 Generate Report", type="primary"):
                self.generate_executive_report(report_type, date_range, drivers_df, daily_df)
        
        with col2:
            st.markdown("#### 💾 Export Options")
            
            export_format = st.selectbox(
                "Export Format",
                ["PDF", "Excel", "CSV"],
                key="exec_export_format"
            )
            
            if st.button("📥 Download Report", type="secondary"):
                st.info("Report generation in progress...")

    def generate_executive_report(self, report_type, date_range, drivers_df, daily_df):
        """Generate executive report content."""
        st.markdown("#### 📊 Executive Report Preview")
        
        # Generate report content based on type
        if report_type == "Daily Summary":
            st.markdown("**Daily Performance Summary**")
            st.markdown(f"- Total Drivers: {len(drivers_df)}")
            
            # Safe column access for tasks
            if not daily_df.empty:
                if 'tasks' in daily_df.columns:
                    tasks = daily_df['tasks'].sum()
                elif 'total_tasks' in daily_df.columns:
                    tasks = daily_df['total_tasks'].sum()
                elif 'completed_tasks' in daily_df.columns:
                    tasks = daily_df['completed_tasks'].sum()
                else:
                    tasks = 0
            else:
                tasks = 0
            st.markdown(f"- Tasks Completed: {tasks}")
            
            # Safe column access for task per hour
            if not drivers_df.empty and 'task_per_hour' in drivers_df.columns:
                avg_task_hour = drivers_df['task_per_hour'].mean()
            else:
                avg_task_hour = 0
            st.markdown(f"- Average Task/Hour: {avg_task_hour:.1f}")
        
        elif report_type == "Weekly Performance":
            st.markdown("**Weekly Performance Analysis**")
            # Add weekly analysis logic here
        
        elif report_type == "Monthly Strategic Review":
            st.markdown("**Monthly Strategic Review**")
            # Add monthly analysis logic here
        
        elif report_type == "Team Comparison":
            st.markdown("**Team Performance Comparison**")
            if not drivers_df.empty:
                team_comparison = drivers_df.groupby('team')['task_per_hour'].mean()
                st.bar_chart(team_comparison)

    def create_mobile_executive_view(self, drivers_df, daily_df):
        """Create mobile-optimized executive view."""
        st.markdown("### 📱 Mobile Executive View")
        
        # Essential metrics for mobile
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("Active Drivers", len(drivers_df))
            
            # Safe column access for total tasks
            if not daily_df.empty:
                if 'tasks' in daily_df.columns:
                    total_tasks = daily_df['tasks'].sum()
                elif 'total_tasks' in daily_df.columns:
                    total_tasks = daily_df['total_tasks'].sum()
                elif 'completed_tasks' in daily_df.columns:
                    total_tasks = daily_df['completed_tasks'].sum()
                else:
                    total_tasks = 0
            else:
                total_tasks = 0
            st.metric("Total Tasks", total_tasks)
        
        with col2:
            # Safe column access for task per hour
            if not drivers_df.empty and 'task_per_hour' in drivers_df.columns:
                avg_task_hour = drivers_df['task_per_hour'].mean()
            else:
                avg_task_hour = 0
            st.metric("Avg Task/Hour", f"{avg_task_hour:.1f}")
            st.metric("Team KI/FL", len(drivers_df[drivers_df['team'] == 'Team KI/FL']))

        # Footer
        st.markdown("""
        <div style="text-align: center; padding: 2rem; color: #64748b; font-size: 0.875rem;">
            <p>Driver Performance Dashboard v2.0 | Data refreshed every 5 minutes | Last updated: """ + 
            datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
        </div>
        """, unsafe_allow_html=True)
    
    
    def create_city_team_page(self):
        """Create city and team comparison page."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">🏙️ City & Team Performance</div>
                    <div class="chart-subtitle">Comparative analysis across cities and teams</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Get real data from database
        conn = self.get_database_connection()
        if not conn:
            st.error("Database connection failed")
            return
        
        try:
            # Get city performance data
            city_query = """
            SELECT 
                c.name as city,
                COUNT(DISTINCT fs.driver_id) as drivers,
                COALESCE(SUM(ftc.task_count), 0) as total_tasks,
                COALESCE(AVG(sms.task_per_hour), 0) as avg_efficiency
            FROM fact_shift fs
            JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            GROUP BY c.city_id, c.name
            ORDER BY total_tasks DESC
            """
            
            city_df = pd.read_sql_query(city_query, conn)
            
            # Get team performance data
            team_query = """
            SELECT 
                d.team,
                COUNT(DISTINCT d.driver_id) as members,
                COALESCE(SUM(ftc.task_count), 0) as total_tasks,
                COALESCE(AVG(sms.task_per_hour), 0) as avg_efficiency
            FROM dim_driver d
            LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE d.team IS NOT NULL
            GROUP BY d.team
            ORDER BY total_tasks DESC
            """
            
            team_df = pd.read_sql_query(team_query, conn)
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("#### City Performance Comparison")
                if len(city_df) > 0:
                    city_df.columns = ['City', 'Drivers', 'Tasks', 'Avg Efficiency']
                    st.dataframe(city_df, use_container_width=True)
                else:
                    st.info("No city data available")
            
            with col2:
                st.markdown("#### Team Performance Comparison")
                if len(team_df) > 0:
                    team_df.columns = ['Team', 'Members', 'Tasks', 'Avg Efficiency']
                    st.dataframe(team_df, use_container_width=True)
                else:
                    st.info("No team data available")
            
            # Team member details
            st.markdown("#### Team Member Details")
            member_query = """
            SELECT 
                d.team,
                d.full_name as driver_name,
                c.name as city,
                COALESCE(SUM(ftc.task_count), 0) as total_tasks,
                COALESCE(AVG(sms.task_per_hour), 0) as avg_efficiency
            FROM dim_driver d
            LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
            LEFT JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE d.team IS NOT NULL
            GROUP BY d.team, d.driver_id, d.full_name, c.name
            ORDER BY d.team, total_tasks DESC
            """
            
            member_df = pd.read_sql_query(member_query, conn)
            if len(member_df) > 0:
                member_df.columns = ['Team', 'Driver', 'City', 'Tasks', 'Avg Efficiency']
                st.dataframe(member_df, use_container_width=True)
            
            conn.close()
            
        except Exception as e:
            st.error(f"Error fetching data: {e}")
            conn.close()
    
    def create_historical_analysis_page(self):
        """Create comprehensive historical analysis page with driver selection."""
        st.markdown("""
        <div class="chart-container">
            <div class="chart-header">
                <div>
                    <div class="chart-title">📈 Historical Performance Analysis</div>
                    <div class="chart-subtitle">Detailed driver performance tracking with flexible date ranges</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Get available drivers
        conn = self.get_database_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT full_name FROM dim_driver WHERE active = 1 ORDER BY full_name")
                drivers = [row[0] for row in cursor.fetchall()]
                conn.close()
            except:
                drivers = ["Patryk Dochniak", "Vukasin Roganovic", "Igor Dajic", "Nicolas Cristian", "Pufleani Cosmin", "Faeez Kirde", "Suhail Suhail", "Nenad Vlajic", "Dzenis Pirja", "Aleksander Gas", "Nedim Mujic", "Stefan Simic"]
        else:
            drivers = ["Patryk Dochniak", "Vukasin Roganovic", "Igor Dajic", "Nicolas Cristian", "Pufleani Cosmin", "Faeez Kirde", "Suhail Suhail", "Nenad Vlajic", "Dzenis Pirja", "Aleksander Gas", "Nedim Mujic", "Stefan Simic"]
        
        # Controls
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            selected_driver = st.selectbox("Select Driver", ["All Drivers"] + drivers, key="historical_driver")
        
        with col2:
            start_date = st.date_input("Start Date", value=date.today() - timedelta(days=30), key="historical_start")
        
        with col3:
            end_date = st.date_input("End Date", value=date.today(), key="historical_end")
        
        # Get driver performance data
        if selected_driver == "All Drivers":
            self.create_all_drivers_analysis(start_date, end_date)
        else:
            self.create_individual_driver_analysis(selected_driver, start_date, end_date)
    
    def create_all_drivers_analysis(self, start_date, end_date):
        """Create analysis for all drivers."""
        st.markdown("### 📊 All Drivers Performance Summary")
        
        conn = self.get_database_connection()
        if not conn:
            st.error("Database connection failed")
            return
        
        try:
            # Get summary data for all drivers
            query = """
            SELECT 
                d.full_name as driver_name,
                d.team,
                c.name as city,
                COUNT(DISTINCT fs.shift_id) as total_shifts,
                COALESCE(SUM(ftc.task_count), 0) as total_tasks,
                COALESCE(AVG(sms.task_per_hour), 0) as avg_task_per_hour,
                COALESCE(AVG(sms.battery_swap_avg_time_min), 0) as avg_battery_time,
                COALESCE(AVG(sms.ifqc_avg_time_min), 0) as avg_ifqc_time
            FROM dim_driver d
            LEFT JOIN fact_shift fs ON d.driver_id = fs.driver_id
            LEFT JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE fs.shift_date BETWEEN ? AND ?
            GROUP BY d.driver_id, d.full_name, d.team, c.name
            ORDER BY total_tasks DESC
            """
            
            df = pd.read_sql_query(query, conn, params=[start_date, end_date])
            
            if len(df) > 0:
                # Display summary table
                st.dataframe(df, use_container_width=True)
                
                # Create performance charts
                col1, col2 = st.columns(2)
                
                with col1:
                    fig_tasks = px.bar(df, x='driver_name', y='total_tasks', 
                                     title="Total Tasks by Driver", 
                                     color='total_tasks',
                                     color_continuous_scale='Viridis')
                    fig_tasks.update_layout(xaxis_tickangle=-45)
                    st.plotly_chart(fig_tasks, use_container_width=True)
                
                with col2:
                    fig_efficiency = px.bar(df, x='driver_name', y='avg_task_per_hour',
                                          title="Average Task per Hour by Driver",
                                          color='avg_task_per_hour',
                                          color_continuous_scale='Blues')
                    fig_efficiency.update_layout(xaxis_tickangle=-45)
                    st.plotly_chart(fig_efficiency, use_container_width=True)
            else:
                st.info("No data found for the selected date range")
            
            conn.close()
            
        except Exception as e:
            st.error(f"Error fetching data: {e}")
            conn.close()
    
    def create_individual_driver_analysis(self, driver_name, start_date, end_date):
        """Create detailed analysis for individual driver."""
        # Get driver's team
        conn = self.get_database_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT team FROM dim_driver WHERE full_name = ?", (driver_name,))
                result = cursor.fetchone()
                team = result[0] if result else "Unknown Team"
                conn.close()
            except:
                team = "Unknown Team"
        else:
            team = "Unknown Team"
        
        st.markdown(f"### 👤 {driver_name} - {team} - Performance Analysis")
        
        conn = self.get_database_connection()
        if not conn:
            st.error("Database connection failed")
            return
        
        try:
            # Get detailed performance data for the selected driver
            query = """
            SELECT 
                fs.shift_date as date,
                d.team,
                c.name as city,
                COALESCE(SUM(ftc.task_count), 0) as daily_tasks,
                COALESCE(AVG(sms.task_per_hour), 0) as task_per_hour,
                COALESCE(AVG(sms.battery_swap_avg_time_min), 0) as battery_avg_time,
                COALESCE(AVG(sms.ifqc_avg_time_min), 0) as ifqc_avg_time,
                COUNT(DISTINCT fs.shift_id) as shifts_count
            FROM fact_shift fs
            JOIN dim_driver d ON fs.driver_id = d.driver_id
            JOIN dim_city c ON fs.city_id = c.city_id
            LEFT JOIN fact_task_count ftc ON fs.shift_id = ftc.shift_id
            LEFT JOIN stg_manual_shift_reports sms ON fs.source_doc_id = sms.source_file
            WHERE d.full_name = ? AND fs.shift_date BETWEEN ? AND ?
            GROUP BY fs.shift_date, d.team, c.name
            ORDER BY fs.shift_date
            """
            
            df = pd.read_sql_query(query, conn, params=[driver_name, start_date, end_date])
            
            if len(df) > 0:
                df['date'] = pd.to_datetime(df['date'])
                
                # Summary metrics
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    total_tasks = df['daily_tasks'].sum()
                    st.metric("Total Tasks", f"{total_tasks:,}")
                
                with col2:
                    avg_task_per_hour = df['task_per_hour'].mean()
                    st.metric("Avg Task/Hour", f"{avg_task_per_hour:.1f}")
                
                with col3:
                    avg_battery_time = df['battery_avg_time'].mean()
                    st.metric("Avg Battery Time", f"{avg_battery_time:.1f}m")
                
                with col4:
                    total_shifts = df['shifts_count'].sum()
                    st.metric("Total Shifts", f"{total_shifts}")
                
                # Performance charts
                col1, col2 = st.columns(2)
                
                with col1:
                    fig_daily = px.bar(df, x='date', y='daily_tasks', 
                                      title="Daily Task Count",
                                      color='city')
                    st.plotly_chart(fig_daily, use_container_width=True)
                
                with col2:
                    fig_efficiency = px.bar(df, x='date', y='task_per_hour',
                                           title="Task per Hour Trend",
                                           color='city')
                    st.plotly_chart(fig_efficiency, use_container_width=True)
                
                # KPI trends
                col1, col2 = st.columns(2)
                
                with col1:
                    fig_battery = px.bar(df, x='date', y='battery_avg_time',
                                        title="Battery Swap Average Time",
                                        color='city')
                    st.plotly_chart(fig_battery, use_container_width=True)
                
                with col2:
                    fig_ifqc = px.bar(df, x='date', y='ifqc_avg_time',
                                     title="IFQC Average Time",
                                     color='city')
                    st.plotly_chart(fig_ifqc, use_container_width=True)
                
                # Detailed data table
                st.markdown("### 📋 Detailed Performance Data")
                st.dataframe(df, use_container_width=True)
                
            else:
                st.info(f"No data found for {driver_name} in the selected date range")
            
            conn.close()
            
        except Exception as e:
            st.error(f"Error fetching data: {e}")
            conn.close()

def main():
    """Main function to run the dashboard."""
    dashboard = ProfessionalDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()