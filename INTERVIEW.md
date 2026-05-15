# MiniLMS — Interview Questions & Answers

Comprehensive technical Q&A covering every aspect of this project for interview preparation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [React Native & Expo](#2-react-native--expo)
3. [Navigation (expo-router)](#3-navigation-expo-router)
4. [State Management (Zustand)](#4-state-management-zustand)
5. [API Layer & Networking](#5-api-layer--networking)
6. [Authentication & Security](#6-authentication--security)
7. [NativeWind (Tailwind CSS)](#7-nativewind-tailwind-css)
8. [Forms & Validation](#8-forms--validation)
9. [WebView & Native Communication](#9-webview--native-communication)
10. [Biometric Authentication](#10-biometric-authentication)
11. [AI Integration (OpenAI)](#11-ai-integration-openai)
12. [Offline Support & Networking](#12-offline-support--networking)
13. [Push Notifications](#13-push-notifications)
14. [Performance Optimisation](#14-performance-optimisation)
15. [TypeScript](#15-typescript)
16. [Architecture & Design Decisions](#16-architecture--design-decisions)

---

## 1. Project Overview

**Q: What is MiniLMS and what problem does it solve?**

A: MiniLMS is a cross-platform mobile Learning Management System built with React Native and Expo. It solves the problem of accessing and managing educational content on mobile devices. Users can browse a course catalog, enroll in courses, bookmark content for later, view rich course material inside a WebView, receive personalized AI-driven recommendations, and continue working even when offline.

---

**Q: Why did you choose Expo over bare React Native?**

A: Expo dramatically reduces the native build setup overhead. The managed workflow provides pre-built native modules for commonly needed features — notifications, secure storage, biometrics, image handling — without writing Objective-C or Kotlin. Expo SDK 54 with the new architecture (`newArchEnabled: true`) also gives access to the JSI and concurrent rendering. Expo Router's file-based navigation is built on top of React Navigation and simplifies typed routing significantly.

---

**Q: What API does MiniLMS use and why?**

A: It uses the FreeAPI.app public REST API. The `/api/v1/public/randomproducts` endpoint provides paginated product data that is mapped to courses, and `/api/v1/public/randomusers` provides instructor profiles. For auth, it uses `/api/v1/users/login` and `/api/v1/users/register`. This free, no-key API was chosen to keep the app fully runnable without any paid backend dependencies.

---

## 2. React Native & Expo

**Q: What is the difference between React Native's old and new architecture?**

A: The old architecture used an asynchronous JSON bridge between JavaScript and native code, which was a serialisation bottleneck. The new architecture (enabled in this project via `"newArchEnabled": true`) uses JSI (JavaScript Interface) — a C++ layer that allows JS to directly call native functions synchronously without serialisation. It also introduces Fabric (new renderer) and TurboModules (lazy-loaded native modules), resulting in faster startup and smoother animations.

---

**Q: How does expo-image differ from React Native's built-in Image?**

A: `expo-image` offers:
- **Memory and disk caching** (`cachePolicy="memory-disk"`) — avoids re-downloading the same thumbnails on scroll
- **Blurhash placeholder** — shows a blurred colour preview while the image loads, giving instant visual feedback
- **Better performance** using native image decoders on each platform
- **`contentFit`** which maps to CSS `object-fit` semantics (more predictable than `resizeMode`)

In CourseCard, this means thumbnails appear instantly on re-scroll and the loading transition is smooth.

---

**Q: What is `SafeAreaView` and why do you use it from `react-native-safe-area-context` rather than the built-in one?**

A: `SafeAreaView` ensures content does not overlap the device's notch, status bar, or home indicator. The built-in RN version only works on iOS and has known bugs with dynamic insets. `react-native-safe-area-context` provides a cross-platform implementation with hooks (`useSafeAreaInsets`) for fine-grained control, and is the recommended approach for Expo projects.

---

## 3. Navigation (expo-router)

**Q: How does expo-router work and what are its advantages?**

A: expo-router uses the file system as the routing definition — every file inside `app/` becomes a route. This means:
- No manual route registration
- **Typed routes** — TypeScript knows the exact path strings and their params (enabled via `experiments.typedRoutes`)
- Deep linking works out of the box because routes match URL paths
- **Route groups** — `(auth)` and `(tabs)` are organisational folders that don't appear in the URL
- `_layout.tsx` files define shared layouts (stacks, tabs) for their directory

---

**Q: Explain the `(auth)` and `(tabs)` route groups.**

A: Route groups wrap routes in a shared layout without adding a path segment. `(auth)` wraps the login and register screens in a Stack navigator and is shown to unauthenticated users. `(tabs)` wraps the main app screens in a Bottom Tab navigator for authenticated users. The root `_layout.tsx` handles the redirect logic — if `isAuthenticated` is false, it redirects to `/(auth)/login`.

---

**Q: How do you pass parameters between routes?**

A: Using `router.push({ pathname: "/course-detail", params: { courseId: course.id } })` and reading them with `useLocalSearchParams<{ courseId: string }>()` in the destination screen. The `experiments.typedRoutes` flag makes these type-safe — TypeScript will error if you pass a wrong param name.

---

## 4. State Management (Zustand)

**Q: Why Zustand over Redux or Context API?**

A: Zustand has a much smaller API surface and no boilerplate. There is no `Provider`, no `dispatch`, no action creators. State is defined as a plain object with methods, and any component can subscribe to exactly the slice it needs without causing unnecessary re-renders. The `persist` middleware adds AsyncStorage-backed persistence in a single line. Redux adds significant overhead in file count and indirection that is not justified for a project of this scale.

---

**Q: How does state persistence work in the app?**

A: The `persist` middleware from `zustand/middleware` is wrapped around each store's creation function. It uses `@react-native-async-storage/async-storage` as the storage engine via `createJSONStorage`. On app launch, the middleware automatically re-hydrates the store from AsyncStorage before the first render, so the user's session, bookmarks, and enrolled courses survive app restarts.

---

**Q: How do you prevent unnecessary re-renders with Zustand?**

A: By subscribing to the minimal state slice needed. For example, `const { isOnline } = useAppStateStore()` only re-renders when `isOnline` changes, not when `searchQuery` changes. This is Zustand's default shallow-equality selector behaviour. For derived data like `enrolledCoursesList`, computation is done inside the component using `.filter()` rather than storing it separately, avoiding stale data issues.

---

**Q: Explain the three stores and their responsibilities.**

A:
- **`authStore`** — manages user identity (`user`, `token`, `isAuthenticated`) and async actions for `login`, `register`, `logout`, and `restoreSession`. Token is stored in Zustand (persisted to AsyncStorage) and also written to `expo-secure-store` for secure access.
- **`courseStore`** — manages the full course catalog, pagination (`page`, `hasMore`), search results, and per-user data (`bookmarkedCourses`, `enrolledCourses` as ID arrays). All mutations are synchronous Zustand updates.
- **`appStateStore`** — lightweight UI state: network status, the current search query string, and transient error messages shown in the `ErrorBanner`.

---

## 5. API Layer & Networking

**Q: Describe the Axios client and its retry logic.**

A: `src/api/client.ts` creates an Axios instance with a 15-second timeout and base URL. Two interceptors are set up:
1. **Request interceptor** — attaches the `Authorization: Bearer <token>` header from the auth store on every outgoing request.
2. **Response interceptor** — on error, checks if the request has been retried fewer than `MAX_RETRIES` (3) times. If so, it waits `retryDelay * 2^retryCount` milliseconds (exponential backoff starting at 1 s) and retries. This handles transient network blips without user intervention.

---

**Q: How is error handling centralised?**

A: `src/utils/errors.ts` defines an `ApiError` class with `message`, `statusCode`, and `type` fields. `ErrorHandler.handleApiError()` converts any thrown value (Axios error, plain Error, or unknown) into a consistent `ApiError`. `ErrorHandler.getUserMessage()` then maps that to a human-readable string. All API call sites use this pattern so every error surfaces through the same `ErrorBanner` component.

---

**Q: What is the auth token flow?**

A: On login, the server returns `{ data: { user, accessToken } }`. The token is saved to the Zustand auth store (persisted to AsyncStorage) and also written to `expo-secure-store` for native secure access. On subsequent requests, the Axios request interceptor reads the token from the auth store and injects it. On logout, the token is cleared from both locations and the user is redirected to login.

---

## 6. Authentication & Security

**Q: Why use both AsyncStorage (Zustand persist) and expo-secure-store for the token?**

A: `expo-secure-store` uses the device's native secure enclave (iOS Keychain, Android Keystore) and is the safest place for sensitive values like auth tokens. However, Zustand's `persist` middleware only supports AsyncStorage. The solution is to store the token in both: Zustand/AsyncStorage for seamless session re-hydration on app start, and SecureStore for any direct native secure access. This is a defence-in-depth approach.

---

**Q: How does the app protect against OWASP mobile security risks?**

A:
- **Sensitive data exposure** — tokens stored in SecureStore, not plain AsyncStorage alone
- **Insecure communication** — all API calls use HTTPS (`https://api.freeapi.app`)
- **Improper authentication** — JWT token validated server-side on every API call; expired tokens trigger logout
- **Code injection** — the WebView has `javaScriptEnabled` scoped to known-safe HTML content only, with typed message parsing and a try/catch around `JSON.parse`
- **Input validation** — all user input goes through Zod schemas before hitting the API

---

## 7. NativeWind (Tailwind CSS)

**Q: How does NativeWind work under the hood?**

A: NativeWind v4 uses a Babel plugin (`jsxImportSource: "nativewind"`) that transforms every JSX element's `className` prop into a `style` prop at compile time. It reads your `tailwind.config.js` to generate the style objects. At runtime, a Metro bundler plugin (`withNativeWind`) processes `global.css` (which contains the `@tailwind` directives) and generates the style sheet. The result is that you write Tailwind class names in your JSX and they are compiled into React Native style objects — no runtime CSS parsing.

---

**Q: What are the limitations of NativeWind compared to web Tailwind?**

A:
- No `hover:`, `focus:`, `active:` pseudo-class utilities (touch events differ)
- No CSS Grid (`grid-cols-*`) — use Flexbox instead
- Box shadows work differently — `shadow-*` utilities work on iOS but Android needs `elevation`
- Some utilities like `transition-*` and `animate-*` require `react-native-reanimated`
- The `className` prop is processed at compile time, so fully dynamic class strings (string interpolation based on runtime values) need to be done with complete class names, not concatenated fragments

---

**Q: Why do you still use inline `style` props alongside NativeWind classes?**

A: Two scenarios require it:
1. **Shadow properties** — React Native shadows take an object (`shadowOffset: { width, height }`), which cannot be expressed as a Tailwind utility. Android uses `elevation` which NativeWind does support.
2. **Dynamic colours** — in components like the stats cards where colour comes from a variable (`stat.color`), you cannot use a Tailwind class since the class name must be a static string known at compile time.

---

**Q: How did you configure NativeWind v4?**

A: Four files need to be modified:
1. `tailwind.config.js` — add `nativewind/preset` and point `content` at all component files
2. `babel.config.js` — add `jsxImportSource: "nativewind"` to `babel-preset-expo` options, plus the Reanimated plugin
3. `metro.config.js` — wrap `getDefaultConfig` with `withNativeWind({ input: "./global.css" })`
4. `global.css` — the CSS entry point imported in `app/_layout.tsx`
5. `nativewind-env.d.ts` — type reference so TypeScript knows about the `className` prop

---

## 8. Forms & Validation

**Q: Why react-hook-form + Zod instead of Formik + Yup?**

A: react-hook-form uses uncontrolled inputs by default, which means it does not re-render the whole form on every keystroke — only the field that changed. This is a significant performance advantage on mobile. Zod provides a type-safe schema definition language that generates TypeScript types automatically from schemas via `z.infer<typeof schema>`, eliminating duplication between validation rules and TypeScript interfaces. Yup is older and not as tightly integrated with TypeScript.

---

**Q: How does Controller work in react-hook-form with React Native?**

A: React Native's `TextInput` is uncontrolled by default. `Controller` wraps it and provides `field.onChange` and `field.value` to bridge between the uncontrolled RHF internals and the controlled `value`/`onChangeText` props that TextInput expects. This gives RHF full control over the field's value while keeping the native input performant.

---

**Q: Explain the search input keyboard dismissal bug and how you fixed it.**

A: The bug was that `onChangeText` was wired directly to `handleSearch`, an async function that called `searchCourses()` and `smartSearch()`. These state updates triggered a re-render of the screen component, which caused the `TextInput` to lose focus and dismiss the keyboard on every keystroke.

The fix uses two techniques:
1. **Local `inputValue` state** — the TextInput's `value` prop is bound to local state that updates synchronously and instantly. Since local state updates do not cause the parent screen to re-render (they are scoped to the same component), the TextInput stays focused.
2. **Debounced search** — a `useRef` holds a `setTimeout` ID. The expensive search logic runs only 400 ms after the user stops typing, so no re-render cascade occurs mid-keystroke.

---

## 9. WebView & Native Communication

**Q: How does bidirectional communication between the WebView and native code work?**

A: There are two directions:

**WebView → Native:** The WebView calls `window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))`. In native code, the `<WebView onMessage={handler}>` prop fires `handleWebViewMessage` with the raw string, which is parsed back to an object and dispatched to the correct action (enroll, bookmark, or ready).

**Native → WebView:** The native code calls `webViewRef.current.injectJavaScript(script)` where `script` is a string of JavaScript. This calls `window.__updateCourseState(stateObject)` which was defined in the HTML's `<script>` block to update DOM elements.

---

**Q: Why do you use an injected HTML string rather than a real URL in the WebView?**

A: The API does not provide a hosted course content URL for every course. Using a locally-generated HTML template string means the content is always available — even offline — and can dynamically embed course data (title, price, enrolment count) that was already fetched from the API. It also demonstrates the `injectJavaScript` bidirectional communication pattern more clearly.

---

**Q: What security precautions did you take with the WebView?**

A: The HTML content is generated from API data that has already been validated and stored. The `course.description` string has `'` and newlines escaped before being interpolated into the JS string context inside the HTML template. The `onMessage` handler wraps `JSON.parse` in a try/catch — malformed messages are silently ignored. `domStorageEnabled` and `javaScriptEnabled` are only set to `true` because the content is fully controlled (not loading arbitrary third-party URLs).

---

## 10. Biometric Authentication

**Q: How is biometric authentication implemented?**

A: Using `expo-local-authentication`. On mount, `hasHardwareAsync()` and `isEnrolledAsync()` are both checked — the biometric button only renders if both return `true`. On press, `authenticateAsync({ promptMessage: "Authenticate to sign in" })` triggers the OS-level biometric prompt (Face ID on iOS, fingerprint/face on Android).

On success, the app checks the auth store for an existing valid session. If one exists, the user is routed directly to `/(tabs)`. If not, they're told to log in with credentials first. This design means biometrics act as a re-authentication mechanism for an already-established session — the token itself is still server-issued.

---

**Q: What is the difference between biometric authentication and biometric-stored credentials?**

A: This app uses biometrics as **session guard** — it verifies the person holding the phone is the registered user, then resumes an already-valid server session. A more advanced implementation would use `expo-secure-store` with biometric access control (`WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`) to encrypt the stored password, then use biometrics to unlock it and replay the login. The simpler approach was chosen to avoid storing raw passwords on device.

---

## 11. AI Integration (OpenAI)

**Q: How does the AI smart search work?**

A: When the user types a search query and pauses for 400 ms, `smartSearch()` runs in parallel with the standard API search. It sends the query plus the titles/descriptions of up to 50 local courses to GPT-4o-mini. The model returns a JSON array of matching course IDs. These are mapped back to course objects and merged with local keyword matches (so nothing is lost if the model misses a simple string match). The `displayedCourses` variable in the home screen prefers AI results when available.

---

**Q: How does the recommendation engine work?**

A: `getRecommendations()` in `src/services/aiService.ts` sends:
1. The titles of courses the user has enrolled in
2. Up to 50 unenrolled candidate courses

GPT-4o-mini reasons about what subject areas the learner is interested in and returns up to 5 course IDs that would complement their existing learning. The Explore screen fetches these in a `useEffect` that re-runs whenever the enrolled count changes.

---

**Q: How does the app behave without an OpenAI API key?**

A: Both functions have explicit fallbacks. `getClient()` returns `null` when `EXPO_PUBLIC_OPENAI_API_KEY` is not set. `smartSearch` falls back to a local `localKeywordSearch` function that filters by `.includes()` on title and description. `getRecommendations` falls back to returning the first N unenrolled courses. The app is fully functional without a key — AI is a progressive enhancement.

---

**Q: What is `dangerouslyAllowBrowser: true` in the OpenAI client config?**

A: The OpenAI Node SDK normally blocks usage in browser-like environments (where the API key would be exposed in network traffic visible to users). React Native is not a browser but its environment is detected similarly. Setting this flag suppresses that warning. The key is stored in an `EXPO_PUBLIC_` env var and is accessible client-side, so this is acceptable for a demo/development project. In production, all AI calls should go through a server-side proxy to keep the key secret.

---

## 12. Offline Support & Networking

**Q: How does the app detect and respond to network changes?**

A: `@react-native-community/netinfo` subscribes to connectivity events via `NetworkService.initialize()`. A listener calls `setIsOnline()` on every change, keeping `appStateStore.isOnline` current. This runs inside `useNetworkMonitoring()` which is called in the root `_layout.tsx` so it is active for the entire app lifecycle. Every screen renders `<OfflineBanner isOnline={isOnline} />` at the top, which shows a red strip when offline.

---

**Q: What happens to API calls made while offline?**

A: Mutating actions (bookmark toggle, search) have early-return guards that check `isOnline` and show an error message without making the API call. For read operations, Zustand's persisted state means the last-fetched data is still available — the course list, enrolled courses, and bookmarks are all visible offline. The Axios retry interceptor only retries on transient errors (5xx, network timeout), not on deliberate offline detection.

---

## 13. Push Notifications

**Q: How are local notifications triggered in the app?**

A: There are two triggers:
1. **Bookmark milestone** — in the home screen's `handleBookmarkToggle`, if the new bookmark count equals 5 exactly, `NotificationService.sendNotification()` fires `scheduleNotificationAsync` with a 1-second trigger.
2. **24-hour return reminder** — on app launch, `NotificationService.initialize()` checks the timestamp stored in AsyncStorage for the last app open. If more than 24 hours have passed, a reminder notification is scheduled for 1 minute from now.

---

**Q: Why do you use named imports from `expo-notifications` instead of `import * as Notifications`?**

A: With Expo SDK 53+, `import * as Notifications` no longer works reliably due to changes in the module's export structure. Named imports (`import { scheduleNotificationAsync, ... } from "expo-notifications"`) are the correct and stable API as documented in the Expo SDK 53/54 migration guide. Using the namespace import would cause runtime errors in production builds.

---

**Q: How do you handle notification permissions?**

A: `getPermissionsAsync()` is called first. If `status !== "granted"`, `requestPermissionsAsync()` is called with `{ ios: { allowAlert, allowBadge, allowSound: true } }`. If the user denies, initialization returns early and no notifications are scheduled. On Android, a notification channel named "default" is created with `AndroidImportance.HIGH` before scheduling.

---

## 14. Performance Optimisation

**Q: What performance optimisations are in place?**

A:
- **`React.memo`** on `CourseCard` — prevents re-render when the parent FlatList re-renders but this specific card's props haven't changed
- **`useCallback`** on handlers passed to FlatList items (`handleCoursePress`, `handleBookmarkToggle`, `renderCourseItem`) — stable references prevent child re-renders
- **Debounced search** — 400 ms debounce prevents API/AI calls on every keystroke
- **Paginated loading** — courses are loaded 10 at a time with `onEndReached`; the full list is never fetched at once
- **expo-image disk+memory cache** — thumbnails are not re-fetched on scroll
- **`useFocusEffect`** instead of `useEffect` for data fetching — only fetches when the screen is actually visible, not on mount of hidden background screens
- **Zustand selective subscriptions** — components subscribe to only the state slices they need

---

**Q: How does FlatList improve performance over ScrollView for large lists?**

A: `FlatList` uses a windowed rendering approach — only items visible on screen (plus a small buffer controlled by `windowSize`) are mounted as React components. Off-screen items are unmounted to free memory. `ScrollView` renders all children immediately, which becomes unacceptably slow with 100+ courses. `FlatList` also has built-in `onEndReached` for pagination and `RefreshControl` for pull-to-refresh.

---

## 15. TypeScript

**Q: How is TypeScript configured in this project?**

A: `tsconfig.json` has `strict: true` enabling all strict checks (`strictNullChecks`, `noImplicitAny`, etc.). The `@/*` path alias maps to `./` for clean absolute imports. `nativewind-env.d.ts` is included so TypeScript recognises the `className` prop on all JSX elements. The Expo `experiments.typedRoutes` flag generates type definitions for all route strings and their parameters.

---

**Q: How do you keep types and API responses consistent?**

A: All shared interfaces are in `src/types/index.ts`. The `AuthResponse` type exactly mirrors the server's JSON structure (`{ data: { user, accessToken } }`). When the API response shape changed (from `tokens.accessToken` to `data.accessToken`), only `types/index.ts` needed updating and TypeScript immediately showed all the usages that needed fixing. Generic types like `ApiResponse<T>` and `PaginatedResponse<T>` are reused across all endpoints.

---

## 16. Architecture & Design Decisions

**Q: Why separate `src/` from `app/`?**

A: `app/` is owned by expo-router for routing. `src/` contains all non-routing code — API clients, stores, utilities, types, and reusable components. This separation makes the business logic portable and testable independently of the navigation framework. It also prevents accidental creation of unintended routes (any `.tsx` file in `app/` becomes a route).

---

**Q: How would you scale this app for a real production LMS?**

A:
- Replace `freeapi.app` with a real backend (Node/Express or Django) with a proper course database
- Add a server-side proxy for OpenAI calls to protect the API key
- Implement refresh token rotation — the current implementation only stores the access token
- Add unit tests (Jest + React Native Testing Library) for stores and utility functions
- Add E2E tests (Detox or Maestro) for critical flows (login, enroll, bookmark)
- Use a CDN for course thumbnail images and implement progressive image loading
- Add analytics (Amplitude or PostHog) to track engagement
- Implement proper role-based access (student vs instructor vs admin)

---

**Q: Why was `memo` used only on CourseCard and not on other components?**

A: `React.memo` is beneficial when a component re-renders frequently with the same props. `CourseCard` is rendered inside a `FlatList` which can re-render its entire item list on scroll, data changes, or bookmark toggles. Without `memo`, every card would re-render even if only one card's bookmark changed. Other components like `OfflineBanner`, `ErrorBanner`, and `LoadingSpinner` are simple enough that the overhead of `memo`'s prop comparison would not save meaningful time.

---

**Q: Explain the debounce implementation — why a ref instead of useState for the timer?**

A: A `useRef` is used because:
1. Storing a timeout ID in `useState` would trigger a re-render every time the timer is set or cleared — counterproductive for a debounce
2. `useRef` provides a mutable container whose `.current` value persists across renders without causing re-renders
3. The ref is also accessible inside `useEffect`'s cleanup function for cancellation on unmount, preventing "state update on unmounted component" warnings
