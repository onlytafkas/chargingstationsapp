# UI Components

## Overview

All UI elements in this application use **shadcn/ui** components exclusively.

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
