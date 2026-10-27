// Prerenderiza la web: compila la entrada de servidor, pinta <App/> a HTML y lo mete en dist/index.html.
// Lee SITE_CONFIG del propio index.html para que los enlaces salgan iguales que en el navegador.
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { build } from 'vite';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const dist = process.argv[2] || 'dist';
const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
const cfgSrc = html.match(/window\.SITE_CONFIG\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
const SITE_CONFIG = cfgSrc ? Function(`return (${cfgSrc[1]})`)() : {};
globalThis.__SITE_CONFIG__ = SITE_CONFIG;
globalThis.__SSR_HOST__ = process.env.SSR_HOST || 'megustastu.pages.dev';

await build({ logLevel: 'warn', build: { ssr: 'src/entry-server.jsx', outDir: 'dist-ssr', emptyOutDir: true, copyPublicDir: false } });
const { render } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.mjs')).href);
const app = render();

if (!html.includes('<div id="root"></div>')) throw new Error('no encuentro <div id="root"></div>');
// precarga de las fuentes del primer pantallazo (texto del hero y botones)
const fonts = readdirSync(path.join(dist, 'assets')).filter(f => /^(libre-caslon-text-latin-400-normal|poppins-latin-500-normal|poppins-latin-400-normal).*\.woff2$/.test(f));
const pre = fonts.map(f => `<link rel="preload" as="font" type="font/woff2" href="./assets/${f}" crossorigin>`).join('');
const three = readdirSync(path.join(dist, 'assets')).filter(f => /^HeroStack-.*\.js$/.test(f)).map(f => `<link rel="modulepreload" href="./assets/${f}">`).join('');
// texturas de la pila del hero (las mismas que pide HeroStack: móvil a media resolución)
const tex = ['mgt', 'ldr', 'rey'].flatMap(k => ['back', 'spine'].flatMap(f => [
  `<link rel="preload" as="image" href="./t/s/${k}_${f}.webp" media="(max-width: 699px)">`,
  `<link rel="preload" as="image" href="./t/${k}_${f}.webp" media="(min-width: 700px)">`
])).join('');
writeFileSync(path.join(dist, 'index.html'), html.replace('</head>', pre + three + tex + "</head>").replace('<div id="root"></div>', `<div id="root">${app}</div>`));
rmSync('dist-ssr', { recursive: true, force: true });
console.log('prerender ok', (app.length / 1024).toFixed(1) + ' KB de HTML');
