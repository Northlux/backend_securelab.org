import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for signals
const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
const SignalCategorySchema = z.enum([
  'cve',
  'advisory',
  'apt',
  'malware',
  'news',
  'research',
  'exploit',
  'vulnerability',
  'incident',
]);

const CreateSignalSchema = z.object({
  title: z.string().min(10).max(500),
  summary: z.string().optional(),
  full_content: z.string().optional(),
  signal_category: SignalCategorySchema.default('news'),
  severity: SeveritySchema.default('medium'),
  confidence_level: z.number().min(0).max(100).default(50),
  source_id: z.string().uuid().optional(),
  source_name: z.string().optional(),
  source_type: z.enum(['rss', 'api', 'scraper', 'manual']).optional(),
  source_url: z.string().url().optional(),
  source_date: z.string().datetime().optional(),
  cve_ids: z.array(z.string()).optional(),
  threat_actors: z.array(z.string()).optional(),
  malware_families: z.array(z.string()).optional(),
  campaign_names: z.array(z.string()).optional(),
  target_industries: z.array(z.string()).optional(),
  target_regions: z.array(z.string()).optional(),
  motivation: z.string().optional(),
  attack_phase: z.string().optional(),
  ioc_types: z.array(z.string()).optional(),
  affected_products: z.array(z.string()).optional(),
  exploit_type: z.string().optional(),
  mitre_tactics: z.array(z.string()).optional(),
  mitre_techniques: z.array(z.string()).optional(),
  is_fraud_trust_safety: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_verified: z.boolean().default(false),
  tag_ids: z.array(z.string().uuid()).optional(),
});

const SignalImportSchema = z.object({
  metadata: z.object({
    import_source: z.string().optional(),
    import_date: z.string().datetime().optional(),
    batch_id: z.string().optional(),
    total_signals: z.number().optional(),
  }).optional(),
  signals: z.array(CreateSignalSchema),
});

export type SignalImportData = z.infer<typeof SignalImportSchema>;

interface ImportOptions {
  skipDuplicates?: boolean;
  autoEnrich?: boolean;
}

interface ImportResult {
  title: string;
  status: 'imported' | 'skipped' | 'error';
  error?: string;
}

export interface ImportResults {
  imported: number;
  skipped: number;
  errors: string[];
  details: ImportResult[];
}

// ✅ Database response schema for type-safe queries
const DatabaseSignalRowSchema = z.object({
  source_url: z.string().url().nullable(),
});

const DatabaseCVERowSchema = z.object({
  cve_ids: z.array(z.string()).nullable(),
});

/**
 * Validate JSON against schema without importing
 */
export function validateSignalsJson(jsonData: unknown): {
  valid: boolean;
  count: number;
  errors: string[];
} {
  try {
    const validated = SignalImportSchema.parse(jsonData);
    return {
      valid: true,
      count: validated.signals.length,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return {
        valid: false,
        count: 0,
        errors,
      };
    }
    return {
      valid: false,
      count: 0,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Fetch existing signal URLs from database - Type-safe version
 */
async function fetchExistingUrls(supabase: SupabaseClient): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('source_url')
      .not('source_url', 'is', null);

    if (error) {
      console.warn('Failed to fetch existing URLs:', {
        error_code: error.code,
        error_message: error.message,
      });
      return new Set();
    }

    // ✅ Validate response shape with Zod
    const validated = z.array(DatabaseSignalRowSchema).parse(data || []);

    return new Set(
      validated
        .map(row => row.source_url)
        .filter((url): url is string => url !== null && url !== undefined)
    );
  } catch (err) {
    console.error('Error fetching existing URLs:', err instanceof Error ? err.message : 'Unknown error');
    return new Set();
  }
}

/**
 * Fetch existing CVE IDs from database - Type-safe version
 */
async function fetchExistingCveIds(supabase: SupabaseClient): Promise<Map<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('cve_ids')
      .not('cve_ids', 'is', null);

    if (error) {
      console.warn('Failed to fetch existing CVE IDs:', {
        error_code: error.code,
        error_message: error.message,
      });
      return new Map();
    }

    // ✅ Validate response shape with Zod
    const validated = z.array(DatabaseCVERowSchema).parse(data || []);

    const cveMap = new Map<string, boolean>();
    for (const row of validated) {
      if (Array.isArray(row.cve_ids)) {
        for (const cveId of row.cve_ids) {
          cveMap.set(cveId, true);
        }
      }
    }

    return cveMap;
  } catch (err) {
    console.error('Error fetching existing CVE IDs:', err instanceof Error ? err.message : 'Unknown error');
    return new Map();
  }
}

/**
 * Infer industries from signal content
 */
function inferIndustries(text: string): string[] {
  const industries: string[] = [];
  const lowerText = text.toLowerCase();

  const mappings: Record<string, string[]> = {
    healthcare: ['hospital', 'medical', 'healthcare', 'patient', 'clinic', 'pharmacy'],
    finance: ['bank', 'financial', 'payment', 'credit card', 'fintech'],
    government: ['government', 'federal', 'agency', 'military', 'defense'],
    manufacturing: ['manufacturing', 'factory', 'plant', 'scada'],
    energy: ['energy', 'utility', 'power plant', 'electric'],
    telecommunications: ['telecom', 'isp', 'network provider', 'carrier'],
    education: ['university', 'college', 'school', 'education'],
    retail: ['retail', 'store', 'shopping', 'ecommerce'],
    technology: ['technology', 'software', 'cloud', 'saas'],
    transportation: ['transportation', 'airline', 'shipping', 'logistics'],
  };

  for (const [industry, keywords] of Object.entries(mappings)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      industries.push(industry);
    }
  }

  return industries;
}

/**
 * Calculate confidence score for signal
 */
function calculateConfidence(signal: any): number {
  let confidence = 50;

  if (signal.cve_ids && Array.isArray(signal.cve_ids) && signal.cve_ids.length > 0) {
    confidence += 30;
  }

  if (signal.is_verified === true) {
    confidence += 15;
  }

  if (signal.severity === 'critical') {
    confidence += 10;
  } else if (signal.severity === 'high') {
    confidence += 5;
  }

  if (signal.is_featured === true) {
    confidence += 5;
  }

  return Math.min(100, confidence);
}

/**
 * Enrich signal with calculated fields
 */
function enrichSignal(signal: any): any {
  const enriched = { ...signal };

  if (!enriched.target_industries || enriched.target_industries.length === 0) {
    enriched.target_industries = inferIndustries(
      `${enriched.title} ${enriched.summary || ''} ${enriched.full_content || ''}`
    );
  }

  if (enriched.confidence_level === undefined || enriched.confidence_level === null) {
    enriched.confidence_level = calculateConfidence(enriched);
  }

  if (!enriched.source_type) {
    enriched.source_type = 'manual';
  }

  return enriched;
}

/**
 * Import signals from JSON data
 * ✅ Added session validation and improved error handling
 */
export async function importSignalsFromJson(
  jsonData: unknown,
  options: ImportOptions = {}
): Promise<ImportResults> {
  const { skipDuplicates = true, autoEnrich = true } = options;

  // Validate JSON structure
  let validated: SignalImportData;
  try {
    validated = SignalImportSchema.parse(jsonData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return {
        imported: 0,
        skipped: 0,
        errors: messages,
        details: [],
      };
    }
    throw error;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ✅ Verify user session is still valid
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        imported: 0,
        skipped: 0,
        errors: ['Session expired. Please log in and try again.'],
        details: [],
      };
    }
  } catch (err) {
    console.error('Session validation failed:', err instanceof Error ? err.message : 'Unknown error');
    return {
      imported: 0,
      skipped: 0,
      errors: ['Authentication error. Please log in again.'],
      details: [],
    };
  }

  const results: ImportResults = {
    imported: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  // Fetch existing signals for duplicate detection
  const existingUrls = skipDuplicates ? await fetchExistingUrls(supabase) : new Set<string>();
  const existingCveIds = skipDuplicates ? await fetchExistingCveIds(supabase) : new Map<string, boolean>();

  // Process each signal
  for (const signal of validated.signals) {
    try {
      // Check for duplicate URLs
      if (skipDuplicates && signal.source_url && existingUrls.has(signal.source_url)) {
        results.skipped++;
        results.details.push({
          title: signal.title,
          status: 'skipped',
          error: 'Duplicate URL detected',
        });
        continue;
      }

      // Check for duplicate CVE IDs
      if (skipDuplicates && signal.cve_ids && signal.cve_ids.length > 0) {
        const hasDuplicateCve = signal.cve_ids.some(cveId => existingCveIds.has(cveId));
        if (hasDuplicateCve) {
          results.skipped++;
          results.details.push({
            title: signal.title,
            status: 'skipped',
            error: 'Duplicate CVE ID detected',
          });
          continue;
        }
      }

      // Enrich signal
      let enrichedSignal = signal;
      if (autoEnrich) {
        enrichedSignal = enrichSignal(enrichedSignal);
      }

      // ✅ Type-safe database insert
      const { error } = await supabase
        .from('signals')
        .insert([enrichedSignal]); // Explicit array notation

      if (error) {
        // ✅ Log detailed error server-side
        console.error('Database insert failed:', {
          signal_title: signal.title,
          error_code: error.code,
          error_message: error.message,
          signal_id: (signal as any).id,
        });

        // ✅ Return generic error to client
        results.details.push({
          title: signal.title,
          status: 'error',
          error: 'Failed to import signal. Please check the format and try again.',
        });
      } else {
        results.imported++;
        results.details.push({
          title: signal.title,
          status: 'imported',
        });
      }
    } catch (err) {
      // ✅ Log detailed error server-side
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Signal import error:', {
        signal_title: signal.title,
        error: errorMsg,
        error_type: err instanceof Error ? err.constructor.name : 'Unknown',
      });

      // ✅ Return generic error to client
      results.details.push({
        title: signal.title,
        status: 'error',
        error: 'Import failed due to an error. Please try again.',
      });
    }
  }

  return results;
}
