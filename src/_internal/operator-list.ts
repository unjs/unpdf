import type { PDFOperatorList } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'

/** Affine transform `[a, b, c, d, e, f]`, mapping `(x, y)` to `(a·x + c·y + e, b·x + d·y + f)`. */
export type Matrix = [number, number, number, number, number, number]

/** Axis-aligned box in PDF user space, origin bottom-left. */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Operation {
  fn: number
  args: any
  /** Current transformation matrix at the time of the operation, mapping into PDF user space. */
  transform: Matrix
}

const IDENTITY_MATRIX: Matrix = [1, 0, 0, 1, 0, 0]

/**
 * Walks an operator list in painting order, tracking the current transformation
 * matrix through `save`/`restore`, `transform`, and form XObjects.
 */
export function* walkOperatorList(
  operatorList: PDFOperatorList,
  ops: typeof PDFJS.OPS,
): Generator<Operation> {
  const transformStack: Matrix[] = []
  let transform = IDENTITY_MATRIX

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i]!
    const args = operatorList.argsArray[i]

    if (fn === ops.save) {
      transformStack.push(transform)
    }
    else if (fn === ops.restore || fn === ops.paintFormXObjectEnd) {
      transform = transformStack.pop() ?? transform
    }
    else if (fn === ops.transform) {
      transform = multiplyMatrices(transform, args)
    }
    else if (fn === ops.paintFormXObjectBegin) {
      transformStack.push(transform)
      const [formMatrix] = args
      if (formMatrix) {
        transform = multiplyMatrices(transform, formMatrix)
      }
    }

    yield { fn, args, transform }
  }
}

/**
 * Maps the unit square, which PDF images are drawn into, through a transform
 * and returns the axis-aligned box around the result.
 */
export function getUnitSquareBounds(transform: Matrix): Bounds {
  const [a, b, c, d, e, f] = transform
  const xs = [e, a + e, c + e, a + c + e]
  const ys = [f, b + f, d + f, b + d + f]
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  }
}

/** Applies `inner` first, then `outer`, like `cm` concatenating onto the current matrix. */
function multiplyMatrices(outer: Matrix, inner: ArrayLike<number>): Matrix {
  const [a, b, c, d, e, f] = outer
  const [a2, b2, c2, d2, e2, f2] = Array.from(inner) as Matrix

  return [
    a * a2 + c * b2,
    b * a2 + d * b2,
    a * c2 + c * d2,
    b * c2 + d * d2,
    a * e2 + c * f2 + e,
    b * e2 + d * f2 + f,
  ]
}
