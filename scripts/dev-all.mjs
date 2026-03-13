import { spawn } from 'node:child_process'

const processes = []
const DEV_PORT = '8788'
const NPM_BIN = process.env.NPM_BIN || '/opt/homebrew/bin/npm'
const NPX_BIN = process.env.NPX_BIN || '/opt/homebrew/bin/npx'

function run(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

function start(command, options = {}) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  })

  processes.push(child)
  child.on('exit', (code, signal) => {
    if (signal || code === 0) return
    console.error(`[wkustation] ${command} exited with code ${code}`)
    shutdown(code)
  })

  return child
}

function shutdown(exitCode = 0) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }
  process.exit(exitCode)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

async function main() {
  console.log('[wkustation] local D1 migration apply')
  await run(`"${NPX_BIN}" wrangler d1 migrations apply wkustation-db --local`, {
    env: { CI: '1' },
  })

  console.log('[wkustation] local D1 seed apply')
  await run(`"${NPX_BIN}" wrangler d1 execute wkustation-db --local --file=./migrations/0002_seed.sql`)

  console.log('[wkustation] start vite build watch')
  start(`"${NPM_BIN}" run build:watch`)

  console.log('[wkustation] initial build')
  await run(`"${NPM_BIN}" run build`)

  console.log('[wkustation] start pages dev server')
  console.log(`[wkustation] app url: http://127.0.0.1:${DEV_PORT}`)
  console.log(`[wkustation] admin url: http://127.0.0.1:${DEV_PORT}/#admin`)
  start(`"${NPX_BIN}" wrangler pages dev dist --local --port ${DEV_PORT}`)
}

main().catch((error) => {
  console.error('[wkustation] dev bootstrap failed')
  console.error(error.message)
  shutdown(1)
})
