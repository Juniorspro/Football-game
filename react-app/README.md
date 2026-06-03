# Rezona Football — React (Vite)

Pragmatic React port of the Three.js game. React owns the container/lifecycle;
the original game engine runs intact inside `src/App.jsx`. Includes the full
body markup (both blocks), so daily/quests/leagues/store/album work.

## Run

```bash
cd react-app
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

- `src/game/game.js` — main Three.js module. `three/addons/*` -> `three/examples/jsm/*`;
  Colyseus from npm; 3D assets served from `public/` via `import.meta.env.BASE_URL`.
- `src/game/figuritas.js` — stickers/album/daily/quests/store/leagues module.
- `src/game/markup.html` — original HTML body (both blocks), raw.
- `public/*.glb`, `public/bvh_pack_v5.json` — 3D assets.

A standalone single-file build of the same game lives at `../index.html`.
