export interface PDFContent {
  totalPages: number
  info?: Record<string, any>
  metadata?: any
  text: string | string[]
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & Record<never, never>
