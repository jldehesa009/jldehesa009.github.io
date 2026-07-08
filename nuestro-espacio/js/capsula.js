import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, or, onSnapshot, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ==========================================================================
   1. IDENTIFICADORES
   ========================================================================== */
const USERS = {
    JORGE: "M3Lazbqi5shxyhmW6SOacU1lxEH3",
    MILY: "KBkYxuSQwScMzTKWMvLKHGjUEZc2"
};

let currentUserUid = null;
let partnerUid = null;
let partnerName = ""; // Variable global para el placeholder

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('capsule-form');
    const grid = document.getElementById('capsules-grid');
    const modal = document.getElementById('letter-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalText = document.getElementById('modal-text');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    /* ==========================================================================
       2. AUTENTICACIÓN Y PLACEHOLDER DINÁMICO
       ========================================================================== */
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserUid = user.uid;
            
            if (currentUserUid === USERS.JORGE) {
                partnerUid = USERS.MILY;
                partnerName = "Mily";
            } else {
                partnerUid = USERS.JORGE;
                partnerName = "Jorge";
            }

            // Cambiar placeholder dinámicamente
            const capsuleContent = document.getElementById('capsule-content');
            if (capsuleContent) {
                capsuleContent.placeholder = `Escribe algo hermoso para ${partnerName}...`;
            }

            listenToCapsules();
        }
    });

    /* ==========================================================================
       3. LEER CÁPSULAS DESDE FIRESTORE
       ========================================================================== */
    function listenToCapsules() {
        const capsulesRef = collection(db, "capsules");
        
        // Consulta: Trae las cartas para mí, O las que yo envié
        const q = query(capsulesRef, or(
            where("to", "==", currentUserUid),
            where("from", "==", currentUserUid)
        ));

        onSnapshot(q, (snapshot) => {
            const capsules = [];
            snapshot.forEach((doc) => {
                capsules.push({ id: doc.id, ...doc.data() });
            });

            capsules.sort((a, b) => new Date(a.date) - new Date(b.date));
            renderCapsules(capsules);
        }, (error) => {
            console.error("Error al cargar cápsulas:", error);
        });
    }

    function renderCapsules(capsules) {
        grid.innerHTML = ''; 

        if (capsules.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.6;">Aún no hay mensajes para ti. ¡Seguro pronto llegará uno!</p>';
            return;
        }

        capsules.forEach((capsule, index) => {
            const el = createCapsuleElement(capsule, index);
            grid.appendChild(el);
        });
    }

    function createCapsuleElement(capsule, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'envelope-wrapper observe-fade is-visible';
        
        // Calcular si está bloqueada o no comparando con la fecha actual
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const isUnlocked = todayStr >= capsule.date;

        if (isUnlocked) {
            wrapper.classList.add('unlocked');
        } else {
            wrapper.classList.add('locked');
        }

        // Formatear fecha para mostrarla bonita
        const openDate = new Date(capsule.date + 'T00:00:00');
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = openDate.toLocaleDateString('es-ES', dateOptions);
        
        // Deducción dinámica del nombre para evitar errores de Scope
        const myPartnerName = (currentUserUid === USERS.JORGE) ? "Mily" : "Jorge";
        const isSentByMe = capsule.from === currentUserUid;
        const authorText = isSentByMe ? `Para ${myPartnerName}` : `De ${myPartnerName}`;

        let statusHtml = '';
        if (isSentByMe) {
            // Si la mandé yo, muestro las palomitas
            statusHtml = capsule.visto 
                ? `<div class="capsule-status seen">✓✓ Leída</div>` 
                : `<div class="capsule-status sent">✓✓ Entregada</div>`;
        }

        wrapper.innerHTML = `
            <div class="envelope-date-badge">${formattedDate}</div>
            <div class="envelope-flap"></div>
            <div class="envelope-seal">${isUnlocked ? '♥' : '🔒'}</div>
            <div class="envelope-title">${capsule.title}</div>
            <div class="envelope-footer">
                <div class="envelope-author">${authorText}</div>
                ${statusHtml}
            </div>
        `;

        wrapper.addEventListener('click', () => {
            if (isUnlocked) {
                wrapper.classList.add('is-opening');
                setTimeout(() => {
                    openModal(capsule, formattedDate);
                    wrapper.classList.remove('is-opening');
                }, 800);
            } else {
                showToast(`Esta cápsula está sellada hasta el ${formattedDate}`);
            }
        });

        return wrapper;
    }

    /* ==========================================================================
       4. GUARDAR NUEVA CÁPSULA (CON VALIDACIÓN DE HORA LOCAL)
       ========================================================================== */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserUid || !partnerUid) {
            showToast("Error de sesión.");
            return;
        }

        const title = document.getElementById('capsule-title').value.trim();
        const date = document.getElementById('capsule-date').value;
        const content = document.getElementById('capsule-content').value.trim();

        if (!title || !date || !content) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (date < todayStr) {
            showToast("No puedes viajar al pasado. Elige una fecha futura o de hoy.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Sellando...";

        try {
            await addDoc(collection(db, "capsules"), {
                title: title,
                date: date,
                content: content,
                from: currentUserUid,
                to: partnerUid,
                visto: false, // Nace sin leer
                createdAt: serverTimestamp()
            });

            form.reset();
            showToast("¡Cápsula sellada y enviada al futuro!");
        } catch (error) {
            console.error("Error al guardar cápsula:", error);
            showToast("No se pudo guardar la cápsula.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Sellar Cápsula";
        }
    });

    /* ==========================================================================
       5. MODAL Y NOTIFICACIONES DE VISTO
       ========================================================================== */
    async function openModal(capsule, formattedDate) {
        modalTitle.textContent = capsule.title;
        modalDate.textContent = `Abierta el: ${formattedDate}`;
        modalText.textContent = capsule.content;
        modal.classList.remove('hide');

        // Marcar como visto en la base de datos si es para mí y no está visto
        if (capsule.to === currentUserUid && capsule.visto === false) {
            try {
                const capsuleRef = doc(db, "capsules", capsule.id);
                await updateDoc(capsuleRef, {
                    visto: true
                });
            } catch (error) {
                console.error("Error al marcar como visto:", error);
            }
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hide');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hide');
            }
        });
    }

    let toastTimeout;
    function showToast(message) {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.classList.remove('hide');
        
        toastTimeout = setTimeout(() => {
            toast.classList.add('hide');
        }, 3000);
    }

    // Fecha mínima en el input HTML
    const dateInput = document.getElementById('capsule-date');
    if (dateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateInput.setAttribute('min', `${year}-${month}-${day}`);
    }
});