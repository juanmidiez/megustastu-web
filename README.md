# megustastu-web

Web de la trilogía **me gustas tú. · los días raros. · rey.** de Juanmi Díez.
En línea: https://megustastu.pages.dev (Cloudflare Pages, proyecto «megustastu»).

## Lo que se edita a mano

En `index.html`, bloque **EDITA AQUÍ**:

- `mgt`, `ldr`, `rey`: enlace de Amazon de cada libro. Si `rey` está vacío, su botón lleva al recopilatorio.
- `trilogia`: enlace de Amazon del recopilatorio «me gustas tú. La trilogía». Mientras esté vacío, la web dice «Muy pronto en Amazon».

La etiqueta `google-site-verification` del `<head>` es la verificación de Google Search Console: no quitarla.

## Publicar

El proyecto «megustastu» de Cloudflare Pages está conectado a este repositorio: cada cambio que se sube a `main` se compila (`npm run build`, carpeta `dist`) y se publica solo.

Alternativas:

- A mano: `npm run build` y subir la carpeta `dist` en Cloudflare → megustastu → Create deployment → Production.
- GitHub Actions (`.github/workflows/publicar.yml`, solo manual): necesita los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (`721c1b1b718e91e055409f64170d079f`).

## Trabajar en local

```bash
npm install
npm run dev      # vista previa con recarga
npm run build    # genera dist/ (HTML prerenderizado)
```

## Estructura

- `src/App.jsx`: secciones de la web. `src/data.js`: textos, libros, recopilatorio y enlaces.
- `src/three/`: pila de libros en 3D (three.js). `src/puntos.jsx`: los puntos que viajan.
- `src/prologo.json`: texto del prólogo.
- `public/`: imágenes, texturas de los libros (`t/`), iconos, `robots.txt`, `sitemap.xml`, `_headers`.
- `scripts/prerender.mjs`: escribe el HTML de la página al compilar (para Google y para que cargue antes).
