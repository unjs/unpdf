export interface PDFContent {
  totalPages: number
  info?: Record<string, any>
  metadata?: any
  text: string | string[]
}
