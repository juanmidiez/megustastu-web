import { useEffect, useRef, useState } from 'react';
import { makeBook, makeStage, THREE, ORDER, SPECS, supportsWebGL } from './books.js';

// Libro tumbado con el lomo hacia cámara: el texto del lomo se lee de izquierda a derecha.
const LYING = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0))
);
// Pequeños desajustes para que la pila parezca real, como en el render.
const JITTER = { mgt: { x: 0, yaw: 0 }, ldr: { x: 0.22, yaw: 0.03 }, rey: { x: -0.18, yaw: -0.022 }, omni: { x: 0.12, yaw: 0.026 } };
// v12: en la pila solo se ven el lomo y la contracubierta (la cubierta queda boca abajo).
// En móvil, texturas a la mitad de tamaño (72 KB en vez de 387 KB): la pila aparece mucho antes.
export const HERO_TEX = () => (window.innerWidth < 700 ? 't/s/' : 't/');
// Caída: altura (unidades = pulgadas), tiempo hasta el golpe, altura del rebote y cabeceo de cada libro
const DROP_H = 1.7;
const FALL = 0.32;
const BOUNCE = 0.3;
const ROLL = [0.05, -0.065, 0.055, -0.045];
const TAN = Math.tan((26 / 2) * (Math.PI / 180));

export default function HeroStack({ hostRef, spotRef, startOnView = false, label, books: keys = ORDER }) {
  const canvasRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) return setFallback(true);
    const canvas = canvasRef.current;
    let stage;
    try {
      stage = makeStage(canvas, { shadowSize: 12 });
    } catch {
      return setFallback(true);
    }
    const { renderer, scene, camera } = stage;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const group = new THREE.Group();
    scene.add(group);
    const books = [];
    let alive = true;
    let raf = 0;
    let visible = true;
    let start = 0;
    let armed = !startOnView;
    const p = { tx: 0, ty: 0, x: 0, y: 0, s: 0, ts: 0 };
    const stackH = keys.reduce((a, k) => a + SPECS[k].d, 0);

    const frameCamera = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      const portrait = aspect < 0.9;
      const frac = portrait ? 0.8 : 0.4;
      let D = 9.6 / (frac * 2 * TAN * aspect);
      // Centro de la pila = centro del hueco reservado en el hero
      let place = portrait ? 0.8 : 0.74;
      const spot = spotRef?.current;
      if (spot) {
        const cr = canvas.getBoundingClientRect();
        const sr = spot.getBoundingClientRect();
        place = (sr.top + sr.height / 2 - cr.top) / Math.max(1, cr.height);
        // Que la pila quepa también a lo alto del hueco (nunca se corta)
        const fh = (sr.height / Math.max(1, cr.height)) * 0.88;
        if (fh > 0) D = Math.max(D, (stackH * 1.77) / (fh * 2 * TAN));
      }
      const V = 2 * D * TAN;
      const lookY = stackH / 2 + (place - 0.5) * V;
      camera.position.set(0, lookY + D * 0.14, D);
      camera.lookAt(0, lookY, 0);
      camera.updateProjectionMatrix();
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      if (!armed) {
        books.forEach(b => (b.visible = false));
        renderer.render(scene, camera);
        return;
      }
      if (!start) start = now;
      const t = (now - start) / 1000;
      let busy = false;
      // Entrada (v13.1): caen con gravedad, golpean, rebotan un poco y se asientan con un leve
      // cabeceo; la pila de debajo cede un pelín con cada golpe. El cuarto (el recopilatorio,
      // en el cierre) llega tras una pausa, cuando la pila 1-2-3 ya está hecha.
      const starts = books.map((_, i) => 0.15 + i * 0.36 + (i > 2 ? 0.45 : 0));
      const lands = starts.map(s0 => s0 + FALL);
      let y = 0;
      books.forEach((b, i) => {
        const k = b.userData.key;
        const d = SPECS[k].d;
        const tl = reduced ? 99 : t - starts[i];
        let off = 0;
        let roll = 0;
        if (tl < FALL) {
          const f = Math.max(0, tl) / FALL;
          off = DROP_H * (1 - f * f); // acelera al caer, como con gravedad
          roll = ROLL[i % 4] * 0.5 * (1 - f);
        } else {
          const tb = tl - FALL;
          const decay = Math.exp(-5.2 * tb);
          off = BOUNCE * (d / 0.8) ** 0.35 * decay * Math.abs(Math.sin(12.5 * tb)); // rebote corto y amortiguado
          roll = ROLL[i % 4] * Math.exp(-4.5 * tb) * Math.cos(15 * tb); // cabecea al tocar y se asienta
          if (tb < 1.5) busy = true;
        }
        if (tl < FALL) busy = true;
        // la pila de debajo se hunde un instante con cada libro que le cae encima
        let dip = 0;
        for (let j = i + 1; j < books.length; j++) {
          const since = t - lands[j];
          if (since > 0 && !reduced) dip += 0.05 * Math.exp(-11 * since) * Math.sin(Math.min(Math.PI, since * 20));
        }
        // al cabecear, se levanta lo justo para no hundir la esquina en el libro de abajo
        const lift = Math.abs(Math.sin(roll)) * SPECS[k].h * 0.5;
        b.position.set(JITTER[k].x, y + d / 2 + off + lift - dip, 0);
        b.quaternion
          .copy(LYING)
          .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), JITTER[k].yaw))
          .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
        b.visible = tl >= 0;
        // v13.2: aparece mientras cae (los primeros 40 % de la caída), así nunca cruza el texto de encima
        const alpha = reduced ? 1 : Math.min(1, Math.max(0, tl / (FALL * 0.55)));
        if (b.userData.alpha !== alpha) {
          b.userData.alpha = alpha;
          (Array.isArray(b.material) ? b.material : [b.material]).forEach(m => (m.opacity = alpha));
          b.castShadow = alpha > 0.6;
        }
        y += d;
      });
      // Puntero y scroll, con amortiguado crítico
      const k = 1 - Math.exp(-6 / 60);
      p.x += (p.tx - p.x) * k;
      p.y += (p.ty - p.y) * k;
      p.s += (p.ts - p.s) * (reduced ? 1 : k);
      if (Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) + Math.abs(p.ts - p.s) > 0.0005) busy = true;
      group.rotation.y = p.x * 0.07 + p.s * 0.55;
      group.rotation.x = p.y * 0.035;
      group.position.y = p.s * 1.2;
      renderer.render(scene, camera);
      if (busy && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const onPointer = e => {
      if (e.pointerType !== 'mouse') return;
      p.tx = (e.clientX / window.innerWidth) * 2 - 1;
      p.ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const onScroll = () => {
      // v13: en el cierre la pila no sube ni gira con el scroll (se quedaba pegada arriba)
      if (startOnView) return;
      const host = hostRef?.current;
      if (!host) return;
      const r = host.getBoundingClientRect();
      p.ts = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      kick();
    };
    const ro = new ResizeObserver(() => {
      frameCamera();
      kick();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([e]) => {
      visible = e.isIntersecting;
      if (visible && !armed && e.intersectionRatio > 0.15) {
        armed = true;
        start = 0;
      }
      if (visible) kick();
      },
      { threshold: [0, 0.15, 0.6] }
    );
    io.observe(canvas);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    (async () => {
      // v12: los tres a la vez (antes, uno detrás de otro)
      const made = await Promise.all(keys.map(k => makeBook(k, renderer, HERO_TEX(), { skipFront: true })));
      made.forEach(b => {
        b.visible = false;
        group.add(b);
        books.push(b);
      });
      if (!alive) return;
      frameCamera();
      setReady(true);
      start = 0;
      kick();
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
    };
  }, [hostRef, spotRef]);

  if (fallback) return <img className="hero-fallback" src="r/stack.webp" alt="Los tres libros apilados: me gustas tú., los días raros. y rey." />;
  return <canvas ref={canvasRef} className={`hero-canvas ${ready ? 'is-ready' : ''}`} role="img" aria-label={label || "Los tres libros apilados en orden: me gustas tú. abajo, los días raros. en medio y rey. coronando la pila."} />;
}
