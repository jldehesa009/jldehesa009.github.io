// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCirE1JN_1W5vsGzm1JRm-TmION490mdn0",

  authDomain: "jm-hub-privado.firebaseapp.com",

  databaseURL: "https://jm-hub-privado-default-rtdb.firebaseio.com",

  projectId: "jm-hub-privado",

  storageBucket: "jm-hub-privado.firebasestorage.app",

  messagingSenderId: "549637456936",

  appId: "1:549637456936:web:2b46f113cfa38ed1bfe11d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 👇 ESTAS SON LAS LÍNEAS QUE TE FALTABAN (Los exports) 👇
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
