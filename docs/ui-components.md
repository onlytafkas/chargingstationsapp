# UI Components & Styling

## Overview

All UI elements in this application use **shadcn/ui** components exclusively.

## Typography & Fonts

### ⚠️ CRITICAL: Geist Fonts Configuration

**DO NOT MODIFY OR REMOVE the Geist font configuration in `app/layout.tsx`.**

The application uses Geist Sans and Geist Mono fonts which are:
- ✅ Already configured in `app/layout.tsx` with `next/font/google`
- ✅ Applied globally via CSS variables in `app/globals.css`
- ✅ Applied to the `<body>` element with `font-sans` class
- ✅ Available as Tailwind utilities via `font-sans` and `font-mono` classes

**Required Configuration in layout.tsx:**
```tsx
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Body MUST include: font-sans class + both variable classes
<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
```

### Font Usage Guidelines

1. **Body Text**: The `font-sans` class is automatically applied globally via the layout. Do NOT manually add `font-sans` to every component.

2. **Code/Monospace Text**: Use `font-mono` class when displaying code snippets or monospace text.

3. **Font Variables**: The fonts are available as CSS variables:
   - `var(--font-geist-sans)` for sans-serif
   - `var(--font-geist-mono)` for monospace

### What NOT to Do

❌ **NEVER** remove the Geist font imports from `layout.tsx`
❌ **NEVER** remove the font variable classes from the `<body>` tag
❌ **NEVER** remove the `font-sans` class from the `<body>` tag (this is CRITICAL for displaying Geist fonts)
❌ **NEVER** replace Geist fonts with other fonts without explicit approval
❌ **NEVER** add inline font-family styles that override the global fonts

### Verification

If fonts appear broken:
1. Check that `layout.tsx` still imports Geist and Geist_Mono
2. Verify the `<body>` tag has the font variable classes applied
3. Ensure `globals.css` has the `@theme inline` font definitions
4. Confirm Tailwind is compiling the `font-sans` and `font-mono` utilities

## Core Rules

### 1. Use shadcn/ui Only
- Always use shadcn/ui components for all UI elements
- Never create custom components from scratch
- If a component doesn't exist in shadcn/ui, extend or compose existing shadcn/ui components

### 2. No Custom Components
- Do not build custom buttons, inputs, cards, dialogs, or other UI primitives
- Leverage the existing shadcn/ui component library in `components/ui/`

### 3. Component Extension
- When additional functionality is needed, wrap or extend shadcn/ui components
- Maintain shadcn/ui styling conventions and patterns
- Use Tailwind CSS for any custom styling

## Implementation Guidelines

When working with UI components:
- Check `components/ui/` for available shadcn/ui components
- Use `npx shadcn@latest add <component>` to add new shadcn/ui components
- Compose multiple shadcn/ui components to create more complex interfaces
- Follow shadcn/ui's composition patterns and accessibility standards
- Maintain consistent styling with Tailwind CSS utilities
