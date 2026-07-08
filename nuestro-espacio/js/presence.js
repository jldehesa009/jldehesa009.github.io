import { auth, rtdb, db } from './firebase-config.js';
import { ref, onValue, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// 1. IDENTIFICADORES
// ==========================================================================
const USERS = {
    JORGE: "M3Lazbqi5shxyhmW6SOacU1lxEH3",
    MILY: "KBkYxuSQwScMzTKWMvLKHGjUEZc2"
};

const presenceIndicator = document.getElementById('presence-indicator');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const myUid = user.uid;
        let partnerUid = null;
        let partnerName = "";

        // Determinar identidades
        if (myUid === USERS.JORGE) {
            partnerUid = USERS.MILY;
            partnerName = "Mily";
        } else if (myUid === USERS.MILY) {
            partnerUid = USERS.JORGE;
            partnerName = "Jorge";
        }

        // ==========================================================================
        // 2. SISTEMA DE PRESENCIA ("EN LÍNEA") - REALTIME DATABASE
        // ==========================================================================
        if (presenceIndicator) {
            presenceIndicator.classList.remove('hide');
            
            const myStatusRef = ref(rtdb, '/status/' + myUid);
            const partnerStatusRef = ref(rtdb, '/status/' + partnerUid);
            const connectedRef = ref(rtdb, '.info/connected');

            // Mi estado
            onValue(connectedRef, (snap) => {
                if (snap.val() === true) {
                    onDisconnect(myStatusRef).set({
                        online: false,
                        last_changed: serverTimestamp()
                    }).then(() => {
                        set(myStatusRef, {
                            online: true,
                            last_changed: serverTimestamp()
                        });
                    });
                }
            });

            // Estado de mi pareja
            onValue(partnerStatusRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.online) {
                    statusDot.classList.add('online');
                    statusText.textContent = `${partnerName} en línea`;
                } else {
                    statusDot.classList.remove('online');
                    statusText.textContent = `${partnerName} desconectado/a`;
                }
            });
        }

        // ==========================================================================
        // 3. MOTOR DE NOTIFICACIONES (CÁPSULAS SIN LEER) - FIRESTORE
        // ==========================================================================
        // Buscamos TODOS los puntitos en la página
        const badges = document.querySelectorAll('.badge-notif');
        
        if (badges.length > 0) {
            const capsulesRef = collection(db, "capsules");
            // Consulta: Cartas para mí, que su estado "visto" sea estrictamente falso
            const qNotif = query(capsulesRef, where("to", "==", myUid), where("visto", "==", false));

            onSnapshot(qNotif, (snapshot) => {
                badges.forEach(badge => {
                    if (!snapshot.empty) {
                        badge.classList.remove('hide'); // Encender puntito
                    } else {
                        badge.classList.add('hide');    // Apagar puntito
                    }
                });
            }, (error) => {
                console.error("Error buscando notificaciones:", error);
            });
        }
    }
});