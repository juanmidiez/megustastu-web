import { makeBook, makeStage, THREE, ORDER, SPECS } from './three/books.js';
const canvas = document.getElementById('c');
const { renderer, scene, camera } = makeStage(canvas);
renderer.setPixelRatio(1);
const lying = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,-1), new THREE.Vector3(1,0,0), new THREE.Vector3(0,-1,0)));
const shot = (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.render(scene, camera); return canvas.toDataURL('image/png'); };
(async () => {
  const books = {};
  for (const k of ORDER) books[k] = await makeBook(k, renderer);
  const out = {};
  // Cada libro de pie, tres cuartos
  for (const k of ORDER) {
    Object.values(books).forEach(b => scene.remove(b));
    const b = books[k]; b.quaternion.identity(); b.rotation.set(0, 0.42, 0); b.position.set(0, SPECS[k].h / 2, 0); scene.add(b);
    camera.position.set(0, 6.0, 22); camera.lookAt(0, 4.6, 0);
    out[k] = shot(1500, 2000);
  }
  // Pila
  Object.values(books).forEach(b => scene.remove(b));
  let y = 0;
  for (const k of ORDER) { const b = books[k]; b.rotation.set(0,0,0); b.quaternion.copy(lying); b.position.set(0, y + SPECS[k].d / 2, 0); y += SPECS[k].d; scene.add(b); }
  camera.position.set(0, 5.2, 18); camera.lookAt(0, 1.1, 0);
  out.stack = shot(2400, 1350);
  window.__out = out; document.title = 'ready';
})();
