#!/usr/bin/env node
/**
 * Seed script for populating signals database with test threat intelligence data
 * Usage: node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: `${__dirname}/../.env.local` })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testSignals = [
  {
    title: 'Critical: MOVEit Transfer RCE Vulnerability Exploited',
    summary: 'Threat actors actively exploiting CVE-2024-5274 in MOVEit Transfer for RCE',
    full_content: 'Threat actors are actively exploiting CVE-2024-5274 in Progress MOVEit Transfer. This zero-day vulnerability allows remote code execution without authentication.',
    severity: 'critical',
    signal_category: 'vulnerability',
    source_url: 'https://www.bleepingcomputer.com/moveit-transfer-rce',
    cve_ids: ['CVE-2024-5274'],
    target_industries: ['Technology'],
    confidence_level: 98,
    is_verified: true,
  },
  {
    title: 'High: LockBit 3.0 Ransomware Campaign Targeting Finance Sector',
    summary: 'LockBit 3.0 launching ransomware campaign targeting financial institutions',
    full_content: 'LockBit 3.0 has launched a new ransomware campaign targeting financial institutions with focus on banking trojans and credential harvesting.',
    severity: 'high',
    signal_category: 'ransomware',
    source_url: 'https://krebsonsecurity.com/lockbit-3-campaign',
    cve_ids: [],
    target_industries: ['Financial Services'],
    confidence_level: 92,
    is_verified: true,
  },
  {
    title: 'High: Apache Log4j Exploitation in the Wild',
    summary: 'Log4j CVE-2021-44228 continues to be exploited across multiple sectors',
    full_content: 'Continued exploitation of Log4j CVE-2021-44228 detected across multiple sectors. Attackers using it for initial access in multi-stage attacks.',
    severity: 'high',
    signal_category: 'vulnerability',
    source_url: 'https://www.bleepingcomputer.com/log4j-exploitation',
    cve_ids: ['CVE-2021-44228'],
    target_industries: ['Multiple'],
    confidence_level: 95,
    is_verified: true,
  },
  {
    title: 'Medium: Phishing Campaign Using Lookalike Domains',
    summary: 'Homograph attack campaign using Unicode characters to mimic SaaS platforms',
    full_content: 'New phishing campaign detected using homograph attacks with Unicode characters to mimic popular SaaS platforms. 45% click rate reported.',
    severity: 'medium',
    signal_category: 'phishing',
    source_url: 'https://securityintel.example.com/phishing-unicode',
    cve_ids: [],
    target_industries: ['SaaS'],
    confidence_level: 87,
    is_verified: true,
  },
  {
    title: 'High: Windows 0-Day Privilege Escalation Discovered',
    summary: 'New Windows kernel privilege escalation affecting Windows 10/11',
    full_content: 'A new Windows privilege escalation vulnerability affecting Windows 10/11 has been discovered. Remote attackers can escalate from user to SYSTEM.',
    severity: 'high',
    signal_category: 'vulnerability',
    source_url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-1234',
    cve_ids: ['CVE-2024-1234'],
    target_industries: ['Technology'],
    confidence_level: 99,
    is_verified: true,
  },
  {
    title: 'Low: Suspicious DNS Activity in Ukraine',
    summary: 'DNS reconnaissance patterns match APT29 infrastructure activity',
    full_content: 'Increased suspicious DNS queries detected in Ukrainian infrastructure. Pattern matches previous APT29 infrastructure reconnaissance.',
    severity: 'low',
    signal_category: 'advisory',
    source_url: 'https://threatfeed.example.com/ukraine-dns',
    cve_ids: [],
    target_industries: ['Government'],
    threat_actors: ['APT29'],
    confidence_level: 72,
    is_verified: false,
  },
  {
    title: 'Medium: New Variant of Emotet Botnet Detected',
    summary: 'Emotet botnet variant with enhanced C&C obfuscation discovered',
    full_content: 'Security researchers have identified a new variant of the Emotet botnet with enhanced C&C communication obfuscation and anti-analysis capabilities.',
    severity: 'medium',
    signal_category: 'malware',
    source_url: 'https://malwarebytes.example.com/emotet-variant',
    cve_ids: [],
    target_industries: ['Multiple'],
    confidence_level: 88,
    is_verified: true,
  },
  {
    title: 'Critical: CISA Warns of Active Exploitation of Fortinet FortiOS Vulnerability',
    summary: 'Fortinet FortiOS VPN vulnerability actively exploited in the wild',
    full_content: 'CISA has added CVE-2023-27997 to its Known Exploited Vulnerabilities catalog. Multiple threat actors actively exploiting Fortinet FortiOS VPN devices.',
    severity: 'critical',
    signal_category: 'vulnerability',
    source_url: 'https://www.cisa.gov/known-exploited-vulnerabilities',
    cve_ids: ['CVE-2023-27997'],
    target_industries: ['Technology'],
    confidence_level: 99,
    is_verified: true,
  },
  {
    title: 'High: Supply Chain Attack via Compromised NPM Package',
    summary: 'Malicious NPM package with 2.3M downloads injecting cryptomining code',
    full_content: 'Researchers discovered a malicious NPM package with 2.3M downloads that injects cryptocurrency mining code. Package was published by compromised maintainer.',
    severity: 'high',
    signal_category: 'exploit',
    source_url: 'https://github.com/advisories/npm-malicious',
    cve_ids: [],
    target_industries: ['Software Development'],
    confidence_level: 96,
    is_verified: true,
  },
  {
    title: 'Medium: Increased DDoS Activity Against Government Websites',
    summary: 'NATO government websites targeted with coordinated DDoS attacks',
    full_content: 'Multiple government websites across NATO countries experiencing coordinated DDoS attacks. Attack pattern matches Russian-affiliated threat group Killnet.',
    severity: 'medium',
    signal_category: 'threat_actor',
    source_url: 'https://cloudflare.com/ddos-report',
    cve_ids: [],
    target_industries: ['Government'],
    threat_actors: ['Killnet'],
    target_regions: ['NATO'],
    confidence_level: 85,
    is_verified: true,
  },
]

async function seedDatabase() {
  try {
    console.log('🌱 Seeding signals database...\n')

    // Insert signals
    const { data, error } = await supabase
      .from('signals')
      .insert(testSignals)
      .select()

    if (error) {
      console.error('❌ Error inserting signals:', error.message)
      console.error('   Details:', error)
      process.exit(1)
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} signals`)
    console.log('\n📊 Signal Summary:')
    console.log(`   Critical: ${testSignals.filter(s => s.severity === 'critical').length}`)
    console.log(`   High: ${testSignals.filter(s => s.severity === 'high').length}`)
    console.log(`   Medium: ${testSignals.filter(s => s.severity === 'medium').length}`)
    console.log(`   Low: ${testSignals.filter(s => s.severity === 'low').length}`)

    console.log('\n🔍 Categories:')
    const categories = new Set(testSignals.map(s => s.category))
    categories.forEach(cat => {
      const count = testSignals.filter(s => s.category === cat).length
      console.log(`   ${cat}: ${count}`)
    })

    console.log('\n✨ Database seeding complete!')
    console.log('   Visit: http://localhost:3007/admin/intel/signals')
    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

seedDatabase()
