# kai — Project Conventions

## Stack

- **Language**: TypeScript (strict mode, `target: ES2022`)
- **Build**: Vite in library mode (rolldown-vite)
- **Package manager**: Bun
- **Runtime deps**: Zero — vanilla DOM APIs only
- **Output format**: IIFE

## Commands

```bash
bun install        # install deps
bun run dev        # dev server
bun run build      # typecheck + build
bun run preview    # preview production build
```

## Architecture constraints

- Single Web Component (`<ui-annotator>`) with **closed Shadow DOM**
- All CSS is embedded inside the Shadow DOM via `<style>` tags — no external CSS files
- All SVG icons are inlined as template literal strings — no external asset requests
- Build output is two self-contained files: `dist/kai.js` (readable) and `dist/kai.min.js` (minified)
- No frameworks, no runtime deps — vanilla DOM only

## Code style

- No classes for UI elements — prefer functions that return `HTMLElement`
- Inline all SVG and CSS as template literal strings
- Use `px→rem` display convention (show rem equivalent inline in UI)
- Prefer `const` and arrow functions
- Name files in kebab-case

## File structure

```
src/
├── annotator.ts          # Main Web Component class, entry point
├── icons.ts              # SVG icons as exported template literals
├── styles.ts             # Shadow DOM CSS as a single exported string
├── core/                 # Pure logic, no DOM rendering
│   ├── selector.ts       # CSS selector generation
│   ├── styles.ts         # Computed style extraction & px→rem
│   ├── css-vars.ts       # CSS custom property harvesting
│   └── session.ts        # localStorage session persistence
├── ui/                   # DOM-creating functions
│   ├── highlight.ts      # Hover overlay + tooltip
│   ├── panel.ts          # Annotation input panel
│   ├── drawer.ts         # Annotation list sidebar
│   ├── markers.ts        # Numbered badges on annotated elements
│   ├── autocomplete.ts   # CSS var dropdown
│   └── toast.ts          # Copy confirmation toast
└── export/               # Serializers
    ├── json.ts           # JSON export formatter
    └── markdown.ts       # Markdown export formatter
```

## Spec

See [SPEC.md](./SPEC.md) for full product specification.
