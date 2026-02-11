import type { Annotation } from '../types.ts';
import { iconKai } from '../icons.ts';

const parser = new DOMParser();

const createMarkerIcon = (): SVGElement => {
  const doc = parser.parseFromString(iconKai, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGElement;
  svg.setAttribute('width', '12');
  svg.setAttribute('height', '12');
  svg.setAttribute('stroke-width', '2.5');
  return svg;
};

export const createMarkerManager = (
  shadowRoot: ShadowRoot,
  onMarkerClick: (annotation: Annotation, markerRect: DOMRect) => void,
  onMarkerEnter?: (annotationId: string) => void,
  onMarkerLeave?: (annotationId: string) => void,
) => {
  const markerMap = new Map<string, HTMLElement>();
  const boxMap = new Map<string, HTMLElement>();
  const visibleBoxes = new Set<string>();
  let currentAnnotations: Annotation[] = [];
  let rafId = 0;

  let previewMarker: HTMLElement | null = null;
  let previewBox: HTMLElement | null = null;
  let previewTarget: Element | null = null;
  let isActive = false;

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
        if (!visibleBoxes.has(annotation.id)) {
          box.style.display = 'none';
        } else {
          const gap = 4;
          box.style.display = 'block';
          box.style.top = `${rect.top - gap}px`;
          box.style.left = `${rect.left - gap}px`;
          box.style.width = `${rect.width + gap * 2}px`;
          box.style.height = `${rect.height + gap * 2}px`;
        }
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

    annotations.forEach((annotation) => {
      // Marker
      let marker = markerMap.get(annotation.id);
      if (!marker) {
        marker = document.createElement('div');
        marker.className = isActive ? 'kai-marker' : 'kai-marker kai-marker--inactive';
        marker.setAttribute('role', 'button');
        marker.setAttribute('tabindex', '0');
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const el = e.currentTarget as HTMLElement;
          onMarkerClick(annotation, el.getBoundingClientRect());
        });
        marker.addEventListener('mouseenter', () => onMarkerEnter?.(annotation.id));
        marker.addEventListener('mouseleave', () => onMarkerLeave?.(annotation.id));
        shadowRoot.appendChild(marker);
        markerMap.set(annotation.id, marker);
      }
      if (!marker.querySelector('svg')) marker.appendChild(createMarkerIcon());
      marker.setAttribute('aria-label', `Annotation: ${annotation.comment.slice(0, 50)}`);

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

  const showPreview = (element: Element): DOMRect => {
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
    marker.appendChild(createMarkerIcon());
    marker.style.pointerEvents = 'none';
    marker.style.top = `${rect.top - 8}px`;
    marker.style.left = `${rect.right - 8}px`;
    shadowRoot.appendChild(marker);

    previewMarker = marker;
    previewBox = box;
    previewTarget = element;

    return new DOMRect(rect.right - 8, rect.top - 8, 22, 22);
  };

  const showBox = (id: string) => {
    visibleBoxes.add(id);
  };

  const hideBox = (id: string) => {
    visibleBoxes.delete(id);
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

  const setActive = (active: boolean) => {
    isActive = active;
    for (const marker of markerMap.values()) {
      marker.classList.toggle('kai-marker--inactive', !active);
    }
  };

  const getMarkerRect = (id: string): DOMRect | undefined => {
    return markerMap.get(id)?.getBoundingClientRect();
  };

  return { update, showPreview, clearPreview, showBox, hideBox, setActive, destroy, getMarkerRect };
};
