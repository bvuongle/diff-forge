import { describe, expect, it } from 'vitest'

import type { CatalogComponent } from './CatalogSchema'
import { listSources, searchCatalog } from './searchCatalog'

const linkEth: CatalogComponent = {
  type: 'LinkEth',
  source: 'link_eth',
  version: '1.0.0',
  implements: ['ILink'],
  requires: [],
  configSchema: {}
}

const linkGsm: CatalogComponent = {
  type: 'LinkGsm',
  source: 'link_gsm',
  version: '1.0.0',
  implements: ['ILink'],
  requires: [],
  configSchema: {}
}

const messageSource: CatalogComponent = {
  type: 'MessageSource',
  source: 'message_source',
  version: '1.0.0',
  implements: ['IMessageProducer'],
  requires: [{ slot: 'links', interface: 'ILink', min: 1, max: 4, order: 0 }],
  configSchema: {}
}

const all = [linkEth, linkGsm, messageSource]

describe('searchCatalog', () => {
  describe('empty query', () => {
    it('returns flat list of all components in name mode', () => {
      const result = searchCatalog(all, '', 'name')
      expect(result).toEqual({ kind: 'flat', matches: all })
    })

    it('returns flat list of all components in interface mode', () => {
      const result = searchCatalog(all, '', 'interface')
      expect(result).toEqual({ kind: 'flat', matches: all })
    })

    it('treats whitespace-only query as empty', () => {
      const result = searchCatalog(all, '   ', 'interface')
      expect(result).toEqual({ kind: 'flat', matches: all })
    })
  })

  describe('name mode', () => {
    it('matches type case-insensitively', () => {
      const result = searchCatalog(all, 'link', 'name')
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([linkEth, linkGsm])
    })

    it('returns empty matches when nothing matches', () => {
      const result = searchCatalog(all, 'nope', 'name')
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([])
    })

    it('ignores leading and trailing whitespace', () => {
      const result = searchCatalog(all, '  link  ', 'name')
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([linkEth, linkGsm])
    })
  })

  describe('interface mode', () => {
    it('groups providers and consumers of an interface', () => {
      const result = searchCatalog(all, 'ILink', 'interface')
      if (result.kind !== 'grouped') throw new Error('expected grouped')
      expect(result.provides).toEqual([linkEth, linkGsm])
      expect(result.accepts).toEqual([messageSource])
    })

    it('matches interface name case-insensitively', () => {
      const result = searchCatalog(all, 'ilink', 'interface')
      if (result.kind !== 'grouped') throw new Error('expected grouped')
      expect(result.provides).toEqual([linkEth, linkGsm])
      expect(result.accepts).toEqual([messageSource])
    })

    it('returns empty groups when interface is unknown', () => {
      const result = searchCatalog(all, 'IMissing', 'interface')
      if (result.kind !== 'grouped') throw new Error('expected grouped')
      expect(result.provides).toEqual([])
      expect(result.accepts).toEqual([])
    })

    it('matches partial interface name', () => {
      const result = searchCatalog(all, 'Producer', 'interface')
      if (result.kind !== 'grouped') throw new Error('expected grouped')
      expect(result.provides).toEqual([messageSource])
      expect(result.accepts).toEqual([])
    })
  })

  describe('source filter', () => {
    it('returns all components when filter set is empty', () => {
      const result = searchCatalog(all, '', 'name', new Set())
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual(all)
    })

    it('restricts results to a single chosen source', () => {
      const result = searchCatalog(all, '', 'name', new Set(['link_eth']))
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([linkEth])
    })

    it('returns the union when multiple sources are selected', () => {
      const result = searchCatalog(all, '', 'name', new Set(['link_eth', 'link_gsm']))
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([linkEth, linkGsm])
    })

    it('combines source filter with name query', () => {
      const result = searchCatalog(all, 'Link', 'name', new Set(['link_gsm']))
      if (result.kind !== 'flat') throw new Error('expected flat')
      expect(result.matches).toEqual([linkGsm])
    })

    it('combines source filter with interface query', () => {
      const result = searchCatalog(all, 'ILink', 'interface', new Set(['link_eth']))
      if (result.kind !== 'grouped') throw new Error('expected grouped')
      expect(result.provides).toEqual([linkEth])
      expect(result.accepts).toEqual([])
    })
  })

  describe('listSources', () => {
    it('returns unique sources sorted alphabetically', () => {
      expect(listSources(all)).toEqual(['link_eth', 'link_gsm', 'message_source'])
    })

    it('returns empty for empty catalog', () => {
      expect(listSources([])).toEqual([])
    })
  })
})
