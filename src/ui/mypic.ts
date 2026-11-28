import { photoInk, fitRect } from '../core/photo';
import type { MyPic } from '../core/mypics';
import { W, H } from '../render/character';
import { INK } from '../render/primitives';
import type { Ctx } from './context';
import { canvas, h } from './dom';

/** A picture ready to colour: its lines in ink colour on a transparent 1200×900 board. */
export interface PicArt {
  id: string;
  name: string;
  ink: HTMLCanvasElement;
}

/** Draws a photo or image file on a white 1200×900 board, inside the square the colouring stage shows. */
export async function boardFromImage(src: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(src);
  const board = canvas(W, H);
  const c = board.getContext('2d', { willReadFrequently: true })!;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  // The stage shows the middle 900×900 of the board.
  const side = H;
  const r = fitRect(bmp.width, bmp.height, side, side);
  c.drawImage(bmp, (W - side) / 2 + r.x, r.y, r.w, r.h);
  bmp.close?.();
  return board;
}

/** The board's lines as ink (dark, with soft edges) on a transparent canvas. */
export function inkFromBoard(board: HTMLCanvasElement, level: number): HTMLCanvasElement {
  const src = board.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, W, H);
  const ink = photoInk(src.data, W, H, level);
  const out = new ImageData(W, H);
  const n = parseInt(INK.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  for (let i = 0; i < W * H; i++) {
    if (!ink[i]) continue;
    const o = i * 4;
    out.data[o] = r;
    out.data[o + 1] = g;
    out.data[o + 2] = b;
    out.data[o + 3] = ink[i];
  }
  const cv = canvas(W, H);
  cv.getContext('2d')!.putImageData(out, 0, 0);
  return cv;
}

/** White board with the ink on top: what the child will see before colouring. */
export function previewOf(ink: HTMLCanvasElement, w = W, h = H): HTMLCanvasElement {
  const cv = canvas(w, h);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#fff';
  c.fillRect(0, 0, w, h);
  c.drawImage(ink, 0, 0, w, h);
  return cv;
}

export async function picArt(p: MyPic): Promise<PicArt> {
  const board = await boardFromImage(p.src);
  return { id: p.id, name: p.name, ink: inkFromBoard(board, p.level) };
}

/** Opens "Nuevo dibujo" with a photo or image; after saving it returns to `from`. */
export function openNewPic(ctx: Ctx, f: Blob, from: 'parents' | 'pick', name = 'Mi dibujo'): void {
  ctx.state.newPic = f instanceof File ? f : new File([f], name, { type: f.type });
  ctx.state.newPicFrom = from;
  ctx.show('mypic');
}

/** "Tomar foto", "Subir imagen" and (where the browser can) "Pegar imagen". */
export function newPicButtons(ctx: Ctx, from: 'parents' | 'pick'): HTMLElement[] {
  const pick = (camera: boolean) => {
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true, ...(camera ? { capture: 'environment' } : {}) }) as HTMLInputElement;
    input.onchange = () => {
      const f = input.files?.[0];
      input.remove();
      if (f) openNewPic(ctx, f, from);
    };
    document.body.append(input);
    input.click();
  };
  const paste = async () => {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) return openNewPic(ctx, await item.getType(type), from, 'Imagen pegada');
      }
      ctx.toast('No hay una imagen copiada. Copia una imagen y vuelve a intentar.');
    } catch {
      ctx.toast('No se pudo leer el portapapeles. Prueba con Subir imagen.');
    }
  };
  const btns = [
    h('button', { class: 'bigbtn', onClick: () => pick(true) }, 'Tomar foto'),
    h('button', { class: 'bigbtn alt', onClick: () => pick(false) }, 'Subir imagen'),
  ];
  if (typeof navigator.clipboard?.read === 'function') btns.push(h('button', { class: 'bigbtn alt', onClick: () => void paste() }, 'Pegar imagen'));
  return btns;
}
