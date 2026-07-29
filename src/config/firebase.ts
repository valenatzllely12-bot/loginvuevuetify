// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyApLV1LzftaypzeFpLIyDkuiHJ-Fzu9W50',
  authDomain: 'login-d7825.firebaseapp.com',
  projectId: 'login-d7825',
  storageBucket: 'login-d7825.firebasestorage.app',
  messagingSenderId: '813199889787',
  appId: '1:813199889787:web:54a7d34b325908cd9959de',
  measurementId: 'G-N4KT3SZLM4',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
export const auth = getAuth(app)

// Firestore con caché local persistente (IndexedDB).
// Esto hace que los documentos ya sincronizados (productos, almacenes, etc.)
// queden disponibles en el navegador aunque se recargue la página sin conexión.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
})

export const messaging = getMessaging(app)

export default app