import { auth, rtdb, db } from './firebase-config.js';
import { ref, onValue, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// 1. IDENTIFICADORES Y NOTIFICACIONES NATIVAS
// ==========================================================================
const USERS = {
    JORGE: "M3Lazbqi5shxyhmW6SOacU1lxEH3",
    MILY: "KBkYxuSQwScMzTKWMvLKHGjUEZc2"
};

const presenceIndicator = document.getElementById('presence-indicator');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');

// Variable de control para enviar la notificación SOLO en el cambio de estado
let partnerEstabaConectado = false;

// Solicitar permisos de notificación al cargar el DOM si el navegador lo soporta
document.addEventListener('DOMContentLoaded', () => {

    // Registro del Service Worker para soporte PWA e iOS
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/nuestro-espacio/sw.js')
            .then(reg => console.log('🟢 Service Worker registrado con éxito:', reg.scope))
            .catch(err => console.error('🔴 Error al registrar el Service Worker:', err));
    });
}

    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("🔔 Permiso de notificaciones concedido.");
                }
            });
        }
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        const myUid = user.uid;
        let partnerUid = null;
        let partnerName = "";

        // Determinar identidades dinámicamente
        if (myUid === USERS.JORGE) {
            partnerUid = USERS.MILY;
            partnerName = "Mily";
        } else if (myUid === USERS.MILY) {
            partnerUid = USERS.JORGE;
            partnerName = "Jorge";
        }

        // ==========================================================================
        // 2. SISTEMA DE PRESENCIA Y NOTIFICACIONES DE ESCRITORIO
        // ==========================================================================
        if (presenceIndicator) {
            presenceIndicator.classList.remove('hide');
            
            const myStatusRef = ref(rtdb, '/status/' + myUid);
            const partnerStatusRef = ref(rtdb, '/status/' + partnerUid);
            const connectedRef = ref(rtdb, '.info/connected');

            // Registrar mi estado de conexión
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

            // Escuchar el estado de la pareja en tiempo real
            onValue(partnerStatusRef, (snapshot) => {
                const data = snapshot.val();
                
                if (data && data.online) {
                    statusDot.classList.add('online');
                    statusText.textContent = `${partnerName} en línea`;

                    // 👇 DISPARAR NOTIFICACIÓN DE ESCRITORIO EN CAMBIO DE ESTADO 👇
                    if (!partnerEstabaConectado && Notification.permission === "granted") {
                        const notif = new Notification(`${partnerName} está en línea ✨`, {
                            body: `Acaba de entrar al rincón digital.`,
                            tag: "presencia-pareja" // Evita que se acumulen notificaciones repetidas
                        });
                        
                        // Auto-cerrar después de 7 segundos
                        setTimeout(() => notif.close(), 7000);
                    }
                    partnerEstabaConectado = true;
                    
                } else {
                    statusDot.classList.remove('online');
                    statusText.textContent = `${partnerName} desconectado/a`;
                    
                    partnerEstabaConectado = false; // Resetear bandera al desconectarse
                }
            });
        }

        // ==========================================================================
        // 3. MOTOR DE NOTIFICACIONES (CÁPSULAS SIN LEER) - FIRESTORE
        // ==========================================================================
        const badges = document.querySelectorAll('.badge-notif');
        
        if (badges.length > 0) {
            const capsulesRef = collection(db, "capsules");
            const qNotif = query(capsulesRef, where("to", "==", myUid), where("visto", "==", false));

            onSnapshot(qNotif, (snapshot) => {
                badges.forEach(badge => {
                    if (!snapshot.empty) {
                        badge.classList.remove('hide'); 
                    } else {
                        badge.classList.add('hide');    
                    }
                });
            }, (error) => {
                console.error("Error buscando notificaciones:", error);
            });
        }
    }
});