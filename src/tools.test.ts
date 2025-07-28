import { describe, expect, test, vi, beforeEach } from 'vitest'
import { searchNpmPackage, searchNpmPackages } from './tools.ts'

describe('tools.ts 功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  test('searchNpmPackage - 成功返回包信息', async () => {
    const mockData = {
      name: 'react',
      "dist-tags": { latest: '18.2.0' },
      description: 'React library',
      author: { name: 'Facebook' },
      homepage: 'https://reactjs.org/',
      repository: { url: 'https://github.com/facebook/react' },
      versions: { '18.2.0': { dependencies: { "react-dom": "18.2.0" } } }
    }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData)
    })

    const result = await searchNpmPackage('react')
    expect(result).toEqual({
      name: 'react',
      version: '18.2.0',
      description: 'React library',
      author: 'Facebook',
      homepage: 'https://reactjs.org/',
      repository: 'https://github.com/facebook/react',
      dependencies: { "react-dom": "18.2.0" }
    })
  })

  test('searchNpmPackage - 处理404错误', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Package not found' })
    })

    await expect(searchNpmPackage('non-existent-package')).rejects
      .toThrow('Package \'non-existent-package\' not found')
  })

  test('searchNpmPackages - 成功返回搜索结果', async () => {
    const mockResults = {
      objects: [{
        package: {
          name: 'react',
          version: '18.2.0',
          description: 'React library'
        }
      }]
    }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults)
    })

    const result = await searchNpmPackages('react')
    expect(result.objects[0].package.name).toBe('react')
  })
})