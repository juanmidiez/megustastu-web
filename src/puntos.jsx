/* PROPUESTA (no publicada) · «puntos juguetones» (v6).
   Los tres puntos (azul me gustas tú., rojo los días raros., ámbar rey.) acompañan el scroll y
   aterrizan donde la web ya tiene puntos: titular del hero → playlists → trilogía → autor → cierre.
   Entre una parada y otra NO se quedan en pantalla: al irse, vuelan a los tres puntos del logo
   (junto a «Juanmi Díez») y se funden con ellos; cuando aparece la siguiente parada, salen del logo
   y aterrizan con un rebote. Nunca hay puntos sueltos por medio.
   Solo se activa con fx.puntos (panel de propuesta o SITE_CONFIG.fx.puntos). */
import { useEffect, useRef } from 'react';
import { useFx } from './propuesta.jsx';

const COLORS = ['#399AC9', '#E62526', '#FBB348'];
const BASE = 20;
const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;

// Centro y diámetro de la tinta de un «.» tipográfico.
function glyphDot(el) {
  if (!el) return null;
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let tn = null;
  while (tw.nextNode()) if (tw.currentNode.textContent.includes('.')) tn = tw.currentNode;
  if (!tn) return null;
  const i = tn.textContent.lastIndexOf('.');
  const range = document.createRange();
  range.setStart(tn, i);
  range.setEnd(tn, i + 1);
  const box = range.getBoundingClientRect();
  if (!box.width && !box.height) return null;
  const cs = getComputedStyle(tn.parentElement);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText('.');
  const k = box.height / (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent || 1);
  const base = box.top + m.fontBoundingBoxAscent * k;
  const l = box.left - m.actualBoundingBoxLeft * k;
  const r = box.left + m.actualBoundingBoxRight * k;
  const t = base - m.actualBoundingBoxAscent * k;
  const b = base + m.actualBoundingBoxDescent * k;
  return { x: (l + r) / 2, y: (t + b) / 2, d: Math.min(r - l, b - t) };
}
function circleDot(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width };
}
// ¿Se ve de verdad? (dentro de pantalla y sin otra hoja encima)
function visible(p, owner) {
  if (!p || !owner) return false;
  const vh = window.innerHeight;
  if (p.y < 76 || p.y > vh - 24 || p.x < 4 || p.x > window.innerWidth - 4) return false;
  const hit = document.elementFromPoint(p.x, p.y);
  return !!hit && owner.contains(hit);
}

const STATIONS = [
  {
    key: 'hero',
    owner: () => document.querySelector('.hero'),
    els: () => [...document.querySelectorAll('.hero .hl-dot')],
    measure: glyphDot,
    muted: el => el.closest('.hero-line')?.classList.contains('is-focus')
  },
  { key: 'canciones', owner: () => document.getElementById('canciones'), els: () => [...document.querySelectorAll('#canciones .list-title .bk-dot')], measure: glyphDot },
  { key: 'trilogia', owner: () => document.getElementById('trilogia'), els: () => [...document.querySelectorAll('#trilogia .lu-title .bk-dot')], measure: glyphDot },
  { key: 'autor', owner: () => document.getElementById('autor'), els: () => [...document.querySelectorAll('#autor .author-copy .dots i')], measure: circleDot },
  {
    key: 'cierre',
    owner: () => document.querySelector('footer.close'),
    els: () => {
      const d = document.querySelector('.close-dot');
      return d ? [d, d, d] : [];
    },
    measure: glyphDot,
    merge: true // los tres se funden en el punto que bota
  }
];
const OFF = { key: 'off' };

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function DotTrail() {
  const { puntos } = useFx();
  const layer = useRef(null);

  useEffect(() => {
    if (!puntos || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.classList.add('pt-on');
    const dots = [...layer.current.children].map((n, i) => ({ n, i, x: 0, y: 0, d: 8, o: 0, from: null, t0: 0, landed: true, landedAt: 0, hidden: null }));
    const vacated = new Set(); // puntos reales que los viajeros dejaron al irse
    let station = OFF;
    let dir = 1; // 1 bajando, -1 subiendo
    let lastY = window.scrollY;
    let raf = 0;
    const t0 = performance.now();

    // Al cargar, los puntos del titular salen del logo.
    // Si la web tardó en arrancar (móvil lento) y los puntos del titular ya se ven, no hay salida
    // desde el logo: los viajeros se quedan directamente en el titular, sin parpadeos.
    const late = performance.now() > 1200;
    const heroWait = late ? [] : [...document.querySelectorAll('.hero .hl-dot')];
    heroWait.forEach(el => el.classList.add('pt-hide'));
    heroWait.forEach(el => vacated.add(el));
    const intro = late ? 0 : 1400;
    let first = true;
    // Casa: los tres puntos del logo, junto a «Juanmi Díez»
    const logoDots = () => [...document.querySelectorAll('.nav-brand .dots i')].map(circleDot);
    const logo = logoDots();
    dots.forEach((dt, i) => logo[i] && Object.assign(dt, logo[i]));

    const targets = st => {
      const els = st.els();
      if (els.length < 3) return null;
      return els.slice(0, 3).map(el => ({ el, p: st.measure(el) }));
    };

    const go = (st, now) => {
      const prev = station;
      station = st;
      dots.forEach((dt, i) => {
        if (dt.hidden) {
          vacated.add(dt.hidden);
          dt.hidden = null;
        }
        // si venían de casa (el logo), salen de sus puntos
        if (prev === OFF && st !== OFF && dt.landed) {
          const h = logoDots()[i];
          if (h) Object.assign(dt, h);
        }
        dt.from = { x: dt.x, y: dt.y, d: dt.d };
        dt.t0 = now + (dir > 0 ? i : 2 - i) * 90;
        dt.landed = false;
      });
    };

    const frame = now => {
      raf = requestAnimationFrame(frame);
      const sy = window.scrollY;
      if (Math.abs(sy - lastY) > 0.5) dir = sy > lastY ? 1 : -1;
      lastY = sy;

      // 1) Parada activa: la última de la página cuyos tres puntos se ven. Si no hay ninguna, fuera.
      let next = OFF;
      for (const st of STATIONS) {
        if (st.key === 'hero' && now - t0 < intro) continue;
        const ts = targets(st);
        if (!ts) continue;
        const owner = st.owner();
        if (st.merge ? visible(ts[0].p, owner) : ts.every(t => visible(t.p, owner))) next = st;
      }
      if (late && first && next.key === 'hero') {
        // arranque tardío: los viajeros sustituyen sin más a los puntos del titular
        const ts = targets(next);
        station = next;
        dots.forEach((dt, i) => {
          if (!ts || !ts[i].p) return;
          Object.assign(dt, ts[i].p, { landed: true, landedAt: -1e9, o: 1 });
          ts[i].el.classList.add('pt-hide');
          dt.hidden = ts[i].el;
        });
      }
      first = false;
      if (next !== station) go(next, now);

      // Los puntos reales que se dejaron vuelven a verse cuando ya no están a la vista.
      vacated.forEach(el => {
        if (dots.some(dt => dt.hidden === el)) {
          vacated.delete(el);
          return;
        }
        const p = el.tagName === 'I' ? circleDot(el) : glyphDot(el);
        const sec = el.closest('section, footer');
        if (!visible(p, sec) && !(heroWait.includes(el) && now - t0 < intro)) {
          el.classList.remove('pt-hide');
          vacated.delete(el);
        }
      });

      // 2) Mover.
      const ts = station === OFF ? null : targets(station);
      dots.forEach((dt, i) => {
        const tg = ts ? ts[i] : null;
        const target = tg && tg.p ? tg.p : logoDots()[i] || { x: dt.x, y: dt.y, d: dt.d };
        let o = 1;
        let pulse = 1;
        if (!dt.landed) {
          const dist = Math.hypot(target.x - dt.from.x, target.y - dt.from.y);
          const leaving = station === OFF;
          const dur = Math.min(1150, 620 + dist * 0.3);
          const k = Math.min(1, Math.max(0, (now - dt.t0) / dur));
          const e = easeInOut(k);
          // al irse dan un saltito antes de caer; al llegar, arco de bote
          // arco de bote; si sale del logo o va hacia él (arriba del todo), el arco va hacia abajo para no salirse
          const nearTop = Math.min(dt.from.y, target.y) < 140;
          const arc = Math.sin(Math.PI * e) * Math.min(leaving ? 90 : 150, 30 + dist * (leaving ? 0.12 : 0.22)) * (nearTop ? -0.55 : 1);
          dt.x = dt.from.x + (target.x - dt.from.x) * e;
          dt.y = dt.from.y + (target.y - dt.from.y) * e - arc;
          dt.d = (dt.from.d + (target.d - dt.from.d) * e) * (1 + Math.sin(Math.PI * e) * 0.5);
          if (k >= 1) {
            dt.landed = true;
            dt.landedAt = now;
            if (!leaving && !station.merge && tg) {
              tg.el.classList.add('pt-hide');
              dt.hidden = tg.el;
            }
          }
        } else if (station !== OFF) {
          dt.x = target.x;
          dt.y = target.y;
          dt.d = target.d;
          // rebote al aterrizar
          const s = Math.min(1, (now - dt.landedAt) / 380);
          pulse = 1 + Math.sin(Math.PI * s) * 0.45 * (1 - s);
        }
        if (station === OFF && dt.landed) o = 0;
        if (station.merge && dt.landed) o = 0;
        if (station.muted && tg && station.muted(tg.el)) o = 0;
        dt.o += (o - dt.o) * (o ? 0.6 : 0.3);
        const sc = Math.max(0.01, (dt.d * pulse) / BASE);
        dt.n.style.transform = `translate3d(${(dt.x - BASE / 2).toFixed(2)}px, ${(dt.y - BASE / 2).toFixed(2)}px, 0) scale(${sc.toFixed(4)})`;
        dt.n.style.opacity = dt.o.toFixed(3);
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('pt-on');
      document.querySelectorAll('.pt-hide').forEach(el => el.classList.remove('pt-hide'));
    };
  }, [puntos]);

  if (!puntos) return null;
  return (
    <div className="pt-layer" ref={layer} aria-hidden="true">
      {COLORS.map(c => (
        <i key={c} style={{ background: c }} />
      ))}
    </div>
  );
}
