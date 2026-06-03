# Rezona Football — React (Vite)

Pragmatic React port of the original Three.js game. React owns the container and
lifecycle; the original game engine runs intact inside `src/App.jsx`.

## Run

```bash
cd react-app
npm install
npm run dev      # dev server
npm run build    # production build -> dist/
```

## Layout

- `src/main.jsx` — React entry (no StrictMode; the engine is imperative).
- `src/App.jsx` — mounts the game markup and boots the engine.
- `src/game/markup.html` — original HTML body (screens, HUD, canvases), raw.
- `src/game/game.js` — main game module (Three.js). `three/addons/*` imports
  rewritten to `three/examples/jsm/*`; Colyseus imported from npm.
- `src/game/figuritas.js` — stickers/album module.
- `src/styles.css` — original CSS.

3D assets (`*.glb`, `bvh_pack_v5.json`) load from the jsDelivr CDN (the `REPO`
constant in `game.js`); change it to use local `public/` assets if you prefer.
