import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path, { extname } from 'node:path'

export const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
const prototypePath = '/planning/admin-foundation/prototypes/admin-foundation/index.html'

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
])

function safePathname(requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1')
  if (url.pathname === '/') return prototypePath
  const decoded = decodeURIComponent(url.pathname)
  const resolved = path.resolve(repositoryRoot, `.${decoded}`)
  if (resolved !== repositoryRoot && !resolved.startsWith(`${repositoryRoot}${path.sep}`)) return null
  return resolved
}

export function createPrototypeServer() {
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' })
      response.end('Method Not Allowed')
      return
    }

    const pathname = safePathname(request.url ?? '/')
    if (!pathname) {
      response.writeHead(400)
      response.end('Bad Request')
      return
    }

    try {
      const info = await stat(pathname)
      if (!info.isFile()) throw new Error('Not a file')
      response.writeHead(200, {
        'Content-Type': contentTypes.get(extname(pathname)) ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      if (request.method === 'HEAD') {
        response.end()
        return
      }
      createReadStream(pathname).pipe(response)
    } catch {
      response.writeHead(404)
      response.end('Not Found')
    }
  })
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PROTOTYPE_PORT ?? 4178)
  const server = createPrototypeServer()
  server.listen(port, '127.0.0.1', () => {
    console.log(`Prototype: http://127.0.0.1:${port}${prototypePath}`)
  })
}
