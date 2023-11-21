import firebase from "firebase/compat/app";
import { getFirestore } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config();

/**
 * Firebase client credentials.
 * @typedef {Object} ClientCredentials
 * @property {string} apiKey - The Firebase API key.
 * @property {string} authDomain - The Firebase authentication domain.
 * @property {string} projectId - The Firebase project ID.
 * @property {string} storageBucket - The Firebase storage bucket.
 * @property {string} messagingSenderId - The Firebase messaging sender ID.
 * @property {string} appId - The Firebase app ID.
 */
const clientCredentials = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Check if an instance is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(clientCredentials);
}

export const firestore = getFirestore();