import { describe, expect, it } from 'vitest'
import { renderPageAsImage } from '../src/index'
import { getPDF, isWorkerd } from './utils'

describe('renderPageAsImage (workerd)', () => {
  it.runIf(isWorkerd)('rejects as an unsupported environment for canvas creation', async () => {
    await expect(renderPageAsImage(await getPDF(), 1)).rejects.toThrow('Unsupported environment for canvas creation.')
  })
})
