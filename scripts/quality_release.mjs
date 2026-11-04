import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

const root = process.cwd()
const run = new Date().toISOString().replace(/[:.]/g, '-')
const dir = resolve('docs/quality/releases', run)
mkdirSync(dir, { recursive: true })

const hash = value => createHash('sha256').update(value).digest('hex')
const execute = (command, args, timeout = 900000) => spawnSync(command, args, {
  cwd: root,
  encoding: 'utf8',
  timeout,
  maxBuffer: 32 * 1024 * 1024,
})

const quality = execute('npm', ['run', 'quality:check'], 1800000)
const qualityLog = `${quality.stdout || ''}${quality.stderr || ''}${quality.error ? String(quality.error) : ''}`
const qualityLogPath = resolve(dir, 'quality-check.log')
writeFileSync(qualityLogPath, qualityLog)

const qualitySummaryPath = resolve('docs/quality/summary.json')
let qualitySummary = null
if (existsSync(qualitySummaryPath)) {
  try {
    qualitySummary = JSON.parse(readFileSync(qualitySummaryPath, 'utf8').replace(/^\uFEFF/, ''))
  } catch {
    qualitySummary = null
  }
}

const shaResult = execute('git', ['rev-parse', 'HEAD'], 30000)
const sha = (shaResult.stdout || '').trim()
if (shaResult.status !== 0 || !sha) {
  writeFileSync(resolve(dir, 'GATE-RESULT.json'), JSON.stringify({ decision: 'BLOCKED', reason: 'Unable to resolve repository SHA' }, null, 2))
  process.exitCode = 1
} else {
  const statusResult = execute('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], 30000)
  const records = (statusResult.stdout || '').split('\0').filter(Boolean)
  const generatedEvidence = path => /^docs\/quality\/(?:checks\.json|summary\.json|defects\.csv|QUALITY-REPORT\.md|release-latest\.json|releases\/)/.test(path)
  const sourceChanges = []
  for (let index = 0; index < records.length; index += 1) {
    const status = records[index].slice(0, 2)
    const path = records[index].slice(3)
    const oldPath = /[RC]/.test(status) ? records[++index] : undefined
    if (!generatedEvidence(path) && !(oldPath && generatedEvidence(oldPath))) {
      sourceChanges.push({ status, path, ...(oldPath ? { old_path: oldPath } : {}) })
    }
  }

  const approvedBy = (process.env.GPUSTACK_RELEASE_APPROVED_BY || '').trim()
  const approvalUrl = (process.env.GPUSTACK_RELEASE_APPROVAL_URL || '').trim()
  const approval = {
    approved_by: approvedBy || null,
    source_url: /^https:\/\//.test(approvalUrl) ? approvalUrl : null,
    valid: Boolean(approvedBy && /^https:\/\//.test(approvalUrl)),
  }

  const missing = []
  const failed = []
  if (quality.status !== 0 || qualitySummary?.quality_decision !== 'PASS') failed.push('quality-check')
  if (sourceChanges.length) missing.push('fixed-clean-release-revision')
  if (!approval.valid) missing.push('human-release-approval')

  const decision = failed.length || missing.length ? 'BLOCKED' : 'PASS'
  const evidence = {
    schema_version: 2,
    run,
    repository_sha: sha,
    environment: { node: process.version, platform: process.platform, cwd: root },
    quality_check: {
      command: 'npm run quality:check',
      exit_code: quality.status,
      summary: qualitySummary,
      log: qualityLogPath,
      log_sha256: hash(readFileSync(qualityLogPath)),
    },
    approval,
    source_changes: sourceChanges,
    failed_checks: failed,
    missing_release_evidence: missing,
    decision,
  }

  writeFileSync(resolve(dir, 'checks.json'), JSON.stringify(evidence, null, 2))
  writeFileSync(resolve(dir, 'GATE-RESULT.json'), JSON.stringify({
    decision,
    repository_sha: sha,
    failed_checks: failed,
    missing_release_evidence: missing,
    evidence: 'checks.json',
  }, null, 2))
  writeFileSync(resolve(dir, 'GATE-REPORT.md'), [
    `# Release decision: ${decision}`,
    '',
    `Repository SHA: \`${sha}\``,
    `Quality check exit: \`${quality.status}\``,
    `Source changes: \`${sourceChanges.length}\``,
    `Failed checks: \`${failed.join(', ') || 'none'}\``,
    `Missing release evidence: \`${missing.join(', ') || 'none'}\``,
    '',
    'A clean release revision and candidate-specific human approval are required for PASS.',
  ].join('\n'))
  writeFileSync(resolve('docs/quality/release-latest.json'), JSON.stringify({ directory: dir, decision }, null, 2))
  console.log(JSON.stringify({ decision, failed, missing, evidence: dir }, null, 2))
  process.exitCode = decision === 'PASS' ? 0 : 1
}
