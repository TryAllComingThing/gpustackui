#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(argument('--root', process.cwd()))
const query = argument('--query', '').trim()
const searchScopes = ['src/components', 'src/composables', 'src/utils', 'src/services', 'src/api', 'src/modules']
const sourceExtensions = new Set(['.vue', '.ts', '.js', '.mjs'])

function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function filesUnder(path) {
  if (!existsSync(path)) return []
  if (statSync(path).isFile()) return sourceExtensions.has(path.slice(path.lastIndexOf('.'))) ? [path] : []
  const files = []
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || entry.name === 'node_modules') continue
    const absolute = join(path, entry.name)
    if (entry.isDirectory()) files.push(...filesUnder(absolute))
    else if (entry.isFile() && sourceExtensions.has(absolute.slice(absolute.lastIndexOf('.')))) files.push(absolute)
  }
  return files
}

function search(term) {
  const normalized = term.toLowerCase()
  const results = []
  for (const scope of searchScopes) {
    for (const file of filesUnder(resolve(root, scope))) {
      const path = relative(root, file).split('\\').join('/')
      const lines = readFileSync(file, 'utf8').split('\n')
      const matches = []
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(normalized)) matches.push({ line: index + 1, text: line.trim().slice(0, 180) })
      })
      if (path.toLowerCase().includes(normalized) && matches.length === 0) matches.push({ line: 1, text: '(path match)' })
      if (matches.length) results.push({ path, matches: matches.slice(0, 5) })
    }
  }
  return results.sort((left, right) => left.path.localeCompare(right.path))
}

if (!query) {
  console.error('Usage: npm run reuse:search -- <capability>')
  process.exit(1)
}

const results = search(query)
if (!results.length) {
  console.log(`No matches for "${query}" in reusable source scopes.`)
  process.exit(0)
}

console.log(`${results.length} candidate file(s) for "${query}":`)
for (const result of results) {
  console.log(`\n${result.path}`)
  for (const match of result.matches) console.log(`  ${match.line}: ${match.text}`)
}
