import type { Annotation, ExportPayload } from '../types.ts';

export const toJSON = (annotations: Annotation[]): string => {
  const payload: ExportPayload = {
    url: location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    exportedAt: new Date().toISOString(),
    annotations,
  };
  return JSON.stringify(payload, null, 2);
};
