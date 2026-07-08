document.addEventListener('DOMContentLoaded', () => {
    
    // Referencias
    const timelineContainer = document.getElementById('timeline-container');
    const progressBar = document.getElementById('timeline-progress');
    const timelineDots = document.querySelectorAll('.timeline-dot');
    
    // Verificar que estemos en la página correcta
    if (!timelineContainer || !progressBar) return;

    /* ==========================================================================
       1. ILUMINACIÓN DE LA LÍNEA POR SCROLL
       ========================================================================== */
    function updateTimelineScroll() {
        // Dimensiones y posiciones
        const rect = timelineContainer.getBoundingClientRect();
        
        // Puntos de inicio y fin de la pantalla
        const windowHeight = window.innerHeight;
        
        // Altura total del contenedor
        const containerHeight = rect.height;
        
        // Cuánto hemos bajado con respecto al contenedor de la línea
        // Empezamos a dibujar cuando la parte superior del contenedor entra a la mitad de la pantalla
        const scrollPosition = (windowHeight / 2) - rect.top;
        
        // Calculamos el porcentaje
        let percentage = (scrollPosition / containerHeight) * 100;

        // Límites
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        // Aplicamos la altura a la línea luminosa
        progressBar.style.height = `${percentage}%`;

        /* ==========================================================================
           2. ILUMINAR LOS PUNTOS SEGÚN LA LÍNEA
           ========================================================================== */
        // Obtenemos la posición Y absoluta de la barra de progreso
        const progressRect = progressBar.getBoundingClientRect();
        const progressBottom = progressRect.bottom;

        timelineDots.forEach(dot => {
            const dotRect = dot.getBoundingClientRect();
            // El centro del punto
            const dotCenter = dotRect.top + (dotRect.height / 2);

            // Si la barra iluminada ha bajado más que el centro del punto, lo iluminamos
            if (progressBottom >= dotCenter) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Escuchar el evento scroll y redimensionado
    window.addEventListener('scroll', updateTimelineScroll);
    window.addEventListener('resize', updateTimelineScroll);
    
    // Disparar una vez al cargar por si el usuario actualiza a mitad de la página
    setTimeout(updateTimelineScroll, 100);
});