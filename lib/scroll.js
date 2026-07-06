// Tiny module-level store so any component (e.g. the progress rail) can drive
// the single Lenis instance created by <SmoothScroll>.
let lenisInstance = null;

export function setLenis(lenis) {
  lenisInstance = lenis;
}

export function getLenis() {
  return lenisInstance;
}
