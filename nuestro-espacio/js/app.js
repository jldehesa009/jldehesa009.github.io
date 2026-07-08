document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. LOADER
       ========================================================================== */
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1500);
    }

    /* ==========================================================================
       2. MODO OSCURO / CLARO (Guardar Preferencias)
       ========================================================================== */
    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const htmlEl = document.documentElement;
    
    // Check LocalStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlEl.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            htmlEl.setAttribute('data-theme', 'dark');
            updateThemeIcons('dark');
        }
    }

    if (themeToggle && moonIcon && sunIcon) {
        themeToggle.addEventListener('click', () => {
            let currentTheme = htmlEl.getAttribute('data-theme');
            let newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcons(newTheme);
            
            // Reiniciar partículas solo si la función existe en esa página
            if (typeof initParticles === 'function') initParticles(); 
        });
    }

    function updateThemeIcons(theme) {
        if (!moonIcon || !sunIcon) return;
        if (theme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }

    /* ==========================================================================
       3. MENÚ HAMBURGUESA (Mobile)
       ========================================================================== */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Cerrar menú al hacer click en un enlace
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    /* ==========================================================================
       4. INTERSECTION OBSERVER (Animaciones al Scroll)
       ========================================================================== */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Anima solo una vez
            }
        });
    }, observerOptions);

    document.querySelectorAll('.observe-fade').forEach(el => {
        observer.observe(el);
    });

    /* ==========================================================================
       5. BOTÓN VOLVER ARRIBA & NAVBAR BLUR ESTILO APPLE
       ========================================================================== */
    const backToTopBtn = document.getElementById('back-to-top');
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 300) {
                navbar.style.borderBottom = '1px solid var(--glass-border)';
                navbar.style.boxShadow = 'var(--glass-shadow)';
            } else {
                navbar.style.borderBottom = 'none';
                navbar.style.boxShadow = 'none';
            }
        }
        
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ==========================================================================
       6. FRASES ROMÁNTICAS CAMBIANTES (Hero)
       ========================================================================== */
    const phraseEl = document.getElementById('romantic-phrase');
    if (phraseEl) {
        const phrases = [
            "Nuestro pequeño rincón en el mundo.",
            "Donde guardamos los mejores recuerdos.",
            "Para nosotros, por nosotros.",
            "La música de nuestra vida.",
            "Tú, yo y un montón de aventuras."
        ];
        
        let phraseIndex = 0;
        
        setInterval(() => {
            phraseEl.classList.add('fade-out');
            setTimeout(() => {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                phraseEl.textContent = phrases[phraseIndex];
                phraseEl.classList.remove('fade-out');
            }, 500);
        }, 5000);
    }

    /* ==========================================================================
       7. SISTEMA DE PARTÍCULAS SUAVES (Fondo Vivo)
       ========================================================================== */
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let w, h;

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * -0.5 - 0.1;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.y < 0 || this.x < 0 || this.x > w) {
                    this.y = h;
                    this.x = Math.random() * w;
                }
            }
            draw() {
                const isDark = htmlEl.getAttribute('data-theme') === 'dark';
                ctx.fillStyle = isDark ? `rgba(212, 175, 55, ${this.opacity})` : `rgba(249, 213, 229, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        window.initParticles = function() {
            particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();
    }
    
    // Año automático en el footer
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    /* ==========================================================================
       8. CERRAR SESIÓN
       ========================================================================== */
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Importamos dinámicamente la función de logout
                const { logoutUser } = await import('./auth.js');
                await logoutUser();
            } catch (error) {
                console.error("Error al cerrar sesión", error);
            }
        });
    }
});