import { initializeApp } from "firebase/app"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBOVXBoJ65kUZsSl0JEOfFHjVCjmEe-GAc",
  authDomain: "easy-quick-school.firebaseapp.com",
  projectId: "easy-quick-school",
  storageBucket: "easy-quick-school.firebasestorage.app",
  messagingSenderId: "25426802631",
  appId: "1:25426802631:web:a576da3249dc98ca0a0be2",
  measurementId: "G-TDZG7RD7EY"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}