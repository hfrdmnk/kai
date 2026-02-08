export type Annotation = {
  id: string;
  selector: string;
  path: string;
  comment: string;
  styles: Record<string, string>;
  rect: { x: number; y: number; w: number; h: number };
  createdAt: string;
};

export type ExportPayload = {
  url: string;
  viewport: { width: number; height: number };
  exportedAt: string;
  annotations: Annotation[];
};
