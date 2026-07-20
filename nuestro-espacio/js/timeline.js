import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Elementos de la Interfaz
const modal = document.getElementById('timeline-modal');
const btnOpen = document.getElementById('btn-open-modal');
const btnClose = document.getElementById('btn-close-modal');
const form = document.getElementById('timeline-form');
const container = document.getElementById('timeline-container');

// Control del Modal
btnOpen.addEventListener('click', () => modal.classList.remove('hide'));
btnClose.addEventListener('click', () => {
    modal.classList.add('hide');
    form.reset();
});
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hide');
        form.reset();
    }
});

// 2. TUS EFECTOS VISUALES ORIGINALES (Encapsulados)
function reanimarEfectosVisuales() {
    // A. Intersección para las tarjetas (observe-fade)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Aquí usamos la clase 'visible' o 'show' que usabas en tu CSS original
                entry.target.classList.add('is-visible'); 
            }
        });
    }, { threshold: 0.15 });

    // Seleccionamos las tarjetas que Firebase acaba de inyectar y las observamos
    document.querySelectorAll('.observe-fade').forEach(el => observer.observe(el));

    // B. Lógica de la línea de progreso (timeline-progress)
    const progressLine = document.getElementById('timeline-progress');
    const timelineContainer = document.getElementById('timeline-container');

    if (progressLine && timelineContainer) {
        const actualizarLinea = () => {
            const rect = timelineContainer.getBoundingClientRect();
            // Calcula cuánto has bajado para estirar la línea
            let alturaScroll = (window.innerHeight / 2) - rect.top;
            
            if (alturaScroll < 0) alturaScroll = 0;
            if (alturaScroll > rect.height) alturaScroll = rect.height;
            
            progressLine.style.height = `${alturaScroll}px`;
        };

        // Asignamos el evento y lo llamamos una vez para la carga inicial
        window.addEventListener('scroll', actualizarLinea);
        actualizarLinea();
    }
}

// 3. LOGICA DE FIREBASE
onAuthStateChanged(auth, (user) => {
    if (!user) {
        btnOpen.classList.add('hide'); 
        return;
    }
    btnOpen.classList.remove('hide');

    const timelineRef = collection(db, "timeline");
    const q = query(timelineRef, orderBy("date", "asc"));

    onSnapshot(q, (snapshot) => {
        // Limpiamos los ítems viejos dejando solo las líneas estructurales centrales
        container.innerHTML = `
            <div class="timeline-line"></div>
            <div class="timeline-line-progress" id="timeline-progress"></div>
        `;

        let index = 1;
        snapshot.forEach((doc) => {
            const data = doc.data();
            renderTrack(data, index);
            index++;
        });

        // 🔥 LA MAGIA OCURRE AQUÍ: 
        // Una vez que las tarjetas ya están en el HTML, reactivamos tus animaciones
        setTimeout(() => reanimarEfectosVisuales(), 100);
    });
});

// Función para maquetar visualmente cada Track
function renderTrack(data, index) {
    const lado = (index % 2 !== 0) ? 'left' : 'right';
    const trackCard = document.createElement('div');
    // Le agregamos la clase observe-fade para que la función visual la detecte
    trackCard.className = `timeline-item ${lado} observe-fade`;

    const opcionesFecha = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = new Date(data.date + "T12:00:00").toLocaleDateString('es-ES', opcionesFecha);

    const imagenHTML = data.image 
        ? `<img src="${data.image}" alt="${data.title}" class="timeline-img">`
        : ``; 
       // : `<div class="timeline-img-placeholder"><span>✨ Sin foto de la sinfonía</span></div>`;

    const numeroTrack = String(index).padStart(2, '0');

    trackCard.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content glass">
            <span class="track-number">Track ${numeroTrack}</span>
            <h3 class="timeline-title">${data.title}</h3>
            <div class="timeline-date">${fechaFormateada}</div>
            ${imagenHTML}
            <p>${data.description}</p>
        </div>
    `;

    container.appendChild(trackCard);
}

// 4. ENVÍO DEL FORMULARIO A FIREBASE
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('track-title').value;
    const date = document.getElementById('track-date').value;
    const image = document.getElementById('track-img').value;
    const description = document.getElementById('track-desc').value;

    try {
        await addDoc(collection(db, "timeline"), {
            title: title,
            date: date,
            image: image,
            description: description,
            createdAt: new Date()
        });
        
        modal.classList.add('hide');
        form.reset();
    } catch (error) {
        console.error("Error al añadir al Setlist: ", error);
        alert("Hubo un error al guardar tu recuerdo.");
    }
});