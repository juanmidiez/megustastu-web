import { useEffect, useRef, useState } from 'react';
import { makeBook, makeStage, THREE, ORDER, SPECS, supportsWebGL } from './books.js';

const TAN = Math.tan((26 / 2) * (Math.PI / 180));
const SP = 6.7; // separación en el carrusel: el siguiente libro asoma por la derecha
const SPO = 7.6; // separación en la presentación de los tres
const REST = 0.42; // tres cuartos, con el lomo a la vista

// Muelle con amortiguamiento crítico (sin rebote): sigue el valor actual y su velocidad.
const spring = (s, target, omega, dt) => {
  const x = s.v - target;
  const e = Math.exp(-omega * dt);
  const nx = (x + (s.vel + omega * x) * dt) * e;
  s.vel = (s.vel - omega * (s.vel + omega * x) * dt) * e;
  s.v = target + nx;
  return Math.abs(nx) > 0.0004 || Math.abs(s.vel) > 0.0004;
};
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* Carrusel de los tres libros. Al entrar en pantalla se presentan los tres juntos
   y después el primero pasa al frente con el siguiente asomando: se entiende que hay más. */
export default function Viewer({ index, flipped = false, dragRef, onIntro }) {
  const canvasRef = useRef(null);
  const props = useRef({ index, flipped });
  props.current = { index, flipped };
  const kickRef = useRef(() => {});
  const introRef = useRef(onIntro);
  introRef.current = onIntro;
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    kickRef.current();
  }, [index, flipped]);

  useEffect(() => {
    if (dragRef) dragRef.current.kick = () => kickRef.current();
  }, [dragRef]);

  useEffect(() => {
    if (!supportsWebGL()) return setFallback(true);
    const canvas = canvasRef.current;
    let stage;
    try {
      stage = makeStage(canvas, { shadowSize: 26 });
    } catch {
      return setFallback(true);
    }
    const { renderer, scene, camera } = stage;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const books = [];
    let alive = true;
    let raf = 0;
    let visible = false;
    let last = 0;
    let introAt = 0;
    let aspect = 1;
    const cur = { v: 0, vel: 0 };
    const ov = { v: reduced ? 0 : 1, vel: 0 };
    const yaw = { v: REST, vel: 0 };
    const hover = { tx: 0, ty: 0, x: 0, y: 0 };

    const frameCamera = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000) || 1 / 60;
      last = now;
      const { index: idx, flipped: fl } = props.current;
      const drag = dragRef?.current || { dx: 0, active: false };
      let busy = false;
      const o = reduced ? 60 : 1;
      // Presentación: los tres juntos un instante y luego al carrusel
      if (introAt && now > introAt && ov.v > 0) {
        busy = spring(ov, 0, 3.6 * o, dt) || busy;
        if (ov.v < 0.02 && introRef.current) {
          introRef.current();
          introRef.current = null;
        }
      } else if (ov.v > 0) busy = true;
      busy = spring(cur, idx - drag.dx, (drag.active ? 22 : 7.5) * o, dt) || busy;
      busy = spring(yaw, REST + (fl ? Math.PI : 0), 7 * o, dt) || busy;
      hover.x += (hover.tx - hover.x) * (1 - Math.exp(-dt * 6));
      hover.y += (hover.ty - hover.y) * (1 - Math.exp(-dt * 6));
      if (Math.abs(hover.tx - hover.x) + Math.abs(hover.ty - hover.y) > 0.001) busy = true;
      const t = ov.v;

      books.forEach((b, i) => {
        const k = b.userData.key;
        const rel = i - cur.v;
        const f = clamp(1 - Math.abs(rel));
        const sc = mix(0.72 + 0.28 * f, 0.86, t);
        const x = mix(rel * SP, (i - 1) * SPO, t);
        const z = mix(-(1 - f) * 2.4, 0, t);
        let op = mix((0.45 + 0.55 * f) * clamp(1.85 - Math.abs(rel)), 1, t);
        b.scale.setScalar(sc);
        b.position.set(x, (SPECS[k].h / 2) * sc, z);
        const near = Math.round(idx) === i;
        const turn = near ? yaw.v + hover.x * 0.12 * f : REST;
        b.rotation.set(hover.y * 0.04 * f * (1 - t), mix(REST + (turn - REST) * f, REST, t) - rel * 0.06 * (1 - t), 0);
        b.visible = op > 0.01;
        b.castShadow = op > 0.55;
        b.material.forEach(m => (m.opacity = op));
      });

      // Cámara: en el carrusel encuadra el libro activo; en la presentación, los tres.
      const Dh = 9.3 / (0.72 * 2 * TAN);
      const Dw = 7.6 / (0.62 * 2 * TAN * aspect);
      const Dc = Math.max(Dh, Dw);
      const Do = Math.max(Dc, (2 * SPO + 6.6) / (0.9 * 2 * TAN * aspect), (9.3 * 0.86) / (0.6 * 2 * TAN));
      const D = mix(Dc, Do, t);
      const lookY = mix(4.55, 4.55 * 0.86, t);
      camera.position.set(0, lookY + 0.35 + D * 0.08, D);
      camera.lookAt(0, lookY, 0);
      renderer.render(scene, camera);
      if ((busy || drag.active) && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };
    kickRef.current = kick;

    const move = e => {
      if (e.pointerType !== 'mouse') return;
      const r = canvas.getBoundingClientRect();
      hover.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      hover.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      kick();
    };
    const leave = () => {
      hover.tx = 0;
      hover.ty = 0;
      kick();
    };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);

    const ro = new ResizeObserver(() => {
      frameCamera();
      kick();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !introAt && e.intersectionRatio > 0.55 && books.length) introAt = performance.now() + 1100;
        if (visible) kick();
      },
      { threshold: [0, 0.55, 0.8] }
    );

    (async () => {
      for (const k of ORDER) {
        const b = await makeBook(k, renderer);
        scene.add(b);
        books.push(b);
      }
      if (!alive) return;
      cur.v = props.current.index;
      frameCamera();
      setReady(true);
      io.observe(canvas);
      kick();
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      renderer.dispose();
    };
  }, [dragRef]);

  if (fallback) {
    return (
      <div className="viewer-fallback">
        <img src={`r/${ORDER[index]}.webp`} alt="" />
      </div>
    );
  }
  return <canvas ref={canvasRef} className={`viewer-canvas ${ready ? 'is-ready' : ''}`} aria-hidden="true" />;
}
