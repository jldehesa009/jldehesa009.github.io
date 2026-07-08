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
let currentPhotos = []; // Arreglo global para que el Lightbox sepa qué fotos hay
let currentPhotoIndex = 0; // Para saber qué foto estamos viendo

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('album-form');
    const fileInput = document.getElementById('photo-file');
    const captionInput = document.getElementById('photo-caption');
    const grid = document.getElementById('album-grid');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Referencias del Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    /* ==========================================================================
       2. AUTENTICACIÓN
       ========================================================================== */
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserUid = user.uid;
            listenToAlbum();
        }
    });

    /* ==========================================================================
       3. ESCUCHAR FOTOS DESDE FIRESTORE
       ========================================================================== */
    function listenToAlbum() {
        const albumRef = collection(db, "album");
        
        onSnapshot(albumRef, (snapshot) => {
            const photos = [];
            snapshot.forEach((doc) => {
                photos.push({ id: doc.id, ...doc.data() });
            });

            photos.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date();
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date();
                return dateB - dateA; // Recientes primero
            });

            currentPhotos = photos; // Actualizamos el arreglo global
            renderAlbum(photos);
        }, (error) => {
            console.error("Error al cargar el álbum:", error);
        });
    }

    function renderAlbum(photos) {
        if (!grid) return;
        grid.innerHTML = '';

        if (photos.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.6;">Nuestra galería está vacía. ¡Subamos nuestra primera foto juntos!</p>';
            return;
        }

        photos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card glass observe-fade is-visible';
            
            const uploader = photo.uploadedBy === USERS.JORGE ? "Jorge" : "Mily";

            card.innerHTML = `
                <div class="photo-frame" style="cursor: pointer;">
                    <img src="${photo.url}" alt="${photo.caption || 'Foto de momentos'}" loading="lazy">
                </div>
                <div class="photo-info">
                    <p class="photo-caption">${photo.caption || 'Sin descripción'}</p>
                    <span class="photo-meta">Por ${uploader}</span>
                </div>
            `;

            // 👇 NUEVO: Evento para abrir el Lightbox al hacer clic en la foto
            const frame = card.querySelector('.photo-frame');
            frame.addEventListener('click', () => openLightbox(index));

            grid.appendChild(card);
        });
    }

    /* ==========================================================================
       4. SUBIDA A CLOUDINARY
       ========================================================================== */
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            const caption = captionInput.value.trim();

            if (!file) {
                showToast("Por favor, selecciona una imagen primero.");
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Revelando foto...";

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
                const response = await fetch(cloudinaryUrl, { method: 'POST', body: formData });

                if (!response.ok) throw new Error("Error en la subida a Cloudinary");

                const data = await response.json();
                
                await addDoc(collection(db, "album"), {
                    url: data.secure_url,
                    caption: caption,
                    uploadedBy: currentUserUid,
                    createdAt: serverTimestamp()
                });

                form.reset();
                showToast("¡Foto añadida a nuestro álbum!");
            } catch (error) {
                console.error(error);
                showToast("No se pudo subir la imagen. Verifica la conexión.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Subir a la Galería";
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
    }

    function closeLightbox() {
        if (lightbox) lightbox.classList.add('hide');
    }

    function updateLightboxContent() {
        const photo = currentPhotos[currentPhotoIndex];
        if (photo && lightboxImg && lightboxCaption) {
            lightboxImg.src = photo.url;
            lightboxCaption.textContent = photo.caption || '';
        }
    }

    function navigateLightbox(direction) {
        currentPhotoIndex += direction;
        
        // Efecto carrusel infinito
        if (currentPhotoIndex >= currentPhotos.length) {
            currentPhotoIndex = 0; 
        } else if (currentPhotoIndex < 0) {
            currentPhotoIndex = currentPhotos.length - 1; 
        }
        
        updateLightboxContent();
    }

    // Eventos de los botones del Lightbox
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));

    // Cerrar al hacer clic en el fondo oscuro
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-overlay')) {
                closeLightbox();
            }
        });
    }

    // Navegar con las flechas del teclado
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