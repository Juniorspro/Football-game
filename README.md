# Football-game

Rezona Football — juego de fútbol arcade con **Three.js**.

## Contenido

- **`rezona_game208.html`** — versión original: un único HTML, render con Three.js
  (r160 vía CDN) y assets `.glb`/BVH desde el CDN de jsDelivr.
- **`react-app/`** — el mismo juego empaquetado como **proyecto React (Vite)**,
  con `three` y `colyseus.js` desde npm.

## Proyecto React (`react-app/`)

Conversión **pragmática**: React es el contenedor y controla el ciclo de vida; el
motor del juego (Three.js) corre **intacto** dentro de un componente.

```bash
cd react-app
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción -> dist/
```

Estructura:

- `src/main.jsx` — entrada React (sin StrictMode: el motor es imperativo y no
  debe inicializarse dos veces).
- `src/App.jsx` — inyecta el markup del juego y arranca el motor en un `useEffect`.
- `src/game/markup.html` — el `<body>` original (pantallas, HUD, canvases), tal cual.
- `src/game/game.js` — módulo principal Three.js. Los imports `three/addons/*` se
  reescribieron a `three/examples/jsm/*` y Colyseus se importa desde npm.
- `src/game/figuritas.js` — módulo de figuritas/álbum.
- `src/styles.css` — el CSS original.

Los assets 3D (`*.glb`, `bvh_pack_v5.json`) se cargan desde el CDN de jsDelivr
(constante `REPO` en `game.js`); se puede cambiar a assets locales en `public/`.

> El proyecto se regenera desde el HTML original con `node scaffold_react.mjs`.
> El `npm run build` compila y empaqueta los 114 módulos sin errores; el juego en
> sí conviene probarlo en un navegador con WebGL.
