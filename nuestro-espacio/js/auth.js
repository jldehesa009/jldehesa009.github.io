import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Detectar en qué página está navegando el usuario
const currentPath = window.location.pathname;
const isLoginPage = currentPath.endsWith('login.html') || currentPath.endsWith('login');

// 2. Variables globales para los datos del usuario activo
export let currentUser = null;

/* ==========================================================================
   GUARDIÁN DE RUTAS (Observer)
   ========================================================================== */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // El usuario tiene sesión iniciada
        currentUser = user;
        
        // Si está logueado pero intenta entrar al login, lo redirigimos al hub
        if (isLoginPage) {
            window.location.replace('index.html');
        }
        
    } else {
        // No hay usuario logueado
        currentUser = null;
        
        // Si NO está en la página de login, lo expulsamos inmediatamente
        if (!isLoginPage) {
            // Calcular la ruta correcta dependiendo de si estamos en /pages/ o en la raíz
            const pathToLogin = currentPath.includes('/pages/') ? '../login.html' : 'login.html';
            window.location.replace(pathToLogin);
        }
    }
});

/* ==========================================================================
   LÓGICA DEL FORMULARIO DE LOGIN (Solo se ejecuta en login.html)
   ========================================================================== */
if (isLoginPage) {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI de carga
        errorMsg.classList.add('hide');
        btnText.classList.add('hide');
        btnLoader.classList.remove('hide');
        loginBtn.disabled = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            // Intentar iniciar sesión en Firebase
            await signInWithEmailAndPassword(auth, email, password);
            // Si es exitoso, el onAuthStateChanged (arriba) detectará el cambio
            // y hará la redirección automáticamente.
        } catch (error) {
            // Manejo de errores
            loginBtn.disabled = false;
            btnText.classList.remove('hide');
            btnLoader.classList.add('hide');
            
            errorMsg.classList.remove('hide');
            
            // Personalizar el mensaje según el error de Firebase
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMsg.textContent = "El correo o la contraseña son incorrectos.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMsg.textContent = "Demasiados intentos fallidos. Intenta más tarde.";
            } else {
                errorMsg.textContent = "Hubo un error al intentar acceder.";
                console.error(error);
            }
        }
    });
}

/* ==========================================================================
   FUNCIÓN GLOBAL PARA CERRAR SESIÓN
   ========================================================================== */
export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar sesión", error);
    }
};