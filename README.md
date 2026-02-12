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
* **Interactive Map**: Tag posts with location and view global activity on an interactive Google Map.
* **Social Graph**: Follow/unfollow users and see a personalized feed of their activity.
* **Deep User Profiles**: View detailed user profiles including their post history, bio, and social stats.
* **Movie Discovery**: Search and explore movies using the **OMDb API**, now integrated as a primary tab.
* **Real-time Updates**: Live updates for likes, comments, and profile changes using **Firestore onSnapshot**.
* **Cloud Storage**: Seamless media handling via **Firebase Storage**.
* **AI Integration**: Dedicated AI tab for enhanced user interactions.
* **Modern Navigation**: Built with **Expo Router** for file-based routing.

## Project Structure

```bash
app/
├── (tabs)/             # Main tab-based navigation (Feed, Map, Search, Movies, etc.)
├── auth/               # Authentication flow (Login, Signup)
├── user/               # Dedicated user profile views
├── post/               # Detailed post and comment views
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
* **[Home Feed](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/index.tsx)**: The central social hub where users create and view multimedia posts. Features real-time liking, commenting, and location tagging.
* **[Interactive Map](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/map.tsx)**: A Google Maps powered view showing the user's location and nearby post activity. Markers link directly to post details.
* **[Search](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/search.tsx)**: A dedicated screen for discovering other users. Supports prefix-based searching and direct navigation to user profiles.
* **[Movies Explorer](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/movies.tsx)**: Integrated OMDb search engine to explore cinema data, browse posters, and view ratings.
* **[AI Assistant](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/ai.tsx)**: A dedicated space for AI-driven features and user interactions.
* **[Task List](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/list.tsx)**: A personal productivity tracker with category filtering and image attachments for tasks.
* **[Profile Settings](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/(tabs)/profile.tsx)**: View account statistics, manage your public bio, and handle application logout.

### Secondary Screens
* **[User Profile Details](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/user/%5Buid%5D.tsx)**: A deep-dive view of another user's profile, including their full post history, follower counts, and location.
* **[Post Details](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/post/%5Bid%5D.tsx)**: Focused view of a single post with a real-time comment thread and high-fidelity media playback.
* **[Movie Details](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/movie/%5Bid%5D.tsx)**: Comprehensive information for a selected movie, including plot summaries, cast lists, and director info.
* **[Authentication](file:///Users/aaronramirez/Desktop/mvpboilerplate/app/auth/index.tsx)**: Secure entry point for the app, handling Login and Signup flows via Firebase.

## Tech Stack

- **Framework**: Expo (React Native)
- **Database**: Firebase Cloud Firestore
- **Storage**: Firebase Storage
- **Auth**: Firebase Authentication
- **State Management**: Redux Toolkit
- **Maps**: React Native Maps (Google Maps)
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
