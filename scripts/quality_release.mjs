import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const execute = (command, args, timeout = 900000) => spawnSync(command, args, {
  cwd: root,
  encoding: 'utf8',
  timeout,
  maxBuffer: 32 * 1024 * 1024,
})

const quality = execute('npm', ['run', 'quality:check'], 1800000)

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
  console.log(JSON.stringify({ decision: 'BLOCKED', reason: 'Unable to resolve repository SHA' }, null, 2))
  process.exitCode = 1
} else {
  const statusResult = execute('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], 30000)
  const records = (statusResult.stdout || '').split('\0').filter(Boolean)
  const generatedEvidence = path => /^docs\/quality\/(?:checks\.json|summary\.json|QUALITY-REPORT\.md)$/.test(path)
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
  console.log(JSON.stringify({
    decision,
    repository_sha: sha,
    quality_check: {
      command: 'npm run quality:check',
      exit_code: quality.status,
      summary: qualitySummary,
    },
    approval,
    source_changes: sourceChanges,
    failed_checks: failed,
    missing_release_evidence: missing,
  }, null, 2))
  process.exitCode = decision === 'PASS' ? 0 : 1
}
