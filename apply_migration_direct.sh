#!/bin/bash

# Read the migration file
MIGRATION_FILE="./supabase/migrations/20260216006000_create_github_sources.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Applying migration from: $MIGRATION_FILE"

# Extract SQL statements (simple approach - split by semicolons)
# Read entire file
SQL=$(cat "$MIGRATION_FILE")

# Create a simple Python script to execute SQL via Supabase
python3 << 'PYTHON'
import os
import sys
from pathlib import Path

# Try importing supabase - if not available, provide instructions
try:
    from supabase import create_client
except ImportError:
    print("⚠️  Supabase Python client not installed")
    print("To apply migrations manually:")
    print("1. Go to: https://app.supabase.com/project/efybjwirnwtrclqkwyvs/sql/new")
    print("2. Copy contents of: ./supabase/migrations/20260216006000_create_github_sources.sql")
    print("3. Paste and execute in the SQL editor")
    sys.exit(0)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Missing Supabase credentials")
    print("Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set")
    sys.exit(1)

supabase = create_client(url, key)

# Read migration file
with open("./supabase/migrations/20260216006000_create_github_sources.sql", "r") as f:
    sql = f.read()

# Execute
try:
    result = supabase.postgrest.sql(sql).execute()
    print("✅ Migration applied successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
PYTHON

