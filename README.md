# Football-game

Rezona Football — juego de fútbol arcade (HTML único).

## Versiones

- **`rezona_game208.html`** — versión original, renderizada con **Three.js** (r160 vía CDN).
- **`rezona_game_babylon.html`** — misma versión del juego corriendo sobre **Babylon.js**.

### Cómo funciona la versión Babylon

El código del juego es idéntico al original: sigue escribiéndose contra la API de
Three.js. Lo que cambia es a dónde resuelven sus `import`:

- Se carga **Babylon.js** (motor real) por CDN.
- Un **`importmap`** redirige `three` y `three/addons/*` a **`babylon-three-shim.js`**.
- Ese shim reimplementa la parte de la API de Three.js que el juego usa
  (grafo de escena, `Vector3`/`Quaternion`/`Euler`/`Matrix4`/`Box3`, geometrías,
  materiales, luces, cámara, `Raycaster`, `AnimationMixer`, `BVHLoader`,
  `GLTFLoader` y el post-proceso de *bloom*) **encima de Babylon.js**.

Cada `THREE.Mesh` crea una malla Babylon equivalente y, en cada frame, se
sincroniza su matriz mundial; Babylon hace todo el dibujado, las sombras y el
post-proceso. Los modelos GLB se importan con `SceneLoader` de Babylon y se
reexponen como mallas para que la lógica de juego (bounding boxes, *merge*,
*culling*) siga funcionando, reutilizando los materiales PBR (conserva texturas).

> La capa de compatibilidad vive en `babylon-three-shim.js`. La lógica pura
> (matemáticas, grafo de escena, mixer de animación y parser BVH) está cubierta
> por pruebas; el render/GPU conviene validarlo en un navegador con WebGL.
