document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('confetti-index');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let confettis = [];
    let confettiActive = true;

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
            // Colores elegantes: Dorado, crema, rosa y blanco
            this.color = ['#d4af37', '#fff5e1', '#f9d5e5', '#ffffff'][Math.floor(Math.random() * 4)];
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 10 - 5;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotationSpeed;
            if (this.y > canvas.height) { 
                this.y = -10; 
                this.x = Math.random() * canvas.width; 
            }
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

    // Crear 100 papelitos de confeti
    for (let i = 0; i < 100; i++) confettis.push(new Confetti());

    function animateConfetti() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettis.forEach(c => { c.update(); c.draw(); });
        requestAnimationFrame(animateConfetti);
    }
    
    animateConfetti();

    // Detener el confeti después de 8 segundos para que no estorbe la lectura
    setTimeout(() => {
        confettiActive = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 8000);
});