import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto "prueba alexis"
const firebaseConfig = {
  apiKey: "AIzaSyBOImE_ej-JWIPpvz7q8CdmzpSWoT73qWA",
  authDomain: "prueba-alexis-de42a.firebaseapp.com",
  projectId: "prueba-alexis-de42a",
  storageBucket: "prueba-alexis-de42a.firebasestorage.app",
  messagingSenderId: "707699254598",
  appId: "1:707699254598:web:1aaf143ad3f3cd96007147"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
// Inicializar Firestore (la base de datos)
export const db = getFirestore(app);
