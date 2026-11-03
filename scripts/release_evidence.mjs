import { readFileSync, existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { createHash } from 'node:crypto'
export const digest = value => createHash('sha256').update(value).digest('hex')
function local(root, path) {
 if (typeof path !== 'string' || !path) throw new Error('Missing artifact path')
 const base = resolve(root); const target = resolve(base, path)
 if (!target.startsWith(base + sep)) throw new Error('Artifact path escapes evidence root')
 return target
}
export function inspectArtifactRecord(root, sha, record) {
 try {
  if (record.repository_sha !== sha || record.status !== 'VERIFIED' || !record.verified_by || !/^https:\/\//.test(record.source_url || '')) throw new Error('Missing independent verification metadata or wrong source SHA')
  const file = local(root, record.artifact_path)
  if (!existsSync(file) || !/^[a-f0-9]{64}$/.test(record.artifact_sha256 || '') || digest(readFileSync(file)) !== record.artifact_sha256) throw new Error('Referenced evidence is missing or checksum mismatches')
  return { valid: true, artifact: file, reason: 'Record integrity verified; identity and approval authority remain external responsibilities' }
 } catch (error) { return { valid: false, reason: error.message } }
}
export function inspectFormalState(root, sha, path) {
 try {
  const state = JSON.parse(readFileSync(local(root, path), 'utf8').replace(/^\uFEFF/, ''))
  if (state.stage !== 'F6' || state.status !== 'PASS' || state.repository_sha !== sha) throw new Error('State is not F6 PASS bound to candidate SHA')
  const gateFile = local(root, state.gate || state.gate_result)
  const approvalFile = local(root, state.approval)
  if (digest(readFileSync(gateFile)) !== state.gate_sha256 || digest(readFileSync(approvalFile)) !== state.approval_sha256) throw new Error('State reference checksum mismatch')
  const gate = JSON.parse(readFileSync(gateFile, 'utf8').replace(/^\uFEFF/, ''))
  const approval = JSON.parse(readFileSync(approvalFile, 'utf8').replace(/^\uFEFF/, ''))
  if (gate.stage !== 'F6' || gate.status !== 'PASS' || gate.repository_sha !== sha || !Array.isArray(gate.checks) || !gate.checks.length || !Array.isArray(gate.source_changes) || gate.source_changes.length) throw new Error('Invalid verification gate')
  for (const check of gate.checks) {
   if (check.exit_code !== 0 || check.status !== 'PASS' || digest(readFileSync(local(root, check.evidence))) !== check.sha256) throw new Error('Failed or tampered verification evidence')
  }
  if (approval.stage !== 'F6' || approval.decision !== 'APPROVED' || approval.repository_sha !== sha || !approval.approved_by || !/^https:\/\//.test(approval.source_url || '')) throw new Error('Missing candidate-specific human approval')
  return { valid: true, reason: 'Gate/state/approval references agree' }
 } catch (error) { return { valid: false, reason: error.message } }
}
export function classifyFailure(id, log) {
 if (id === 'strict-browser-visual' && /snapshot doesn't exist/.test(log) && !/browserType.launch|Test timeout/.test(log)) return { kind: 'VERIFICATION_GAP', severity: null, reason: 'Applicable visual baseline missing; visual correctness unverified' }
 return { kind: 'UNTRIAGED_CHECK_FAILURE', severity: null, reason: 'Required check failed; product severity requires triage' }
}

export function sourceChanges(porcelain) {
 const records = porcelain.split('\0').filter(Boolean); const changes = []
 const generated = path => /(^|\/)__pycache__\//.test(path) || /^docs\/fusion\/F6\/evidence\/(human-approval|protected-ci-policy|rollback-rehearsal)\.json$/.test(path) || /^(artifacts\/|test-results\/|dist(?:-showcase|-consumer-saas)?\/|playwright-report(?:-f4-strict)?\/)/.test(path) || /^docs\/fusion\/F6\/(F6-(STATE\.json|RELEASE-DECISION\.md|ASSET-INVENTORY\.json|DEFECTS\.json|BLOCKERS\.json)|VISUAL-MATRIX\.md|VISUAL-DIFF\.md|ACCESSIBILITY\.md)$/.test(path)
 for (let i=0; i<records.length; i++) {
  const status = records[i].slice(0,2); const path = records[i].slice(3)
  const oldPath = /[RC]/.test(status) ? records[++i] : undefined
  if (!generated(path) || (oldPath && !generated(oldPath))) changes.push({ status, path, ...(oldPath ? { old_path: oldPath } : {}) })
 }
 return changes
}
