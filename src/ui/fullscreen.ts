/**
 * Pantalla completa: oculta la barra de estado y los botones del celular mientras se juega.
 * - App instalada en Android: el manifiesto ya pide `fullscreen`.
 * - En el navegador (o si el niño desliza y salen las barras): el siguiente toque vuelve a ocultarlas.
 * - iPhone no permite ocultarlas desde una página; instalada desde Safari ya se abre sin barra del navegador.
 */

export const fullscreenSupported = (): boolean =>
  typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false;

const displayFullscreen = (): boolean => {
  try {
    return matchMedia('(display-mode: fullscreen)').matches;
  } catch {
    return false;
  }
};

export const isFullscreen = (): boolean => !!document.fullscreenElement || displayFullscreen();

/** Must be called from a tap or key press (browsers require a user gesture). */
export function enterFullscreen(): void {
  if (!fullscreenSupported() || document.fullscreenElement) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
    /* not allowed right now (no gesture, iframe, policy): keep playing as is */
  });
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

/**
 * On phones and tablets, any tap re-enters full screen when it is on. A mouse never triggers it, so
 * a laptop keeps its normal window (the parents area has a button for that).
 */
export function setupFullscreen(enabled: () => boolean): void {
  window.addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType === 'mouse' || !enabled() || isFullscreen()) return;
      enterFullscreen();
    },
    { capture: true },
  );
}
