#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createStudioFileResourceLiftVisibilityEvidence
} from '../src/index.js'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = parseArgs(process.argv.slice(2))
const studioCandidate = JSON.parse(await readFile(resolve(repoRoot, args.studioCandidate), 'utf8'))
const evidence = createStudioFileResourceLiftVisibilityEvidence({
  studioCandidate,
  observedAt: args.observedAt ?? new Date().toISOString()
})
const output = resolve(repoRoot, args.output ?? 'proof-artifacts/studio-file-resource-lift-visibility-latest/evidence.json')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({
  commandStatus: 'bytes_studio_file_resource_lift_visibility_evidence_emitted',
  output,
  evidenceRef: evidence.evidenceRef,
  evidenceHash: evidence.evidenceHash,
  pointerRef: evidence.pointerRef,
  visibilityStatus: evidence.visibilityStatus
}, null, 2)}\n`)

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]
    if (arg === '--studio-candidate') {
      parsed.studioCandidate = next
      index += 1
    } else if (arg === '--observed-at') {
      parsed.observedAt = next
      index += 1
    } else if (arg === '--output') {
      parsed.output = next
      index += 1
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  if (!parsed.studioCandidate) throw new Error('--studio-candidate is required')
  return parsed
}
