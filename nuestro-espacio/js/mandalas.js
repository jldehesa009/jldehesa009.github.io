import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/* ==========================================================================
   1. CONFIGURACIÓN DE CREDENCIALES
   ========================================================================== */
const USERS = {
    JORGE: "M3Lazbqi5shxyhmW6SOacU1lxEH3", 
    MILY: "KBkYxuSQwScMzTKWMvLKHGjUEZc2"   
};

const CLOUD_NAME = "an3spiav"; 
const UPLOAD_PRESET = "hub_album"; 

let currentUserUid = null;
let currentPhotos = []; 
let currentPhotoIndex = 0; 

console.log("🚀 Script mandalasprueba.js cargado exitosamente.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("✨ DOM completamente cargado y listo.");
    
    const form = document.getElementById('mandala-form');
    const fileInput = document.getElementById('photo-file');
    const captionInput = document.getElementById('photo-caption');
    const grid = document.getElementById('mandala-grid');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    /* ==========================================================================
       2. AUTENTICACIÓN (Monitoreada)
       ========================================================================== */
    onAuthStateChanged(auth, (user) => {
        console.log("🔑 Firebase Auth cambió de estado. Datos del usuario:", user);
        
        if (user) {
            currentUserUid = user.uid;
            console.log("✅ Usuario autenticado detectado. UID:", currentUserUid);
            listenToMandalas();
        } else {
            console.warn("❌ No hay ninguna sesión activa en esta página de prueba.");
            if (grid) {
                grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #d4af37; font-weight: 500; width: 100%; padding: 2rem;">Por favor, inicia sesión en tu aplicación primero para poder validar el acceso a la galería.</p>';
            }
        }
    });

    /* ==========================================================================
       3. ESCUCHAR MANDALAS DESDE FIRESTORE
       ========================================================================== */
    function listenToMandalas() {
        console.log("📥 Conectando a Firestore para escuchar la colección 'mandalas'...");
        const mandalasRef = collection(db, "mandalas");
        
        onSnapshot(mandalasRef, (snapshot) => {
            const photos = [];
            snapshot.forEach((doc) => {
                photos.push({ id: doc.id, ...doc.data() });
            });

            console.log(`📸 Datos recibidos de Firestore. Total de obras encontradas: ${photos.length}`);

            photos.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date();
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date();
                return dateA - dateB; 
            });

            currentPhotos = photos; 
            renderMandalas(photos);
        }, (error) => {
            console.error("🚨 Error crítico al leer en Firestore:", error);
        });
    }

    function renderMandalas(photos) {
        if (!grid) {
            console.error("🚨 Error: No se encontró el contenedor '#mandala-grid' en el HTML.");
            return;
        }
        grid.innerHTML = '';

        if (photos.length === 0) {
            console.log("ℹ️ La colección está vacía en Firestore.");
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.6; width: 100%;">La galería está vacía. ¡Sé el primero en colgar una obra!</p>';
            return;
        }

        photos.forEach((photo, index) => {
            const artPiece = document.createElement('div');
            artPiece.className = 'art-piece observe-fade is-visible';
            
            const uploaderName = photo.uploadedBy === USERS.JORGE ? "Jorge" : "Mily";

            // Estructura completa con la ficha técnica integrada que lee tu CSS
            artPiece.innerHTML = `
                <div class="art-image-wrapper">
                    <img src="${photo.url}" class="art-image" alt="${photo.caption || 'Mandala'}" loading="lazy">
                </div>
                <div class="art-details">
                    <h3 class="art-title">${photo.caption || 'Obra sin título'}</h3>
                    <p class="art-author">Exhibido por ${uploaderName}</p>
                </div>
            `;

            const frame = artPiece.querySelector('.art-image-wrapper');
            frame.addEventListener('click', () => {
                console.log(`🔍 Abriendo lightbox para la obra índice: ${index}`);
                openLightbox(index);
            });

            grid.appendChild(artPiece);
        });
        console.log("🎨 Muro del museo renderizado en pantalla con éxito.");
    }

    /* ==========================================================================
       4. SUBIDA A CLOUDINARY
       ========================================================================== */
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("📝 Formulario enviado. Iniciando proceso de subida...");
            
            const file = fileInput.files[0];
            const caption = captionInput.value.trim();

            if (!file) {
                showToast("Por favor, selecciona una imagen primero.");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Colgando obra...";

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                console.log("☁️ Subiendo archivo físico a Cloudinary...");
                const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
                const response = await fetch(cloudinaryUrl, { method: 'POST', body: formData });

                if (!response.ok) throw new Error("Error en la subida a Cloudinary");

                const data = await response.json();
                console.log("✅ Cloudinary subida exitosa. URL generada:", data.secure_url);
                
                console.log("💾 Guardando registro en la colección 'mandalas' de Firestore...");
                await addDoc(collection(db, "mandalas"), {
                    url: data.secure_url,
                    caption: caption,
                    uploadedBy: currentUserUid,
                    createdAt: serverTimestamp()
                });

                form.reset();
                showToast("¡Mandala exhibido en la galería!");
            } catch (error) {
                console.error("🚨 Falló el proceso de guardado:", error);
                showToast("No se pudo subir la imagen. Verifica la conexión.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Colgar en la Galería";
            }
        });
    }

    /* ==========================================================================
       5. LÓGICA DEL LIGHTBOX
       ========================================================================== */
    function openLightbox(index) {
        if (!lightbox || currentPhotos.length === 0) return;
        currentPhotoIndex = index;
        updateLightboxContent();
        lightbox.classList.remove('hide');
        document.body.style.overflow = 'hidden'; 
    }

    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.add('hide');
            document.body.style.overflow = '';
        }
    }

    function updateLightboxContent() {
        const photo = currentPhotos[currentPhotoIndex];
        if (photo && lightboxImg && lightboxCaption) {
            lightboxImg.src = photo.url;
            lightboxCaption.textContent = photo.caption || 'Obra sin título';
        }
    }

    function navigateLightbox(direction) {
        currentPhotoIndex += direction;
        if (currentPhotoIndex >= currentPhotos.length) currentPhotoIndex = 0; 
        else if (currentPhotoIndex < 0) currentPhotoIndex = currentPhotos.length - 1; 
        updateLightboxContent();
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox || lightbox.classList.contains('hide')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
    });

    /* ==========================================================================
       6. UTILERÍAS (Toast)
       ========================================================================== */
    let toastTimeout;
    function showToast(message) {
        if (!toast || !toastMessage) return;
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.classList.remove('hide');
        toastTimeout = setTimeout(() => toast.classList.add('hide'), 3000);
    }
});