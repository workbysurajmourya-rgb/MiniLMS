# MiniLMS — Mobile Learning Management System

A full-featured mobile LMS app built with **React Native + Expo**, demonstrating native device features, offline resilience, real-time API integration, biometric authentication, AI-powered search and recommendations, and Tailwind-class styling via NativeWind.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Authentication](#authentication)
  - [Course Catalog](#course-catalog)
  - [My Learning (Explore)](#my-learning-explore)
  - [Bookmarks](#bookmarks)
  - [Course Detail & WebView](#course-detail--webview)
  - [Biometric Authentication](#biometric-authentication)
  - [AI Smart Search & Recommendations](#ai-smart-search--recommendations)
  - [Offline Support](#offline-support)
  - [Push Notifications](#push-notifications)
  - [Profile](#profile)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Styling System](#styling-system)
- [Type System](#type-system)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Overview

MiniLMS is a cross-platform (iOS + Android) learning management system that connects to the [FreeAPI](https://api.freeapi.app/) public API. It lets users register and log in, browse a paginated course catalog, enroll in and bookmark courses, view course content in an embedded WebView, and receive personalised AI-driven recommendations — all while handling network loss gracefully and persisting state between sessions.

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Framework | React Native + Expo | SDK 54 (`~54.0.33`) |
| Navigation | expo-router (file-based) | `~6.0.23` |
| Language | TypeScript (strict mode) | `~5.9.2` |
| Styling | NativeWind (Tailwind for RN) | `^4.2.3` |
| State | Zustand + persist middleware | `^5.0.13` |
| HTTP | Axios (interceptors + retry) | `^1.16.1` |
| Forms | react-hook-form + zod | `^7.75.0` / `^4.4.3` |
| Secure storage | expo-secure-store | `~15.0.8` |
| Async storage | @react-native-async-storage | `2.2.0` |
| Images | expo-image (memory+disk cache) | `~3.0.11` |
| WebView | react-native-webview | `13.15.0` |
| Biometrics | expo-local-authentication | `~17.0.8` |
| AI | OpenAI SDK | `^6.37.0` |
| Notifications | expo-notifications | `~0.32.17` |
| Network | @react-native-community/netinfo | `^12.0.1` |
| Safe area | react-native-safe-area-context | `~5.6.0` |

---

## Project Structure

```
MiniLMS/
├── app/                        # expo-router file-based routes
│   ├── _layout.tsx             # Root layout — global.css, network monitor, notifications
│   ├── course-detail.tsx       # Course detail screen with WebView
│   ├── modal.tsx               # Generic modal route
│   ├── (auth)/                 # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # Auth entry (redirects to login)
│   │   ├── login.tsx           # Login screen + biometric auth
│   │   └── register.tsx        # Registration screen
│   └── (tabs)/                 # Authenticated tab group
│       ├── _layout.tsx         # Bottom tab bar config
│       ├── index.tsx           # Course catalog (home)
│       ├── explore.tsx         # My Learning + AI recommendations
│       ├── bookmarks.tsx       # Saved / bookmarked courses
│       └── profile.tsx         # User profile & stats
│
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance, interceptors, exponential-backoff retry
│   │   ├── auth.ts             # Auth endpoints (login / register / logout)
│   │   └── courses.ts          # Course endpoints (list, search, detail)
│   ├── components/
│   │   ├── CourseCard.tsx      # Reusable course card (expo-image, blurhash)
│   │   ├── ErrorBanner.tsx     # Dismissable error/warning/info banner
│   │   ├── LoadingSpinner.tsx  # Full-screen and inline spinner
│   │   ├── OfflineBanner.tsx   # Sticky offline indicator strip
│   │   └── index.ts            # Barrel export
│   ├── hooks/
│   │   └── useNetwork.ts       # useNetworkMonitoring + useNotifications hooks
│   ├── services/
│   │   └── aiService.ts        # OpenAI smart search & course recommendations
│   ├── store/
│   │   ├── appStateStore.ts    # UI state: online status, search query, error messages
│   │   ├── authStore.ts        # Auth state: user, token, login/register/logout
│   │   └── courseStore.ts      # Courses, bookmarks, enrollments, pagination
│   ├── types/
│   │   └── index.ts            # All shared TypeScript interfaces
│   └── utils/
│       ├── errors.ts           # ApiError class + ErrorHandler
│       ├── network.ts          # NetInfo wrapper (NetworkService)
│       ├── notifications.ts    # NotificationService (schedule, cancel, channels)
│       └── validation.ts       # Zod schemas for login / register forms
│
├── components/                 # Shared Expo template components
├── constants/
│   └── theme.ts                # Colour tokens
├── assets/images/              # App icons, splash, favicon
├── global.css                  # Tailwind @base / @components / @utilities entry
├── tailwind.config.js          # NativeWind v4 config + custom colour palette
├── metro.config.js             # Metro bundler + withNativeWind wrapper
├── babel.config.js             # babel-preset-expo, jsxImportSource nativewind
├── nativewind-env.d.ts         # NativeWind type reference
├── tsconfig.json               # TypeScript config (strict, paths, nativewind types)
├── app.json                    # Expo app configuration
└── package.json
```

---

## Features

### Authentication

- **Register** — email, password, first name, last name validated with Zod schema and react-hook-form. Calls `POST /api/v1/users/register`.
- **Login** — email + password form. Calls `POST /api/v1/users/login`. Access token stored via `expo-secure-store` and persisted in Zustand.
- **Session restore** — on app launch, the persisted auth store re-hydrates from AsyncStorage so users stay logged in.
- **Logout** — clears token from secure store, resets all store slices, redirects to login.
- Token is attached to every subsequent API request via an Axios request interceptor.

### Course Catalog

- Paginated course list fetched from `GET /api/v1/public/randomproducts` (products mapped as courses).
- **Infinite scroll** — loads the next page when the FlatList reaches 80% from the bottom.
- **Pull-to-refresh** — resets pagination and re-fetches page 1.
- **Debounced search bar** — local input state updates instantly (keyboard never dismissed); the search API call is debounced 400 ms after the user pauses typing.
- **AI-augmented search** — when an OpenAI key is present, search results are semantically re-ranked by GPT-4o-mini in parallel with the API query.
- **Bookmark toggle** — tap the bookmark icon on any card; a milestone push notification fires when the 5th bookmark is saved.

### My Learning (Explore)

- Shows a stats row: enrolled count, bookmarked count, total available courses.
- Lists all courses the user has enrolled in.
- **AI Recommendations section** — after enrolment data is available, `getRecommendations()` asks GPT-4o-mini to suggest relevant un-enrolled courses. Falls back to the first 5 un-enrolled courses when no API key is set.
- "Browse Courses" CTA when the enrolment list is empty.

### Bookmarks

- Displays all bookmarked courses in a FlatList.
- Empty state with icon and prompt.
- Offline banner shown when disconnected.

### Course Detail & WebView

- Accessed by pushing `{ pathname: "/course-detail", params: { courseId } }`.
- Displays thumbnail, title, description, instructor info, rating, price, and enrolment count.
- **Enrol / Unenrol** and **Bookmark / Unbookmark** action buttons.
- **"View Content" button** toggles an embedded `WebView` that loads the course content URL.
- **Bidirectional JS ↔ Native communication**: the WebView can post `ENROLL`, `BOOKMARK`, and `READY` messages back to the native layer; the native layer can call `window.receiveMessage(...)` inside the WebView via `webViewRef.current.injectJavaScript(...)`.

### Biometric Authentication

- On the login screen, `expo-local-authentication` checks `hasHardwareAsync()` and `isEnrolledAsync()` at mount time.
- If both return `true`, a **"Sign in with Biometrics"** button (fingerprint icon) is shown below the login form.
- On press, `authenticateAsync({ promptMessage: "Authenticate to sign in" })` is called.
- On success, if a valid session token already exists in the auth store the user is routed directly to `/(tabs)`.
- If no existing session is found, the user is prompted to log in with credentials first to establish one.

### AI Smart Search & Recommendations

Implemented in `src/services/aiService.ts` using the official OpenAI Node SDK.

**`smartSearch(query, courses)`**
1. Passes up to 50 course titles/descriptions to GPT-4o-mini with the user's search query.
2. GPT returns a JSON array of matching course IDs.
3. Results are merged with local keyword matches so nothing is lost if the model misses a simple match.
4. Falls back to local keyword filtering when no API key is set.

**`getRecommendations(enrolledCourses, allCourses, limit)`**
1. Sends enrolled course titles and up to 50 candidate courses to GPT-4o-mini.
2. GPT returns the IDs of the top recommended courses.
3. Falls back to the first N un-enrolled courses when no API key is set.

Both functions fail gracefully — the app is fully functional without an OpenAI key.

### Offline Support

- `NetworkService` (wraps `@react-native-community/netinfo`) subscribes to connectivity changes at app startup.
- `useNetworkMonitoring()` hook in the root layout keeps `appStateStore.isOnline` up to date.
- Every screen shows an **`OfflineBanner`** strip when `isOnline === false`.
- Search and mutating actions (bookmark, enrol) show an early-return error message when offline.
- Axios client has exponential-backoff retry (up to 3 attempts, 1 s base delay) for transient network failures on GET requests.

### Push Notifications

Implemented in `src/utils/notifications.ts` using named imports from `expo-notifications`.

| Trigger | Notification |
|---|---|
| App opened after 24 h absence | "Welcome back! Continue your learning journey." |
| 5th course bookmarked | "You have bookmarked 5 courses. Keep exploring!" |

- Requests permission on first launch (iOS prompt + Android channel setup).
- Schedules and cancels notifications by ID stored in AsyncStorage.
- Notification response listener routes the user to the relevant screen on tap.

### Profile

- Displays user avatar placeholder, full name, and email.
- Stats cards: enrolled, bookmarked, and total available courses.
- Account information section (email, name, member since date).
- **Logout** button with confirmation alert.

---

## State Management

Three Zustand stores, all with `persist` middleware backed by `AsyncStorage`:

| Store | Responsibility |
|---|---|
| `authStore` | `user`, `token`, `isAuthenticated`, `login`, `register`, `logout`, `restoreSession` |
| `courseStore` | `courses`, `selectedCourse`, `bookmarkedCourses`, `enrolledCourses`, `page`, `hasMore`, `fetchCourses`, `searchCourses`, `toggleBookmark`, `toggleEnrollment` |
| `appStateStore` | `isOnline`, `searchQuery`, `errorMessage`, `setIsOnline`, `setSearchQuery`, `setErrorMessage` |

---

## API Layer

Base URL: `https://api.freeapi.app`

| Endpoint | Usage |
|---|---|
| `POST /api/v1/users/register` | Create account |
| `POST /api/v1/users/login` | Login → `accessToken` |
| `GET /api/v1/public/randomproducts?page=&limit=` | Paginated course list |
| `GET /api/v1/public/randomproducts/:id` | Course detail |
| `GET /api/v1/public/randomusers?page=&limit=` | Instructor data |

`src/api/client.ts` wraps Axios with:
- Auth token injection in the request interceptor
- Automatic exponential-backoff retry on 5xx / network errors (max 3 attempts, 1 s base delay)
- 15 s request timeout
- Centralised error normalisation via `ErrorHandler`

---

## Styling System

NativeWind v4 is configured to bring Tailwind CSS utility classes to React Native via `className` props.

**Custom colour tokens** (defined in `tailwind.config.js`):

| Token | Value | Usage |
|---|---|---|
| `primary` | `#007AFF` | Buttons, links, icons |
| `danger` | `#E53935` | Errors, destructive actions |
| `success` | `#34C759` | Success states |
| `warning` | `#FF9500` | Warnings |
| `surface` | `#FFFFFF` | Cards, modals |
| `background` | `#F8F8F8` | Screen backgrounds |
| `muted` | `#999999` | Placeholder / secondary text |
| `border` | `#E0E0E0` | Dividers, input borders |

**Configuration files:**

- `tailwind.config.js` — content paths, `nativewind/preset`, custom colours
- `metro.config.js` — `withNativeWind(getDefaultConfig(__dirname), { input: "./global.css" })`
- `babel.config.js` — `babel-preset-expo` with `jsxImportSource: "nativewind"` + `react-native-reanimated/plugin`
- `global.css` — `@tailwind base; @tailwind components; @tailwind utilities;`
- `nativewind-env.d.ts` — `/// <reference types="nativewind/types" />`

---

## Type System

All shared interfaces live in `src/types/index.ts`:

- `User`, `AuthCredentials`, `AuthResponse`
- `Course`, `Instructor`, `Enrollment`, `Bookmark`
- `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`
- `AuthState`, `CourseState`, `AppState`
- `NotificationPayload`

TypeScript strict mode is enabled (`tsconfig.json`). Zero `any` types in application code.

---

## Configuration Files

| File | Purpose |
|---|---|
| `app.json` | Expo app name, slug, icons, splash, plugins, new arch, typed routes |
| `tsconfig.json` | Strict TS, `@/*` path alias → `./`, includes `nativewind-env.d.ts` |
| `babel.config.js` | Expo preset + NativeWind JSX transform + Reanimated plugin |
| `metro.config.js` | NativeWind CSS processing wrapper |
| `tailwind.config.js` | NativeWind preset + custom design tokens |
| `eslint.config.js` | `eslint-config-expo` flat config |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Optional — enables AI-powered search and recommendations.
# Without this key the app falls back to local keyword matching.
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

Expo exposes variables prefixed with `EXPO_PUBLIC_` to the client bundle via `process.env`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator (macOS) or Android Emulator / physical device with Expo Go

### Install dependencies

```bash
npm install
```

### Run the app

```bash
# Start Expo dev server
npx expo start

# Open directly on Android
npx expo start --android

# Open directly on iOS
npx expo start --ios
```

### Type check

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

---

## Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Start + open Android |
| `npm run ios` | Start + open iOS |
| `npm run web` | Start + open browser |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Move starter code to `app-example/`, reset `app/` |
