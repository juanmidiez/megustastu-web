/* Mejoras de React Bits elegidas (v9): sello circular del cierre (Circular Text) (el grano de papel se retiró: provocaba fallos de pintado en Chrome).
   El panel para encenderlas y apagarlas solo aparece con ?propuesta en la URL. */
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { BOOKS, trilogyUrl } from './data.js';

const cfg = (typeof window !== 'undefined' && window.SITE_CONFIG) || globalThis.__SITE_CONFIG__ || {};
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const FX_LIST = [
  { k: 'seal', n: 3, name: 'Circular Text', where: 'Cierre: sello junto al botón de compra' },
  { k: 'puntos', n: 'P', name: 'Puntos juguetones', where: 'Aterrizan donde hay puntos y, entre parada y parada, salen de la pantalla' },
];
const DEFAULT = { seal: true, puntos: true, ...(cfg.fx || {}) };
export const showPanel = () =>
  !!cfg.preview || (typeof location !== 'undefined' && /[?&]propuesta\b/.test(location.search));

const FxPanel = lazy(() => import('./fxpanel.jsx'));
const FxCtx = createContext(DEFAULT);
export const useFx = () => useContext(FxCtx);

export function FxProvider({ children }) {
  const [fx, setFx] = useState(DEFAULT);
  // el panel de propuestas solo existe en la web de pruebas (?propuesta o SITE_CONFIG.preview) y se carga aparte
  const [panel, setPanel] = useState(false);
  useEffect(() => setPanel(showPanel()), []);
  useEffect(() => {
    const root = document.documentElement;
    FX_LIST.forEach(f => root.classList.toggle(`px-${f.k}`, !!fx[f.k]));
  }, [fx]);
  return (
    <FxCtx.Provider value={fx}>
      {children}
      {panel ? (
        <Suspense fallback={null}>
          <FxPanel fx={fx} setFx={setFx} />
        </Suspense>
      ) : null}
    </FxCtx.Provider>
  );
}

/* 3 · Cierre: sello circular con los tres títulos (Circular Text), gira despacio y acelera al pasar por encima */
export function Seal() {
  const { seal } = useFx();
  const rot = useRef(null);
  // v12: gira unos segundos al aparecer y se para (WCAG 2.2.2); al pasar el ratón vuelve a girar.
  const st = useRef({ a: 0, v: 0, target: 0, raf: 0, vis: false, last: 0, until: 0, hover: false, kick: () => {} });
  useEffect(() => {
    if (!seal || reduced()) return;
    const s = st.current;
    const step = now => {
      const dt = Math.min(50, now - (s.last || now));
      s.last = now;
      s.target = s.hover ? 0.7 : now < s.until ? 0.12 : 0;
      s.v += (s.target - s.v) * Math.min(1, dt / 220);
      s.a = (s.a + s.v * dt * 0.06) % 360;
      if (rot.current) rot.current.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
      const moving = s.target > 0 || s.v > 0.002;
      s.raf = s.vis && moving ? requestAnimationFrame(step) : 0;
    };
    s.kick = () => {
      if (s.vis && !s.raf) {
        s.last = 0;
        s.raf = requestAnimationFrame(step);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      const was = s.vis;
      s.vis = e.isIntersecting;
      if (s.vis && !was) s.until = performance.now() + 4500;
      s.kick();
    });
    io.observe(rot.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [seal]);
  if (!seal) return null;
  const R = 76;
  const C = 2 * Math.PI * R;
  return (
    <a
      className="seal"
      href={trilogyUrl()}
      {...(trilogyUrl().startsWith('#') ? null : { target: '_blank', rel: 'noopener noreferrer' })}
      aria-hidden="true"
      tabIndex={-1}
      onPointerEnter={() => { st.current.hover = true; st.current.kick(); }}
      onPointerLeave={() => (st.current.hover = false)}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <path id="seal-path" d={`M100,100 m-${R},0 a${R},${R} 0 1,1 ${2 * R},0 a${R},${R} 0 1,1 -${2 * R},0`} />
        </defs>
        <g ref={rot} className="seal-rot">
          <text className="seal-txt">
            <textPath href="#seal-path" textLength={C - 6} lengthAdjust="spacing">
              {BOOKS.map(b => (
                <tspan key={b.key}>
                  {b.title}
                  <tspan fill={b.dot}>.</tspan>
                  {'  ·  '}
                </tspan>
              ))}
            </textPath>
          </text>
        </g>
        <circle className="seal-core" cx="100" cy="100" r="42" />
        <path className="seal-arrow" d="M86 114 L114 86 M93 86 H114 V107" />
      </svg>
    </a>
  );
}
