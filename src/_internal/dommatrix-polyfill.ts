export function polyfillDOMMatrix(): void {
  if (typeof globalThis.DOMMatrix !== 'undefined')
    return

  // @ts-expect-error: Minimal polyfill, not spec-complete.
  globalThis.DOMMatrix = class DOMMatrix {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number

    constructor(init?: number[]) {
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]!
        this.b = init[1]!
        this.c = init[2]!
        this.d = init[3]!
        this.e = init[4]!
        this.f = init[5]!
      }
      else {
        this.a = 1
        this.b = 0
        this.c = 0
        this.d = 1
        this.e = 0
        this.f = 0
      }
    }

    translateSelf(tx: number, ty = 0): this {
      this.e = this.a * tx + this.c * ty + this.e
      this.f = this.b * tx + this.d * ty + this.f
      return this
    }

    scaleSelf(sx: number, sy = sx): this {
      this.a *= sx
      this.b *= sx
      this.c *= sy
      this.d *= sy
      return this
    }
  }
}
