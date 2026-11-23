// Ponyfills for built-ins PDF.js calls but not every runtime has. The build
// routes PDF.js' call sites here instead of installing them globally: each
// fallback covers only what PDF.js uses, and as a global it would mislead
// code that feature-detects the built-in.

// Destructured, so `inject` leaves these references alone and the
// `routeToPonyfills` guard passes them.
const { fromBase64: nativeFromBase64 } = Uint8Array
const { toBase64: nativeToBase64, toHex: nativeToHex } = Uint8Array.prototype
const { sumPrecise: nativeSumPrecise } = Math

// Node.js < 25 lacks `Uint8Array.fromBase64`. PDF.js passes no options; the
// defaults decode like `atob`.
export function fromBase64(string) {
  if (nativeFromBase64)
    return nativeFromBase64.call(Uint8Array, string)
  return Uint8Array.from(atob(string), char => char.charCodeAt(0))
}

// Node.js < 25 lacks `Uint8Array.prototype.toBase64`.
export function toBase64(bytes) {
  if (nativeToBase64)
    return nativeToBase64.call(bytes)
  let binary = ''
  // Chunked, so the spread stays below the engine's argument limit.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

// Node.js < 25 lacks `Uint8Array.prototype.toHex`.
export function toHex(bytes) {
  if (nativeToHex)
    return nativeToHex.call(bytes)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

// Node.js lacks `Math.sumPrecise`. Every PDF.js call site sums byte lengths,
// glyph sizes or small floats, where naive summation's rounding error is
// negligible – so the fallback deliberately skips the algorithm the
// specification asks for.
export function sumPrecise(items) {
  if (nativeSumPrecise)
    return nativeSumPrecise(items)
  let sum = 0
  for (const value of items) {
    sum += value
  }
  return sum
}
