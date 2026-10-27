import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import ScrollVelocity from './rb/ScrollVelocity.jsx';
import PillNav from './rb/PillNav.jsx';
// v12: three.js (la mayor parte del JS) se carga aparte, sin retrasar el texto ni los botones
// (se carga al montar; hasta entonces, el mismo lienzo vacío que llega en el HTML prerenderizado)
let heroStackModule = null;
const HeroStack = props => {
  const [Comp, setComp] = useState(() => heroStackModule);
  useEffect(() => {
    if (Comp) return;
    import('./three/HeroStack.jsx').then(m => {
      heroStackModule = m.default;
      setComp(() => m.default);
    });
  }, [Comp]);
  return Comp ? <Comp {...props} /> : <canvas className="hero-canvas" aria-hidden="true" />;
};
import { BOOKS, BIO, amazon, instagram, trilogyUrl, onSale, STORE, OMNI, OMNI_ANCHOR } from './data.js';
import { L, HeroLine, Book3D, FlipSentence } from './parts.jsx';
import PROLOGO from './prologo.json';
import { FxProvider, Seal } from './propuesta.jsx';
import DotTrail from './puntos.jsx';

const [MGT, LDR, REY] = BOOKS;
const NAVY = '#3A3026';
// En la vista previa de Claude no se pueden incrustar otras webs; en tu dominio, sí.
const HOST = typeof window !== 'undefined' ? window.location : { hostname: globalThis.__SSR_HOST__ || '', protocol: 'https:' };
const CAN_EMBED = !!HOST.hostname && !/claude|anthropic/i.test(HOST.hostname) && HOST.protocol !== 'file:';

/* ---------- Piezas ---------- */
const Title = ({ book, as: Tag = 'span', className = '', colored = true }) => (
  <Tag className={`bk ${className}`} style={colored ? { color: book.ink } : undefined}>
    {book.title}
    <span className="bk-dot" style={{ color: book.dot }}>.</span>
  </Tag>
);

/* Botón de compra de un libro: Amazon si ya tiene ficha; si no, «Próximamente». */
const Buy = ({ book, tabIndex, small = false }) =>
  book.omni ? (
    <OmniBuy tabIndex={tabIndex} small={small} />
  ) : onSale(book.key) ? (
    <a className={`btn${small ? ' btn-sm' : ''}`} style={{ '--b': book.fill }} href={amazon(book.key)} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>
      <span className="buy-long"><L>Comprar en Amazon</L></span>
      <span className="buy-short"><L>Comprar</L></span>
    </a>
  ) : (
    // v13: mientras no tenga ficha propia, rey. se lee en el recopilatorio
    <a className={`btn btn-ghost btn-tint${small ? ' btn-sm' : ''}`} style={{ '--b': book.fill, '--bt': book.inkText }} href={OMNI_ANCHOR} tabIndex={tabIndex}>
      <span className="buy-long"><L>Léelo en la trilogía</L></span>
      <span className="buy-short"><L>En la trilogía</L></span>
    </a>
  );

/* Botón del recopilatorio: a Amazon cuando tenga ficha; mientras, «Muy pronto en Amazon». */
function OmniBuy({ tabIndex, small = false }) {
  return onSale(OMNI.key) ? (
    <a className={`btn${small ? ' btn-sm' : ''}`} style={{ '--b': NAVY }} href={trilogyUrl()} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>
      <span className="buy-long"><L>Comprar la trilogía</L></span>
      <span className="buy-short"><L>Comprar</L></span>
    </a>
  ) : (
    <span className={`btn btn-ghost btn-soon${small ? ' btn-sm' : ''}`} style={{ '--b': NAVY, '--bt': NAVY }} aria-disabled="true">
      Muy pronto en Amazon
    </span>
  );
}

/* Enlace al recopilatorio: a Amazon si ya tiene ficha; si no, a su bloque en esta página. */
const omniLink = () => {
  const url = trilogyUrl();
  return url.startsWith('#') ? { href: url } : { href: url, target: '_blank', rel: 'noopener noreferrer' };
};

/* v13: el recopilatorio «me gustas tú. La trilogía», lo primero de la sección de compra */
function Omnibus() {
  return (
    <Reveal className="omni" id={OMNI_ANCHOR.slice(1)}>
      <div className="omni-art">
        <Book3D k="omni" width={220} label="Dar la vuelta a me gustas tú. La trilogía y ver la contraportada" />
      </div>
      <div className="omni-txt">
        <h3 className="omni-title">
          <span className="omni-kicker">Nuevo · {OMNI.sub} en un volumen</span>
          {OMNI.title}
          <span className="omni-dot">.</span>
        </h3>
        <p className="omni-lead">
          La historia completa de Álvaro, de principio a fin: <Title book={MGT} colored={false} />, <Title book={LDR} colored={false} /> y{' '}
          <Title book={REY} colored={false} /> en un solo libro.
        </p>
        <OmniBuy />
      </div>
    </Reveal>
  );
}

const Dots = ({ size = 8, active = -1 }) => (
  <span className="dots" aria-hidden="true" style={{ '--d': `${size}px` }}>
    {BOOKS.map((b, i) => (
      <i key={b.key} className={i === active ? 'is-on' : ''} style={{ background: b.dot }} />
    ))}
  </span>
);

const I = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>,
  pause: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>,
  prev: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>,
  next: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5l11 7-11 7z" /></svg>,
  arrow: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z" /></svg>,
  out: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6h-2V7.4l-7.3 7.3-1.4-1.4L16.6 6H14zM5 6h6v2H6v10h10v-5h2v7H4V6z" /></svg>,
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6 10.6 12 5 6.4z" /></svg>,
  book: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C6.5 4 9.5 4 12 5.6 14.5 4 17.5 4 20 5.5V19c-2.5-1.4-5.5-1.4-8 .2-2.5-1.6-5.5-1.6-8-.2zM11 7.1C9.3 6.2 7.5 6 6 6.6v9.6c1.6-.4 3.4-.2 5 .6zm2 9.7c1.6-.8 3.4-1 5-.6V6.6c-1.5-.6-3.3-.4-5 .5z" /></svg>,
  turn: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 0 1 6.9 6H21l-3.5 4-3.5-4h2.8A5 5 0 1 0 12 17v2a7 7 0 0 1 0-14z" /></svg>,
  left: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 5 8.4 12l7 7 1.4-1.4L11.2 12l5.6-5.6z" /></svg>,
  right: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.6 5 7 7-7 7-1.4-1.4 5.6-5.6-5.6-5.6z" /></svg>,
  drag: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8 3 12l4 4v-3h10v3l4-4-4-4v3H7z" /></svg>
};

/* Aparece al entrar en pantalla; lo que ya está a la vista al cargar nunca se oculta. */
function Reveal({ children, as: Tag = 'div', className = '', delay = 0, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Dentro de las hojas apiladas la propia hoja ya es la entrada: si además el contenido
    // aparece con fundido, al llegar la hoja se ve vacía o a medio pintar (v9.6).
    if (el.closest('.sheet-sec')) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add('rv-pre');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('rv-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <Tag ref={ref} className={`rv ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/* Titular que sube por líneas desde una máscara, como en las páginas de producto de Apple. */
function Rise({ text, as: Tag = 'h2', className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('rise-pre');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          // Si aparece por arriba (al volver hacia atrás se destapa una hoja), sin animación:
          // solo sube cuando entra desde abajo, y empieza antes de verse para no parecer vacío.
          if (e.boundingClientRect.top < window.innerHeight * 0.6) el.classList.add('rise-now');
          el.classList.add('rise-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px 25% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={`rise ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="rise-w" aria-hidden="true">
            <span style={{ transitionDelay: `${i * 45}ms` }}>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
      {children}
    </Tag>
  );
}

const Player = ({ book, compact = false }) => (
  <div className={`player ${compact ? 'player-sm' : ''}`} style={{ '--pl': book.fill }}>
    <div className="pl-meta">
      <span className="pl-label">Sonando:</span>
      <span className="pl-song">“{book.song.name}”</span>
      <span className="pl-artist">{book.song.artist}</span>
    </div>
    <div className="pl-ctrl" aria-hidden="true">
      {I.prev}
      <span className="pl-play">{I.play}</span>
      {I.next}
    </div>
    <div className="pl-bar" aria-hidden="true">
      <i style={{ width: `${[34, 58, 80][book.n - 1]}%` }} />
    </div>
  </div>
);

/* ---------- Hoja de lectura (contraportada y prólogo) ---------- */
function Sheet({ open, onClose, book, kind }) {
  const ref = useRef(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector('.sheet-body')?.scrollTo(0, 0);
    }
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onClose();
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 260);
  };
  const b = book || MGT;
  const prologo = kind === 'prologo';
  return (
    <dialog
      ref={ref}
      className={`sheet ${closing ? 'is-closing' : ''}`}
      aria-labelledby="sheet-title"
      onCancel={e => {
        e.preventDefault();
        close();
      }}
      onClick={e => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="sheet-in">
        <header className="sheet-head">
          <img src={b.cover} alt="" width="1000" height="1500" />
          <div>
            <p className="eyebrow" style={{ color: b.inkText }}>
              {prologo ? 'Prólogo · El principio por el final' : b.omni ? 'Contraportada · La trilogía' : `Contraportada · Libro ${b.n} de 3`}
            </p>
            <h2 id="sheet-title" className="sheet-title">
              <Title book={b} />
            </h2>
          </div>
          <button type="button" className="sheet-close" onClick={close} aria-label="Cerrar">
            {I.close}
          </button>
        </header>
        <div className="sheet-body">
          {prologo ? (
            <>
              <p className="sheet-sonando">
                <span>Sonando:</span> “Experience” de Ludovico Einaudi
              </p>
              {PRO_REST.map((p, i) => (
                <p key={i} className={p.startsWith('–') ? 'dlg' : p === '…' ? 'gap' : p.startsWith('Algún lugar') ? 'place' : ''}>
                  {p}
                </p>
              ))}
            </>
          ) : (
            b.back.map((p, i) => <p key={i}>{p}</p>)
          )}
        </div>
        <footer className="sheet-foot">
          <Buy book={b} />
          <span className="sheet-note">{prologo ? 'Sigue en la primera parte: «El verano que lo cambió todo».' : 'Juanmi Díez'}</span>
        </footer>
      </div>
    </dialog>
  );
}

/* ---------- Navegación ---------- */
const NAV_ITEMS = [
  { label: 'Libros', href: '#libros' },
  { label: 'Prólogo', href: '#leer' },
  { label: 'Canciones', href: '#canciones' },
  { label: 'La trilogía', href: '#trilogia' },
  { label: 'Autor', href: '#autor' }
];

function Header({ active, color, accent, scrolled }) {
  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`} style={{ '--nc': color }}>
      <span className="nav-progress" aria-hidden="true" />
      <div className="nav-in">
        <a className="nav-brand" href="#top" aria-label="Juanmi Díez · volver al principio">
          <Dots size={7} active={accent} />
          <span>Juanmi Díez</span>
        </a>
        <div className="nav-pill">
          <PillNav
            items={NAV_ITEMS}
            activeHref={active}
            theme="light"
            layout="joined"
            size="sm"
            surface="glass"
            hoverEffect="fill"
            indicator="pill"
            highlightColor={color}
            highlightTextColor="#FFFFFF"
            barColor="rgba(249, 245, 236, 0.72)"
            textColor="#3A3026"
            bounce={0.12}
            stretch={0.4}
            collapse="auto"
            ariaLabel="Secciones"
          />
        </div>
        <a className="btn btn-sm nav-buy" style={{ '--b': color }} href="#trilogia">
          <L>Comprar</L>
        </a>
      </div>
    </header>
  );
}

/* ---------- Secciones ---------- */
function Hero() {
  const host = useRef(null);
  const spot = useRef(null);
  const lines = [
    ['Primero te gusta', MGT.dot],
    ['Luego se hace raro', LDR.dot],
    ['Y si aguantas, te corona', REY.dot]
  ];
  return (
    <section className="hero" id="top" ref={host} data-push>
      <HeroStack hostRef={host} spotRef={spot} />
      <div className="wrap hero-in">
        <p className="eyebrow">La trilogía completa · Juanmi Díez</p>
        {/* v13.1: título principal real (<h1>) para Google; se ve exactamente igual */}
        <h1 className="hero-title" aria-label="Primero te gusta. Luego se hace raro. Y si aguantas, te corona.">
          {lines.map(([t, c], i) => (
            <HeroLine key={t} text={t} color={c} order={i} delay={`${0.45 + i * 0.3}s`} />
          ))}
        </h1>
        <p className="hero-sub">
          Tres novelas, una historia: un verano que lo cambió todo, un invierno extraño y la noche en que tu historia deja de ser solo tuya.
        </p>
        <div className="cta-row cta-center">
          {/* v13.2: el principal es la compra (igual que «Comprar» del menú); empezar a leer pasa a secundario */}
          <a className="btn" style={{ '--b': NAVY }} href="#trilogia">
            <L>Comprar la trilogía</L>
          </a>
          <a className="btn-link" href="#libros">
            Empieza por me gustas tú. {I.arrow}
          </a>
        </div>
        <div className="hero-spot" ref={spot} aria-hidden="true" />
      </div>
    </section>
  );
}

function ColdOpen() {
  return (
    <section className="cold sheet-sec" data-push>
      <div className="wrap">
        <FlipSentence
          className="cold-reveal cold-text"
          text="Mi nombre es Álvaro y el 25 de mayo de 2019 puse mi mundo patas arriba."
          flip="mi mundo patas arriba"
          color={MGT.dot}
        />
        <p className="cold-cap">
          Así empieza <Title book={MGT} />
        </p>
      </div>
    </section>
  );
}

function BookCopy({ book, active, side, openSheet }) {
  return (
    <div className={`copy ${active ? 'is-on' : ''}`} aria-hidden={!active} style={{ '--bc': book.inkText, '--dotc': book.dot, '--side': side }}>
      <p className="eyebrow ink">{book.omni ? 'La trilogía en un volumen' : `Libro ${book.n} de 3`}</p>
      <Title book={book} as="h3" className="book-title" />
      <p className="book-tag">{book.tagline}</p>
      <p className="book-lead">{book.lead}</p>
      <blockquote className="book-quote">«{book.quote}»</blockquote>
      {book.omni ? null : <Player book={book} />}
      <div className="cta-row">
        <Buy book={book} tabIndex={active ? 0 : -1} />
        <button type="button" className="btn btn-ghost" onClick={() => openSheet(book, 'back')} tabIndex={active ? 0 : -1}>
          {I.book} <L>Leer la contraportada</L>
        </button>
      </div>
    </div>
  );
}

/* Libros: un carrusel horizontal como los de Instagram o las galerías de Apple.
   Cada libro es una tarjeta a pantalla casi completa y la siguiente asoma por la derecha:
   se ve de un vistazo que hay que deslizar. Barra de progreso en tres tramos, contador y flechas. */
// v13: el carrusel suma una cuarta tarjeta, el recopilatorio
const CARDS = [...BOOKS, OMNI];
const LAST = CARDS.length - 1;

function Books({ openSheet, onBook }) {
  const track = useRef(null);
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [flip, setFlip] = useState(() => CARDS.map(() => false));
  const [hint, setHint] = useState(false);
  const [moved, setMoved] = useState(false);
  const drag = useRef({ on: false, x: 0, left: 0, t: 0, moved: false });
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cardLeft = i => {
    const t = track.current;
    const c = t.children[i];
    return c.offsetLeft - parseFloat(getComputedStyle(t).paddingLeft);
  };
  const go = useCallback(
    i => {
      const n = Math.max(0, Math.min(LAST, i));
      setMoved(true);
      track.current.scrollTo({ left: cardLeft(n), behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced]
  );

  // Progreso continuo según el desplazamiento: mueve la barra, la escala de las tarjetas y el color del menú
  useEffect(() => {
    const t = track.current;
    let raf = 0;
    const on = () => {
      raf = 0;
      const max = t.scrollWidth - t.clientWidth;
      const p = max > 0 ? (t.scrollLeft / max) * LAST : 0;
      setProg(p);
      [...t.children].forEach((c, i) => {
        c.style.setProperty('--d', Math.min(1, Math.abs(i - p)).toFixed(3));
        // Desplazamiento con signo: las tarjetas giran en 3D y el libro da vueltas sobre su eje al deslizar
        c.style.setProperty('--o', Math.max(-1.4, Math.min(1.4, i - p)).toFixed(3));
      });
      const n = Math.round(p);
      setIdx(prev => {
        if (prev !== n) {
          onBook?.(n);
          setFlip(CARDS.map(() => false));
          if (n > 0) setMoved(true);
        }
        return n;
      });
    };
    const sc = () => {
      if (!raf) raf = requestAnimationFrame(on);
    };
    on();
    t.addEventListener('scroll', sc, { passive: true });
    window.addEventListener('resize', sc);
    return () => {
      t.removeEventListener('scroll', sc);
      window.removeEventListener('resize', sc);
    };
  }, [onBook]);

  // Al llegar, el carrusel hace un amago hacia la izquierda para enseñar que hay más.
  useEffect(() => {
    if (reduced) return;
    const t = track.current;
    let t1;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setHint(true);
        t1 = setTimeout(() => t.classList.add('is-nudge'), 700);
      },
      { threshold: 0.5 }
    );
    io.observe(t);
    return () => {
      io.disconnect();
      clearTimeout(t1);
    };
  }, [reduced]);

  // Arrastrar con el ratón (con el dedo y el trackpad ya funciona de forma nativa)
  const down = e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button, .player')) return;
    const t = track.current;
    drag.current = { on: true, x: e.clientX, left: t.scrollLeft, t: performance.now(), moved: false, start: idx };
    t.classList.add('is-drag');
  };
  const move = e => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const up = e => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    const t = track.current;
    t.classList.remove('is-drag');
    const dx = e.clientX - d.x;
    const v = dx / Math.max(60, performance.now() - d.t);
    let n = Math.round(prog);
    if (dx < -60 || v < -0.6) n = d.start + 1;
    else if (dx > 60 || v > 0.6) n = d.start - 1;
    go(n);
  };
  const key = e => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(idx + 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(idx - 1);
    }
  };
  const toggleFlip = i => setFlip(f => f.map((v, j) => (j === i ? !v : v)));

  return (
    <section className="books sheet-sec" id="libros" data-push>
      <div className="bk-pin">
      <div className="wrap">
        <Reveal className="sec-head sl-head">
          <div>
            <p className="eyebrow">Los libros</p>
            <Rise className="h2" text="Una historia en tres libros." />
            <p className="sec-lead">Se leen en orden. Cada uno continúa donde termina el anterior.</p>
          </div>
          <div className="sl-ctrl" aria-hidden="false">
            <span className="sl-count">
              <b>0{idx + 1}</b> / 0{CARDS.length}
            </span>
            <button type="button" className="vnav" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Libro anterior">
              {I.left}
            </button>
            <button type="button" className={`vnav vnav-go ${hint && !moved ? 'is-pulse' : ''}`} onClick={() => go(idx + 1)} disabled={idx === LAST} aria-label="Libro siguiente">
              {I.right}
            </button>
          </div>
        </Reveal>
      </div>
      <div
        className="sl"
        ref={track}
        tabIndex={0}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Los tres libros y la trilogía en un volumen. Usa las flechas para cambiar de libro."
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={e => drag.current.on && up(e)}
        onClickCapture={e => {
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
        onKeyDown={key}
      >
        {CARDS.map((b, i) => (
          <article key={b.key} className={`sl-card ${i === idx ? 'is-on' : ''}`} style={{ '--tint': b.stage, '--bc': b.inkText }} aria-label={b.omni ? 'La trilogía en un solo volumen: me gustas tú.' : `Libro ${b.n} de 3: ${b.title}.`}>
            <div
              className="sl-art"
              onPointerMove={e => {
                if (e.pointerType !== 'mouse') return;
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--hx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
                e.currentTarget.style.setProperty('--hy', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
              }}
              onPointerLeave={e => {
                e.currentTarget.style.setProperty('--hx', 0);
                e.currentTarget.style.setProperty('--hy', 0);
              }}
            >
              <Book3D
                k={b.k3d || b.key}
                mode="still"
                width={250}
                ry={flip[i] ? -158 : i === idx ? 24 : 10}
                tabIndex={i === idx ? 0 : -1}
                label={`${b.title}. Dale la vuelta`}
                onClick={() => (i === idx ? toggleFlip(i) : go(i))}
              />
              <button type="button" className="tool" onClick={() => toggleFlip(i)} aria-pressed={flip[i]} tabIndex={i === idx ? 0 : -1}>
                {I.turn}
                {flip[i] ? 'Ver la portada' : 'Dale la vuelta'}
              </button>
            </div>
            <BookCopy book={b} active side={0} openSheet={openSheet} />
            {i < LAST ? (
              <button type="button" className="sl-next" onClick={() => go(i + 1)} tabIndex={-1} aria-hidden="true">
                <span>
                  Siguiente: {CARDS[i + 1].omni ? <span className="bk">la trilogía</span> : <Title book={CARDS[i + 1]} />}
                </span>
                {I.right}
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="wrap sl-foot">
        <div className="sl-bar" role="tablist" aria-label="Elige un libro">
          {CARDS.map((b, i) => (
            <button key={b.key} type="button" role="tab" aria-selected={i === idx} className={`sl-seg ${i === idx ? 'is-on' : ''}`} style={{ '--sw': b.omni ? '#FBB348' : b.fill }} onClick={() => go(i)}>
              <i style={{ '--f': Math.max(0, Math.min(1, prog - i + 1)) }} />
              {b.omni ? (
                <span data-n="1+2+3">La trilogía</span>
              ) : (
                <span data-n={`${b.n}`}>
                  {b.n} · {b.title}
                  <span style={{ color: b.dot }}>.</span>
                </span>
              )}
            </button>
          ))}
        </div>
        <span className={`sl-hint ${hint && !moved ? 'is-on' : ''}`} aria-hidden="true">
          <span className="sl-hand" /> Desliza para verlos todos
        </span>
      </div>
      </div>
    </section>
  );
}

// v13.1: el adelanto es el arranque real del prólogo (no la nota sobre las canciones)
const PLACE_I = PROLOGO.findIndex(p => p.startsWith('Algún lugar'));
const PLACE = PROLOGO[PLACE_I];
const OPEN = PROLOGO[PLACE_I + 1];
const OPEN_END = OPEN.indexOf('eso ya daba igual.') + 'eso ya daba igual.'.length;
const OPEN_CUT = OPEN.indexOf('Madrid.') + 'Madrid.'.length;
// Al abrirlo, el prólogo sigue justo donde se queda el adelanto
const PRO_REST = [OPEN.slice(OPEN_END).trim(), ...PROLOGO.slice(PLACE_I + 2)];

function Prologo({ openSheet }) {
  // Al abrir el libro: la página de la dedicatoria del autor.
  const page = (
    <span className="pg-ded">
      A mis padres, por apoyar absolutamente todo lo que he querido hacer siempre con mi vida. Pero, sobre todo, a mi hermana Ana, por ser fuente de
      inspiración, orgullo, pegamento y el eterno motor de mi familia.
    </span>
  );
  return (
    <section className="leer sheet-sec" id="leer" data-push>
      <div className="wrap leer-in">
        <Reveal className="leer-art">
          <Book3D k="mgt" mode="open" width={290} page={page} autoOpen label="Abrir el prólogo de me gustas tú." onClick={() => openSheet(MGT, 'prologo')} />
          <span className="leer-hint" aria-hidden="true">Pasa por encima para abrirlo</span>
        </Reveal>
        <Reveal className="leer-copy" delay={80}>
          <p className="eyebrow ink" style={{ '--bc': MGT.inkText }}>
            Empieza a leer · Prólogo de me gustas tú.
          </p>
          <p className="leer-place">{PLACE}</p>
          <p className="leer-quote">{OPEN.slice(0, OPEN_CUT)}</p>
          <p className="leer-more">{OPEN.slice(OPEN_CUT, OPEN_END).trim()}</p>
          <p className="leer-small">El prólogo completo de <Title book={MGT} />, para leer aquí antes de empezar el libro.</p>
          <div className="cta-row">
            <button type="button" className="btn" style={{ '--b': MGT.fill }} onClick={() => openSheet(MGT, 'prologo')}>
              {I.book} <L>Seguir leyendo</L>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Songs() {
  // v13.3: la cinta sigue girando sola; en escritorio se para con el ratón encima, en móvil con el botón (WCAG 2.2.2); fuera de pantalla se para
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(true);
  const mq = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting));
    io.observe(mq.current);
    return () => io.disconnect();
  }, []);
  return (
    <section className="songs sheet-sec" id="canciones" data-push>
      <div className="wrap">
        <Reveal className="sec-head">
          <p className="eyebrow">Sonando:</p>
          <Rise className="h2" text="Cada capítulo tiene su canción." />
        </Reveal>
      </div>
      <div className="marquee" ref={mq} aria-label="Canciones de los tres libros, en orden">
        <ScrollVelocity
          paused={paused || !seen}
          pauseOnHover
          texts={BOOKS.map(b => b.songs.join('   –   ') + '   –   ')}
          velocity={30}
          numCopies={4}
          className="mq-text"
          parallaxClassName="mq-row"
          scrollerClassName="mq-scroller"
          fadeEdges
        />
        <div className="wrap mq-ctl">
          <button type="button" className="mq-pause" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Volver a mover las canciones' : 'Parar las canciones'}>
            {paused ? I.play : I.pause}
            <span>{paused ? 'Seguir' : 'Pausar'}</span>
          </button>
        </div>
      </div>
      <div className="wrap">
        <Reveal className="twist-head">
          <Rise as="h3" className="h3" text="Escucha cada libro." />
          <p className="sec-lead">Tres playlists, una por novela, con las canciones en el orden de los capítulos.</p>
        </Reveal>
        <div className="lists">
          {BOOKS.map((b, i) => (
            <Reveal className="list" key={b.key} delay={i * 90} style={{ '--bc': b.inkText }}>
              <div className="list-top">
                <img src={b.cover} alt="" width="1000" height="1500" loading="lazy" />
                <div>
                  <span className="list-n">Playlist {b.n}</span>
                  <Title book={b} as="h4" className="list-title" />
                </div>
              </div>
              {CAN_EMBED ? (
                <iframe
                  className="spotify"
                  title={`Playlist de ${b.title}`}
                  src={`https://open.spotify.com/embed/playlist/${b.playlist.url.split('/').pop()}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              ) : (
                <Player book={b} compact />
              )}
              <a className="btn btn-ghost btn-full btn-tint" style={{ '--b': b.fill, '--bt': b.inkText }} href={b.playlist.url} target="_blank" rel="noopener noreferrer">
                <L>{CAN_EMBED ? 'Abrir en Spotify' : 'Escuchar en Spotify'}</L> {I.out}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trilogy() {
  return (
    <section className="trilogy sheet-sec" id="trilogia" data-push>
      <div className="wrap">
        <Reveal className="sec-head center">
          <p className="eyebrow">Elige cómo leerla</p>
          <Rise className="h2" text="La trilogía completa." />
          <p className="sec-lead">
            Toda la historia en un solo volumen o libro a libro, empezando por <Title book={MGT} />.
          </p>
        </Reveal>
        <Omnibus />
        <p className="lu-or">O libro a libro</p>
        <div className="lineup">
          {BOOKS.map((b, i) => (
            <Reveal className="lu" key={b.key} delay={i * 110}>
              <div className="lu-art" data-par={[0.05, 0.1, 0.05][i]}>
                <Book3D k={b.key} width={210} label={`Dar la vuelta a ${b.title}. y ver la contraportada`} />
              </div>
              <span className="lu-n">Libro {b.n}</span>
              <Title book={b} as="h3" className="lu-title" />
              <p className="lu-tag">{b.tagline}</p>
              {STORE[b.key] ? (
                <p className="lu-meta">
                  <span>
                    <span className="lu-stars" aria-hidden="true">★</span> {STORE[b.key].rating}
                    <span className="meta-long"> · {STORE[b.key].count} valoraciones en Amazon</span>
                    <span className="meta-short"> ({STORE[b.key].count})</span>
                  </span>
                  <span className="lu-fmt">{STORE[b.key].formats}</span>
                </p>
              ) : (
                <p className="lu-meta lu-meta-soon">
                  <span>
                    <span className="meta-long">Tercera y última parte</span>
                    <span className="meta-short">Muy pronto</span>
                  </span>
                  <span className="lu-fmt">Muy pronto en Amazon</span>
                </p>
              )}
              <Buy book={b} />
            </Reveal>
          ))}
        </div>
        <Reveal className="lu-all">
          <p className="lu-hint">Pasa por encima de un libro para ver su contraportada.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* La foto del autor sobre tres hojas de color, una por libro, que se abren en abanico al llegar
   y siguen al cursor con una leve inclinación. */
function AuthorPhoto() {
  const ref = useRef(null);
  const move = e => {
    if (e.pointerType !== 'mouse') return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    ref.current.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const leave = () => {
    ref.current.style.setProperty('--tx', 0);
    ref.current.style.setProperty('--ty', 0);
  };
  return (
    <div className="aa" ref={ref} onPointerMove={move} onPointerLeave={leave}>
      {BOOKS.map((b, i) => (
        <i key={b.key} className={`aa-card aa-${i + 1}`} style={{ background: b.fill }} />
      ))}
      <div className="author-photo">
        <img src="a/autor.webp" alt="Juanmi Díez, sonriente, con camiseta de rayas marineras." width="900" height="1125" decoding="sync" />
      </div>
    </div>
  );
}

function Author() {
  return (
    <section className="author sheet-sec" id="autor" data-push>
      <div className="wrap author-in">
        <Reveal className="author-art" data-enter>
          <AuthorPhoto />
        </Reveal>
        <Reveal className="author-copy" delay={80}>
          <p className="eyebrow">El autor</p>
          <Rise className="author-name" text="Juanmi Díez" />
          <Dots size={9} />
          {BIO.map((p, i) => (
            <p key={i} className="author-p">
              {p}
            </p>
          ))}
          <a className="btn-link" href={instagram} target="_blank" rel="noopener noreferrer">
            @juanmidiez en Instagram {I.arrow}
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// v12: el punto del cierre da una vuelta de colores (tres botes) al aparecer y descansa;
// pasar el ratón por el titular lo vuelve a lanzar (nada se mueve solo más de 5 s).
function useBounceOnce(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-live', e.isIntersecting), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return () => {
    const el = ref.current;
    if (!el || el.getAnimations().some(a => a.playState === 'running')) return;
    el.classList.remove('is-live');
    void el.offsetWidth;
    el.classList.add('is-live');
  };
}

// v13: en el cierre, a la pila 1-2-3 se le une el recopilatorio
const CLOSE_STACK = ['mgt', 'ldr', 'rey', 'omni'];

function Closing() {
  const host = useRef(null);
  const spot = useRef(null);
  const dot = useRef(null);
  const replay = useBounceOnce(dot);
  // v12: la pila 3D del cierre (WebGL) solo se crea cuando el cierre está a una pantalla de distancia
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '0px 0px 120% 0px' });
    io.observe(host.current);
    return () => io.disconnect();
  }, []);
  return (
    <footer className="close sheet-sec" ref={host}>
      {near ? <HeroStack hostRef={host} spotRef={spot} startOnView books={CLOSE_STACK} label="Los tres libros apilándose en orden y, encima, me gustas tú. La trilogía." /> : null}
      <div className="wrap close-in">
        <Reveal className="close-main">
          <div className="close-spot" ref={spot} aria-hidden="true" />
          <p className="close-big" onPointerEnter={replay}>
            Descubre
            <br />
            la historia<span className="close-dot" ref={dot} aria-hidden="true">.</span>
          </p>
          <div className="close-cta">
            <a className="btn" style={{ '--b': MGT.fill }} {...omniLink()}>
              <L>{onSale(OMNI.key) ? 'Comprar la trilogía completa' : 'Ver la trilogía completa'}</L>
            </a>
            <Seal />
          </div>
        </Reveal>
        <div className="foot">
          <span className="foot-l">
            <Dots size={7} /> <Title book={MGT} colored={false} /> <Title book={LDR} colored={false} /> <Title book={REY} colored={false} />
          </span>
          <span>© Juanmi Díez · Todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}

/* Menú con fondo en cuanto el contenido pasa por debajo */
const useScrolled = () => {
  const [s, setS] = useState(false);
  useEffect(() => {
    const on = () => setS(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return s;
};

/* Transiciones ligadas al scroll: la sección que se va retrocede como una página,
   la foto del autor se descubre y los renders de la trilogía tienen paralaje. */
const useScrollFx = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    // v9.8: los efectos se escriben directamente en el estilo de cada pieza (y solo si cambian).
    // Antes se movían variables CSS heredadas en cada fotograma, y Chrome tenía que recalcular
    // toda la página mientras hacía scroll: no le daba tiempo a pintar y aparecían huecos.
    const put = (el, prop, val) => {
      const c = el.__fx || (el.__fx = {});
      if (c[prop] === val) return;
      c[prop] = val;
      if (prop.startsWith('--')) el.style.setProperty(prop, val);
      else el.style[prop] = val;
    };
    const parts = new Map();
    const partsOf = el => {
      let p = parts.get(el);
      if (!p) {
        let dim = el.querySelector(':scope > .sheet-dim');
        if (!dim) {
          dim = document.createElement('i');
          dim.className = 'sheet-dim';
          dim.setAttribute('aria-hidden', 'true');
          el.appendChild(dim);
        }
        p = {
          lift: [...el.querySelectorAll(':scope > .wrap, :scope > .hero-canvas')],
          tilt: [...el.querySelectorAll('.viewer-grid, .sl')],
          dim,
          hero: el.classList.contains('hero')
        };
        parts.set(el, p);
      }
      return p;
    };
    const bar = document.querySelector('.nav-progress');
    const run = () => {
      raf = 0;
      const vh = window.innerHeight;
      document.documentElement.classList.add('fx-stack');
      // La hoja de más arriba que tapa toda la pantalla y la que tiene justo debajo se pintan;
      // las demás de debajo no se ven y dejan de pintarse (ahorra memoria gráfica).
      const sheets = [...document.querySelectorAll('main > *')];
      let top = -1;
      for (let i = sheets.length - 1; i >= 0; i--) {
        const rr = sheets[i].getBoundingClientRect();
        if (rr.top <= 0.5 && rr.bottom >= vh - 0.5) {
          top = i;
          break;
        }
      }
      document.querySelectorAll('[data-push]').forEach(el => {
        const r = el.getBoundingClientRect();
        const P = partsOf(el);
        // Cada página se queda quieta al llegar abajo y la siguiente se posa encima.
        put(el, '--stick', `${Math.min(0, Math.round(vh - el.offsetHeight))}px`);
        const next = el.nextElementSibling;
        const nt = next ? next.getBoundingClientRect().top : vh;
        const t = Math.round(Math.min(1, Math.max(0, (vh - nt) / (vh * 0.85))) * 1000) / 1000;
        const k = P.hero ? 1 : Math.round(Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.85))) * 1000) / 1000;
        const covered = top > 0 && sheets.indexOf(el) < top - 1;
        const onScreen = r.top < vh && r.bottom > 0 && !covered;
        const active = onScreen && (t > 0.001 || k < 0.999);
        el.classList.toggle('is-covered', covered);
        el.classList.toggle('is-push', active);
        // Las capas gráficas se preparan con antelación (una pantalla antes de que la hoja llegue)
        // para que Chrome no tenga que crearlas y pintarlas en el mismo instante en que aparece.
        el.classList.toggle('is-near', !covered && r.top < vh * 2 && r.bottom > -vh * 0.5);
        P.lift.forEach(w => {
          put(w, 'transform', active ? `translateY(${((1 - k) * 70).toFixed(1)}px) scale(${(1 - t * 0.06).toFixed(4)})` : '');
          const canvas = w.classList.contains('hero-canvas');
          put(w, 'opacity', active && !(canvas && !w.classList.contains('is-ready')) ? (1 - t * (canvas ? 0.45 : 0.55)).toFixed(3) : '');
        });
        P.tilt.forEach(w => {
          put(w, 'transform', active ? `scale(${(1 - t * 0.05).toFixed(4)})` : '');
          put(w, 'opacity', active ? (1 - t * 0.55).toFixed(3) : '');
        });
        put(P.dim, 'opacity', active ? (t * 0.12).toFixed(3) : '0');
      });
      const max = document.documentElement.scrollHeight - vh;
      if (bar) put(bar, 'transform', `scaleX(${(max > 0 ? window.scrollY / max : 0).toFixed(4)})`);
      document.querySelectorAll('[data-enter]').forEach(el => {
        const r = el.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
        put(el, '--enter', (Math.round(t * 100) / 100).toString());
      });
      document.querySelectorAll('[data-par]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        put(el, '--par', `${(-c * parseFloat(el.dataset.par) * 100).toFixed(1)}px`);
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
};

/* Sección activa para el menú: manda la última hoja que ha llegado arriba (las hojas
   apiladas siguen «ocupando» la pantalla por debajo, así que no basta con mirar su caja). */
const SPY = ['libros', 'leer', 'canciones', 'trilogia', 'autor'];
const useSpy = () => {
  const [active, setActive] = useState('');
  useEffect(() => {
    const on = () => {
      const y = window.innerHeight * 0.4;
      let cur = '';
      document.querySelectorAll('main > section, main > footer').forEach(el => {
        if (el.getBoundingClientRect().top <= y) cur = el.id && SPY.includes(el.id) ? `#${el.id}` : '';
      });
      setActive(cur);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return active;
};


/* Las secciones se apilan con position: sticky; para que los enlaces del menú lleven
   a su sitio real, se mide la posición sin el apilado y se desplaza hasta ahí. */
let glideRaf = 0;
const glide = to => {
  cancelAnimationFrame(glideRaf);
  const from = window.scrollY;
  const dist = to - from;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(dist) < 2) return window.scrollTo({ top: to, behavior: 'instant' });
  const dur = Math.min(1300, 450 + Math.abs(dist) * 0.12);
  const t0 = performance.now();
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = now => {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo({ top: from + dist * ease(t), behavior: 'instant' });
    if (t < 1) glideRaf = requestAnimationFrame(step);
  };
  glideRaf = requestAnimationFrame(step);
  const stop = () => cancelAnimationFrame(glideRaf);
  window.addEventListener('wheel', stop, { once: true, passive: true });
  window.addEventListener('touchstart', stop, { once: true, passive: true });
};

const useAnchors = () => {
  useEffect(() => {
    const click = e => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
      const id = a.getAttribute('href').slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      const root = document.documentElement;
      const had = root.classList.contains('fx-stack');
      root.classList.remove('fx-stack');
      const top = el.getBoundingClientRect().top + window.scrollY - (el.closest('.sheet-sec') === el ? 0 : 96);
      if (had) root.classList.add('fx-stack');
      glide(Math.max(0, top));
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, []);
};

export default function App() {
  const [sheet, setSheet] = useState({ open: false, book: null, kind: 'back' });
  const [bookIdx, setBookIdx] = useState(0);
  const active = useSpy();
  const scrolled = useScrolled();
  useScrollFx();
  useAnchors();
  // v12: hasta que React toma el control, en móvil no se enseña el menú de escritorio
  useEffect(() => { document.documentElement.classList.add('is-hyd'); }, []);
  const openSheet = useCallback((book, kind) => setSheet({ open: true, book, kind }), []);
  // Cada sección del menú toma el color de un libro
  const accent = { '#libros': bookIdx < BOOKS.length ? bookIdx : -1, '#leer': 0, '#canciones': 1, '#autor': 2 }[active] ?? -1;
  const color = accent === -1 ? NAVY : BOOKS[accent].fill;
  return (
    <FxProvider>
      <Header active={active} color={color} accent={accent} scrolled={scrolled} />
      <main>
        <Hero />
        <ColdOpen />
        <Books openSheet={openSheet} onBook={setBookIdx} />
        <Prologo openSheet={openSheet} />
        <Songs />
        <Trilogy />
        <Author />
        <Closing />
      </main>
      <Sheet open={sheet.open} book={sheet.book} kind={sheet.kind} onClose={() => setSheet(s => ({ ...s, open: false }))} />
      <DotTrail />
    </FxProvider>
  );
}
