// Scaffolds a Vite + React project (react-app/) from the original Three.js
// single-HTML game (rezona_game208.html), keeping the game engine intact.
// Run from repo root:  node scaffold_react.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'rezona_game208.html';
const html = readFileSync(SRC, 'utf8');

function between(start, end, from = 0) {
  const a = html.indexOf(start, from); if (a < 0) throw new Error('missing ' + start);
  const b = html.indexOf(end, a + start.length); if (b < 0) throw new Error('missing ' + end);
  return { text: html.slice(a + start.length, b), endIdx: b + end.length };
}

// --- CSS ---
const css = between('<style>', '</style>').text;

// --- body markup (from <body> up to the first <script ...>) ---
const bodyStart = html.indexOf('<body>') + '<body>'.length;
const firstScript = html.indexOf('<script', bodyStart);
const markup = html.slice(bodyStart, firstScript).trim();

// --- the two <script type="module"> blocks: main game + figuritas ---
const m1 = between('<script type="module">', '</script>');
const m2 = between('<script type="module">', '</script>', m1.endIdx);
let game = m1.text.trim();
let figuritas = m2.text.trim();

// rewrite addon imports for the npm `three` package, and pull colyseus from npm
game = game.replace(/three\/addons\//g, 'three/examples/jsm/');
game = `import * as Colyseus from 'colyseus.js';\n` + game;

mkdirSync('react-app/src/game', { recursive: true });
mkdirSync('react-app/public', { recursive: true });

writeFileSync('react-app/src/styles.css', css.trim() + '\n');
writeFileSync('react-app/src/game/markup.html', markup + '\n');
writeFileSync('react-app/src/game/game.js', game + '\n');
writeFileSync('react-app/src/game/figuritas.js', figuritas + '\n');

writeFileSync('react-app/package.json', JSON.stringify({
  name: 'rezona-football',
  private: true,
  version: '1.0.0',
  type: 'module',
  scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
  dependencies: {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    three: '0.160.0',
    'colyseus.js': '^0.16.0'
  },
  devDependencies: {
    '@vitejs/plugin-react': '^4.3.1',
    vite: '^5.4.0'
  }
}, null, 2) + '\n');

writeFileSync('react-app/vite.config.js',
`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
});
`);

writeFileSync('react-app/index.html',
`<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
  <title>Rezona Football</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`);

writeFileSync('react-app/src/main.jsx',
`import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

// NOTE: no React.StrictMode — the game engine mounts imperatively and must not
// be double-initialised (StrictMode runs effects twice in dev).
createRoot(document.getElementById('root')).render(<App />);
`);

writeFileSync('react-app/src/App.jsx',
`import { useEffect, useRef } from 'react';
// The original game markup (all screens / HUD / canvases), kept byte-for-byte.
import markup from './game/markup.html?raw';

// Pragmatic React wrapper: React owns the container + lifecycle; the Three.js
// game engine (game.js + figuritas.js) runs unchanged inside it.
export default function App() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;   // guard against double-init
    started.current = true;
    (async () => {
      // markup is already in the DOM (committed above) before these run, so the
      // engine's getElementById(...) calls resolve. Order matches the original.
      await import('./game/game.js');
      await import('./game/figuritas.js');
    })();
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
`);

writeFileSync('react-app/.gitignore', 'node_modules\ndist\n*.local\n.vite\n');

writeFileSync('react-app/README.md',
`# Rezona Football — React (Vite)

Pragmatic React port of the original Three.js game. React owns the container and
lifecycle; the original game engine runs intact inside \`src/App.jsx\`.

## Run

\`\`\`bash
cd react-app
npm install
npm run dev      # dev server
npm run build    # production build -> dist/
\`\`\`

## Layout

- \`src/main.jsx\` — React entry (no StrictMode; the engine is imperative).
- \`src/App.jsx\` — mounts the game markup and boots the engine.
- \`src/game/markup.html\` — original HTML body (screens, HUD, canvases), raw.
- \`src/game/game.js\` — main game module (Three.js). \`three/addons/*\` imports
  rewritten to \`three/examples/jsm/*\`; Colyseus imported from npm.
- \`src/game/figuritas.js\` — stickers/album module.
- \`src/styles.css\` — original CSS.

3D assets (\`*.glb\`, \`bvh_pack_v5.json\`) load from the jsDelivr CDN (the \`REPO\`
constant in \`game.js\`); change it to use local \`public/\` assets if you prefer.
`);

console.log('React project scaffolded into react-app/');
console.log('  styles.css :', css.length, 'chars');
console.log('  markup     :', markup.length, 'chars');
console.log('  game.js    :', game.length, 'chars');
console.log('  figuritas  :', figuritas.length, 'chars');
