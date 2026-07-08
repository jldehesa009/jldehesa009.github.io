document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================================
       1. CONFIGURACIÓN DE LA FECHA DE INICIO
       ========================================================================== */
    // Nota: El mes en JavaScript empieza en 0 (0 = Enero, 1 = Febrero, ..., 3 = Abril).
    const startDate = new Date(2026, 3, 8, 16, 0, 0); 

    // Elementos del DOM
    const elYears = document.getElementById('years');
    const elMonths = document.getElementById('months');
    const elWeeks = document.getElementById('weeks');
    const elDays = document.getElementById('days');
    const elHours = document.getElementById('hours');
    const elMinutes = document.getElementById('minutes');
    const elSeconds = document.getElementById('seconds');
    const alertBox = document.getElementById('anniversary-alert');
    const btnPlaySound = document.getElementById('play-sound-btn');
    const audio = document.getElementById('anniversary-sound');

    let isAnniversaryDay = false;

    /* ==========================================================================
       2. LÓGICA DE CÁLCULO DEL CONTADOR (ABSOLUTA)
       ========================================================================== */
    function updateCounter() {
        const now = new Date();
        if (now < startDate) return;

        // A. Calcular años y meses totales
        let years = now.getFullYear() - startDate.getFullYear();
        let months = now.getMonth() - startDate.getMonth();
        
        // Ajuste si aún no se cumple el día del mes
        if (now.getDate() < startDate.getDate()) {
            months--;
        }
        
        if (months < 0) {
            years--;
            months += 12;
        }

        // B. Calcular semanas y días transcurridos desde el último mes aniversario
        let lastAnniversary = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < startDate.getDate() ? 1 : 0), startDate.getDate());
        
        // Ajuste para cuando el día del aniversario no existe en el mes actual (ej. 31 de feb)
        if (lastAnniversary.getDate() !== startDate.getDate()) {
            lastAnniversary = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        let diffDays = Math.floor((now - lastAnniversary) / (1000 * 60 * 60 * 24));
        let weeks = Math.floor(diffDays / 7);
        let days = diffDays % 7;

        // C. Calcular horas, minutos y segundos exactos del día actual
        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        // Check Aniversario (Alerta y Confeti)
        if (now.getDate() === startDate.getDate() && now.getMonth() === startDate.getMonth()) {
            if (!isAnniversaryDay) {
                isAnniversaryDay = true;
                if (alertBox) alertBox.classList.remove('hide');
                triggerConfetti();
            }
        } else {
            isAnniversaryDay = false;
            if (alertBox) alertBox.classList.add('hide');
        }

        // Actualización de UI con animación
        animateValue(elYears, years);
        animateValue(elMonths, months);
        animateValue(elWeeks, weeks);
        animateValue(elDays, days);
        animateValue(elHours, hours);
        animateValue(elMinutes, minutes);
        animateValue(elSeconds, seconds);
    }

    function animateValue(element, newValue) {
        if (!element) return;
        if (element.innerText !== newValue.toString()) {
            element.innerText = newValue;
            if (element.id === 'seconds') {
                element.style.transform = 'scale(1.1)';
                setTimeout(() => { element.style.transform = 'scale(1)'; }, 150);
            }
        }
    }

    // Iniciar loop
    setInterval(updateCounter, 1000);
    updateCounter();

    /* ==========================================================================
       3. LÓGICA DE CONFETI
       ========================================================================== */
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let confettis = [];
        let confettiActive = false;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Confetti {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height - canvas.height;
                this.size = Math.random() * 10 + 5;
                this.speedY = Math.random() * 3 + 2;
                this.speedX = Math.random() * 2 - 1;
                this.color = ['#f9d5e5', '#d4af37', '#fff', '#e8b4cb', '#1a1a1a'][Math.floor(Math.random() * 5)];
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 10 - 5;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.rotation += this.rotationSpeed;
                if (this.y > canvas.height) { this.y = -10; this.x = Math.random() * canvas.width; }
            }
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        function triggerConfetti() {
            if (confettiActive) return;
            confettiActive = true;
            for (let i = 0; i < 150; i++) confettis.push(new Confetti());
            animateConfetti();
        }

        function animateConfetti() {
            if (!confettiActive) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            confettis.forEach(c => { c.update(); c.draw(); });
            requestAnimationFrame(animateConfetti);
        }
    }

    /* ==========================================================================
       4. REPRODUCIR SONIDO
       ========================================================================== */
    if (btnPlaySound && audio) {
        btnPlaySound.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                btnPlaySound.textContent = "Pausar Melodía";
            } else {
                audio.pause();
                btnPlaySound.textContent = "Reproducir Melodía";
            }
        });
    }
});