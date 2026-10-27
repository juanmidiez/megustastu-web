import { createRoot, hydrateRoot } from 'react-dom/client';
// v12: fuentes servidas desde la propia web (antes, Google Fonts bloqueaba el primer pintado)
import '@fontsource/libre-caslon-text/latin-400.css';
import '@fontsource/libre-caslon-text/latin-400-italic.css';
import '@fontsource/libre-caslon-text/latin-700.css';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import './fonts.css';
import './styles.css';
import App from './App.jsx';

// el 3D del hero empieza a descargarse ya, en paralelo (va en su propio archivo)
import('./three/HeroStack.jsx');

// v12: las cubiertas grandes (libros 3D más abajo) ya no compiten con el JS al cargar:
// se piden en cuanto React toma el control (ver .b3-face en styles.css).

// v12: la página llega ya pintada en el HTML (prerenderizada al compilar) y React solo la «despierta».
// Se despierta justo después del primer pintado, para que el texto salga antes de ejecutar el JS pesado.
const root = document.getElementById('root');
window.__SSR = root.hasChildNodes(); // el titular ya entró con CSS: React no lo repite
const start = () => { return root.hasChildNodes() ? hydrateRoot(root, <App />) : createRoot(root).render(<App />); };
requestAnimationFrame(() => setTimeout(start, 0));
