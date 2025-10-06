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

* Fetch and display movies from a public **Movies API (OMDb)**
* User authentication via **Firebase Auth**
* Screen navigation using **React Navigation**
* Modular project structure and clean code practices

## Project Structure

```bash
src/
├── api/             # API calls (Movies API)
├── components/      # Reusable UI components
├── screens/         # App screens (Login, Home, Details)
├── config/          # Firebase configuration
└── App.js           # Entry point
```

## Firebase Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com)

2. Enable **Email/Password Authentication**

3. Copy your config and add it to `src/config/firebase.js`:

   ```js
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';

   const firebaseConfig = {
     apiKey: 'YOUR_API_KEY',
     authDomain: 'your-app.firebaseapp.com',
     projectId: 'your-app',
     storageBucket: 'your-app.appspot.com',
     messagingSenderId: 'SENDER_ID',
     appId: 'APP_ID',
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   ```

4. Import and use `auth` in your login or signup screens.

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
