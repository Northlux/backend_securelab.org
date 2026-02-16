#!/usr/bin/env node
/**
 * Seed script for populating signals database with test threat intelligence data
 * Usage: pnpm ts-node scripts/seed-signals.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const testSignals = [
  {
    title: 'Critical: MOVEit Transfer RCE Vulnerability Exploited',
    description: 'Threat actors are actively exploiting CVE-2024-5274 in Progress MOVEit Transfer. This zero-day vulnerability allows remote code execution without authentication.',
    severity: 'critical',
    category: 'vulnerability',
    source_name: 'BleepingComputer',
    source_url: 'https://www.bleepingcomputer.com/moveit-transfer-rce',
    cve_ids: ['CVE-2024-5274'],
    industry: 'Technology',
    confidence_score: 0.98,
    is_verified: true,
    tags: ['RCE', 'zero-day', 'exploitation', 'MFT'],
  },
  {
    title: 'High: LockBit 3.0 Ransomware Campaign Targeting Finance Sector',
    description: 'LockBit 3.0 has launched a new ransomware campaign targeting financial institutions with focus on banking trojans and credential harvesting.',
    severity: 'high',
    category: 'malware',
    source_name: 'Krebs on Security',
    source_url: 'https://krebsonsecurity.com/lockbit-3-campaign',
    cve_ids: [],
    industry: 'Financial Services',
    confidence_score: 0.92,
    is_verified: true,
    tags: ['ransomware', 'LockBit', 'finance', 'credential-theft'],
  },
  {
    title: 'High: Apache Log4j Exploitation in the Wild',
    description: 'Continued exploitation of Log4j CVE-2021-44228 detected across multiple sectors. Attackers using it for initial access in multi-stage attacks.',
    severity: 'high',
    category: 'vulnerability',
    source_name: 'BleepingComputer',
    source_url: 'https://www.bleepingcomputer.com/log4j-exploitation',
    cve_ids: ['CVE-2021-44228'],
    industry: 'Multiple',
    confidence_score: 0.95,
    is_verified: true,
    tags: ['log4j', 'exploitation', 'java', 'widespread'],
  },
  {
    title: 'Medium: Phishing Campaign Using Lookalike Domains',
    description: 'New phishing campaign detected using homograph attacks with Unicode characters to mimic popular SaaS platforms. 45% click rate reported.',
    severity: 'medium',
    category: 'phishing',
    source_name: 'Security Intelligence',
    source_url: 'https://securityintel.example.com/phishing-unicode',
    cve_ids: [],
    industry: 'SaaS',
    confidence_score: 0.87,
    is_verified: true,
    tags: ['phishing', 'social-engineering', 'unicode', 'homograph'],
  },
  {
    title: 'High: Windows 0-Day Privilege Escalation Discovered',
    description: 'A new Windows privilege escalation vulnerability affecting Windows 10/11 has been discovered. Remote attackers can escalate from user to SYSTEM.',
    severity: 'high',
    category: 'vulnerability',
    source_name: 'NVD',
    source_url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-1234',
    cve_ids: ['CVE-2024-1234'],
    industry: 'Technology',
    confidence_score: 0.99,
    is_verified: true,
    tags: ['windows', 'privilege-escalation', 'kernel', 'critical'],
  },
  {
    title: 'Low: Suspicious DNS Activity in Ukraine',
    description: 'Increased suspicious DNS queries detected in Ukrainian infrastructure. Pattern matches previous APT29 infrastructure reconnaissance.',
    severity: 'low',
    category: 'suspicious-activity',
    source_name: 'Threat Intel Feed',
    source_url: 'https://threatfeed.example.com/ukraine-dns',
    cve_ids: [],
    industry: 'Government',
    confidence_score: 0.72,
    is_verified: false,
    tags: ['apt29', 'reconnaissance', 'dns', 'ukraine'],
  },
  {
    title: 'Medium: New Variant of Emotet Botnet Detected',
    description: 'Security researchers have identified a new variant of the Emotet botnet with enhanced C&C communication obfuscation and anti-analysis capabilities.',
    severity: 'medium',
    category: 'malware',
    source_name: 'Malwarebytes',
    source_url: 'https://malwarebytes.example.com/emotet-variant',
    cve_ids: [],
    industry: 'Multiple',
    confidence_score: 0.88,
    is_verified: true,
    tags: ['emotet', 'botnet', 'c2', 'obfuscation'],
  },
  {
    title: 'Critical: CISA Warns of Active Exploitation of Fortinet FortiOS Vulnerability',
    description: 'CISA has added CVE-2023-27997 to its Known Exploited Vulnerabilities catalog. Multiple threat actors actively exploiting Fortinet FortiOS VPN devices.',
    severity: 'critical',
    category: 'vulnerability',
    source_name: 'CISA KEV',
    source_url: 'https://www.cisa.gov/known-exploited-vulnerabilities',
    cve_ids: ['CVE-2023-27997'],
    industry: 'Technology',
    confidence_score: 0.99,
    is_verified: true,
    tags: ['fortinet', 'vpn', 'kev', 'exploitation'],
  },
  {
    title: 'High: Supply Chain Attack via Compromised NPM Package',
    description: 'Researchers discovered a malicious NPM package with 2.3M downloads that injects cryptocurrency mining code. Package was published by compromised maintainer.',
    severity: 'high',
    category: 'supply-chain',
    source_name: 'GitHub Security Advisory',
    source_url: 'https://github.com/advisories/npm-malicious',
    cve_ids: [],
    industry: 'Software Development',
    confidence_score: 0.96,
    is_verified: true,
    tags: ['supply-chain', 'npm', 'malware', 'cryptomining'],
  },
  {
    title: 'Medium: Increased DDoS Activity Against Government Websites',
    description: 'Multiple government websites across NATO countries experiencing coordinated DDoS attacks. Attack pattern matches Russian-affiliated threat group Killnet.',
    severity: 'medium',
    category: 'ddos',
    source_name: 'Cloudflare Threat Report',
    source_url: 'https://cloudflare.com/ddos-report',
    cve_ids: [],
    industry: 'Government',
    confidence_score: 0.85,
    is_verified: true,
    tags: ['ddos', 'killnet', 'nato', 'government'],
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
      console.error('❌ Error inserting signals:', error)
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
    console.log('   Visit: http://localhost:3006/admin/intel/signals')
    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

seedDatabase()
