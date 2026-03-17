# Laadpalen App - AI Agent Instructions

This document serves as the main orchestration file for AI coding assistants working on the Laadpalen App project.

## 🚨 CRITICAL REQUIREMENT - READ THIS FIRST 🚨

**BEFORE GENERATING ANY CODE, YOU MUST:**

1. **ALWAYS READ** the relevant instruction files in the `/docs` directory that relate to the feature or component you're working on
2. **NEVER** generate code without first consulting the applicable documentation
3. **VERIFY** that your planned approach aligns with the documented patterns and rules

**This is NOT optional. Failure to read the documentation will result in code that violates project standards and architectural decisions.**

Available documentation files to consult:
- `docs/authentication.md` - For anything related to auth, protected routes, user management
- `docs/ui-components.md` - For UI components, styling, fonts, and component composition (⚠️ INCLUDES CRITICAL FONT GUIDELINES)
- Additional files may be added to `/docs` - always check the directory

## Purpose

This project is a charging station (laadpalen) management application built with Next.js, TypeScript, and modern web technologies. When providing code assistance, always adhere to the project's established patterns and conventions.

## Quick Reference

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Icons**: Lucide React

### Key Principles

1. **Type Safety First**: Always use TypeScript with strict mode enabled. Never use `any` unless absolutely necessary.
2. **Server Components by Default**: Use React Server Components unless client interactivity is required (marked with `"use client"`).
3. **Path Aliases**: Use `@/` for absolute imports from the project root.
4. **Component Composition**: Leverage shadcn/ui components and extend them when needed.
5. **Database Type Safety**: Use Drizzle ORM's type inference for database operations.
6. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards.
7. **No Middleware.ts**: Never create a `middleware.ts` file as this is an obsolete approach for this project. Use alternative patterns like route handlers or server actions instead.
8. **⚠️ NEVER MODIFY FONTS**: The Geist fonts are configured in `app/layout.tsx` and MUST NOT be removed or changed. See `docs/ui-components.md` for details.

## Architectural Layer Instructions

The `/docs` directory contains specific implementation details that MUST be consulted before any code generation:

- **[Authentication](docs/authentication.md)**: Clerk authentication setup, protected routes, and modal configuration
- **[UI Components](docs/ui-components.md)**: shadcn/ui component usage and composition patterns

**Remember: These files contain critical rules and patterns. Read them first, every time.**

## Workflow for Code Generation

1. **READ FIRST**: Consult the relevant `/docs` instruction file(s) for your task
2. **UNDERSTAND**: Review existing code patterns in the project
3. **PLAN**: Ensure your approach follows the documented standards
4. **IMPLEMENT**: Generate code that matches the patterns and rules
5. **VALIDATE**: Check that changes maintain type safety and architectural compliance
