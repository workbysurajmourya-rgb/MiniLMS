# MiniLMS — Video Recording Script

A complete narration script for a screen-recorded walkthrough video. Estimated runtime: 15–20 minutes.

---

## Pre-Recording Checklist

- [ ] App running on a physical device or simulator
- [ ] Start on the Login screen
- [ ] Clear any previous session so the registration flow can be shown
- [ ] Have the code editor open side-by-side for code reveal moments
- [ ] Screen recording software capturing device + editor
- [ ] Microphone levels tested

---

## INTRO — (0:00 – 1:00)

> *Camera / face-cam on. Confident, direct delivery.*

"Hey everyone — in this video I'm going to walk you through a mobile LMS app I built from scratch using React Native and Expo.

This isn't a tutorial where I follow a guide — every feature in here was designed and implemented by me. I'll show you what the app does, how I built it, and then dive into the code to explain the key technical decisions.

Here's what we'll cover:

— The authentication flow, including biometric login with Face ID and fingerprint
— A paginated course catalog with AI-powered smart search
— Course detail screens with an embedded WebView that has bidirectional JavaScript-to-native communication
— Offline support that works seamlessly even without internet
— Push notifications that fire at meaningful moments
— Tailwind CSS styling using NativeWind
— An OpenAI integration for personalized course recommendations

Let's start with a live demo."

---

## SECTION 1: DEMO WALKTHROUGH — (1:00 – 6:00)

### 1a — Registration & Login (1:00 – 2:00)

> *Show the app on device. Start at register screen.*

"When you first open the app you land on the login screen. Let me register a new account first.

I tap 'Sign Up', fill in my first name, last name, email, and password. All of these are validated in real time using Zod schemas — so if I try a weak password or a malformed email, I get an immediate error before anything is sent to the server.

I hit 'Create Account', the request goes to the FreeAPI backend, and I'm logged straight in.

Now notice — if I log out and come back, the session is restored automatically. The access token is stored in Expo SecureStore — that's the device's native secure enclave — and Zustand persists the session to AsyncStorage. So re-opening the app doesn't require logging in again."

---

### 1b — Biometric Login (2:00 – 2:30)

> *Show the login screen. The fingerprint button should be visible.*

"Now for the bonus feature — biometric login. You can see this fingerprint icon at the bottom of the login screen. It only appears when the device has enrolled biometrics — I check `hasHardwareAsync()` and `isEnrolledAsync()` from `expo-local-authentication` on mount.

When I tap it, the OS-level authentication prompt appears. I authenticate… and I'm taken straight into the app. The biometrics act as a guard on the existing server session — no password ever leaves the device for this flow."

---

### 1c — Course Catalog & Search (2:30 – 3:30)

> *Navigate to the home tab.*

"This is the course catalog. Courses are fetched from the FreeAPI's random products endpoint — I map those product objects to courses.

The list is paginated — I load ten at a time, and as I scroll down to the bottom, the next page is automatically fetched. Pull to refresh re-loads from page one.

Notice the search bar at the top. Watch what happens when I type — the keyboard never dismisses. I had to specifically fix this. The issue was that the search function was async — every keystroke triggered a state update that re-rendered the parent and caused the TextInput to lose focus.

The fix: I use local input state that updates instantly, and a 400-millisecond debounce for the actual search logic. The API call only fires after the user stops typing.

If I have an OpenAI API key configured, the search is also semantically powered — GPT-4o-mini re-ranks results based on meaning, not just string matching. Without a key, it falls back to local keyword filtering."

---

### 1d — Bookmarks & Notifications (3:30 – 4:00)

> *Tap bookmark icons on several courses.*

"I can bookmark courses by tapping the bookmark icon. These are stored locally in Zustand and persisted across sessions.

Watch what happens when I bookmark my fifth course — a push notification fires. This is a local notification using expo-notifications, scheduled the moment the fifth bookmark is toggled. No server needed."

---

### 1e — Course Detail & WebView (4:00 – 5:00)

> *Tap on a course card.*

"Tapping a course opens the detail screen. I see the price, title, instructor, rating, and enrolled count, plus a full description and a learning objectives section.

I can enroll directly from here. When I tap 'Enroll Now', that gets stored in the course store. 

Now for the most technically interesting part — tap 'View Course Content'. This opens an embedded WebView.

But this isn't just a WebView displaying a URL. I inject the course state from native code into the WebView using `webViewRef.injectJavaScript()`. And when I tap the Enroll or Bookmark button inside the WebView, it calls `window.ReactNativeWebView.postMessage()` — that message comes back to my native `onMessage` handler which triggers the actual store updates.

This is full bidirectional communication between JavaScript in the WebView and the React Native layer."

---

### 1f — My Learning & AI Recommendations (5:00 – 5:30)

> *Navigate to the Explore tab.*

"The Explore tab shows my enrolled courses, plus some stats — how many courses I've bookmarked, enrolled in, and how many are available.

Below that is the AI Recommendations section. After the enrolled courses load, `getRecommendations()` sends my enrolled course titles to GPT-4o-mini, which reasons about what I'd likely enjoy next and returns up to five suggestions. Without an API key, it just returns the first few unenrolled courses."

---

### 1g — Offline Mode (5:30 – 6:00)

> *Toggle airplane mode on the device.*

"Now let me show offline support. I'll turn on airplane mode.

Notice the red banner that appears at the top of every screen — 'No Internet Connection'. This is driven by `@react-native-community/netinfo` which fires a connectivity event the moment the network drops.

But crucially — my data is all still here. The courses I browsed, my bookmarks, my enrolled courses. All of it was persisted to AsyncStorage when I was online. I can still navigate the entire app.

If I try to search, I get a clean error message telling me I'm offline rather than a crash. Let me turn internet back on — and the banner disappears immediately."

---

## SECTION 2: CODE WALKTHROUGH — (6:00 – 15:00)

> *Switch to code editor. Keep it clean and focused.*

---

### 2a — Project Structure (6:00 – 6:45)

"Let me show you how the project is organized.

Everything in `app/` is a route — that's expo-router's file-based navigation. The `(auth)` group handles unauthenticated screens, `(tabs)` handles the main app. Any file I put in here automatically becomes a navigable screen.

The `src/` folder is completely separate and contains all my business logic — API clients, Zustand stores, utilities, types, and reusable components. This separation means I could theoretically swap out expo-router for a different navigation library without touching any business logic.

Two things to call out:
- `global.css` — this is the NativeWind entry point. It contains just three Tailwind directives.
- `src/services/aiService.ts` — the OpenAI integration lives here, completely isolated from the UI."

---

### 2b — NativeWind Styling (6:45 – 8:00)

> *Open `app/(tabs)/profile.tsx` and `tailwind.config.js`.*

"Let me talk about styling. I use NativeWind version 4 — that's Tailwind CSS for React Native.

Open this profile screen — look at the JSX. Every View, Text, and TouchableOpacity has a `className` prop with Tailwind classes. There's no `StyleSheet.create` anywhere in this file.

How does this work? NativeWind's Babel plugin intercepts the JSX transform. When it encounters `className="flex-1 bg-white rounded-xl"`, it compiles those strings into a React Native style object at build time. Zero runtime overhead.

Look at my tailwind.config.js — I defined custom colour tokens. `bg-primary` maps to iOS blue `#007AFF`. `bg-danger` is my red. These tokens are used consistently across the entire app.

There are two exceptions where I still use inline `style` props: Android shadow elevation (which needs an object), and dynamic colours that come from variables like `stat.color` — Tailwind classes must be static strings, so you can't interpolate them at runtime."

---

### 2c — State Management (8:00 – 9:15)

> *Open `src/store/courseStore.ts` and `src/store/authStore.ts`.*

"Let me show you the state management setup with Zustand.

Here's the auth store. Notice there's no Redux boilerplate, no action types, no dispatch. I define the state shape and the mutating functions right here in one object. The `persist` middleware wrapper means this entire store is automatically saved to AsyncStorage and re-hydrated on app launch.

The token gets stored in SecureStore via `expo-secure-store` for native-level security. I read it back in the Axios interceptor.

Now look at the course store. I have `courses`, `page`, `hasMore` for pagination. `bookmarkedCourses` and `enrolledCourses` are simple string arrays of IDs — lightweight and easy to persist. All the heavy objects stay in the `courses` array; I look up course details by ID when needed.

Components subscribe like this: `const { courses, bookmarkedCourses } = useCourseStore()`. Zustand only re-renders that component when those specific values change."

---

### 2d — API Client & Retry Logic (9:15 – 10:15)

> *Open `src/api/client.ts`.*

"Here's the Axios client. A few things worth highlighting.

The request interceptor runs before every API call — it reads the token from the auth store and injects the `Authorization: Bearer` header. I never have to think about authentication headers in individual API functions.

The response interceptor handles retries. If a request fails, it checks the retry count stored on the request config. If we haven't hit three retries yet, it waits for an exponentially increasing delay — one second, then two, then four — before retrying. This handles transient network blips without the user ever seeing an error.

The base URL is `https://api.freeapi.app`. Every course you see in the app is actually a random product from their catalog — I map the product fields to my `Course` interface in `src/types/index.ts`."

---

### 2e — WebView Bidirectional Communication (10:15 – 11:30)

> *Open `app/course-detail.tsx`.*

"This is the most technically interesting part of the project — let me show you the WebView communication.

The WebView renders an HTML string I generate here — `htmlContent`. This string contains a full HTML page with styling, content, and crucially, these JavaScript functions.

`window.__updateCourseState` is a function I define in the HTML. When native code calls `webViewRef.current.injectJavaScript(...)`, it passes JSON state into this function, which updates the DOM directly — changing button labels, colours, prices.

Going the other direction: the HTML's `handleEnroll` and `handleBookmark` functions call `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ENROLL' }))`. That fires the `onMessage` prop here on my native WebView component, which runs `handleWebViewMessage`.

It parses the message type and routes it to the correct Zustand action. So when you tap Enroll inside the WebView, it calls `toggleEnrollment` in the course store, which re-renders the native detail screen with updated state, which then injects the new state back into the WebView. A complete feedback loop."

---

### 2f — Biometric Auth Code (11:30 – 12:15)

> *Open `app/(auth)/login.tsx`.*

"Here's the biometric auth implementation — it's quite clean.

In a `useEffect` on mount, I call `hasHardwareAsync()` and `isEnrolledAsync()` from `expo-local-authentication`. Only if both return true does `biometricAvailable` get set to true, which conditionally renders this button.

On press — `authenticateAsync` with a prompt message. The result object has a `success` boolean. If true, I check the Zustand auth store — if there's a valid token and `isAuthenticated` is true, I route to the main app. If not, I show an alert telling them to log in with credentials first.

Notice I also check `result.error !== 'user_cancel'` before showing any failure alert — I don't want to show an error just because the user dismissed the prompt."

---

### 2g — AI Service (12:15 – 13:30)

> *Open `src/services/aiService.ts`.*

"Here's the AI service. I'm using the official OpenAI Node SDK.

The client is lazily initialised — `getClient()` reads `process.env.EXPO_PUBLIC_OPENAI_API_KEY`. If the key isn't set, it returns null, and both functions fall back to local logic. The app never crashes because of a missing API key.

For smart search — I take the user's query and a catalogue of up to fifty courses. I build a prompt that describes the task to GPT-4o-mini and asks it to return matching course IDs as a JSON array. Then I parse that array, map IDs back to course objects, and merge with local keyword results.

For recommendations — I send the user's enrolled course titles alongside candidate courses. The model reasons about the learner's interests and returns the most relevant suggestions.

In the home screen, smart search runs in parallel with the API search using `Promise.all`. The AI result takes priority if it has content. This means better results without adding latency — both calls start simultaneously."

---

### 2h — Offline & Notifications (13:30 – 14:15)

> *Open `src/hooks/useNetwork.ts` and `src/utils/notifications.ts`.*

"Quick look at the two other infrastructure pieces.

`useNetworkMonitoring` initialises `NetworkService` which wraps `@react-native-community/netinfo`. The subscription fires on every connectivity change and updates `appStateStore.isOnline`. This hook is called once in the root layout and affects every screen.

For notifications — I use named imports from `expo-notifications`. This is important: in Expo SDK 54, `import * as Notifications` no longer works. All imports must be named.

The service requests permissions on first launch, creates an Android channel with high importance, and registers a response listener. The bookmark notification uses `scheduleNotificationAsync` with a one-second trigger. The 24-hour reminder checks a timestamp in AsyncStorage — if the user hasn't opened the app in over a day, it schedules a gentle reminder."

---

## SECTION 3: ARCHITECTURE REFLECTION — (14:15 – 15:30)

"Let me step back and talk about the architectural decisions.

The separation between `app/` and `src/` is intentional. All the business logic — stores, API, utilities, types — is completely independent of the navigation framework. If Expo Router changes its API, I only update `app/`.

I deliberately chose Zustand over Redux because this app doesn't need the full Redux ecosystem. Zustand gives me global reactive state with persistence in about twenty lines of code per store.

NativeWind was a great choice for this project. Being able to write `className="flex-row items-center gap-3 bg-white rounded-xl p-4"` is significantly faster than authoring StyleSheet objects. The one tradeoff is that dynamic class names don't work — you need complete Tailwind strings, not interpolated fragments.

The AI integration is designed as a progressive enhancement. Every AI function has a fallback. This is important for a mobile app where you can't guarantee network access to the OpenAI API, and where users may not want to provide an API key.

If I were to take this to production the main things I'd add are: a proper backend with JWT refresh token rotation, server-side AI proxying so the OpenAI key never lives on the client, a full test suite with Jest and React Native Testing Library, and proper analytics."

---

## OUTRO — (15:30 – 16:00)

"That's MiniLMS — a full-featured mobile LMS demonstrating native features, offline resilience, AI integration, biometric auth, and Tailwind styling.

The full source code is in the repository. I've also included a detailed `INTERVIEW.md` with sixty-plus technical Q&As covering every decision made in this project.

If you found this useful, let me know in the comments what you'd like to see built next. Thanks for watching."

---

## Post-Production Notes

- **Cut** the `useEffect` cleanup explanation if over time — mention it briefly
- **Screen annotations**: add arrows when pointing to specific JSX lines
- **Speed up** the typing in the register form — nobody needs to watch real typing speed
- **Add captions** for the code sections — text overlays on class names and function names help
- **B-roll**: consider a split-screen of the running app next to the code for sections 2b–2h
- **Thumbnail**: Show the app running on a phone mockup with the title "Built a Full LMS App with React Native + AI"
