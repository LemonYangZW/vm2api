import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const REDIRECT_URI = 'https://platform.claude.com/oauth/code/callback'
const CLAUDE_WEB = 'https://claude.ai'
const CAI_AUTHORIZE_URL = 'https://claude.com/cai/oauth/authorize'
const PLATFORM = 'https://platform.claude.com'
const ANTHROPIC_API = 'https://api.anthropic.com'
const TOKEN_URLS = [`${PLATFORM}/v1/oauth/token`, `${ANTHROPIC_API}/v1/oauth/token`]
const BOOTSTRAP_URL = `${ANTHROPIC_API}/api/claude_cli/bootstrap?entrypoint=claude-vscode&model=claude-opus-5`
const GROVE_PATHS = [
  `${ANTHROPIC_API}/api/oauth/account/settings`,
  `${PLATFORM}/api/oauth/account/settings`,
  `${ANTHROPIC_API}/api/oauth/settings`,
]
const UA_CHROME146 =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
const UA_CLI = 'claude-code/2.1.241'

const SCOPE_API = 'user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload'
const SCOPE_INFERENCE = 'user:inference'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function generateState() {
  return b64url(crypto.randomBytes(32))
}

function generateCodeVerifier() {
  return b64url(crypto.randomBytes(32))
}

function generateCodeChallenge(verifier) {
  return b64url(crypto.createHash('sha256').update(verifier).digest())
}

export function buildSetupTokenAuthorizeURL(state, codeChallenge) {
  const encodedRedirectURI = encodeURIComponent(REDIRECT_URI)
  const encodedScope = encodeURIComponent(SCOPE_INFERENCE).replace(/%20/g, '+')
  return `${CAI_AUTHORIZE_URL}?code=true&client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodedRedirectURI}&scope=${encodedScope}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`
}

export function extractOAuthCodeFromRedirect(raw) {
  const urls = []
  if (typeof raw === 'string') urls.push(raw)
  else if (raw && typeof raw === 'object') {
    if (raw.url) urls.push(String(raw.url))
    if (raw.redirect_uri) urls.push(String(raw.redirect_uri))
    if (Array.isArray(raw.history)) {
      for (const item of raw.history) urls.push(String(item?.url || item || ''))
    }
    const headers = raw.headers
    if (headers) {
      const loc = typeof headers.get === 'function' ? headers.get('location') : headers.location
      if (loc) urls.push(String(loc))
    }
    if (raw.text) urls.push(String(raw.text))
    if (typeof raw.body === 'string') urls.push(raw.body)
    else if (raw.body?.redirect_uri) urls.push(String(raw.body.redirect_uri))
  }
  for (const value of urls) {
    if (!value) continue
    try {
      const parsed = new URL(value, REDIRECT_URI)
      const code = parsed.searchParams.get('code')
      if (code) return { code, state: parsed.searchParams.get('state') || '' }
      if (parsed.hash) {
        const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
        const hashed = hash.get('code')
        if (hashed) return { code: hashed, state: hash.get('state') || '' }
      }
    } catch {
      const match = String(value).match(/[?&#]code=([^&#\s]+)/)
      if (match) return { code: decodeURIComponent(match[1]), state: '' }
    }
  }
  return null
}

function redact(s, keep = 12) {
  if (!s || typeof s !== 'string') return s
  if (s.length <= keep * 2) return s.slice(0, 4) + '…'
  return s.slice(0, keep) + '…' + s.slice(-8)
}

function isCloudflareChallenge(s) {
  const t = String(s || '')
  return (
    /just a moment/i.test(t) ||
    /cloudflare_challenge/i.test(t) ||
    /cf-mitigated/i.test(t) ||
    /cdn-cgi\/challenge/i.test(t) ||
    /<!doctype html/i.test(t)
  )
}

function isSessionStale(s) {
  const t = String(s || '')
  return /session_stale/i.test(t) || /not fresh enough/i.test(t) || /session is not fresh/i.test(t) || /不够新/.test(t)
}

/** Anthropic business errors must win over a later Go Cloudflare toast. */
export function classifyImportHelperOutput(stderr) {
  const t = String(stderr || '')
  if (isSessionStale(t)) return 'session_stale_relogin'
  if (/authorize_no_code/i.test(t)) return 'authorize_no_code'
  if (isCloudflareChallenge(t)) return 'cloudflare_challenge'
  return 'cookie_auth_failed'
}

export function publicImportError(raw) {
  const s = String(raw || 'session import failed')
  if (isSessionStale(s)) {
    return 'sessionKey 不够新，Anthropic 拒绝授权（Session is not fresh enough）。请重新登录 claude.ai 后立刻复制最新 sessionKey，不要用旧 cookie。'
  }
  if (/authorize_no_code/i.test(s)) {
    return '官方 CAI 授权页没有返回 code。sessionKey 可能未完成 claude.ai SSO，请重新登录 claude.ai 后立刻复制最新 sessionKey。'
  }
  if (isCloudflareChallenge(s)) {
    return 'Cloudflare 拦截了该槽位 SOCKS5 出口（Just a moment）。已用 Chrome TLS 重试，不再回落 node-fetch。请换住宅代理或稍后重试。'
  }
  const compact = s.replace(/\s+/g, ' ').trim()
  if (/<!doctype|<html[\s>]/i.test(compact)) {
    const status = (compact.match(/\b([45]\d\d)\b/) || [])[1] || ''
    return `导入失败${status ? `: ${status}` : ''} 上游返回了网页而不是 JSON`
  }
  return compact.slice(0, 240)
}

/** Panel import catch: keep Anthropic/CF codes; never leak a missing-helper ReferenceError. */
export function panelImportErrorPayload(err) {
  const raw = String(err?.message || err || '')
  const code = err?.code || classifyImportHelperOutput(raw)
  const stale = code === 'session_stale_relogin' || code === 'authorize_no_code'
  const cf = !stale && (code === 'cloudflare_challenge' || /just a moment|cloudflare|doctype html/i.test(raw))
  return {
    status: stale ? 400 : cf ? 502 : 500,
    error: {
      code: stale
        ? code === 'authorize_no_code'
          ? 'authorize_no_code'
          : 'session_stale_relogin'
        : cf
          ? 'cloudflare_challenge'
          : code || 'import_failed',
      message: publicImportError(raw),
    },
  }
}

async function fetchJson(url, options = {}, proxyUrl = null) {
  const [{ default: fetch }, { SocksProxyAgent }] = await Promise.all([
    import('node-fetch'),
    import('socks-proxy-agent'),
  ])
  const opts = {
    ...options,
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': UA_CHROME146,
      ...(options.headers || {}),
    },
  }
  const px = proxyUrl || _activeProxyUrl
  if (px) {
    opts.agent = new SocksProxyAgent(px)
  }
  const res = await fetch(url, opts)
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body, text, headers: res.headers, url: res.url }
}

/**
 * Step 1: resolve organization UUID via sessionKey cookie
 */
let _activeProxyUrl = null

async function getOrganizationUUID(sessionKey) {
  const supplied = String(process.env.ORG_UUID || '').trim()
  if (supplied) {
    console.log('[1/5] org supplied, skip GET organizations')
    return supplied
  }
  const url = `${CLAUDE_WEB}/api/organizations`
  console.log('[1/5] GET', url)
  const { ok, status, body } = await fetchJson(url, {
    method: 'GET',
    headers: {
      Cookie: `sessionKey=${sessionKey}`,
      Origin: CLAUDE_WEB,
      Referer: `${CLAUDE_WEB}/new`,
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': UA_CHROME146,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  })
  if (!ok) {
    const raw = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(publicImportError(`get organizations failed: ${status} ${raw}`))
  }
  if (!Array.isArray(body) || body.length === 0) {
    throw new Error(`no organizations found: ${JSON.stringify(body).slice(0, 300)}`)
  }
  // Prefer team org when present (sub2api behavior)
  const team = body.find((o) => o.raven_type === 'team')
  const org = team || body[0]
  console.log('[1/5] org uuid=', org.uuid, 'name=', org.name, 'raven_type=', org.raven_type ?? null)
  return org.uuid
}

/**
 * Step 2: request authorization code using sessionKey (no browser)
 */
async function getAuthorizationCode(sessionKey, orgUUID, scope, codeChallenge, state) {
  const url = `${PLATFORM}/v1/oauth/${orgUUID}/authorize`
  const reqBody = {
    response_type: 'code',
    client_id: CLIENT_ID,
    organization_uuid: orgUUID,
    redirect_uri: REDIRECT_URI,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }
  console.log('[2/5] POST platform authorize', url)
  const { ok, status, body } = await fetchJson(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: `sessionKey=${sessionKey}`,
      Origin: 'https://claude.com',
      Referer: `${CAI_AUTHORIZE_URL}?code=true`,
      'Cache-Control': 'no-cache',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': UA_CHROME146,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
    },
    body: JSON.stringify(reqBody),
  })
  if (!ok) {
    throw new Error(
      `authorize failed: ${status} ${typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body).slice(0, 400)}`,
    )
  }
  const redirectURI = body?.redirect_uri
  if (!redirectURI) {
    throw new Error(`no redirect_uri in authorize response: ${JSON.stringify(body).slice(0, 400)}`)
  }
  const parsed = new URL(redirectURI)
  const authCode = parsed.searchParams.get('code')
  const responseState = parsed.searchParams.get('state')
  if (!authCode) {
    throw new Error(`no code in redirect_uri: ${redirectURI}`)
  }
  const fullCode = responseState ? `${authCode}#${responseState}` : authCode
  console.log('[2/5] platform authorize code', redact(authCode, 8))
  return fullCode
}

/**
 * Step 3: exchange code for access/refresh tokens
 */
async function exchangeCodeForToken(fullCode, codeVerifier, { userAgent = UA_CHROME146 } = {}) {
  let authCode = fullCode
  let codeState = ''
  const idx = fullCode.indexOf('#')
  if (idx !== -1) {
    authCode = fullCode.slice(0, idx)
    codeState = fullCode.slice(idx + 1)
  }
  const reqBody = {
    code: authCode,
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  }
  if (codeState) reqBody.state = codeState

  let lastErr
  for (const tokenURL of TOKEN_URLS) {
    console.log('[3/5] POST chrome token', tokenURL)
    try {
      const { ok, status, body } = await fetchJson(tokenURL, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Origin: 'https://claude.com',
          Referer: `${CAI_AUTHORIZE_URL}?code=true`,
          'User-Agent': userAgent,
        },
        body: JSON.stringify(reqBody),
      })
      if (!ok) {
        lastErr = new Error(
          `token exchange failed @ ${tokenURL}: ${status} ${typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body).slice(0, 400)}`,
        )
        console.warn('[3/5]', lastErr.message)
        continue
      }
      if (!body?.access_token) {
        lastErr = new Error(`no access_token in response: ${JSON.stringify(body).slice(0, 400)}`)
        continue
      }
      console.log('[3/5] chrome token ok', redact(body.access_token))
      return body
    } catch (e) {
      lastErr = e
      console.warn('[3/5] error', e.message)
    }
  }
  throw lastErr || new Error('token exchange failed on all endpoints')
}

function cliHeaders(accessToken) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': UA_CLI,
    'anthropic-beta': 'oauth-2025-04-20',
    'anthropic-version': '2023-06-01',
  }
}

async function bootstrapCli(accessToken) {
  try {
    console.log('[4/5] GET bootstrap', BOOTSTRAP_URL.split('?')[0])
    const { ok, status, body } = await fetchJson(BOOTSTRAP_URL, {
      method: 'GET',
      headers: cliHeaders(accessToken),
    })
    if (!ok) {
      console.warn('[4/5] bootstrap failed (commit anyway)', status)
      return { ok: false, account: {} }
    }
    const account = body?.oauth_account || body?.account || {}
    console.log('[4/5] bootstrap ok')
    return { ok: true, account }
  } catch (e) {
    console.warn('[4/5] bootstrap failed (commit anyway)', e.message)
    return { ok: false, account: {} }
  }
}

async function enableGrove(accessToken) {
  for (const url of GROVE_PATHS) {
    try {
      console.log('[5/5] PATCH grove', url.split('://', 2)[1]?.split('/', 2)[0] || url)
      const { ok, status } = await fetchJson(url, {
        method: 'PATCH',
        headers: {
          ...cliHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grove_enabled: true }),
      })
      if (ok || status === 202 || status === 204) {
        console.log('[5/5] grove ok status=', status)
        return { ok: true, status }
      }
      console.warn('[5/5] grove warn', status)
    } catch (e) {
      console.warn('[5/5] grove warn', e.message)
    }
  }
  console.warn('[5/5] grove failed (commit anyway)')
  return { ok: false }
}

/**
 * DISABLED permanently.
 *
 * KIN must never call grant_type=refresh_token — that races the VM official
 * Claude Code which owns credentials.json rotation. Recovery path is:
 *   stored sessionKey → CookieAuth re-import only.
 */
export async function refreshOAuthToken() {
  const err = new Error(
    'KIN_REFRESH_TOKEN_DISABLED: gateway never calls grant_type=refresh_token. Re-import sessionKey or let VM Claude Code refresh.',
  )
  err.code = 'refresh_token_disabled'
  err.need_reimport = true
  throw err
}

function cookieAuthBinName() {
  return process.platform === 'win32' ? 'kin-cookie-auth.exe' : 'kin-cookie-auth'
}

function findCookieAuthBin() {
  const named = process.env.KIN_COOKIE_AUTH_BIN
  const candidates = [
    named,
    path.join(__dirname, '..', 'bin', cookieAuthBinName()),
    path.join(__dirname, '..', 'bin', 'kin-cookie-auth'),
    '/opt/kin-gateway/bin/kin-cookie-auth',
  ].filter(Boolean)
  return candidates.find((p) => fs.existsSync(p)) || null
}

function findCffiHelper() {
  const candidates = [
    path.join(__dirname, 'session-import-cffi.py'),
    path.join(__dirname, 'scripts', 'session-import-cffi.py'),
    path.join(__dirname, '..', 'scripts', 'session-import-cffi.py'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || null
}

function normalizeSocks(proxyUrl) {
  if (!proxyUrl) return null
  const s = String(proxyUrl)
  if (s.startsWith('socks5://') && !s.startsWith('socks5h://')) {
    return 'socks5h://' + s.slice('socks5://'.length)
  }
  return s
}

function spawnCookieHelper(command, args, sessionKey, { scope = 'full', proxyUrl = null } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        SESSION_KEY: sessionKey,
        SCOPE: scope,
        PROXY_URL: normalizeSocks(proxyUrl) || '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8')
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      const label = path.basename(command)
      if (stderr.trim()) console.warn(`[${label}]`, publicImportError(stderr))
      if (code !== 0) {
        const classified = classifyImportHelperOutput(stderr)
        const err = new Error(publicImportError(stderr.trim() || `${label} exited ${code}`))
        err.code = classified
        reject(err)
        return
      }
      try {
        const cred = JSON.parse(stdout.trim())
        if (!cred?.access_token) throw new Error(`${label} returned no access_token`)
        resolve(cred)
      } catch (e) {
        reject(e)
      }
    })
  })
}

function spawnGoImport(sessionKey, opts = {}) {
  const bin = findCookieAuthBin()
  if (!bin) {
    const err = new Error('kin-cookie-auth not found')
    err.code = 'no_cookie_auth_bin'
    return Promise.reject(err)
  }
  return spawnCookieHelper(bin, [], sessionKey, opts)
}

function spawnCffiImport(sessionKey, opts = {}) {
  const helper = findCffiHelper()
  if (!helper) {
    const err = new Error('session-import-cffi.py not found')
    err.code = 'no_cffi_helper'
    return Promise.reject(err)
  }
  return spawnCookieHelper('python3', [helper], sessionKey, opts)
}

export async function exchangeTokenViaCffi({
  code,
  codeVerifier,
  state = '',
  proxyUrl = null,
  redirectUri = null,
  tokenUrls = null,
} = {}) {
  const helper = findCffiHelper()
  if (!helper) {
    const err = new Error('session-import-cffi.py not found')
    err.code = 'no_cffi_helper'
    throw err
  }
  const px = normalizeSocks(proxyUrl)
  if (!px) {
    const err = new Error('slot SOCKS5 is required for token exchange')
    err.code = 'proxy_required'
    throw err
  }
  const urls = Array.isArray(tokenUrls) ? tokenUrls.map((u) => String(u || '').trim()).filter(Boolean) : []
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [helper], {
      env: {
        ...process.env,
        IMPORT_MODE: 'token_exchange',
        PROXY_URL: px,
        AUTH_CODE: String(code || ''),
        CODE_VERIFIER: String(codeVerifier || ''),
        OAUTH_STATE: String(state || ''),
        ...(redirectUri ? { OAUTH_REDIRECT_URI: String(redirectUri) } : {}),
        ...(urls.length ? { OAUTH_TOKEN_URLS: urls.join(',') } : {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8')
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (codeNum) => {
      if (stderr.trim()) console.warn('[cffi-token]', publicImportError(stderr))
      if (codeNum !== 0) {
        const err = new Error(publicImportError(stderr.trim() || `cffi token exited ${codeNum}`))
        err.code = isCloudflareChallenge(stderr) ? 'cloudflare_challenge' : 'token_exchange_failed'
        reject(err)
        return
      }
      try {
        const token = JSON.parse(stdout.trim())
        if (!token?.access_token) throw new Error('cffi token returned no access_token')
        resolve(token)
      } catch (e) {
        reject(e)
      }
    })
  })
}

async function sessionKeyToOAuthNode(sessionKey, { scope = 'full', proxyUrl = null } = {}) {
  _activeProxyUrl = proxyUrl || null
  const sk = String(sessionKey || '').trim()
  if (!sk.startsWith('sk-ant-sid')) {
    throw new Error(`expected sk-ant-sid* sessionKey, got: ${redact(sk)}`)
  }

  const oauthScope = scope === 'inference' ? SCOPE_INFERENCE : SCOPE_API
  const orgUUID = await getOrganizationUUID(sk)

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  const fullCode = await getAuthorizationCode(sk, orgUUID, oauthScope, codeChallenge, state)
  const tokenResp = await exchangeCodeForToken(fullCode, codeVerifier)
  const boot = scope === 'inference' ? { ok: false, account: {} } : await bootstrapCli(tokenResp.access_token)
  const grove = scope === 'inference' ? { ok: false } : await enableGrove(tokenResp.access_token)

  const expiresIn = Number(tokenResp.expires_in || 0)
  const now = Math.floor(Date.now() / 1000)
  const credential = {
    type: scope === 'inference' ? 'setup-token' : 'oauth',
    platform: 'anthropic',
    access_token: tokenResp.access_token,
    refresh_token: tokenResp.refresh_token || '',
    token_type: tokenResp.token_type || 'Bearer',
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    scope: tokenResp.scope || oauthScope,
    org_uuid: boot.account?.organization_uuid || boot.account?.org_uuid || tokenResp.organization?.uuid || orgUUID,
    account_uuid: boot.account?.account_uuid || boot.account?.uuid || tokenResp.account?.uuid || '',
    email_address: boot.account?.account_email || boot.account?.email || tokenResp.account?.email_address || '',
    source: 'sessionKey-portunex-node',
    bootstrap_ok: boot.ok === true,
    grove_ok: grove.ok === true,
    converted_at: new Date().toISOString(),
  }
  _activeProxyUrl = null
  return credential
}

/** Only missing helpers or a real CF challenge may try the next TLS stack. */
export function shouldTryNextImportHelper(code) {
  const c = String(code || '')
  return c === 'no_cookie_auth_bin' || c === 'no_cffi_helper' || c === 'cloudflare_challenge'
}

/**
 * Full conversion: sessionKey → OAuth credential object.
 * Portunex CookieAuth for both full OAuth and setup-token: orgs → JSON
 * authorize → token, all Chrome 146. bootstrap/grove stay Claude CLI UA and
 * only run for full OAuth. kin-cookie-auth is second fallback; node-fetch last.
 */
export async function sessionKeyToOAuth(
  sessionKey,
  { scope = 'full', proxyUrl = null, allowDirectFallback = true } = {},
) {
  const sk = String(sessionKey || '')
    .trim()
    .replace(/^["']|["']$/g, '')
  if (!sk.startsWith('sk-ant-sid')) {
    throw new Error(`expected sk-ant-sid* sessionKey, got: ${redact(sk)}`)
  }
  if (process.env.KIN_FAKE_SESSION_OAUTH === '1' || process.env.KIN_FAKE_SESSION_OAUTH === 'true') {
    const now = Math.floor(Date.now() / 1000)
    return {
      type: scope === 'inference' ? 'setup-token' : 'oauth',
      mode: scope === 'inference' ? 'setup-token' : 'oauth',
      access_token: 'sk-ant-oat01-FAKE-SIM',
      refresh_token: 'sk-ant-ort01-FAKE-SIM',
      expires_at: now + 8 * 3600,
      expiresAt: (now + 8 * 3600) * 1000,
      email: 'fake-oauth@kin.test',
      account_uuid: 'acct-fake-sim',
      org_uuid: 'org-fake-sim',
      source: 'KIN_FAKE_SESSION_OAUTH',
      scope,
    }
  }
  const px = normalizeSocks(proxyUrl)
  if (!px && !allowDirectFallback) {
    const err = new Error('slot SOCKS5 is required for sessionKey CookieAuth')
    err.code = 'proxy_required'
    throw err
  }
  const helpers = [spawnCffiImport, spawnGoImport]
  let lastErr
  for (const spawnHelper of helpers) {
    try {
      const cred = await spawnHelper(sk, { scope, proxyUrl: px })
      console.log('[import]', cred.source || 'cookie-auth', px ? 'socks5h' : 'direct', redact(cred.access_token || ''))
      return cred
    } catch (e) {
      lastErr = e
      console.warn('[import]', e.code || e.message, publicImportError(e.message))
      if (!shouldTryNextImportHelper(e.code)) break
    }
  }
  const helperMissing =
    lastErr?.code === 'no_cookie_auth_bin' ||
    lastErr?.code === 'no_cffi_helper' ||
    /curl_cffi not installed/i.test(lastErr?.message || '')
  if (helperMissing && allowDirectFallback) {
    console.warn('[import] cookie-auth helpers unavailable, falling back to node-fetch')
    return sessionKeyToOAuthNode(sk, { scope, proxyUrl: px })
  }
  const err = new Error(publicImportError(lastErr?.message || 'session import failed'))
  err.code = lastErr?.code || 'cookie_auth_failed'
  throw err
}

import { pathToFileURL } from 'node:url'

const isMain = !!(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
if (isMain) {
  const sessionKey = process.env.SESSION_KEY || process.argv[2]
  const scope = process.env.SCOPE || process.argv[3] || 'full'
  if (!sessionKey) {
    console.error('Usage: node session-to-oauth.mjs <sessionKey> [full|inference]')
    process.exit(1)
  }
  console.log('=== KIN sessionKey → OAuth converter ===')
  console.log('sessionKey:', redact(sessionKey))
  console.log('scope:', scope)
  try {
    const cred = await sessionKeyToOAuth(sessionKey, { scope, proxyUrl: process.env.PROXY_URL || null })
    const outDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'out')
    fs.mkdirSync(outDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fullPath = path.join(outDir, `oauth-${stamp}.json`)
    fs.writeFileSync(fullPath, JSON.stringify(cred, null, 2), { mode: 0o600 })
    const preview = {
      ...cred,
      access_token: redact(cred.access_token),
      refresh_token: redact(cred.refresh_token),
    }
    console.log('\n=== RESULT (redacted) ===')
    console.log(JSON.stringify(preview, null, 2))
    console.log('\nFull credential saved to:', fullPath)
    fs.writeFileSync(path.join(outDir, 'oauth-latest.json'), JSON.stringify(cred, null, 2), { mode: 0o600 })
    fs.writeFileSync(path.join(outDir, 'oauth-latest.redacted.json'), JSON.stringify(preview, null, 2))
  } catch (e) {
    console.error('\nCONVERSION FAILED:', e.message)
    process.exit(2)
  }
}
