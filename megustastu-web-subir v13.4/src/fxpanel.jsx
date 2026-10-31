import { useState } from 'react';
import { FX_LIST } from './propuesta.jsx';

export default function FxPanel({ fx, setFx }) {
  const [open, setOpen] = useState(typeof window !== 'undefined' && window.innerWidth > 900);
  const on = FX_LIST.filter(f => fx[f.k]).length;
  return (
    <aside className={`fxp ${open ? 'is-open' : ''}`} aria-label="Propuesta de mejoras">
      <button type="button" className="fxp-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="fxp-dot" />
        Propuesta React Bits <b>{on}/{FX_LIST.length}</b>
        <span className="fxp-car" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open ? (
        <div className="fxp-body">
          {FX_LIST.map(f => (
            <label key={f.k} className="fxp-row">
              <input type="checkbox" checked={!!fx[f.k]} onChange={e => setFx(s => ({ ...s, [f.k]: e.target.checked }))} />
              <span className="fxp-sw" aria-hidden="true" />
              <span className="fxp-txt">
                <b>
                  {f.n} · {f.name}
                </b>
                <small>{f.where}</small>
              </span>
            </label>
          ))}
          <p className="fxp-note">Enciende y apaga cada una para comparar. Este panel no sale en la web publicada.</p>
        </div>
      ) : null}
    </aside>
  );
}
