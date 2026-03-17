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
