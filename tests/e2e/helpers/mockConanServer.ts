import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

import { FIXTURE_REF, FIXTURE_REVISION, buildConanExportTgz } from './conanFixture'

export type MockConanServer = {
  url: string
  close: () => Promise<void>
}

const TGZ = buildConanExportTgz()
const REF_URL_PATH = FIXTURE_REF.replace('@', '/')

function json(res: ServerResponse, body: unknown) {
  res.statusCode = 200
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

function notFound(res: ServerResponse) {
  res.statusCode = 404
  res.end()
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? ''

  if (url.endsWith('/v2/conans/search?q=*')) {
    return json(res, { results: [FIXTURE_REF] })
  }

  if (url.endsWith(`/v2/conans/${REF_URL_PATH}/revisions`)) {
    return json(res, { revisions: [{ revision: FIXTURE_REVISION, time: '2026-05-23T00:00:00Z' }] })
  }

  if (url.endsWith(`/v2/conans/${REF_URL_PATH}/revisions/${FIXTURE_REVISION}/files/conan_export.tgz`)) {
    res.statusCode = 200
    res.setHeader('content-type', 'application/octet-stream')
    res.end(TGZ)
    return
  }

  notFound(res)
}

export async function startMockConanServer(repoName = 'mock-repo'): Promise<MockConanServer> {
  const server = createServer(handle)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const addr = server.address() as AddressInfo
  const url = `http://127.0.0.1:${addr.port}/${repoName}`
  return {
    url,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      })
  }
}
