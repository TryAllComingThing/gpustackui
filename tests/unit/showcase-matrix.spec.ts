import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { componentMatrix } from '../../showcase/component-matrix'

function collectVueSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return collectVueSources(path)
    return entry.name.endsWith('.vue') ? [readFileSync(path, 'utf8')] : []
  })
}

describe('showcase component matrix', () => {
  it('binds every row to a fixture test id that exists in a Vue fixture', () => {
    const fixtureSource = collectVueSources(join(process.cwd(), 'showcase')).join('\n')
    const testIds = new Set([...fixtureSource.matchAll(/data-testid="([^"]+)"/g)].map((match) => match[1]))
    for (const row of componentMatrix) {
      expect(testIds.has(row.fixtureTestId), `${row.id}: ${row.fixtureTestId}`).toBe(true)
    }
  })

  it('does not register duplicate component ids', () => {
    expect(new Set(componentMatrix.map((row) => row.id)).size).toBe(componentMatrix.length)
  })
})
