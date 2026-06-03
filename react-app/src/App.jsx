import { useEffect, useRef } from 'react';
import markup from './game/markup.html?raw';   // original HTML body, both blocks

// Pragmatic React wrapper: React owns the container + lifecycle; the Three.js
// game engine (game.js + figuritas.js) runs unchanged inside it.
export default function App() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      // markup is in the DOM (committed) before these run, so getElementById works.
      await import('./game/game.js');       // main module first (as in the original)
      await import('./game/figuritas.js');  // then stickers/daily/quests/store
    })();
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
