import { useEffect, useRef } from 'react';
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
