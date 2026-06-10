#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createFileResourceSourceContinuityAcceptedVisibility
} from '../src/index.js'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const args = parseArgs(process.argv.slice(2))
const priorBytesVisibility = await readJson(resolve(repoRoot, args.priorBytesVisibility))
const layerAcceptanceAppend = await readJson(resolve(repoRoot, args.layerAcceptanceAppend))
const causalAcceptanceObservation = await readJson(resolve(repoRoot, args.causalAcceptanceObservation))
const visibility = createFileResourceSourceContinuityAcceptedVisibility({
  priorBytesVisibility,
  layerAcceptanceAppend,
  causalAcceptanceObservation,
  observedAt: args.observedAt ?? new Date().toISOString()
})
const output = resolve(
  repoRoot,
  args.output ??
    'proof-artifacts/file-resource-source-continuity-accepted-visibility-20260610T083000Z/visibility.json'
)
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(visibility, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify({
  commandStatus: 'bytes_file_resource_source_continuity_accepted_visibility_emitted',
  output,
  visibilityRef: visibility.visibilityRef,
  visibilityHash: visibility.visibilityHash,
  visibilityStatus: visibility.visibilityStatus,
  issues: visibility.issues,
  nonClaims: visibility.nonClaims
}, null, 2)}\n`)

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]
    if (arg === '--prior-bytes-visibility') {
      parsed.priorBytesVisibility = next
      index += 1
    } else if (arg === '--layer-acceptance-append') {
      parsed.layerAcceptanceAppend = next
      index += 1
    } else if (arg === '--causal-acceptance-observation') {
      parsed.causalAcceptanceObservation = next
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
  for (const field of ['priorBytesVisibility', 'layerAcceptanceAppend', 'causalAcceptanceObservation']) {
    if (!parsed[field]) throw new Error(`--${field.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} is required`)
  }
  return parsed
}
