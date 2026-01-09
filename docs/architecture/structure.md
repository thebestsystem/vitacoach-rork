# Application Architecture

## Overview
The application follows a React Native (Expo) architecture with a focus on modularity and feature separation.

## Directory Structure

```
app/                    # Expo Router pages
  (tabs)/               # Main application tabs
  auth/                 # Authentication screens
  _layout.tsx           # Root layout with providers
components/             # React Components
  ui/                   # Reusable atomic components (Toast, ErrorFallback)
  features/             # Domain-specific components
    dashboard/          # Dashboard widgets
    health/             # Health tracking & metrics
    wellness/           # Mental wellness & mindfulness
    premium/            # Premium content & locks
contexts/               # Global State (React Context + React Query)
  AuthContext           # User authentication
  HealthContext         # Core health data sync
  SubscriptionContext   # Plan management
hooks/                  # Custom Hooks (Logic)
types/                  # TypeScript Definitions
utils/                  # Helper functions (Firebase, Math, Formatting)
services/               # Backend integrations
```

## State Management
- **Global State:** React Context is used for app-wide state (Auth, Theme).
- **Data Caching:** TanStack React Query is used for async data (Firestore) to handle caching, loading, and error states.
- **Local State:** `useState` / `useReducer` for component-level interaction.

## UI/UX Principles
- **Atomic-ish Design:** UI components are separated from Feature components.
- **Feedback:** Haptic feedback and Toasts are used for user actions.
- **Error Handling:** Global Error Boundary and Inline Error Fallbacks.
