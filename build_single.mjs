// Builds a single self-contained HTML (rezona_game_babylon.html) by inlining
// babylon-three-shim.js into the import map as a data: URL module.
// Run: node build_single.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const shim = readFileSync('babylon-three-shim.js');
const shimB64 = shim.toString('base64');
const threeURL = `data:text/javascript;base64,${shimB64}`;
// tiny stub re-exporting everything from 'three' (resolved via the same map)
const stubB64 = Buffer.from('export * from "three";', 'utf8').toString('base64');
const stubURL = `data:text/javascript;base64,${stubB64}`;

const addons = [
  'three/addons/loaders/GLTFLoader.js',
  'three/addons/loaders/BVHLoader.js',
  'three/addons/utils/BufferGeometryUtils.js',
  'three/addons/postprocessing/EffectComposer.js',
  'three/addons/postprocessing/RenderPass.js',
  'three/addons/postprocessing/ShaderPass.js',
  'three/addons/postprocessing/UnrealBloomPass.js',
  'three/addons/postprocessing/OutputPass.js'
];

const imports = { three: threeURL };
for (const a of addons) imports[a] = stubURL;
const importmap = JSON.stringify({ imports }, null, 2);

const newBlock =
`<!-- ===== Babylon.js engine (real renderer) ===== -->
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>

<!-- ===== THREE.js API → Babylon.js compatibility layer (inlined, single file) =====
     The game code below is unchanged: it still \`import\`s from 'three' and
     'three/addons/*'. Those specifiers resolve to the compatibility shim, which
     is embedded here as a data: URL module so this is ONE self-contained HTML.
     Source of the shim: babylon-three-shim.js (regenerate with build_single.mjs). -->
<script type="importmap">
${importmap}
</script>`;

let html = readFileSync('rezona_game_babylon.html', 'utf8');

// Replace everything from the Babylon CDN comment (or the importmap) through the
// closing </script> of the import map with the freshly built block.
const startMarkers = ['<!-- ===== Babylon.js engine', '<script type="importmap">'];
let start = -1;
for (const m of startMarkers) { const i = html.indexOf(m); if (i !== -1) { start = i; break; } }
if (start === -1) throw new Error('could not locate import map region');
const mapOpen = html.indexOf('<script type="importmap">', start);
const mapClose = html.indexOf('</script>', mapOpen);
if (mapOpen === -1 || mapClose === -1) throw new Error('could not locate import map script');
const end = mapClose + '</script>'.length;

html = html.slice(0, start) + newBlock + html.slice(end);
writeFileSync('rezona_game_babylon.html', html);
console.log(`Inlined shim (${shimB64.length} b64 chars). Single-file HTML written.`);
