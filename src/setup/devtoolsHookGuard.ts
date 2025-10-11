// DevTools hook sanitization guard
// - Prevents semver from receiving empty strings when renderers register
// - Optionally records occurrences when debug is enabled

type DevToolsInternals = {
  version?: string;
  reconcilerVersion?: string;
  rendererVersion?: string;
  rendererPackageVersion?: string;
  rendererPackageName?: string;
  [key: string]: unknown;
};

type DevToolsHook = {
  inject?: (internals: DevToolsInternals, ...rest: unknown[]) => unknown;
  registerRenderer?: (...args: unknown[]) => unknown;
  register?: (...args: unknown[]) => unknown;
  __sanitized?: boolean;
  [key: string]: unknown;
};

type GuardEvent = {
  ts: number;
  type: string;
  rendererPackageName?: string;
  changedKeys: string[];
  original?: Partial<DevToolsInternals>;
  sanitized?: Partial<DevToolsInternals>;
  stack?: string;
};

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: DevToolsHook;
    __DEVTOOLS_HOOK_GUARD_DEBUG__?: boolean;
    __DEVTOOLS_HOOK_GUARD_EVENTS__?: GuardEvent[];
    __DEVTOOLS_HOOK_GUARD_ENABLE__?: () => void;
    __DEVTOOLS_HOOK_GUARD_DISABLE__?: () => void;
    __DEVTOOLS_HOOK_GUARD_DUMP__?: () => GuardEvent[];
  }
}

function isDevToolsInternals(x: unknown): x is DevToolsInternals {
  return typeof x === 'object' && x !== null && (
    'version' in (x as Record<string, unknown>) ||
    'reconcilerVersion' in (x as Record<string, unknown>) ||
    'rendererVersion' in (x as Record<string, unknown>) ||
    'rendererPackageVersion' in (x as Record<string, unknown>)
  );
}

function sanitizeInternals(internals: unknown): void {
  if (!isDevToolsInternals(internals)) return;
  const d = internals;

  const original: Partial<DevToolsInternals> = {
    version: d.version,
    reconcilerVersion: d.reconcilerVersion,
    rendererVersion: d.rendererVersion,
    rendererPackageVersion: d.rendererPackageVersion,
    rendererPackageName: d.rendererPackageName,
  };

  try {
    const setIfMissing = (k: keyof DevToolsInternals) => {
      const v = d[k];
      if (typeof v !== 'string' || v.trim() === '') (d as Record<string, unknown>)[k as string] = '0.0.0';
    };

    setIfMissing('version');
    setIfMissing('reconcilerVersion');

    if (typeof d.rendererVersion !== 'string' || d.rendererVersion.trim() === '') {
      if (typeof d.rendererPackageVersion === 'string' && d.rendererPackageVersion.trim() !== '') {
        d.rendererVersion = d.rendererPackageVersion;
      } else {
        d.rendererVersion = d.reconcilerVersion ?? '0.0.0';
      }
    }
  } catch {
    // never throw from sanitization
  }

  try {
    const changed: string[] = [];
    if (!original.version || String(original.version).trim() === '') changed.push('version');
    if (!original.reconcilerVersion || String(original.reconcilerVersion).trim() === '') changed.push('reconcilerVersion');
    if (!original.rendererVersion || String(original.rendererVersion).trim() === '') changed.push('rendererVersion');

    if (changed.length > 0 && typeof window !== 'undefined') recordEvent('sanitize', d, original, changed);
  } catch {
    // ignore diagnostics
  }
}

function isDebugEnabled(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.__DEVTOOLS_HOOK_GUARD_DEBUG__) return true;
    try { if (new URLSearchParams(location.search).get('devtoolsHookGuardDebug') === '1') return true; } catch {}
    try { if (localStorage.getItem('__DEVTOOLS_HOOK_GUARD_DEBUG__') === '1') return true; } catch {}
  } catch {
    // ignore
  }
  return false;
}

function recordEvent(type: string, internals: DevToolsInternals, original: Partial<DevToolsInternals>, changedKeys?: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const ev: GuardEvent = {
      ts: Date.now(),
      type,
      rendererPackageName: internals.rendererPackageName,
      changedKeys: changedKeys ?? [],
      original,
      sanitized: {
        version: internals.version,
        reconcilerVersion: internals.reconcilerVersion,
        rendererVersion: internals.rendererVersion,
      },
      stack: isDebugEnabled() ? new Error().stack : undefined,
    };

    window.__DEVTOOLS_HOOK_GUARD_EVENTS__ = window.__DEVTOOLS_HOOK_GUARD_EVENTS__ ?? [];
    window.__DEVTOOLS_HOOK_GUARD_EVENTS__.push(ev);

    if (isDebugEnabled()) console.warn('[devtoolsHookGuard] sanitized renderer registration', ev);
  } catch {
    // ignore
  }
}

// runtime helpers
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, '__DEVTOOLS_HOOK_GUARD_ENABLE__', { configurable: true, enumerable: false, value: () => { try { window.__DEVTOOLS_HOOK_GUARD_DEBUG__ = true; try { localStorage.setItem('__DEVTOOLS_HOOK_GUARD_DEBUG__', '1'); } catch {} } catch {} } });
    Object.defineProperty(window, '__DEVTOOLS_HOOK_GUARD_DISABLE__', { configurable: true, enumerable: false, value: () => { try { window.__DEVTOOLS_HOOK_GUARD_DEBUG__ = false; try { localStorage.removeItem('__DEVTOOLS_HOOK_GUARD_DEBUG__'); } catch {} } catch {} } });
    Object.defineProperty(window, '__DEVTOOLS_HOOK_GUARD_DUMP__', { configurable: true, enumerable: false, value: () => window.__DEVTOOLS_HOOK_GUARD_EVENTS__ ?? [] });
  } catch {
    // ignore
  }
}

function isDevToolsHook(x: unknown): x is DevToolsHook {
  return typeof x === 'object' && x !== null && ('inject' in (x as Record<string, unknown>) || 'register' in (x as Record<string, unknown>) || 'registerRenderer' in (x as Record<string, unknown>));
}

function wrapHook(hook: unknown) {
  if (!isDevToolsHook(hook)) return;
  const h = hook;
  if (h.__sanitized) return;

  try { Object.defineProperty(h, '__sanitized', { value: true, configurable: true }); } catch {}

  try {
    const originalInject = h.inject as ((this: unknown, internals: DevToolsInternals, ...rest: unknown[]) => unknown) | undefined;
    if (typeof originalInject === 'function') {
      const wrapperInject = function (this: unknown, internals: DevToolsInternals, ...rest: unknown[]) {
        if (isDebugEnabled()) recordEvent('inject-attempt', internals, { version: internals.version }, []);
        try { sanitizeInternals(internals); } catch {}
        const res = originalInject.apply(this, [internals, ...rest]);
        try { if (isDebugEnabled()) recordEvent('inject-complete', internals, { version: internals.version }, []); } catch {}
        return res;
      };
      try { Object.defineProperty(h, 'inject', { value: wrapperInject, configurable: true, writable: true }); } catch {}
    }

    const registerKey = (typeof h.registerRenderer === 'function' ? 'registerRenderer' : typeof h.register === 'function' ? 'register' : null) as keyof DevToolsHook | null;
    if (registerKey !== null) {
      const maybeOriginal = h[registerKey];
      if (typeof maybeOriginal === 'function') {
        const originalRegister = maybeOriginal as (...args: unknown[]) => unknown;
        const wrapperRegister = function(this: unknown, ...args: unknown[]) {
          try { if (args[0] && typeof args[0] === 'object') sanitizeInternals(args[0] as DevToolsInternals); } catch {}
          return originalRegister.apply(this, args);
        };
        try { Object.defineProperty(h, registerKey, { value: wrapperRegister, configurable: true, writable: true }); } catch {}
      }
    }
  } catch {
    // swallow
  }
}

// install guard
if (typeof window !== 'undefined') {
  try {
    const existing = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (isDevToolsHook(existing)) wrapHook(existing);
    else {
      let internalHook: DevToolsHook | undefined;
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', { configurable: true, enumerable: true, get() { return internalHook; }, set(h) { internalHook = h as DevToolsHook; try { wrapHook(internalHook); } catch {} } });
    }
  } catch {
    // must not throw
  }
}

export {};
