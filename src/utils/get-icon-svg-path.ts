/** Cache so we only resolve each icon once per session. */
const _cache = new Map<string, string | null>();

export async function getIconSvgPath(icon: string): Promise<string | null> {
  if (_cache.has(icon)) {
    return _cache.get(icon) ?? null;
  }

  try {
    // Strategy 1: use window.customIconsets if available (covers MDI + all custom sets)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customIconsets = (window as any).customIconsets as
      | Record<string, (name: string) => Promise<{ path?: string } | null>>
      | undefined;

    if (customIconsets) {
      const colonIndex = icon.indexOf(":");
      if (colonIndex !== -1) {
        const setName = icon.slice(0, colonIndex);
        const iconName = icon.slice(colonIndex + 1);
        const resolver = customIconsets[setName];
        if (typeof resolver === "function") {
          const result = await resolver(iconName);
          if (result?.path) {
            _cache.set(icon, result.path);
            return result.path;
          }
        }
      }
    }

    // Strategy 2: create a throwaway <ha-icon>, let HA resolve and render it,
    // then read the path from its shadow DOM.  This works for every icon set
    // that HA supports, including ones not exposed via customIconsets.
    const path = await _resolveViaHaIconElement(icon);
    _cache.set(icon, path);
    return path;
  } catch {
    _cache.set(icon, null);
    return null;
  }
}

async function _resolveViaHaIconElement(icon: string): Promise<string | null> {
  // Only works in a browser context where <ha-icon> is registered.
  if (typeof customElements === "undefined") return null;
  if (!customElements.get("ha-icon")) return null;

  const el = document.createElement("ha-icon") as HTMLElement & {
    icon?: string;
    updateComplete?: Promise<unknown>;
  };
  el.icon = icon;
  // Must be in the DOM for the shadow root to populate.
  el.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;";
  document.body.appendChild(el);

  try {
    // Wait for the Lit update cycle to complete.
    if (typeof el.updateComplete === "object" && el.updateComplete) {
      await el.updateComplete;
    } else {
      // Fallback: yield to the microtask / paint queue.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      );
    }

    // <ha-icon> renders an <ha-svg-icon> in its shadow root, which in turn
    // renders an <svg> containing a <path d="...">.
    const shadow = el.shadowRoot;
    if (!shadow) return null;

    // Try direct <path> inside shadow root (ha-svg-icon pattern).
    let pathEl = shadow.querySelector("path");
    if (!pathEl) {
      // Some versions nest inside ha-svg-icon → shadow → svg → path
      const svgIconEl = shadow.querySelector("ha-svg-icon");
      pathEl = svgIconEl?.shadowRoot?.querySelector("path") ?? null;
    }

    return pathEl?.getAttribute("d") ?? null;
  } finally {
    document.body.removeChild(el);
  }
}
