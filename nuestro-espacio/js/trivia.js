document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. BASE DE DATOS DE PREGUNTAS (Editable)
       ========================================================================== */
    const questions = [
        {
            question: "¿Cuál fue el lugar exacto de nuestra primera cita?",
            options: ["En el cine", "En un café del centro", "En el parque", "En un concierto"],
            correctAnswer: 1 // Índice de la respuesta correcta (0-3)
        },
        {
            question: "¿Qué comida no puedo dejar de comer aunque esté lleno?",
            options: ["Pizza", "Sushi", "Helado", "Tacos"],
            correctAnswer: 2
        },
        {
            question: "Cuando me enojo por una tontería, ¿qué me calma más rápido?",
            options: ["Que me des la razón", "Comida", "Un abrazo", "Que me dejes solo/a un rato"],
            correctAnswer: 2
        },
        {
            question: "¿Cuál es mi película de confort?",
            options: ["Orgullo y Prejuicio", "Star Wars", "About Time", "Harry Potter"],
            correctAnswer: 2
        },
        {
            question: "¿Qué modelo de guitarra utilizaste para la propuesta?",
            options: ["Stratocaster", "AZ2204N", "Les Paul", "Telecaster"],
            correctAnswer: 1
        },
        {
            question: "¿Cuál es mi mayor manía antes de dormir?",
            options: ["Revisar las puertas", "Beber agua", "Acomodar las almohadas de cierta forma", "Poner ruido blanco"],
            correctAnswer: 2
        },
        {
            question: "¿En qué país/lugar me encantaría perdernos en un viaje?",
            options: ["Japón", "Italia", "Canadá", "Islandia"],
            correctAnswer: 1
        },
        {
            question: "Si fueras una canción en nuestro setlist, ¿cuál serías?",
            options: ["La intro épica", "La balada romántica", "El solo de guitarra frenético", "El encore inolvidable"],
            correctAnswer: 3 
        }
    ];

    /* ==========================================================================
       2. VARIABLES DE ESTADO Y REFERENCIAS
       ========================================================================== */
    let currentQuestionIndex = 0;
    let score = 0;

    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const questionCounter = document.getElementById('question-counter');
    const progressBar = document.getElementById('progress-bar');
    
    const finalScoreEl = document.getElementById('final-score');
    const resultMessageEl = document.getElementById('result-message');
    const resultSubmessageEl = document.getElementById('result-submessage');

    /* ==========================================================================
       3. LÓGICA DEL JUEGO
       ========================================================================== */
    
    // Iniciar juego
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hide');
        setTimeout(() => {
            quizScreen.classList.remove('hide');
            loadQuestion();
        }, 500); // Esperar que termine la transición css
    });

    // Reiniciar juego
    restartBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        resultScreen.classList.add('hide');
        setTimeout(() => {
            quizScreen.classList.remove('hide');
            loadQuestion();
        }, 500);
    });

    // Cargar la pregunta actual
    function loadQuestion() {
        // Limpiar opciones previas
        optionsContainer.innerHTML = '';
        
        const currentQ = questions[currentQuestionIndex];
        
        // Actualizar textos
        questionText.textContent = currentQ.question;
        questionCounter.textContent = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`;
        
        // Actualizar barra de progreso
        const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // Generar botones
        currentQ.options.forEach((optionText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = optionText;
            
            btn.addEventListener('click', () => handleAnswer(index, btn, currentQ.correctAnswer));
            
            optionsContainer.appendChild(btn);
        });
    }

    // Manejar la selección de respuesta
    function handleAnswer(selectedIndex, selectedBtn, correctIndex) {
        // Deshabilitar todos los botones para evitar múltiples clics
        const allBtns = optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);

        // Validar respuesta
        if (selectedIndex === correctIndex) {
            selectedBtn.classList.add('correct');
            score++;
        } else {
            selectedBtn.classList.add('wrong');
            // Marcar también cuál era la correcta
            allBtns[correctIndex].classList.add('correct');
        }

        // Pasar a la siguiente pregunta con un ligero retraso
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                // Pequeña animación de salida
                quizScreen.style.opacity = 0;
                setTimeout(() => {
                    loadQuestion();
                    quizScreen.style.opacity = 1;
                }, 300);
            } else {
                showResults();
            }
        }, 1500);
    }

    // Mostrar pantalla final
    function showResults() {
        quizScreen.classList.add('hide');
        
        // Finalizar barra
        progressBar.style.width = `100%`;

        setTimeout(() => {
            resultScreen.classList.remove('hide');
            
            finalScoreEl.textContent = `${score}/${questions.length}`;
            
            const percentage = (score / questions.length) * 100;
            
            if (percentage === 100) {
                resultMessageEl.textContent = "¡Perfección absoluta! ✨";
                resultSubmessageEl.textContent = "Me conoces como a la palma de tu mano. No podría pedir a nadie mejor para compartir mis melodías.";
            } else if (percentage >= 75) {
                resultMessageEl.textContent = "¡Casi perfecto! ❤️";
                resultSubmessageEl.textContent = "Sabes muy bien cómo funciona mi mente y mi corazón. (Solo te perdonaré esa equivocación porque te amo).";
            } else if (percentage >= 50) {
                resultMessageEl.textContent = "Nada mal, nada mal... 🤔";
                resultSubmessageEl.textContent = "Parece que tenemos que pasar más tiempo juntos para que te aprendas estos detalles. ¡Prepararé una cita pronto!";
            } else {
                resultMessageEl.textContent = "Houston, tenemos un problema 😅";
                resultSubmessageEl.textContent = "¿Seguro que eres mi novio/a? ¡Toca hacer maratón de charlas y películas de castigo!";
            }
        }, 500);
    }
});