/** Polyfills required by pdfjs-dist v5.6+ on older Chromium (e.g. Samsung Internet). */
export function applyPdfJsPolyfills(): void {
  if (typeof Promise.withResolvers === "undefined") {
    Object.defineProperty(Promise, "withResolvers", {
      value<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      },
      writable: true,
      configurable: true,
    });
  }

  if (!("getOrInsertComputed" in Map.prototype)) {
    Object.defineProperty(Map.prototype, "getOrInsertComputed", {
      value<T>(key: PropertyKey, callbackFn: (key: PropertyKey) => T): T {
        if (this.has(key)) return this.get(key) as T;
        const value = callbackFn(key);
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
    });
  }

  if (!("getOrInsert" in Map.prototype)) {
    Object.defineProperty(Map.prototype, "getOrInsert", {
      value<T>(key: PropertyKey, defaultValue: T): T {
        if (this.has(key)) return this.get(key) as T;
        this.set(key, defaultValue);
        return defaultValue;
      },
      writable: true,
      configurable: true,
    });
  }

  if (!("toHex" in Uint8Array.prototype)) {
    Object.defineProperty(Uint8Array.prototype, "toHex", {
      value() {
        let hex = "";
        for (let i = 0; i < this.length; i++) {
          hex += this[i].toString(16).padStart(2, "0");
        }
        return hex;
      },
      writable: true,
      configurable: true,
    });
  }
}
