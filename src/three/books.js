import * as THREE from 'three';

// Medidas reales en pulgadas (KDP): ancho, alto, grosor de lomo.
import { SPECS } from './specs.js';
export { SPECS };
export const ORDER = ['mgt', 'ldr', 'rey'];

const loader = new THREE.TextureLoader();
// v12: misma petición que las imágenes ya cargadas por la página (mismo origen): se reaprovechan sin volver a descargarse
loader.crossOrigin = undefined;
const load = (url, renderer) =>
  new Promise(res => {
    loader.load(
      url,
      t => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        res(t);
      },
      undefined,
      () => res(null)
    );
  });

// Canto de páginas: crema con líneas finas de hojas.
let edgeCache = null;
function pageEdges() {
  if (edgeCache) return edgeCache;
  const make = vertical => {
    const c = document.createElement('canvas');
    c.width = vertical ? 256 : 32;
    c.height = vertical ? 32 : 256;
    const g = c.getContext('2d');
    g.fillStyle = '#EFE5CF';
    g.fillRect(0, 0, c.width, c.height);
    const n = vertical ? c.width : c.height;
    for (let i = 0; i < n; i += 2) {
      const a = 0.05 + ((i * 7919) % 13) / 260;
      g.fillStyle = `rgba(120, 96, 60, ${a})`;
      if (vertical) g.fillRect(i, 0, 1, c.height);
      else g.fillRect(0, i, c.width, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  edgeCache = { u: make(true), v: make(false) };
  return edgeCache;
}

export async function makeBook(key, renderer, base = 't/', { skipFront = false } = {}) {
  const s = SPECS[key];
  const [front, back, spine] = await Promise.all([
    skipFront ? null : load(`${base}${key}_front.webp`, renderer),
    load(`${base}${key}_back.webp`, renderer),
    load(`${base}${key}_spine.webp`, renderer)
  ]);
  const edges = pageEdges();
  const cover = map => new THREE.MeshStandardMaterial({ map, roughness: 0.52, metalness: 0, transparent: true });
  const paper = map => new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.92, metalness: 0, transparent: true });
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z
  const mats = [paper(edges.u), cover(spine), paper(edges.v), paper(edges.v), cover(front), cover(back)];
  const geo = new THREE.BoxGeometry(s.w, s.h, s.d);
  const mesh = new THREE.Mesh(geo, mats);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { key, ...s };
  return mesh;
}

export function makeStage(canvas, { shadowSize = 22 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xe2d4b8, 2.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-4, 16, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 8;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera;
  sc.left = -shadowSize;
  sc.right = shadowSize;
  sc.top = shadowSize;
  sc.bottom = -shadowSize;
  sc.near = 1;
  sc.far = 60;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff1d6, 0.35);
  rim.position.set(8, 6, -6);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return { renderer, scene, camera, floor, key };
}

export const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
};

// Utilidades de pose
export const qFrom = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'));
export const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
export const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export { THREE };
