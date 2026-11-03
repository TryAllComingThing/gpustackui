import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, cpSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { inspectArtifactRecord, inspectFormalState, classifyFailure, sourceChanges } from './release_evidence.mjs'
const root = process.cwd()
const run = new Date().toISOString().replace(/[:.]/g, '-')
const dir = resolve('artifacts/quality-release', run)
mkdirSync(dir, { recursive: true })
const hash = data => createHash('sha256').update(data).digest('hex')
const execute = command => spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', timeout: command.startsWith('pnpm test:strict') ? 1800000 : 900000, maxBuffer: 32 * 1024 * 1024 })
const checks = [
 ['release-policy', 'node --test tests/policy/release-evidence.policy.mjs'],
 ['consumer-boundary', 'node scripts/check_consumer_boundary.mjs'],
 ['contracts', 'python scripts/validate_contracts.py'],
 ['skills', 'python scripts/validate_skills.py'],
 ['f2-tokens', 'python scripts/validate_f2_tokens.py'],
 ['f3-tokens', 'python scripts/validate_f3_tokens.py'],
 ['structure', 'python quality/check_structure.py'],
 ['lint', 'pnpm lint'], ['typecheck', 'pnpm typecheck'],
 ['showcase-typecheck', 'pnpm typecheck:showcase'],
 ['consumer-typecheck', 'pnpm typecheck:consumer'],
 ['unit', 'pnpm test:unit'], ['production-build', 'pnpm build'],
 ['showcase-build', 'pnpm build:showcase'], ['consumer-build', 'pnpm build:consumer'],
 ['isolation', 'python quality/check_showcase_isolation.py'],
 ['security', 'pnpm audit --registry=https://registry.npmjs.org --json'],
 ['sensitive-information', 'python scripts/f6_sensitive_scan.py'],
 ['local-recovery-rehearsal', 'python scripts/f6_rollback_rehearsal.py'],
 ['production-e2e', 'pnpm test:e2e'], ['showcase-e2e', 'pnpm test:showcase'],
 ['consumer-e2e', 'pnpm test:consumer'],
 ['accessibility', 'pnpm test:accessibility'],
 ['zoom-motion', 'pnpm test:acceptance'],
 ['strict-browser-visual', 'pnpm test:strict --update-snapshots=none'],
]
const records = []
for (const [id, command] of checks) {
 const start = Date.now(); const r = execute(command)
 const log = resolve(dir, `${id}.log`)
 writeFileSync(log, (r.stdout || '') + (r.stderr || '') + (r.error ? String(r.error) : ''))
 if (['production-e2e', 'showcase-e2e', 'accessibility', 'strict-browser-visual'].includes(id) && existsSync('test-results')) cpSync('test-results', resolve(dir, `${id}-artifacts`), { recursive: true })
 if (id === 'consumer-e2e' && existsSync('artifacts/consumer-e2e')) cpSync('artifacts/consumer-e2e', resolve(dir, `${id}-artifacts`), { recursive: true })
 if (id === 'zoom-motion' && existsSync('artifacts/f6/acceptance-report')) cpSync('artifacts/f6/acceptance-report', resolve(dir, 'zoom-motion-report'), { recursive: true })
 if (id === 'strict-browser-visual' && existsSync('playwright-report-f4-strict')) cpSync('playwright-report-f4-strict', resolve(dir, 'strict-html-report'), { recursive: true })
 records.push({ id, required: true, command, exit_code: r.status, duration_ms: Date.now()-start, status: r.status === 0 ? 'PASS' : 'BLOCKED', evidence: log, sha256: hash(readFileSync(log)) })
 console.log(`${id}: ${r.status === 0 ? 'PASS' : 'BLOCKED'} exit=${r.status}`)
}
const sha = execute('git rev-parse HEAD').stdout.trim()
// Local verification never authorizes deployment or manufactures a gate/state PASS.
const requirements = ['human-approval', 'protected-ci-policy', 'rollback-rehearsal']
const externalEvidence = requirements.map(id => {
 const path = resolve('docs/fusion/F6/evidence', `${id}.json`)
 if (!existsSync(path)) return { id, valid: false, reason: 'Missing external evidence', path }
 try {
  const record = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  // Imported records require an explicit independently verified state and exact source binding.
  return { id, path, ...inspectArtifactRecord(root, sha, record) }
 } catch (error) { return { id, path, valid: false, reason: String(error) } }
})
const missing = externalEvidence.filter(r => !r.valid).map(r => r.id)
const failed = records.filter(r => r.status !== 'PASS' || !existsSync(r.evidence) || hash(readFileSync(r.evidence)) !== r.sha256)
const workingTree = execute('git status --short').stdout
const candidateChanges = sourceChanges(execute('git status --porcelain=v1 -z --untracked-files=all').stdout)
if (candidateChanges.length) missing.push('fixed-clean-release-commit')
// Even successful local checks need the repository's authoritative gate/state chain.
const formalState = inspectFormalState(root, sha, 'docs/fusion/F6/F6-STATE.json')
if (!formalState.valid) missing.push('formal-gate-state-chain')
const decision = failed.length || missing.length ? 'BLOCKED' : 'PASS'
const verificationStatus = failed.length ? 'BLOCKED' : 'PASS'
writeFileSync(resolve(dir, 'F6-VERIFICATION-GATE.json'), JSON.stringify({ stage: 'F6', status: verificationStatus, repository_sha: sha, scope: 'local verification only', source_changes: candidateChanges, checks: records }, null, 2))
const files = []
function index(path) { if (!existsSync(path)) return; for (const ent of readdirSync(path, { withFileTypes: true })) { const p = resolve(path, ent.name); if (ent.isDirectory()) index(p); else files.push({ path: p, sha256: hash(readFileSync(p)) }) } }
index(dir); index(resolve('artifacts/consumer-e2e')); index(resolve('dist-consumer-saas'))
const summary = { schema_version: 1, run, repository_sha: sha, environment: { node: process.version, platform: process.platform, cwd: root }, consumption: 'template-source', verification_status: verificationStatus, formal_state: formalState, decision, external_evidence: externalEvidence, failed_checks: records.filter(r=>r.status !== 'PASS').map(r=>r.id), missing_release_evidence: missing, checks: records }
summary.working_tree = workingTree
summary.source_changes = candidateChanges
summary.validated_scope = 'current working tree; not a clean release commit'
writeFileSync(resolve(dir, 'checks.json'), JSON.stringify(summary,null,2))
writeFileSync(resolve(dir, 'defects.json'), JSON.stringify([
 ...records.filter(r => r.status !== 'PASS').map(r => ({ id: r.id, ...classifyFailure(r.id, readFileSync(r.evidence, 'utf8')), status: 'OPEN', evidence: r.evidence })),
 ...missing.map(id => ({ id, kind: 'RELEASE_PREREQUISITE', severity: null, status: 'PENDING', reason: 'Required release evidence or candidate binding missing' })),
],null,2))
writeFileSync(resolve(dir, 'GATE-RESULT.json'), JSON.stringify({ decision, local_verification_only: true, failed_checks: summary.failed_checks, missing_release_evidence: missing, evidence: 'checks.json' },null,2))
writeFileSync(resolve(dir, 'evidence-index.json'), JSON.stringify(files,null,2))
writeFileSync(resolve(dir, 'GATE-REPORT.md'), `# Release decision: ${decision}\n\nConsumption: template-source, not package consumption.\n\nFailed checks: ${summary.failed_checks.join(', ') || 'none'}\n\nMissing release evidence: ${missing.join(', ')}. No local release authorization.\n`)
writeFileSync(resolve(dir, 'RELEASE-CHECKLIST.md'), `# Release checklist\n\nRequired checks: checks.json\n\nMissing approval, CI isolation policy and rollback evidence: BLOCKED.\n\nNo deployment was attempted.\n`)
writeFileSync(resolve('artifacts/quality-release/latest.json'), JSON.stringify({ directory: dir, decision },null,2))
process.exitCode = decision === 'PASS' ? 0 : 1
