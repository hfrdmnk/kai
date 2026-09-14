export type Annotation = {
  id: string;
  selector: string;
  /** Positional chain that pins the exact element; see generateLocator. Absent on sessions saved before it existed. */
  locator?: string;
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

export type Theme = 'system' | 'light' | 'dark';

export type AccentId = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet';
