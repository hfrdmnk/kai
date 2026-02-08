import type { Annotation } from '../types.ts';

export const createMarkerManager = (shadowRoot: ShadowRoot) => {
  const markerMap = new Map<string, HTMLElement>();
  let currentAnnotations: Annotation[] = [];
  let rafId = 0;

  const reposition = () => {
    for (const annotation of currentAnnotations) {
      const marker = markerMap.get(annotation.id);
      if (!marker) continue;

      const target = document.querySelector(annotation.selector);
      if (!target) {
        marker.style.display = 'none';
        continue;
      }

      const rect = target.getBoundingClientRect();
      marker.style.display = 'flex';
      marker.style.top = `${rect.top - 8}px`;
      marker.style.left = `${rect.right - 8}px`;
    }

    rafId = requestAnimationFrame(reposition);
  };

  const update = (annotations: Annotation[]) => {
    currentAnnotations = annotations;

    const activeIds = new Set(annotations.map(a => a.id));
    for (const [id, el] of markerMap) {
      if (!activeIds.has(id)) {
        el.remove();
        markerMap.delete(id);
      }
    }

    annotations.forEach((annotation, i) => {
      let marker = markerMap.get(annotation.id);
      if (!marker) {
        marker = document.createElement('div');
        marker.className = 'kai-marker';
        marker.setAttribute('aria-hidden', 'true');
        shadowRoot.appendChild(marker);
        markerMap.set(annotation.id, marker);
      }
      marker.textContent = String(i + 1);
    });
  };

  const destroy = () => {
    cancelAnimationFrame(rafId);
    for (const el of markerMap.values()) el.remove();
    markerMap.clear();
  };

  rafId = requestAnimationFrame(reposition);

  return { update, destroy };
};
