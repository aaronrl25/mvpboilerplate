# From Idea to App: Rapid MVP Development in React Native

This is an [Expo](https://expo.dev) project built for a live demo on how to go from idea to MVP quickly using **React Native**, **Firebase**, and a **Movies API**.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

* [development build](https://docs.expo.dev/develop/development-builds/introduction/)
* [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
* [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
* [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Features

* **Multimedia Feed**: Create posts with optional images or videos.
* **Deep User Profiles**: View detailed user profiles including their post history, bio, and social stats.
* **Jobs MVP**: A complete job board system with feed, filtering, and bookmarking.
* **Movie Discovery**: Search and explore movies using the **OMDb API**, now integrated as a primary tab.
* **Real-time Updates**: Live updates for likes, comments, and profile changes using **Firestore onSnapshot**.
* **Cloud Storage**: Seamless media handling via **Firebase Storage**.
* **AI Integration**: Dedicated AI tab for enhanced user interactions.
* **Modern Navigation**: Built with **Expo Router** for file-based routing.

## Project Structure

```bash
app/
├── (tabs)/             # Main tab-based navigation (Jobs, Saved, Advice, Profile)
├── auth/               # Authentication flow (Login, Signup)
├── user/               # Dedicated user profile views
├── job/                # Job detail and creation views
└── movie/              # Movie detail views
services/               # Business logic and Firebase integrations (Auth, Firestore, Storage)
components/             # Reusable UI components and theme-aware elements
store/                  # Redux state management (Auth)
hooks/                  # Custom React hooks (Redux, Color Scheme)
```

## Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Email/Password Authentication**, **Cloud Firestore**, and **Firebase Storage**.
3. Configure your credentials in [services/firebase.ts](file:///Users/aaronramirez/Desktop/mvpboilerplate/services/firebase.ts).

## Screens Overview

### Tab Navigation (`app/(tabs)/`)
* **[Jobs Feed](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/jobs.tsx)**: The central hub for searching and discovering job opportunities. Features real-time filtering and pagination.
* **[Saved Jobs](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/saved.tsx)**: Personal bookmarks for jobs the user is interested in.
* **[AI Advice](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/ai.tsx)**: A dedicated space for career advice and AI-driven interactions.
* **[Profile](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/profile.tsx)**: View account statistics, manage your professional bio, and handle application logout.

### Secondary Screens
* **[Job Details](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/job/%5Bid%5D.tsx)**: Comprehensive information for a selected job, including requirements, salary, and application links.
* **[User Profile Details](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/user/%5Buid%5D.tsx)**: A deep-dive view of another user's profile.

## Tech Stack

- **Framework**: Expo (React Native)
- **Database**: Firebase Cloud Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication
- **State Management**: Redux Toolkit
- **Media**: Expo ImagePicker & Expo AV
- **Navigation**: Expo Router (File-based)


## Movies API Example

Example of fetching data from the OMDb API:

```js
const response = await fetch('https://www.omdbapi.com/?apikey=YOUR_KEY&s=batman');
const data = await response.json();
setMovies(data.Search);
```

Display results using a FlatList and navigate to a details screen for more info.

## Navigation

Using React Navigation:

```js
<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Home" component={HomeScreen} />
  <Stack.Screen name="Details" component={DetailsScreen} />
</Stack.Navigator>
```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

* [Expo documentation](https://docs.expo.dev/)
* [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/)
* [React Native Firebase](https://rnfirebase.io/)
* [React Navigation docs](https://reactnavigation.org/)

## Join the community

Join the community of developers building universal apps with Expo:

* [Expo on GitHub](https://github.com/expo/expo)
* [Discord community](https://chat.expo.dev)

---

💡 **Built for the talk:** *From Idea to App: Rapid MVP Development in React Native* by Aaron Ramírez Lezama
