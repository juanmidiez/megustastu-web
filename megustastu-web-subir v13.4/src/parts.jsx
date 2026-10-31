import { Fragment, useEffect, useRef, useState } from 'react';
import BlurText from './rb/BlurText.jsx';
import { SPECS } from './three/specs.js';

// Color base de cada cubierta: rellena los cantos para que no asomen juntas claras entre caras.
const COVER_BG = { mgt: '#1E6FA3', ldr: '#D9452E', rey: '#F2B81B', omni: '#EFE7D3' };
// v13.4: canto de las tapas (el reborde que se ve alrededor de las hojas al girar el libro):
// color de arriba, color de la franja de abajo y altura a la que empieza la franja (de las texturas)
const RIM = {
  mgt: ['#1C78A8', '#07ABDF', '81%'],
  ldr: ['#E55E29', '#E62426', '77.4%'],
  rey: ['#FFCC00', '#F7A000', '80%'],
  omni: ['#EFEAD3', '#F1A637', '97.2%']
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const noHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

/* Texto de botón que rueda al pasar por encima: sale hacia arriba y entra de nuevo desde abajo. */
export const L = ({ children }) => (
  <span className="roll" data-t={children}>
    <span>{children}</span>
  </span>
);

/* Línea del titular del hero. El punto de color es el foco: al pasar el cursor por la frase,
   sale de su sitio, se estira bajo la palabra que tienes delante y la subraya; al salir, vuelve a ser punto. */
export function HeroLine({ text, color, delay, order = 0 }) {
  const line = useRef(null);
  const mark = useRef(null);
  const dot = useRef(null);
  const state = useRef({ on: false, timer: 0 });

  const words = () => {
    const out = [];
    const host = line.current.querySelector('.hero-blur');
    const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode;
      if (n.parentElement.hasAttribute('data-sr')) continue; // texto solo para lectores de pantalla
      const raw = n.textContent;
      const end = raw.replace(/[\s ]+$/, '').length;
      if (!end) continue;
      const r = document.createRange();
      r.setStart(n, 0);
      r.setEnd(n, end);
      out.push(r.getBoundingClientRect());
    }
    return out;
  };
  const place = (x, y, w, h, animate = true) => {
    const m = mark.current;
    if (!animate) m.style.transition = 'none';
    m.style.transform = `translate(${x}px, ${y}px)`;
    m.style.width = `${w}px`;
    m.style.height = `${h}px`;
    if (!animate) {
      void m.offsetWidth;
      m.style.transition = '';
    }
  };
  const home = animate => {
    const lr = line.current.getBoundingClientRect();
    const dr = dot.current.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(line.current).fontSize);
    const s = fs * 0.17;
    place(dr.left - lr.left + dr.width / 2 - s / 2 - fs * 0.005, dr.bottom - lr.top - fs * 0.29, s, s, animate);
  };
  const focus = clientX => {
    const lr = line.current.getBoundingClientRect();
    const ws = words();
    if (!ws.length) return;
    let w = ws[0];
    let best = Infinity;
    ws.forEach(r => {
      const d = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
      if (d < best) {
        best = d;
        w = r;
      }
    });
    const fs = parseFloat(getComputedStyle(line.current).fontSize);
    place(w.left - lr.left, w.bottom - lr.top - fs * 0.2, w.width, Math.max(3, fs * 0.075));
  };

  const enter = e => {
    const st = state.current;
    clearTimeout(st.timer);
    if (!st.on) {
      home(false);
      st.on = true;
      line.current.classList.add('is-focus');
    }
    focus(e.clientX);
  };
  const leave = () => {
    const st = state.current;
    if (!st.on) return;
    home(true);
    clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      st.on = false;
      line.current?.classList.remove('is-focus');
    }, 520);
  };

  // En pantallas táctiles no hay cursor: el punto subraya la frase una vez, tras la entrada del titular.
  useEffect(() => {
    if (!noHover() || reducedMotion()) return;
    const t0 = setTimeout(() => {
      if (!line.current) return;
      const ws = words();
      if (!ws.length) return;
      home(false);
      state.current.on = true;
      line.current.classList.add('is-focus');
      const lr = line.current.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(line.current).fontSize);
      const last = ws[ws.length - 1];
      const first = ws.filter(r => Math.abs(r.top - last.top) < 4)[0] || last;
      place(first.left - lr.left, last.bottom - lr.top - fs * 0.2, last.right - first.left, Math.max(3, fs * 0.075));
      state.current.timer = setTimeout(leave, 950);
    }, 2400 + order * 1250);
    return () => clearTimeout(t0);
  }, []);

  return (
    <div
      className="hero-line"
      ref={line}
      aria-hidden="true"
      style={{ '--dc': color, '--dd': delay }}
      onPointerEnter={enter}
      onPointerMove={enter}
      onPointerLeave={leave}
    >
      <BlurText text={text} delay={60} stepDuration={0.4} animateBy="words" direction="bottom" trigger="load" settled={typeof window !== 'undefined' && !!window.__SSR} srText={false} distance={18} blur={10} className="hero-blur" />
      <span className="hl-dot" ref={dot}>
        .
      </span>
      <i className="hl-mark" ref={mark} />
    </div>
  );
}

/* La primera frase de la novela se escribe sola, con una corrección de autor a mitad. */
export function Typewriter({ text, from, to, caretColor, className = '' }) {
  const ref = useRef(null);
  const [out, setOut] = useState(reducedMotion() ? text : '');
  const [done, setDone] = useState(reducedMotion());
  useEffect(() => {
    if (reducedMotion()) return;
    const el = ref.current;
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const run = () => {
      const draft = text.slice(0, text.indexOf(to)) + from;
      const steps = [];
      for (let i = 1; i <= draft.length; i++) steps.push(draft.slice(0, i));
      const hold = steps.length;
      const base = draft.length - from.length;
      for (let i = from.length - 1; i >= 0; i--) steps.push(draft.slice(0, base + i));
      const back = steps.length;
      const rest = text.slice(base);
      for (let i = 1; i <= rest.length; i++) steps.push(text.slice(0, base) + rest.slice(0, i));
      let t = 0;
      steps.forEach((s, i) => {
        const ch = s[s.length - 1];
        let d = 34 + ((i * 37) % 29);
        if (i >= hold && i < back) d = 55;
        if (i === hold) d = 900;
        if (i === back) d = 380;
        if (ch === ',' || ch === 'y') d += 60;
        t += d;
        later(() => setOut(s), t);
      });
      later(() => setDone(true), t + 200);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          later(run, 350);
        }
      },
      { threshold: 0.7 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [text, from, to]);
  const finished = done && out === text;
  const body = finished ? text.slice(0, -1) : out;
  return (
    <p className={`tw ${className} ${done ? 'is-done' : ''}`} ref={ref} style={{ '--cc': caretColor }}>
      <span className="sr-only">{text}</span>
      <span className="tw-ghost" aria-hidden="true">
        {text}
      </span>
      <span className="tw-live" aria-hidden="true">
        {body}
        {finished ? <span className="tw-dot">.</span> : null}
        <i className="tw-caret" />
      </span>
    </p>
  );
}

/* Libro en 3D hecho con CSS a partir de las cubiertas reales.
   mode="flip": al pasar por encima (o tocar) gira y enseña la contraportada.
   mode="open": al pasar por encima se abre la tapa y se ve la primera página. */
export function Book3D({ k, mode = 'flip', width = 230, page, label, onClick, autoOpen = false, ry, tabIndex }) {
  const s = SPECS[k];
  const w = width;
  const h = (w * s.h) / s.w;
  const d = (w * s.d) / s.w;
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!autoOpen || !noHover()) return;
    const io = new IntersectionObserver(([e]) => setOn(e.intersectionRatio > 0.6), { threshold: [0, 0.6] });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [autoOpen]);
  const tap = () => {
    if (onClick) return onClick();
    if (noHover()) setOn(v => !v);
  };
  return (
    <button
      type="button"
      ref={ref}
      className={`b3 b3-${mode} ${on ? 'is-on' : ''}`}
      style={{ '--w': `${w}px`, '--h': `${h}px`, '--d': `${d}px`, '--cv': COVER_BG[k], '--rt': RIM[k][0], '--rb': RIM[k][1], '--rs': RIM[k][2], '--dr': s.d / s.w, ...(ry !== undefined ? { '--ry': `${ry}deg` } : null) }}
      tabIndex={tabIndex}
      onClick={tap}
      aria-label={label}
    >
      <span className="b3-shadow" aria-hidden="true" />
      <span className="b3-rot" aria-hidden="true">
        <span className="b3-face b3-back" style={{ backgroundImage: `url(t/${k}_back.webp)` }} />
        <span className="b3-face b3-spine" style={{ backgroundImage: `url(t/${k}_spine.webp)` }} />
        <span className="b3-face b3-edge" />
        <span className="b3-face b3-top" />
        <span className="b3-face b3-bottom" />
        {mode === 'open' ? <span className="b3-page">{page}</span> : null}
        <span className="b3-cover">
          <span className="b3-face b3-front" style={{ backgroundImage: `url(t/${k}_front.webp)` }} />
          <span className="b3-face b3-inside" />
        </span>
      </span>
    </button>
  );
}

/* La primera frase de la novela, que se pone literalmente «patas arriba».
   Entra letra a letra (como el ScrollFloat de React Bits); después, «mi mundo patas arriba»
   da la vuelta entera. Al pasar el cursor, las letras que tiene cerca también se vuelcan. */
export function FlipSentence({ text, flip, color, className = '' }) {
  const ref = useRef(null);
  const start = text.indexOf(flip);
  const end = start + flip.length;
  useEffect(() => {
    const el = ref.current;
    if (reducedMotion()) {
      el.classList.add('is-in');
      return;
    }
    let timers = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        // Cada vez que vuelves a la frase, el mundo se vuelve a poner patas arriba.
        const first = !el.classList.contains('is-in');
        el.classList.add('is-in');
        timers.forEach(clearTimeout);
        timers = [];
        const at = first ? 1900 : 500;
        timers.push(setTimeout(() => el.classList.add('is-flip'), at));
        timers.push(setTimeout(() => el.classList.remove('is-flip'), at + 3300));
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);
  const move = e => {
    if (reducedMotion()) return;
    const el = ref.current;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const R = fs * 0.95;
    el.querySelectorAll('.fs-c').forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      c.classList.toggle('up', d < R);
    });
  };
  const leave = () => ref.current.querySelectorAll('.fs-c.up').forEach(c => c.classList.remove('up'));

  let i = 0;
  const words = text.split(' ');
  return (
    <p ref={ref} className={`fs ${className}`} style={{ '--fc': color }} onPointerMove={move} onPointerLeave={leave}>
      <span className="sr-only">{text}</span>
      {words.map((w, wi) => {
        const chars = Array.from(w).map(ch => {
          const k = i++;
          const inFlip = k >= start && k < end;
          const isDot = k === text.length - 1 && ch === '.';
          return (
            <span
              key={k}
              aria-hidden="true"
              className={`fs-c ${inFlip ? 'fs-f' : ''} ${isDot ? 'fs-dot' : ''}`}
              style={{ '--i': k, '--j': inFlip ? k - start : 0 }}
            >
              {ch}
            </span>
          );
        });
        i++; // el espacio
        return (
          <Fragment key={wi}>
            <span className="fs-w" aria-hidden="true">
              {chars}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </Fragment>
        );
      })}
    </p>
  );
}
