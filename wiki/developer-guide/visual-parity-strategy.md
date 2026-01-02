# Visual Parity Strategy

To ensure the V2 rewrite is visually indistinguishable from the Legacy app, we will follow this strict protocol:

## 1. Asset Synchronization

### Fonts
*   **Legacy:** Uses `next/font/google` (Inter).
*   **V2 Strategy:** Use `@fontsource/inter` to serve the exact same font file.
*   **Implementation:** Import `@fontsource/inter/variable.css` in `main.tsx` and bind it to `--font-inter`.

### Icons
*   **Legacy:** `lucide-react` v0.556.0.
*   **V2 Strategy:** Install the exact same version of `lucide-react`.

### CSS & Theme
*   **Legacy:** Tailwind v4 with custom CSS variables in `globals.css`.
*   **V2 Strategy:** We have already ported `globals.css` to `apps/client/src/index.css`.
*   **Verification:** Ensure `.touch-target` and all `@theme` variables match 1:1.

## 2. Component Migration Protocol

We will **not** rewrite UI components from scratch. We will **port** them.

### The "Shell" Pattern
For every feature (e.g., `StoreCard`), we will:
1.  Copy the file from `legacy/src/components/...` to `apps/client/src/components/...`.
2.  **Keep** the JSX structure, Tailwind classes, and logic exactly as is.
3.  **Replace** only the data layer:
    *   `useQuery` (TanStack) -> `useRxQuery` (RxDB).
    *   `Server Actions` -> `RxDB Document Methods`.
    *   `next/link` -> `react-router-dom/Link`.
    *   `next/navigation` -> `react-router-dom/useNavigate`.

### Shadcn UI
*   We must ensure the `components/ui` folder contains the exact same component definitions (variants, sizes) as the legacy app.
*   If the legacy app customized `button.tsx`, we must copy that customization.

## 3. Layout Replication

The `RootLayout` and `ResponsiveShell` are critical.
*   We will port `src/components/layout/responsive-shell.tsx` to V2.
*   We will use `react-router-dom`'s `<Outlet />` to replace `{children}`.

## 4. Visual Regression Testing (Manual)

Before marking a ticket as "Done":
1.  Open Legacy App (Production/Reference).
2.  Open V2 App (Localhost).
3.  Place side-by-side.
4.  Verify:
    *   Spacing (Margins/Paddings).
    *   Colors (Light/Dark mode).
    *   Font weights.
    *   Icon sizes.
    *   Animations.

## 5. Dependencies
We will install the following to match the legacy stack:
*   `lucide-react`
*   `clsx`
*   `tailwind-merge`
*   `class-variance-authority`
*   `sonner` (Toasts)
*   `next-themes` (Works with Vite for theme management)
