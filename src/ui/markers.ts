import type { Annotation } from '../types.ts';

export const createMarkerManager = (
  shadowRoot: ShadowRoot,
  onMarkerClick: (annotation: Annotation, markerRect: DOMRect) => void,
) => {
  const markerMap = new Map<string, HTMLElement>();
  const boxMap = new Map<string, HTMLElement>();
  let currentAnnotations: Annotation[] = [];
  let rafId = 0;

  let previewMarker: HTMLElement | null = null;
  let previewBox: HTMLElement | null = null;
  let previewTarget: Element | null = null;

  const reposition = () => {
    for (const annotation of currentAnnotations) {
      const marker = markerMap.get(annotation.id);
      if (!marker) continue;

      const target = document.querySelector(annotation.selector);
      if (!target) {
        marker.style.display = 'none';
        const box = boxMap.get(annotation.id);
        if (box) box.style.display = 'none';
        continue;
      }

      const rect = target.getBoundingClientRect();
      marker.style.display = 'flex';
      marker.style.top = `${rect.top - 8}px`;
      marker.style.left = `${rect.right - 8}px`;

      const box = boxMap.get(annotation.id);
      if (box) {
        const gap = 4;
        box.style.display = 'block';
        box.style.top = `${rect.top - gap}px`;
        box.style.left = `${rect.left - gap}px`;
        box.style.width = `${rect.width + gap * 2}px`;
        box.style.height = `${rect.height + gap * 2}px`;
      }
    }

    if (previewTarget && previewMarker && previewBox) {
      const pRect = previewTarget.getBoundingClientRect();
      const gap = 4;
      previewMarker.style.top = `${pRect.top - 8}px`;
      previewMarker.style.left = `${pRect.right - 8}px`;
      previewBox.style.top = `${pRect.top - gap}px`;
      previewBox.style.left = `${pRect.left - gap}px`;
      previewBox.style.width = `${pRect.width + gap * 2}px`;
      previewBox.style.height = `${pRect.height + gap * 2}px`;
    }

    rafId = requestAnimationFrame(reposition);
  };

  const update = (annotations: Annotation[]) => {
    currentAnnotations = annotations;

    const activeIds = new Set(annotations.map(a => a.id));

    // Cleanup stale markers and boxes
    for (const [id, el] of markerMap) {
      if (!activeIds.has(id)) {
        el.remove();
        markerMap.delete(id);
      }
    }
    for (const [id, el] of boxMap) {
      if (!activeIds.has(id)) {
        el.remove();
        boxMap.delete(id);
      }
    }

    annotations.forEach((annotation, i) => {
      // Marker
      let marker = markerMap.get(annotation.id);
      if (!marker) {
        marker = document.createElement('div');
        marker.className = 'kai-marker';
        marker.setAttribute('role', 'button');
        marker.setAttribute('tabindex', '0');
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const el = e.currentTarget as HTMLElement;
          onMarkerClick(annotation, el.getBoundingClientRect());
        });
        shadowRoot.appendChild(marker);
        markerMap.set(annotation.id, marker);
      }
      marker.textContent = String(i + 1);
      marker.setAttribute('aria-label', `Annotation ${i + 1}: ${annotation.comment.slice(0, 50)}`);

      // Box
      let box = boxMap.get(annotation.id);
      if (!box) {
        box = document.createElement('div');
        box.className = 'kai-annotation-box';
        shadowRoot.appendChild(box);
        boxMap.set(annotation.id, box);
      }
    });
  };

  const clearPreview = () => {
    previewMarker?.remove();
    previewBox?.remove();
    previewMarker = null;
    previewBox = null;
    previewTarget = null;
  };

  const showPreview = (element: Element, number: number): DOMRect => {
    clearPreview();

    const rect = element.getBoundingClientRect();
    const gap = 4;

    const box = document.createElement('div');
    box.className = 'kai-annotation-box';
    box.style.top = `${rect.top - gap}px`;
    box.style.left = `${rect.left - gap}px`;
    box.style.width = `${rect.width + gap * 2}px`;
    box.style.height = `${rect.height + gap * 2}px`;
    shadowRoot.appendChild(box);

    const marker = document.createElement('div');
    marker.className = 'kai-marker';
    marker.textContent = String(number);
    marker.style.pointerEvents = 'none';
    marker.style.top = `${rect.top - 8}px`;
    marker.style.left = `${rect.right - 8}px`;
    shadowRoot.appendChild(marker);

    previewMarker = marker;
    previewBox = box;
    previewTarget = element;

    return new DOMRect(rect.right - 8, rect.top - 8, 22, 22);
  };

  const destroy = () => {
    cancelAnimationFrame(rafId);
    clearPreview();
    for (const el of markerMap.values()) el.remove();
    markerMap.clear();
    for (const el of boxMap.values()) el.remove();
    boxMap.clear();
  };

  rafId = requestAnimationFrame(reposition);

  return { update, showPreview, clearPreview, destroy };
};
