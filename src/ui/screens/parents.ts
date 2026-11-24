import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { lastQuizResult } from './parentquiz';
import { clearAlbum } from '../../core/album';
import { LANG_NAME } from '../../core/lang';
import type { Skill } from '../../core/math';
import { accuracy, dayKey, progress, resetProgress } from '../../core/progress';
import { MIN_TRIES, reviewPlan, type Technique } from '../../core/review';
import { settings, updateSettings, type Settings } from '../../core/settings';
import { AGES, LANG_MODES, TIME_LIMITS, type Age, type Mode } from '../../core/types';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';

const SKILL_LABEL: Record<Skill, string> = {
  seq: 'Secuencia de números',
  count: 'Contar estrellas',
  sum: 'Sumas',
  sub: 'Restas',
  mul: 'Multiplicaciones',
  div: 'Divisiones',
};
const TECHNIQUE: Record<Technique, { name: string; how: (skill: string) => string }> = {
  spaced: { name: 'Repaso espaciado', how: (s) => `Repasen ${s.toLowerCase()} mañana, en 3 días y en una semana: poco rato, varias veces.` },
  interleaved: { name: 'Práctica intercalada', how: () => 'Mezclen sumas y restas en la misma ronda (Cuentas → Mezcla), para que elija qué operación usar.' },
  cpa: { name: 'Concreto → dibujo → número', how: (s) => `Practiquen ${s.toLowerCase()} con objetos de verdad o con los dibujos de Cuentas antes de pasar a solo números.` },
};

const AGE_LABEL: Record<Age, string> = { '3-4': '3–4', '5-6': '5–6', '7-9': '7–9' };
const MODE_LABEL: Record<Mode, string> = { seq: 'Secuencia 1, 2, 3…', math: 'Resuelve y conecta' };

function seg<T extends string | number>(values: readonly T[], label: (v: T) => string, get: () => T, set: (v: T) => void): HTMLElement {
  const box = h('div', { class: 'seg' });
  const paint = () => box.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(values[i] === get())));
  values.forEach((v) => box.append(h('button', { onClick: () => (set(v), paint()) }, label(v))));
  paint();
  return box;
}

function toggle(id: string, label: string, key: keyof Settings): HTMLElement {
  const input = h('input', { type: 'checkbox', class: 'toggle', id, checked: Boolean(settings[key]), onChange: (e: Event) => updateSettings({ [key]: (e.target as HTMLInputElement).checked }) });
  return h('label', { class: 'setting', for: id }, h('span', null, label), input);
}

function range(id: string, label: string, min: number, max: number, key: 'tolMm' | 'hintDelay', fmt: (v: number) => string, help: string): HTMLElement {
  const out = h('output', null, fmt(settings[key]));
  const input = h('input', {
    type: 'range', id, min, max, value: settings[key],
    onInput: (e: Event) => {
      const v = Number((e.target as HTMLInputElement).value);
      updateSettings({ [key]: v });
      out.textContent = fmt(v);
    },
  });
  return h('label', { class: 'setting', for: id }, h('span', null, label), out, input, h('small', null, help));
}

/** Two taps to confirm, since dialogs are not friendly on kids' devices. */
function confirmButton(label: string, confirmLabel: string, action: () => void): HTMLElement {
  let armed = 0;
  const b = h('button', { class: 'bigbtn alt small' }, label);
  b.onclick = () => {
    if (armed) {
      clearTimeout(armed);
      armed = 0;
      b.textContent = 'Hecho';
      action();
      return;
    }
    b.textContent = confirmLabel;
    armed = window.setTimeout(() => ((armed = 0), (b.textContent = label)), 4000);
  };
  return b;
}

export function parentsScreen(ctx: Ctx): Screen {
  // --- progress ---
  const skills = h('div');
  for (const k of Object.keys(SKILL_LABEL) as Skill[]) {
    const s = progress.skills[k];
    const acc = accuracy(s);
    if (acc == null) continue;
    skills.append(h('div', { class: 'skill' }, h('span', null, SKILL_LABEL[k]), h('b', null, `${acc}%`), h('span', { class: 'bar' }, h('i', { style: `width:${acc}%` })), h('small', null, `${s.right} de ${s.tries} al primer intento`)));
  }
  if (!skills.children.length) skills.append(h('p', { class: 'muted' }, 'Todavía no hay datos. Aparecen cuando el niño une puntos.'));

  const plan = reviewPlan(progress.skills);
  const planBox = h('div', { class: 'plan' },
    ...plan.review.map((r) => h('div', { class: 'planrow' },
      h('span', { class: `tech t-${r.technique}` }, TECHNIQUE[r.technique].name),
      h('span', null, h('b', null, `${SKILL_LABEL[r.skill]} (${r.accuracy}%)`), ' ', TECHNIQUE[r.technique].how(SKILL_LABEL[r.skill])))),
    plan.mastered.length ? h('p', null, h('b', null, 'Ya lo domina: '), plan.mastered.map((k) => SKILL_LABEL[k]).join(', '), '.') : null,
    !plan.review.length && !plan.mastered.length ? h('p', { class: 'muted' }, `Aparece cuando haya al menos ${MIN_TRIES} respuestas de un tema.`) : null,
    !plan.review.length && plan.mastered.length ? h('p', null, 'Nada pendiente por repasar: sigan jugando a su ritmo.') : null,
    h('small', { class: 'muted' }, 'Basado en técnicas de estudio con evidencia (repaso espaciado, práctica intercalada y concreto → dibujo → número). Es una guía, no una certificación ni un diagnóstico.'),
  );

  const days = h('div', { class: 'days' });
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const m = progress.minutes[dayKey(d)] ?? 0;
    days.append(h('div', { class: 'day', title: `${m} min` }, h('i', { style: `height:${Math.min(100, m * 3)}%` }), h('span', null, 'DLMMJVS'[d.getDay()])));
  }

  const words = progress.words.length ? h('div', { class: 'wordchips' }, ...progress.words.slice(-24).map((w) => h('span', null, w))) : h('p', { class: 'muted' }, 'Aún no ha escuchado palabras en inglés.');

  const found = CHARACTER_ORDER.filter((k) => progress.found.includes(k)).map((k) => charOf(k).label);

  // --- voices ---
  const voiceInfo = h('small');
  const paintVoices = () => {
    const es = ctx.speaker.voiceFor('es');
    const en = ctx.speaker.voiceFor('en');
    voiceInfo.textContent = !ctx.speaker.supported
      ? 'Este navegador no tiene voz. Prueba con Chrome, Edge o Safari.'
      : ctx.speaker.hasVoices
        ? `Español: ${es?.name ?? 'sin voz instalada'} · Inglés: ${en?.name ?? 'sin voz instalada'}`
        : 'Buscando voces del dispositivo…';
  };
  const voicePick = h('div', { class: 'voicepick' });
  const paintPick = () => {
    voicePick.replaceChildren(...(['es', 'en'] as const).map((l) => {
      const key = l === 'es' ? 'voiceEs' : 'voiceEn';
      const list = ctx.speaker.voicesFor(l);
      const sel = h('select', { 'aria-label': l === 'es' ? 'Voz en español' : 'Voz en inglés', onChange: (e: Event) => {
        updateSettings({ [key]: (e.target as HTMLSelectElement).value });
        paintVoices();
        ctx.sayOne(l === 'es' ? 'Hola, ¿jugamos a unir puntos?' : "Hi, let's connect the dots!", l);
      } },
        h('option', { value: '' }, 'La mejor (automática)'),
        ...list.map((v) => h('option', { value: v.name, selected: v.name === settings[key] }, `${v.name} (${v.lang})${v.localService === false ? ' · en línea' : ''}`)));
      return h('label', null, h('b', null, l === 'es' ? 'Español' : 'Inglés'), sel,
        h('button', { class: 'bigbtn alt small', onClick: () => ctx.sayOne(l === 'es' ? 'Hola, ¿jugamos a unir puntos?' : "Hi, let's connect the dots!", l) }, 'Probar'));
    }));
  };
  paintVoices();
  paintPick();
  ctx.speaker.onVoicesChanged = () => (paintVoices(), paintPick());

  // --- talk prompts for the current drawing ---
  const talkKey = ctx.state.game?.key ?? ctx.state.colorKey;
  const talk = h('ul', { class: 'talk' }, ...charOf(talkKey).vocab.talk.map((t) => h('li', null, t.q, ' ', h('em', null, t.word))));

  const resetGame = () => {
    ctx.state.game = null;
  };

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'parents' },
      h('div', { class: 'phead' }, h('h2', null, 'Área de padres'), h('button', { class: 'bigbtn', onClick: () => ctx.show('home') }, 'Volver al juego')),
      h('section', { class: 'pcard' },
        h('h3', null, 'Progreso'),
        h('div', { class: 'stats' },
          h('div', null, h('b', null, String(progress.drawings)), h('span', null, 'dibujos terminados')),
          h('div', null, h('b', null, String(progress.dots)), h('span', null, 'puntos unidos')),
          h('div', null, h('b', null, String(progress.words.length)), h('span', null, 'palabras en inglés')),
        ),
        skills,
        h('h4', null, 'Plan de repaso'), planBox,
        h('h4', null, 'Minutos por día'), days,
        h('h4', null, 'Palabras escuchadas'), words,
        h('p', { class: 'muted' }, found.length ? `Ha descubierto: ${found.join(', ')}.` : 'Aún no descubre ningún dibujo.'),
      ),
      (() => {
        const last = lastQuizResult();
        return h('section', { class: 'pcard' },
          h('h3', null, 'Evaluación para padres'),
          h('p', { class: 'muted' }, `8 preguntas sobre lo que conviene saber para un niño de ${settings.age.replace('-', '–')} años (sueño, pantallas, idiomas, aprendizaje y emociones), con recomendaciones según lo que su hijo ha jugado.`),
          last ? h('p', null, `Último resultado: ${last.score} de ${last.total} (${last.age.replace('-', '–')} años, ${last.date}).`) : null,
          h('button', { class: 'bigbtn violet', onClick: () => ctx.show('parentquiz') }, last ? 'Hacer otra vez' : 'Empezar evaluación'));
      })(),
      h('section', { class: 'pcard' },
        h('h3', null, 'Idiomas y voz'),
        h('div', { class: 'setting' }, h('span', null, 'Cómo suena la app'), h('span'),
          seg(LANG_MODES, (l) => LANG_NAME[l], () => settings.lang, (l) => (updateSettings({ lang: l }), ctx.sayPair('Hola', 'Hello'))),
          h('small', null, 'Cada frase se dice primero en el idioma principal y después en el segundo.')),
        toggle('optVoice', 'Voz activada', 'voice'),
        h('div', { class: 'setting' }, h('span', null, 'Voces del dispositivo'), h('button', { class: 'bigbtn alt small', onClick: () => ctx.sayPair('Hola, vamos a jugar.', "Hi, let's play.") }, 'Probar'), voiceInfo),
        h('div', { class: 'setting' }, h('span', null, 'Elegir voz'), h('span'), voicePick,
          h('small', null, 'Las voces "en línea" suelen sonar más naturales pero necesitan internet. Para voces de mejor calidad: en Android, Ajustes → Texto a voz (Motor de Google) → Instalar datos de voz → Español, y descarga una voz de alta calidad; en iPhone, Ajustes → Accesibilidad → Contenido leído → Voces → Español, y descarga una voz "mejorada" o "premium". Después elígela aquí.')),
      ),
      h('section', { class: 'pcard' },
        h('h3', null, 'Juego'),
        h('div', { class: 'setting' }, h('span', null, 'Edad'), h('span'), seg(AGES, (a) => `${AGE_LABEL[a]} años`, () => settings.age, (a) => (updateSettings({ age: a }), resetGame())), h('small', null, 'Cambia la cantidad de puntos y el tipo de operaciones.')),
        h('div', { class: 'setting' }, h('span', null, 'Modo'), h('span'), seg(['seq', 'math'] as const, (m) => MODE_LABEL[m], () => settings.mode, (m) => (updateSettings({ mode: m }), resetGame())), h('small', null, 'Resuelve y conecta: la operación dice cuál es el siguiente punto.')),
        range('tol', 'Tolerancia del toque', 6, 16, 'tolMm', (v) => `${v} mm`, 'Área invisible alrededor de cada punto. Más grande = más fácil.'),
        range('hint', 'Pista automática tras', 0, 10, 'hintDelay', (v) => (v ? `${v} s` : 'Nunca'), 'El siguiente punto brilla si el niño se detiene.'),
        toggle('optInside', 'Colorear dentro del dibujo', 'inside'),
        toggle('optPen', 'Sólo lápiz (ignora dedos y palma)', 'penOnly'),
        toggle('optReduced', 'Movimiento reducido', 'reduced'),
      ),
      h('section', { class: 'pcard' },
        h('h3', null, 'Tiempo de juego'),
        h('div', { class: 'setting' }, h('span', null, 'Descanso después de'), h('span'),
          seg(TIME_LIMITS, (m) => (m ? `${m} min` : 'Sin límite'), () => settings.timeLimitMin, (m) => updateSettings({ timeLimitMin: m })),
          h('small', null, 'Sin cuenta regresiva: al llegar el tiempo anochece en la app y se despide.')),
        h('div', { class: 'setting' }, h('span', null, 'Ver cómo se ve el cierre'), h('button', { class: 'bigbtn alt small', onClick: () => ctx.timer.trigger() }, 'Probar')),
      ),
      h('section', { class: 'pcard' }, h('h3', null, 'Para platicar juntos'), h('p', { class: 'muted' }, `Sobre ${charOf(talkKey).label}:`), talk),
      h('section', { class: 'pcard' },
        h('h3', null, 'Datos'),
        h('p', { class: 'muted' }, 'Todo se guarda sólo en este dispositivo: sin cuentas, anuncios ni envío de datos.'),
        h('div', { class: 'kbtnrow' },
          confirmButton('Borrar álbum', 'Toca otra vez para borrar', () => void clearAlbum()),
          confirmButton('Borrar progreso', 'Toca otra vez para borrar', () => (resetProgress(), resetGame())),
        ),
      ),
    ),
  );
  return {
    el,
    destroy() {
      ctx.speaker.onVoicesChanged = null;
    },
  };
}
