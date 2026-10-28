// `Promise.withResolvers` is not available in Safari < 17.4.
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

// `Promise.try` is used by PDF.js v5.6+ in its message handler.
// Not yet available in Safari < 18.2.
if (typeof Promise.try === 'undefined') {
  Promise.try = function (fn, ...args) {
    return new Promise(resolve => resolve(fn(...args)))
  }
}

// `Map.prototype.getOrInsertComputed` is used extensively by PDF.js v5.6+.
// Not yet available in most runtimes.
if (typeof Map.prototype.getOrInsertComputed === 'undefined') {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Map.prototype, 'getOrInsertComputed', {
    value(key, callbackFn) {
      if (this.has(key)) {
        return this.get(key)
      }
      const value = callbackFn(key)
      this.set(key, value)
      return value
    },
    writable: true,
    configurable: true,
  })
}

// `Map.prototype.getOrInsert` is used by PDF.js v6.4+.
// Not yet available in Safari < 26.2 and Node.js < 26.
if (typeof Map.prototype.getOrInsert === 'undefined') {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Map.prototype, 'getOrInsert', {
    value(key, defaultValue) {
      if (this.has(key)) {
        return this.get(key)
      }
      this.set(key, defaultValue)
      return defaultValue
    },
    writable: true,
    configurable: true,
  })
}

// `Uint8Array.prototype.toHex` is used by PDF.js v5.6+ for document fingerprints.
// Not yet available in Node.js < 26.
if (typeof Uint8Array.prototype.toHex === 'undefined') {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Uint8Array.prototype, 'toHex', {
    value() {
      let hex = ''
      for (let i = 0; i < this.length; i++) {
        hex += this[i].toString(16).padStart(2, '0')
      }
      return hex
    },
    writable: true,
    configurable: true,
  })
}

// `Math.sumPrecise` is used by PDF.js v6.1+ to repair embedded fonts, lay out
// XFA forms and derive AES-256 keys. Not yet available in Node.js.
// Every call site sums a short list of byte lengths, glyph sizes or small
// floats, where the last-ulp difference to correctly rounded summation cannot
// change the result – so this deliberately skips the algorithm the
// specification asks for.
if (typeof Math.sumPrecise === 'undefined') {
  Object.defineProperty(Math, 'sumPrecise', {
    value(items) {
      let sum = 0
      for (const value of items) {
        sum += value
      }
      return sum
    },
    writable: true,
    configurable: true,
  })
}

// `ReadableStream` async iteration is used by PDF.js v5.6+ in `getTextContent`
// and `decompressSignature`. Not yet supported in Safari (all versions).
if (
  typeof ReadableStream !== 'undefined'
  && typeof ReadableStream.prototype[Symbol.asyncIterator] === 'undefined'
) {
  const asyncIterator = function ({ preventCancel = false } = {}) {
    const reader = this.getReader()
    let isFinished = false
    let ongoing = Promise.resolve()
    const next = () => {
      if (isFinished)
        return Promise.resolve({ value: undefined, done: true })
      return reader.read().then(
        (result) => {
          if (result.done) {
            isFinished = true
            reader.releaseLock()
          }
          return result
        },
        (error) => {
          isFinished = true
          reader.releaseLock()
          throw error
        },
      )
    }
    const doReturn = (value) => {
      if (isFinished)
        return Promise.resolve({ value, done: true })
      isFinished = true
      if (preventCancel) {
        reader.releaseLock()
        return Promise.resolve({ value, done: true })
      }
      const cancelPromise = reader.cancel(value)
      reader.releaseLock()
      return cancelPromise.then(() => ({ value, done: true }))
    }
    return {
      next() {
        return (ongoing = ongoing.then(next, next))
      },
      return(value) {
        return (ongoing = ongoing.then(() => doReturn(value), () => doReturn(value)))
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
  }
  for (const key of [Symbol.asyncIterator, 'values']) {
    Object.defineProperty(ReadableStream.prototype, key, {
      value: asyncIterator,
      writable: true,
      configurable: true,
    })
  }
}
