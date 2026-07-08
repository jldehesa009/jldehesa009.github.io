document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. BASE DE DATOS DE IDEAS PARA CITAS
       ========================================================================== */
    const dateIdeas = [
        "Picnic al atardecer 🧺",
        "Noche de películas y pizza 🍕",
        "Ir por nuestro helado favorito 🍦",
        "Cena romántica elegante 🍷",
        "Maratón de videojuegos 🎮",
        "Viaje de carretera improvisado 🚗",
        "Tarde de museo y café ☕",
        "Ver las estrellas juntos ✨",
        "Cocinar una receta nueva 👨‍🍳",
        "Día de spa en casa 🧖‍♀️",
        "Caminar por el parque 🌳",
        "Ir a un Escape Room 🕵️‍♂️",
        "Sesión de fotos juntos 📸",
        "Cantar a todo pulmón en karaoke 🎤",
        "Comprar un libro el uno para el otro 📚"
    ];

    /* ==========================================================================
       2. REFERENCIAS AL DOM
       ========================================================================== */
    const spinBtn = document.getElementById('spin-btn');
    const slotReel = document.getElementById('slot-reel');
    const slotMachine = document.querySelector('.slot-machine');
    
    const resultDisplay = document.getElementById('result-display');
    const resultText = document.getElementById('result-text');
    
    const spinSound = document.getElementById('spin-sound');
    const winSound = document.getElementById('win-sound');

    // Constantes de animación
    const ITEM_HEIGHT = window.innerWidth <= 600 ? 100 : 120; // Depende de la media query CSS
    const SPIN_DURATION = 4000; // 4 segundos de animación

    let isSpinning = false;

    /* ==========================================================================
       3. LÓGICA DE LA TRAGAMONEDAS
       ========================================================================== */
    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        startSpin();
    });

    function startSpin() {
        isSpinning = true;
        spinBtn.disabled = true;
        resultDisplay.classList.add('hide');
        
        // Reset clases visuales
        slotMachine.classList.remove('winner');
        slotMachine.classList.add('is-spinning');
        
        // Efecto de sonido (si existe y puede reproducirse)
        if (spinSound) {
            spinSound.currentTime = 0;
            spinSound.play().catch(e => console.log("Audio play prevented by browser"));
        }

        // 1. Elegir la cita ganadora
        const winningIndex = Math.floor(Math.random() * dateIdeas.length);
        const winningIdea = dateIdeas[winningIndex];

        // 2. Construir la lista falsa de elementos para la ilusión del giro largo
        // Queremos unos 30-40 items antes de llegar al ganador para que gire rápido
        const totalItemsInReel = 40; 
        
        // Limpiamos la transición momentáneamente para volver a la posición 0 sin animar
        slotReel.style.transition = 'none';
        slotReel.style.transform = `translateY(0)`;
        slotReel.innerHTML = '';

        // Rellenar el rodillo
        for (let i = 0; i < totalItemsInReel; i++) {
            const li = document.createElement('li');
            li.className = 'slot-item';
            
            // El último item será el ganador
            if (i === totalItemsInReel - 1) {
                li.innerHTML = `<span>${winningIdea}</span>`;
            } else {
                // Los demás son aleatorios de la lista
                const randomIdea = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
                li.innerHTML = `<span>${randomIdea}</span>`;
            }
            
            slotReel.appendChild(li);
        }

        // 3. Forzar el reflow del navegador para que aplique el translateY(0) inmediatamente
        slotReel.offsetHeight; 

        // 4. Iniciar la animación
        // Calculamos la distancia total a mover: 
        // Es la altura de 1 item multiplicada por el número total de items - 1 (para quedar centrados en el último)
        const finalTranslateY = -(totalItemsInReel - 1) * ITEM_HEIGHT;
        
        slotReel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.9, 0.25, 1)`;
        slotReel.style.transform = `translateY(${finalTranslateY}px)`;

        // 5. Finalizar cuando la transición termine
        setTimeout(() => {
            endSpin(winningIdea);
        }, SPIN_DURATION);
    }

    function endSpin(winningIdea) {
        isSpinning = false;
        spinBtn.disabled = false;
        
        slotMachine.classList.remove('is-spinning');
        slotMachine.classList.add('winner');

        // Detener sonido de giro y reproducir victoria
        if (spinSound) spinSound.pause();
        if (winSound) {
            winSound.currentTime = 0;
            winSound.play().catch(e => console.log("Audio play prevented by browser"));
        }

        // Mostrar resultado
        resultText.textContent = winningIdea;
        resultDisplay.style.display = 'block'; // Asegurar display block antes de animar opacidad
        
        // Pequeño timeout para permitir que el CSS aplique display block
        setTimeout(() => {
            resultDisplay.classList.remove('hide');
            createMiniConfetti();
        }, 50);
    }

    /* ==========================================================================
       4. EFECTO CONFETI (Mini versión para el botón/resultado)
       ========================================================================== */
    function createMiniConfetti() {
        const colors = ['#f9d5e5', '#d4af37', '#fff', '#e8b4cb'];
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = '50%';
            confetti.style.top = '50%';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            
            // Animación aleatoria
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 50; // Tendencia hacia arriba

            confetti.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 1000,
                easing: 'cubic-bezier(0, .9, .57, 1)',
                fill: 'forwards'
            });

            document.body.appendChild(confetti);

            // Limpieza
            setTimeout(() => {
                confetti.remove();
            }, 2000);
        }
    }
    
    // Recalcular altura del item si cambia el tamaño de la ventana (para evitar bugs visuales)
    window.addEventListener('resize', () => {
        if (!isSpinning) {
            // No hacemos nada complejo, pero el próximo giro usará la medida correcta
        }
    });
});