import { initializeApp, } from "firebase/app";
import { initializeAuth, getReactNativePersistence  } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJ31-fGY4CEFlff7PlvwXNtK6DLyqUDjg",
  authDomain: "hcms-final.firebaseapp.com",
  projectId: "hcms-final",
  storageBucket: "hcms-final.appspot.com",
  messagingSenderId: "818217315543",
  appId: "1:818217315543:web:1aaa5c289765b7c4521492",
  measurementId: "G-SHS70FV1E3"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});


export default app;