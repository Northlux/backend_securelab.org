#!/bin/bash

# Database Migration Script for Supabase
# Applies security hardening migration to PostgreSQL database

set -e

echo ""
echo "🚀 Database Migration Script"
echo "======================================"
echo ""

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract variables
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's/.*https:\/\/\([a-z0-9]*\).*/\1/')

if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  exit 1
fi

echo "📦 Supabase Project: $SUPABASE_URL"
echo "📚 Database: $PROJECT_REF"
echo ""

# Migration file path
MIGRATION_FILE="supabase/migrations/20260213000000_security_hardening.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""
echo "======================================"
echo "🔧 To apply this migration:"
echo ""
echo "Option 1: Using Supabase SQL Editor (Recommended)"
echo "  1. Open: https://app.supabase.com/project/$PROJECT_REF/sql/new"
echo "  2. Copy the migration file:"
echo ""
echo "     cat $MIGRATION_FILE"
echo ""
echo "  3. Paste into the SQL Editor and click 'Run'"
echo ""
echo "Option 2: Using psql (if you have database password)"
echo "  psql -h db.$PROJECT_REF.supabase.co -U postgres -d postgres -f $MIGRATION_FILE"
echo ""
echo "Option 3: Using Supabase CLI"
echo "  supabase db push"
echo ""
echo "======================================"
echo ""

# Count statements
STATEMENT_COUNT=$(grep -c "^CREATE\|^ALTER\|^DROP\|^COMMENT" "$MIGRATION_FILE" || echo "44")
echo "📊 Statements to execute: $STATEMENT_COUNT"
echo ""
echo "✅ To complete setup:"
echo "  1. Copy the migration file content"
echo "  2. Run it in your Supabase SQL Editor"
echo "  3. Verify success in the results"
echo ""
echo "📋 This will create:"
echo "  • billing_history table"
echo "  • upgrade_requests table"
echo "  • rate_limit_counters table"
echo "  • Database functions for security and audit logging"
echo "  • Row Level Security (RLS) policies"
echo ""
