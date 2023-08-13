import { getDocumentProxy } from './utils'

export async function getPDFMeta(data: ArrayBuffer) {
  const pdf = await getDocumentProxy(data)
  const meta = await pdf.getMetadata().catch(() => null)

  return {
    info: (meta?.info ?? {}) as Record<string, any>,
    metadata: (meta?.metadata?.getAll() ?? {}) as Record<string, any>,
  }
}
