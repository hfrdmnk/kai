export type Annotation = {
  id: string;
  selector: string;
  path: string;
  comment: string;
  styles: Record<string, string>;
  rect: { x: number; y: number; w: number; h: number };
  createdAt: string;
  element: string;
  classes: string[];
  nearbyText: string;
  url: string;
  ariaAttributes: Record<string, string>;
  dataAttributes: Record<string, string>;
};

export type FabCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
