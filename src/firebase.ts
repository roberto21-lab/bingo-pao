// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 👇 Usa aquí el mismo objeto que te mostró Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC1YbvVqd1R2VyWSFaXoLQ8o2Tyi4-oSTQ",
  authDomain: "bingo-pao.firebaseapp.com",
  projectId: "bingo-pao",
  storageBucket: "bingo-pao.appspot.com",
  messagingSenderId: "48299394380",
  appId: "1:48299394380:web:1d867b17d34100ac193be9",
  measurementId: "G-H763L02C0F",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la instancia de Firestore para usarla en otros archivos
export const db = getFirestore(app);
