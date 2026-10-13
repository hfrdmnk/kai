/** One adjusted declaration, as written: the shortest form that covers the changed longhands */
export type StyleEdit = {
  /** padding | padding-inline | padding-block | padding-top… | margin… | gap | row-gap | column-gap | font-size | line-height | border-radius | border-top-left-radius… */
  property: string;
  /** px; unitless for line-height */
  from: number;
  to: number;
  /** Project utility class when snapped to the project's scale */
  className?: string;
  /** `var(--x)` when snapped to a CSS custom property */
  token?: string;
};

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
  /** Drag-to-adjust changes; each has a line in `comment` and is applied to the page while the annotation exists */
  edits?: StyleEdit[];
};

export type FabCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Theme = 'system' | 'light' | 'dark';

export type AccentId = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'violet';
