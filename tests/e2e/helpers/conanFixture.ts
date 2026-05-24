import { gzipSync } from 'node:zlib'

const TAR_BLOCK = 512

function writeTarHeader(name: string, size: number): Buffer {
  const header = Buffer.alloc(TAR_BLOCK)
  header.write(name.slice(0, 100), 0, 100, 'utf8')
  header.write('0000644\0', 100, 8, 'utf8')
  header.write('0000000\0', 108, 8, 'utf8')
  header.write('0000000\0', 116, 8, 'utf8')
  header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8')
  header.write('00000000000\0', 136, 12, 'utf8')
  header.fill(0x20, 148, 156)
  header.write('0', 156, 1, 'utf8')
  header.write('ustar  \0', 257, 8, 'utf8')
  let sum = 0
  for (let i = 0; i < TAR_BLOCK; i++) sum += header[i]
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')
  return header
}

function tarFile(name: string, content: Buffer): Buffer {
  const header = writeTarHeader(name, content.length)
  const padLen = (TAR_BLOCK - (content.length % TAR_BLOCK)) % TAR_BLOCK
  return Buffer.concat([header, content, Buffer.alloc(padLen)])
}

const LINK_ETH_METADATA = {
  type: 'LinkEth',
  version: '1.0.0',
  implements: [],
  requires: [],
  config: {}
}

export const FIXTURE_REF = 'LinkEth/1.0.0@diff/stable'
export const FIXTURE_REVISION = 'rev0'
export const FIXTURE_COMPONENT_TYPE = 'LinkEth'

export function buildConanExportTgz(): Buffer {
  const file = tarFile('diff.metadata.json', Buffer.from(JSON.stringify(LINK_ETH_METADATA), 'utf8'))
  const trailer = Buffer.alloc(TAR_BLOCK * 2)
  const tar = Buffer.concat([file, trailer])
  return gzipSync(tar)
}
