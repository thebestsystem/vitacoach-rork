# Application Roadmap & Analysis

## Mission
Maximize application value through systematic improvements, robust engineering, and user-centric features.

## Status: IN PROGRESS

## Core Improvements (Priority: High)

### 1. Shopping List Persistence & Usability
- **Current Status:** Completed.
- **Action:** State moved to `HealthContext` and persists to Firestore. Ingredient parsing logic improved to handle quantities (e.g. "200g Chicken").
- **Validation:** Verified via unit tests (`tests/shoppingList.test.ts`) and code review of `HealthContext`.

### 2. Live Coach Session - AI Integration
- **Current Status:** Completed.
- **Action:** Integrated Vercel AI SDK (`useChat` + `app/api/chat+api.ts`) with dynamic context (user goals, metrics).
- **Validation:** Code review confirms end-to-end integration.

### 3. Wellness Trends Implementation
- **Current Status:** Completed.
- **Action:** `WellnessTrendsChart` is implemented in `components/features/dashboard/` and wired to `DashboardOverview`. It visualizes Mood, Stress, and Energy trends from `HealthHistory`.
- **Validation:** Verified code logic in `DashboardOverview.tsx` and `WellnessTrendsChart.tsx`.

### 4. Error Handling & Resilience
- **Current Status:** Completed.
- **Action:** `GlobalErrorBoundary` is active. `DashboardOverview` displays `InlineError` for `HealthContext` sync failures.
- **Validation:** Verified `DashboardOverview` integration with `InlineError`.

## Nice-to-Have Features (Priority: Medium)

### 5. Onboarding Refinement
- **Current Status:** Basic flow.
- **Action:** Ensure `UserProfile` is fully populated before entering the main app.

### 6. Offline Mode Support
- **Current Status:** `HealthContext` relies on Firestore.
- **Action:** Implement optimistic updates or local caching (using `AsyncStorage`) for critical features when offline.

## Architectural Refactoring
- **Atomic Design:** Break down complex screens (e.g., `ShoppingListScreen`, `CoachSessionScreen`) into smaller molecules/organisms.

---

## Change Log
- **[Date]:** Initial analysis and roadmap creation.
- **[Date]:** Completed Shopping List Persistence and improved ingredient parsing.
- **[Date]:** Integrated Live Coach AI with Vercel AI SDK.
- **[Date]:** Implemented Wellness Trends and Error Handling.
