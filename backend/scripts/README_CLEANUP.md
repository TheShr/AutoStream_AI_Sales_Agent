# Database Cleanup Guide

To clean all data from the database (tenants and leads), use one of these methods:

## Method 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard: https://supabase.com
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the contents of `clean_database.sql`:
   ```sql
   DELETE FROM leads;
   DELETE FROM tenants;
   ```
5. Click **Run**

This will delete all leads and tenant records.

## Method 2: Local Python Script (Requires DATABASE_URL)

1. Set your DATABASE_URL environment variable locally:
   ```bash
   # On Windows (PowerShell)
   $env:DATABASE_URL="your_postgresql_url_here"
   
   # On macOS/Linux
   export DATABASE_URL="your_postgresql_url_here"
   ```

2. Run the cleanup script:
   ```bash
   cd backend
   python scripts/clean_database.py
   ```

3. Type `yes` when prompted to confirm deletion

## Method 3: Via Render Shell (If you have access)

1. Go to your Render dashboard
2. Open the service shell
3. Run: `python backend/scripts/clean_database.py`

---

**Note**: This will permanently delete all data. Ensure you have a backup if needed.
