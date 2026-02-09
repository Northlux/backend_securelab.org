# Bulk Import Guide - Threat Intelligence Signals

## Overview

The bulk import interface at `/admin/intel/import` allows administrators to import threat intelligence signals in JSON format with automatic validation, duplicate detection, and enrichment.

## Features

- **File Upload or JSON Paste**: Upload JSON files or paste JSON directly
- **Real-time Validation**: Immediate feedback on JSON syntax and schema compliance
- **Preview Display**: See signals before importing with title, severity, category, and source URL
- **Duplicate Detection**: Automatically skip or flag signals already in the database
  - URL-based matching
  - CVE ID-based matching
- **Auto-Enrichment**: Optionally calculate fields automatically
  - Industry inference from signal content
  - Confidence score calculation
- **Detailed Results**: View import statistics and per-signal status
- **Error Tracking**: Clear error messages for failed imports

## JSON Format

### Minimal Structure

```json
{
  "signals": [
    {
      "title": "Critical Vulnerability in Popular Software",
      "summary": "Brief description of the threat",
      "signal_category": "vulnerability",
      "severity": "critical",
      "source_url": "https://example.com/advisory"
    }
  ]
}
```

### With Metadata

```json
{
  "metadata": {
    "import_source": "manual",
    "import_date": "2026-02-09T22:00:00Z",
    "batch_id": "batch-001",
    "total_signals": 1
  },
  "signals": [
    {
      "title": "Critical Vulnerability in Popular Software",
      "summary": "Brief description of the threat",
      "signal_category": "vulnerability",
      "severity": "critical",
      "source_url": "https://example.com/advisory",
      "cve_ids": ["CVE-2024-0001"],
      "affected_products": ["Software X"],
      "target_industries": ["finance", "healthcare"]
    }
  ]
}
```

## Supported Signal Categories

- `cve` - Common Vulnerabilities and Exposures
- `advisory` - Security advisory
- `apt` - Advanced Persistent Threat
- `malware` - Malware detection/analysis
- `news` - Security news
- `research` - Security research
- `exploit` - Exploit availability
- `vulnerability` - General vulnerability
- `incident` - Security incident

## Supported Severity Levels

- `critical` - Requires immediate action
- `high` - Significant threat
- `medium` - Notable threat
- `low` - Minor threat
- `info` - Informational

## Signal Fields

### Required Fields
- `title` (string, 10-500 chars) - Signal title/headline

### Optional Fields
- `summary` - Short description
- `full_content` - Detailed description
- `signal_category` - Category (default: "news")
- `severity` - Severity level (default: "medium")
- `confidence_level` - Confidence score 0-100 (auto-calculated if not provided)
- `source_id` - UUID of existing source
- `source_name` - Name of source
- `source_type` - Source type (rss, api, scraper, manual)
- `source_url` - URL to source
- `source_date` - ISO datetime of source publication
- `cve_ids` - Array of CVE identifiers
- `threat_actors` - Array of threat actor names
- `malware_families` - Array of malware family names
- `campaign_names` - Array of campaign names
- `target_industries` - Array of target industries
- `target_regions` - Array of affected regions
- `motivation` - Threat motivation
- `attack_phase` - Kill chain phase
- `ioc_types` - Indicator of compromise types
- `affected_products` - Affected products/services
- `exploit_type` - Type of exploit
- `mitre_tactics` - MITRE ATT&CK tactics
- `mitre_techniques` - MITRE ATT&CK techniques
- `is_fraud_trust_safety` - Safety-related flag
- `is_featured` - Featured signal flag
- `is_verified` - Manually verified flag
- `tag_ids` - Array of tag UUIDs

## Import Options

### Skip Duplicates (Default: Enabled)
When enabled, signals are compared against existing database:
- **URL Matching**: Signals with same `source_url` as existing signals are skipped
- **CVE Matching**: Signals containing CVE IDs matching existing signals are skipped

This prevents duplicate data accumulation when re-importing the same source.

### Auto-Enrich (Default: Enabled)
Automatically calculates optional fields if not provided:
- **Industries**: Infers target industries from signal content using keyword matching
- **Confidence**: Calculates confidence score based on:
  - Base: 50 points
  - +30 for CVE IDs (authoritative sources)
  - +15 for manual verification flag
  - +10 for critical severity
  - +5 for high severity or featured flag
  - Max: 100 points
- **Source Type**: Sets to "manual" if not provided

## Import Workflow

1. **Select Input Method**
   - Upload a JSON file (max 5MB) or paste JSON directly
   - Click "Use template" for example format

2. **Validate JSON**
   - Click "Validate" button
   - System checks syntax and schema compliance
   - See preview of signals if valid

3. **Review Preview**
   - Table shows up to 10 signals (title, category, severity, URL)
   - Check that data looks correct

4. **Configure Options**
   - Choose to skip duplicates (default: yes)
   - Choose to auto-enrich (default: yes)

5. **Execute Import**
   - Click "Import Now" button
   - Progress indicator shows import running

6. **Review Results**
   - Summary statistics: imported, skipped, errors
   - Detailed table with per-signal status
   - Error messages for troubleshooting

## File Size & Performance

- **Max File Size**: 5 MB
- **Recommended Batch**: Up to 100 signals
- **Performance**: ~1-2 seconds per signal depending on enrichment

For larger imports, split into multiple batches.

## Validation Rules

### JSON Syntax
- Must be valid JSON
- Either root array of signals or object with `signals` property

### Schema Validation
- `title` required, 10-500 characters
- `signal_category` must be valid enum value
- `severity` must be valid enum value
- URLs must be valid format (if provided)
- CVE IDs must match pattern
- Confidence must be 0-100 if provided
- UUIDs must be valid format

### Duplicate Detection
When enabled:
- Checks `source_url` against existing signals (exact match)
- Checks `cve_ids` array against existing signals (any match)
- Skipped signals count toward final statistics

## Troubleshooting

### Import Fails During Validation
- Check JSON syntax (use JSON validator tool)
- Verify all required fields are present
- Ensure field values match expected types
- Check field lengths (title: 10-500 chars)

### Some Signals Skip as Duplicates
- Normal behavior when `Skip duplicates` is enabled
- Check if signals already exist in database via Signals page
- Disable `Skip duplicates` to re-import anyway

### Confidence Level Seems Wrong
- Only auto-calculated if not provided in JSON
- Calculation based on: CVE IDs, verification flag, severity
- Manually set `confidence_level` in JSON to override

### Import Takes Too Long
- Reduce batch size (recommended: 50 signals per import)
- Disable `Auto-enrich` if not needed
- Split large files and import separately

## Example Imports

### Quick News Import
```json
{
  "signals": [
    {
      "title": "New Zero-Day Vulnerability Discovered in OpenSSL",
      "summary": "Researchers announced a zero-day affecting OpenSSL versions 1.0.0 through 1.1.1",
      "signal_category": "vulnerability",
      "severity": "critical",
      "source_url": "https://example.com/openssl-zeroday"
    }
  ]
}
```

### Structured CVE Import
```json
{
  "signals": [
    {
      "title": "CVE-2024-0001: Remote Code Execution in LibTIFF",
      "summary": "LibTIFF contains buffer overflow in TIFF image processing",
      "signal_category": "cve",
      "severity": "high",
      "cve_ids": ["CVE-2024-0001"],
      "affected_products": ["LibTIFF 4.5.0", "LibTIFF 4.6.0"],
      "target_industries": ["technology", "finance"],
      "source_url": "https://nvd.nist.gov/vuln/detail/CVE-2024-0001"
    }
  ]
}
```

### Threat Intel Import
```json
{
  "signals": [
    {
      "title": "APT28 Campaign Targets European Government Organizations",
      "summary": "Attribution specialists link phishing campaign to APT28 (Fancy Bear)",
      "signal_category": "apt",
      "severity": "critical",
      "threat_actors": ["APT28", "Fancy Bear"],
      "target_regions": ["Europe"],
      "target_industries": ["government"],
      "mitre_tactics": ["Initial Access", "Persistence"],
      "source_url": "https://example.com/apt28-campaign",
      "is_verified": true
    }
  ]
}
```

## Database Impact

- Signals are inserted to `signals` table
- Uses same schema as ingest pipeline
- No modifications to sources or tags tables
- RLS policies apply based on authenticated user
- All imports logged to `ingestion_logs` if configured

## Next Steps

After importing signals:
1. View imported signals: `/admin/intel/signals`
2. Edit signal details: Click edit button in signals table
3. Tag signals: Use signals page to assign tags
4. Monitor ingestion: Check `/admin/intel/logs` for activity
5. Manage sources: Add/edit sources at `/admin/intel/sources`

## Related Pages

- **Signals Management**: `/admin/intel/signals` - View, edit, delete signals
- **Source Management**: `/admin/intel/sources` - Configure data sources
- **Tag Management**: `/admin/intel/tags` - Organize signals with tags
- **Ingestion Logs**: `/admin/intel/logs` - Monitor data ingestion activity
