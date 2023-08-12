import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { decodePDFText } from '../src/index.node'
import DummyPDFDataUri from './fixtures/dummy'

describe('unpdf', () => {
  it('extracts text from a PDF', async () => {
    const pdf = await fetch(DummyPDFDataUri).then(res => res.arrayBuffer())
    const { text } = await decodePDFText(pdf)

    strictEqual(text[0], 'Dummy PDF file')
  })
})
