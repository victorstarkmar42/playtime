import { registerSW } from 'virtual:pwa-register';
import { h } from './dom';

/**
 * Install offer and "new version" notice.
 * - Chrome / Edge / Samsung Internet fire `beforeinstallprompt`: we keep it and show our own button.
 * - iPhone / iPad Safari have no such event: we show the steps (Share → Add to Home Screen).
 * - New versions wait until the adult taps "Actualizar" (a child may be in the middle of a drawing).
 */

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pym-install-dismissed';
const DISMISS_DAYS = 7;
let deferred: InstallPromptEvent | null = null;
let slot: HTMLElement | null = null;

const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || (navigator as { standalone?: boolean }).standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const dismissedRecently = () => Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < DISMISS_DAYS * 864e5;

/** The browser had time to offer install and did not (already installed, or a browser without the event). */
let waited = false;

/** What to offer right now: a real install button, the iOS steps, the menu steps, or nothing. */
export function installOffer(): 'button' | 'ios' | 'manual' | null {
  if (standalone() || dismissedRecently() || location.search.includes('e2e')) return null;
  if (deferred) return 'button';
  if (isIOS()) return 'ios';
  if (waited) return 'manual';
  return null;
}

/** Fills the home screen's install card (and keeps it current if the browser offers install later). */
export function renderInstall(target: HTMLElement): void {
  slot = target;
  const offer = installOffer();
  target.hidden = !offer;
  if (!offer) return target.replaceChildren();
  const later = h('button', { class: 'bigbtn alt small', onClick: () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    target.hidden = true;
  } }, 'Ahora no');
  target.replaceChildren(
    h('span', { class: 'inst-ico', html: '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3" fill="#fff" stroke="#22304F" stroke-width="2"/><path d="M12 7v7m-3-3 3 3 3-3" stroke="#F2672E" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18.5h4" stroke="#22304F" stroke-width="2" stroke-linecap="round"/></svg>' }),
    h('div', { class: 'inst-text' },
      h('b', null, 'Instala PlayHour'),
      offer === 'button'
        ? h('span', null, 'Queda como una app en tu pantalla: se abre completa, sin la barra del navegador, y funciona sin internet.')
        : offer === 'ios'
          ? h('span', null, 'En Safari toca ', h('b', null, 'Compartir'), ' (el cuadro con la flecha) y luego ', h('b', null, 'Agregar a pantalla de inicio'), '.')
          : h('span', null, 'Abre el menú del navegador (', h('b', null, '⋮'), ' arriba a la derecha) y toca ', h('b', null, 'Instalar app'), ' o ', h('b', null, 'Agregar a pantalla principal'), '. Si el menú dice ', h('b', null, 'Abrir app'), ', ya está instalada: búscala en tus apps.')),
    h('div', { class: 'inst-btns' },
      offer === 'button'
        ? h('button', { class: 'bigbtn small', onClick: async () => {
            const e = deferred;
            if (!e) return;
            deferred = null;
            await e.prompt();
            const { outcome } = await e.userChoice;
            if (outcome === 'dismissed') localStorage.setItem(DISMISS_KEY, String(Date.now()));
            renderInstall(target);
          } }, 'Instalar app')
        : null,
      later),
  );
}

function refreshSlot(): void {
  if (slot?.isConnected) renderInstall(slot);
}

export function setupPwa(root: HTMLElement): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own button instead of the browser's mini bar
    deferred = e as InstallPromptEvent;
    refreshSlot();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    waited = false;
    localStorage.setItem(DISMISS_KEY, String(Date.now())); // installed: no need to offer it again soon
    refreshSlot();
  });
  // no install offer after a few seconds: show the menu steps instead, so the option is never missing
  setTimeout(() => {
    waited = true;
    refreshSlot();
  }, 4000);

  const bar = h('div', { class: 'updbar', hidden: true, role: 'status' });
  root.append(bar);
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      bar.replaceChildren(
        h('span', null, h('b', null, 'Hay una versión nueva'), ' de PlayHour.'),
        h('button', { class: 'bigbtn small', onClick: () => {
          bar.replaceChildren(h('span', null, 'Actualizando…'));
          void updateSW(true);
        } }, 'Actualizar'),
        h('button', { class: 'bigbtn alt small', onClick: () => (bar.hidden = true) }, 'Después'),
      );
      bar.hidden = false;
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      // look for a new version every 30 minutes and whenever the app comes back to the front
      const check = () => {
        if (navigator.onLine) void reg.update().catch(() => {});
      };
      setInterval(check, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    },
  });
}
