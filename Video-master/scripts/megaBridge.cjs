#!/usr/bin/env node

const path = require('path')
const mega = require('megajs')

function parseArgs(argv) {
  const parsed = {}
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i]
    if (!raw || !raw.startsWith('--')) continue

    const key = raw.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      parsed[key] = 'true'
      continue
    }

    parsed[key] = next
    i += 1
  }

  return parsed
}

function toBoolean(value, fallback = false) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return fallback
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

function normalizeMimeFromName(filename = '') {
  const lower = String(filename || '').toLowerCase()
  if (lower.endsWith('.mp4')) return 'video/mp4'
  if (lower.endsWith('.mov')) return 'video/quicktime'
  if (lower.endsWith('.mkv')) return 'video/x-matroska'
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.avi')) return 'video/x-msvideo'
  if (lower.endsWith('.m4v')) return 'video/x-m4v'
  return 'application/octet-stream'
}

function requestFileDirectUrl(file, forceHttps = true) {
  return new Promise((resolve, reject) => {
    if (!file || !file.api || typeof file.api.request !== 'function' || !file.nodeId) {
      resolve('')
      return
    }

    file.api.request({
      a: 'g',
      g: 1,
      n: String(file.nodeId),
      ssl: forceHttps ? 2 : 0,
    }, (error, response) => {
      if (error) {
        reject(error)
        return
      }

      resolve(String(response?.g || '').trim())
    })
  })
}

function pickNodeByPath(storage, rootPath = '/') {
  const normalized = String(rootPath || '/').trim() || '/'
  if (normalized === '/' || normalized === '.') {
    return storage.root
  }

  const segments = normalized
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => String(part || '').trim())
    .filter(Boolean)

  if (!segments.length) {
    return storage.root
  }

  let current = storage.root
  for (const segment of segments) {
    if (!current || !current.children) return null
    const next = current.children.find((entry) => String(entry?.name || '') === segment)
    if (!next) return null
    current = next
  }

  return current
}

function flattenFiles(rootNode, recursive = false) {
  if (!rootNode) return []
  const queue = [rootNode]
  const visited = []

  while (queue.length) {
    const node = queue.shift()
    if (!node) continue

    if (node.directory) {
      const children = Array.isArray(node.children) ? node.children : []
      for (const child of children) {
        if (child.directory && recursive) {
          queue.push(child)
          continue
        }
        if (!child.directory) {
          visited.push(child)
        }
      }
      continue
    }

    visited.push(node)
  }

  return visited
}

function toMappedFile(file, index = 0, includeLinks = true) {
  const nodeId = String(file?.nodeId || file?.h || `mega_${index}`)
  const name = String(file?.name || `video_${index}.mp4`)
  const sizeBytes = Number(file?.size || 0)

  const base = {
    id: nodeId,
    nodeId,
    providerId: 'mega',
    name,
    title: String(path.parse(name).name || 'Untitled video'),
    description: 'Fetched from Mega',
    size: sizeBytes > 0 ? Math.round((sizeBytes / (1024 * 1024)) * 100) / 100 : 0,
    sizeBytes,
    mimeType: normalizeMimeFromName(name),
    playbackUrl: '',
  }

  if (!includeLinks || typeof file?.link !== 'function') {
    return Promise.resolve(base)
  }

  const publicLinkPromise = file
    .link({ noKey: false })
    .then((value) => String(value || '').trim())
    .catch(() => '')

  const directLinkPromise = requestFileDirectUrl(file, true)
    .then((value) => String(value || '').trim())
    .catch(() => '')

  return Promise.all([publicLinkPromise, directLinkPromise])
    .then(([publicLink, directLink]) => {
      const playbackUrl = directLink || publicLink
      return {
        ...base,
        playbackUrl,
        streamUrl: directLink,
        downloadUrl: directLink,
        publicLink,
        url: playbackUrl,
      }
    })
    .catch(() => base)
}

async function createStorageSession({ email, password, secondFactorCode }) {
  const options = {
    email,
    password,
    autoload: true,
    autologin: false,
    keepalive: false,
  }

  if (String(secondFactorCode || '').trim()) {
    options.secondFactorCode = String(secondFactorCode).trim()
  }

  const storage = new mega.Storage(options)
  await storage.login()
  return storage
}

;(async () => {
  const args = parseArgs(process.argv)
  const mode = String(args.mode || 'list').trim().toLowerCase() || 'list'

  const email = String(args.email || '').trim()
  const password = String(args.password || '').trim()
  const secondFactorCode = String(args.secondFactorCode || '').trim()

  if (!email || !password) {
    throw new Error('Missing required Mega credentials: email/password')
  }

  const includeLinks = toBoolean(args.includeLinks, true)
  const recursive = toBoolean(args.recursive, false)
  const rootPath = String(args.rootPath || '/').trim() || '/'
  const maxFilesRaw = Number(args.maxFiles || 80)
  const maxFiles = Number.isFinite(maxFilesRaw) && maxFilesRaw > 0
    ? Math.min(Math.floor(maxFilesRaw), 500)
    : 80

  const storage = await createStorageSession({ email, password, secondFactorCode })

  try {
    if (mode === 'list') {
      const rootNode = pickNodeByPath(storage, rootPath)
      if (!rootNode) {
        throw new Error(`Mega path not found: ${rootPath}`)
      }

      const files = flattenFiles(rootNode, recursive)
        .filter((file) => !file?.directory)
        .slice(0, maxFiles)

      const mapped = await Promise.all(
        files.map((file, index) => toMappedFile(file, index, includeLinks)),
      )

      process.stdout.write(JSON.stringify({
        provider: 'mega',
        mode: 'list',
        rootPath,
        recursive,
        files: mapped,
      }))
      return
    }

    if (mode === 'download') {
      const nodeId = String(args.nodeId || '').trim()
      if (!nodeId) {
        throw new Error('Missing required nodeId for download mode')
      }

      const file = storage.files?.[nodeId]
      if (!file || file.directory) {
        throw new Error(`Mega file not found for nodeId: ${nodeId}`)
      }

      const [publicLink, directLink] = await Promise.all([
        (typeof file.link === 'function'
          ? file.link({ noKey: false }).then((value) => String(value || '').trim()).catch(() => '')
          : Promise.resolve('')),
        requestFileDirectUrl(file, true).then((value) => String(value || '').trim()).catch(() => ''),
      ])

      process.stdout.write(JSON.stringify({
        provider: 'mega',
        mode: 'download',
        nodeId,
        playbackUrl: directLink || publicLink,
        streamUrl: directLink,
        downloadUrl: directLink,
        publicLink,
      }))
      return
    }

    throw new Error(`Unsupported mode: ${mode}`)
  } finally {
    try {
      await storage.close()
    } catch (error) {
      // ignore close errors
    }
  }
})().catch((error) => {
  process.stderr.write(JSON.stringify({
    error: String(error?.message || error || 'Unknown Mega bridge error'),
  }))
  process.exit(1)
})

