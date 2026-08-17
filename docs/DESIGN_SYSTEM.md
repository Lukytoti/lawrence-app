# Design System & Visual Guidelines

## 1. Design Tokens (CSS Variables)
All UI elements consume standardized CSS design variables declared in `src/app/globals.css`:

### Color Palette (Dark-First with Deep Wine Accent)
- `--bg-root`: `#09090B` (Canvas dark)
- `--bg-surface`: `#111113` (Card / Panel surface)
- `--bg-surface-elevated`: `#18181B` (Hover / Modal background)
- `--bg-surface-border`: `rgba(255, 255, 255, 0.08)` (Subtle division border)
- `--color-wine-primary`: `#7F1D1D` (Brand wine primary)
- `--color-wine-deep`: `#5B1111` (Deep wine gradient / active state)
- `--color-wine-accent`: `#991B1B` (Interactive wine hover)
- `--text-primary`: `#F4F4F5` (High contrast headers & body)
- `--text-muted`: `#A1A1AA` (Subtle metadata & labels)
- `--text-wine`: `#FCA5A5` (Accent highlight text)

### Typography & Spacing
- Font family: Inter, system-ui, sans-serif
- Standard radii: `var(--radius-sm)` (4px), `var(--radius-md)` (8px), `var(--radius-lg)` (12px), `var(--radius-full)` (9999px)
- Transitions: `transition: all 0.15s ease-in-out`

## 2. Utility Layer Integration
Tailwind CSS provides the utility layer mapped to CSS design variables. Arbitrary color values outside design tokens are prohibited.

## 3. Core UI Component Library
The reusable component directory `src/components/ui/` exports accessible UI primitives:
- `Button`: Primary (Deep Wine), Secondary (Surface outline), Ghost, Danger, Loading state.
- `Input` / `Select`: Accessible styled form controls with error states and focus rings.
- `Modal` / `Drawer`: Contextual overlays supporting keyboard escape (`Escape`) and backdrop focus traps.
- `Badge`: Status badges (Active, Pending, Warning, Success, Neutral).
- `Table`: Responsive data tables with clear headers and hover rows.
- `Skeleton`: Smooth animated loading skeletons.
- `EmptyState`: Contextual illustration/icon, descriptive copy, and primary action button.
- `ErrorState`: Error banner with retry trigger.
