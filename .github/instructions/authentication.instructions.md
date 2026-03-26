---
description: This file describes the authentication rules and patterns for the project.
---
# Authentication

## Overview

All authentication in this application is handled exclusively by **Clerk**. No other authentication methods should be implemented or used.

## Core Rules

### 1. Clerk Only
- Use Clerk for all authentication and user management
- Never implement custom authentication logic
- Never integrate alternative auth providers

### 2. Protected Routes
- The `/dashboard` page is a protected route
- Users must be authenticated to access `/dashboard`
- Implement proper auth checks using Clerk's middleware or components

### 3. Homepage Redirect
- If an authenticated user accesses the homepage (`/`), redirect them to `/dashboard`
- This ensures logged-in users go directly to the app

### 4. Sign In/Sign Up Modal
- Always launch sign-in and sign-up flows as modals
- Do not redirect to separate pages for authentication
- Use Clerk's modal configuration options

### 5. Post-Authentication Redirect
- After successful sign-in or sign-up, users are redirected to `/dashboard`
- Configure this in `ClerkProvider` using `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` props

## Implementation Guidelines

When working with authentication:
- Use `@clerk/nextjs` components and hooks
- Leverage `auth()` for server-side auth checks in Server Components
- Use `useAuth()` or `useUser()` for client-side auth state
- Implement page-level protection using `auth()` and redirects (do not use middleware.ts)
- Configure `ClerkProvider` with `signInFallbackRedirectUrl="/dashboard"` and `signUpFallbackRedirectUrl="/dashboard"` in the root layout
- Set up proper redirect URLs in Clerk dashboard settings

## Authorization Boundaries

Authentication and authorization are not enforced by hiding UI elements. The browser UI is never a security boundary.

- Protect sensitive reads and privileged mutations on the server side.
- Server Components, Server Actions, and route handlers are the real authorization boundaries in this project.
- If a page tab, button, or section is hidden from non-admin users, the corresponding server-side read or mutation must still enforce the same rule.

### Audit Log Rules

- Audit log reads are admin-only and must be enforced in the server-side read function itself.
- The canonical audit-log read path uses `auth()` and then checks `requireActiveAdminUser(userId)` before querying data.
- Audit log writes are internal server infrastructure, not admin-only user operations.
- Unauthorized and forbidden attempts must still be written to the audit log, so the internal audit writer must not require admin privileges.
- The internal audit writer should live in a server-only module and should not be exported from the public audit data API.

### Practical Pattern

- Use `auth()` to identify the current user on the server.
- Use `requireActiveAdminUser(userId)` when the operation is restricted to active admins.
- Keep sensitive read protection close to the read entry point.
- Keep internal audit writing behind a server-only helper so it is less likely to be imported accidentally from unrelated modules.
