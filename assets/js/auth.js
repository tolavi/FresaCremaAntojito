// Base de datos temporal de usuarios (para compatibilidad inicial)
const usuariosTemporales = [
    {
        id: 2,
        username: 'yordy',
        password: '123456',
        nombre: 'Yordy Tolavi',
        email: 'yordytolavi196@gmail.com',
        rol: 'admin'
    },
    {
        id: 3,
        username: 'vendedor',
        password: 'vendedor123',
        nombre: 'Vendedor General',
        email: 'vendedor@fresacrema.com',
        rol: 'vendedor'
    }
];

// Inicializar la aplicación de autenticación
document.addEventListener('DOMContentLoaded', function () {
    // Solo ejecutar en login.html
    if (window.location.pathname.includes('login.html') ||
        window.location.pathname.endsWith('/') ||
        window.location.pathname.endsWith('/login')) {

        // Verificar si ya está autenticado
        if (isAuthenticated()) {
            redirectToDashboard();
            return;
        }

        setupLoginForm();
        loadSavedCredentials();
    }

    // Cargar usuario actual en otras páginas
    if (!window.location.pathname.includes('login.html') &&
        !window.location.pathname.endsWith('/')) {
        updateUserProfileInHeader();
    }
});

// ==================== FUNCIONES DE AUTENTICACIÓN ====================

// Obtener todos los usuarios del sistema (temporales + localStorage)
function getAllUsers() {
    // 1. Obtener de localStorage (usuarios creados)
    const usuariosGuardados = localStorage.getItem('fresa_usuarios');
    let usuariosDeLocalStorage = [];

    if (usuariosGuardados) {
        try {
            usuariosDeLocalStorage = JSON.parse(usuariosGuardados);
        } catch (error) {
            console.error('Error al leer usuarios de localStorage:', error);
        }
    }

    // 2. Combinar con usuarios temporales (para compatibilidad)
    // Primero convertir usuarios temporales al formato de localStorage
    const usuariosTemporalesConvertidos = usuariosTemporales.map(user => ({
        id: user.id,
        usuario: user.username,
        correo: user.email,
        rol: user.rol,
        password: user.password,
        nombreCompleto: user.nombre,
        fechaCreacion: new Date().toISOString().split('T')[0]
    }));

    // Combinar arrays, evitando duplicados por ID
    const todosLosUsuarios = [...usuariosDeLocalStorage];

    usuariosTemporalesConvertidos.forEach(usuarioTemp => {
        const existe = todosLosUsuarios.some(u => u.id === usuarioTemp.id);
        if (!existe) {
            todosLosUsuarios.push(usuarioTemp);
        }
    });

    return todosLosUsuarios;
}

// Función para verificar autenticación
function isAuthenticated() {
    const userData = localStorage.getItem('fresa_user');
    if (!userData) return false;

    try {
        const user = JSON.parse(userData);
        const now = new Date().getTime();
        const loginTime = localStorage.getItem('fresa_login_time');

        // Verificar expiración (24 horas)
        if (loginTime && (now - parseInt(loginTime)) > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('fresa_user');
            localStorage.removeItem('fresa_login_time');
            localStorage.removeItem('fresa_remember_username');
            return false;
        }

        return user && user.id;
    } catch (error) {
        return false;
    }
}

// Función para redirigir según el rol
function redirectToDashboard() {
    const user = getCurrentUser();

    // Si no hay usuario, ir a login
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Redirigir según el rol
    switch (user.rol) {
        case 'admin':
            window.location.href = 'dashboard.html';
            break;
        case 'vendedor':
            window.location.href = 'productos.html';
            break;
        case 'vendedor1':
            window.location.href = 'productos.html';
            break;
        case 'supervisor':
            window.location.href = 'dashboard.html';
            break;
        default:
            window.location.href = 'dashboard.html';
    }
}

// Configurar formulario de login
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');

    if (!loginForm) return;

    // Alternar visibilidad de contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Enviar formulario
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

        if (!username || !password) {
            showError('Por favor, completa todos los campos');
            return;
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        }

        // Simular delay de red
        setTimeout(() => {
            const user = authenticateUser(username, password);

            if (user) {
                loginSuccess(user, rememberMe);
            } else {
                loginFailed();
            }
        }, 800);
    });

    // Permitir login con Enter
    document.getElementById('username').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    document.getElementById('password').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}

// Autenticar usuario (busca en temporales + localStorage)
function authenticateUser(username, password) {
    const todosLosUsuarios = getAllUsers();

    // Buscar usuario que coincida con nombre de usuario O correo
    const usuarioEncontrado = todosLosUsuarios.find(user => {
        const usernameMatch = user.usuario === username;
        const emailMatch = user.correo === username;
        const passwordMatch = user.password === password;

        return (usernameMatch || emailMatch) && passwordMatch;
    });

    if (!usuarioEncontrado) {
        return null;
    }

    // Convertir al formato esperado por el sistema de login
    return {
        id: usuarioEncontrado.id,
        username: usuarioEncontrado.usuario,
        password: usuarioEncontrado.password,
        nombre: usuarioEncontrado.nombreCompleto || usuarioEncontrado.usuario,
        email: usuarioEncontrado.correo,
        rol: usuarioEncontrado.rol
    };
}

// Función para registrar actividad de login
function registrarActividadLogin(userId) {
    try {
        const actividad = {
            userId: userId,
            fecha: new Date().toISOString(),
            tipo: 'login',
            ip: 'local' // En producción obtendrías la IP real
        };

        // Obtener actividad existente
        let actividadGuardada = localStorage.getItem('fresa_actividad');
        let actividadArray = [];

        if (actividadGuardada) {
            actividadArray = JSON.parse(actividadGuardada);
        }

        // Limitar a últimos 100 registros para no usar mucho espacio
        actividadArray.push(actividad);
        if (actividadArray.length > 100) {
            actividadArray = actividadArray.slice(-100);
        }

        localStorage.setItem('fresa_actividad', JSON.stringify(actividadArray));
    } catch (error) {
        console.error('Error al registrar actividad:', error);
    }
}

// Login exitoso
function loginSuccess(user, rememberMe) {
    const userData = {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('fresa_user', JSON.stringify(userData));
    localStorage.setItem('fresa_login_time', new Date().getTime().toString());

    // Registrar actividad
    registrarActividadLogin(user.id);

    if (rememberMe) {
        localStorage.setItem('fresa_remember_username', user.username);
    } else {
        localStorage.removeItem('fresa_remember_username');
    }

    // Mostrar mensaje de éxito
    showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');

    // Redirigir después de breve delay
    setTimeout(() => {
        redirectToDashboard();
    }, 1500);
}

// Login fallido
function loginFailed() {
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');

    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
    }

    showError('Usuario o contraseña incorrectos');

    if (loginForm) {
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }

    // Incrementar contador de intentos fallidos
    let failedAttempts = parseInt(localStorage.getItem('fresa_failed_attempts') || '0');
    failedAttempts++;
    localStorage.setItem('fresa_failed_attempts', failedAttempts.toString());

    // Bloquear después de 5 intentos fallidos (temporalmente)
    if (failedAttempts >= 5) {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput && passwordInput) {
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            if (loginBtn) loginBtn.disabled = true;

            showError('Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.');

            // Reactivar después de 5 minutos
            setTimeout(() => {
                if (usernameInput && passwordInput) {
                    usernameInput.disabled = false;
                    passwordInput.disabled = false;
                    if (loginBtn) loginBtn.disabled = false;
                    localStorage.setItem('fresa_failed_attempts', '0');
                }
            }, 5 * 60 * 1000);
        }
    }
}

// Mostrar error
function showError(message) {
    const errorElement = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');

    if (errorElement && errorMessage) {
        errorMessage.textContent = message;
        errorElement.classList.add('show');

        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

// Mostrar éxito
function showSuccess(message) {
    const successElement = document.getElementById('loginSuccess') || createSuccessElement();
    const successMessage = document.getElementById('successMessage') || successElement.querySelector('.message');

    if (successElement && successMessage) {
        successMessage.textContent = message;
        successElement.classList.add('show');

        setTimeout(() => {
            successElement.classList.remove('show');
        }, 3000);
    }
}

// Crear elemento de éxito si no existe
function createSuccessElement() {
    const successElement = document.createElement('div');
    successElement.id = 'loginSuccess';
    successElement.className = 'alert alert-success';
    successElement.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span id="successMessage" class="message"></span>
    `;

    // Estilos básicos
    successElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(to right, #4CAF50, #45a049);
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;

    successElement.classList.add('show');
    successElement.style.transform = 'translateX(0)';
    successElement.style.opacity = '1';

    document.body.appendChild(successElement);
    return successElement;
}

// Cargar credenciales guardadas
function loadSavedCredentials() {
    const savedUsername = localStorage.getItem('fresa_remember_username');
    const usernameInput = document.getElementById('username');
    const rememberCheckbox = document.getElementById('rememberMe');

    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
        // Poner foco en el campo de contraseña
        document.getElementById('password')?.focus();
    }
}

// Función para cerrar sesión
function logout() {
    const user = getCurrentUser();

    // Registrar actividad de logout
    if (user) {
        try {
            let actividadGuardada = localStorage.getItem('fresa_actividad');
            let actividadArray = [];

            if (actividadGuardada) {
                actividadArray = JSON.parse(actividadGuardada);
            }

            actividadArray.push({
                userId: user.id,
                fecha: new Date().toISOString(),
                tipo: 'logout'
            });

            if (actividadArray.length > 100) {
                actividadArray = actividadArray.slice(-100);
            }

            localStorage.setItem('fresa_actividad', JSON.stringify(actividadArray));
        } catch (error) {
            console.error('Error al registrar actividad de logout:', error);
        }
    }

    // Limpiar datos de sesión
    localStorage.removeItem('fresa_user');
    localStorage.removeItem('fresa_login_time');
    // No eliminar fresa_remember_username para mantener "recordar usuario"
    localStorage.setItem('fresa_failed_attempts', '0');

    // Redirigir a login
    window.location.href = 'login.html';
}

// Función para verificar permisos en páginas protegidas
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Obtener usuario actual
function getCurrentUser() {
    if (isAuthenticated()) {
        try {
            return JSON.parse(localStorage.getItem('fresa_user'));
        } catch (error) {
            return null;
        }
    }
    return null;
}

// Verificar permisos de rol
function checkPermission(requiredRole) {
    if (!checkAuth()) return false;

    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    if (requiredRole && user.rol !== requiredRole && user.rol !== 'admin') {
        alert('No tienes permisos para acceder a esta página');
        window.location.href = 'dashboard.html';
        return false;
    }

    return true;
}

// Actualizar perfil de usuario en el header
function updateUserProfileInHeader() {
    const user = getCurrentUser();
    if (!user) return;

    // Actualizar nombre en todos los elementos con clase user-name
    const userNameElements = document.querySelectorAll('.user-name, .user-profile span, #userName');
    userNameElements.forEach(element => {
        element.textContent = user.nombre || user.username;
    });

    // Actualizar avatar si existe
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        const initials = (user.nombre || user.username)
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        userAvatar.textContent = initials;

        // Colores diferentes por rol
        let bgColor = '#007bff'; // Azul por defecto
        if (user.rol === 'admin') bgColor = '#dc3545'; // Rojo para admin
        if (user.rol === 'vendedor') bgColor = '#28a745'; // Verde para vendedor

        userAvatar.style.backgroundColor = bgColor;
    }
}

// Función para cambiar contraseña del usuario actual
function cambiarContraseña(nuevaPassword) {
    const user = getCurrentUser();
    if (!user) return false;

    try {
        const usuariosGuardados = localStorage.getItem('fresa_usuarios');
        if (usuariosGuardados) {
            let usuarios = JSON.parse(usuariosGuardados);

            // Buscar usuario por ID o username
            const usuarioIndex = usuarios.findIndex(u =>
                u.id === user.id || u.usuario === user.username
            );

            if (usuarioIndex !== -1) {
                // Actualizar contraseña
                usuarios[usuarioIndex].password = nuevaPassword;
                localStorage.setItem('fresa_usuarios', JSON.stringify(usuarios));
                return true;
            }
        }

        // Si no está en localStorage, buscar en temporales
        const usuarioTempIndex = usuariosTemporales.findIndex(u =>
            u.id === user.id || u.username === user.username
        );

        if (usuarioTempIndex !== -1) {
            // No podemos modificar el array temporal, pero podemos agregar a localStorage
            const usuariosGuardados = localStorage.getItem('fresa_usuarios');
            let usuarios = usuariosGuardados ? JSON.parse(usuariosGuardados) : [];

            usuarios.push({
                id: usuariosTemporales[usuarioTempIndex].id,
                usuario: usuariosTemporales[usuarioTempIndex].username,
                correo: usuariosTemporales[usuarioTempIndex].email,
                rol: usuariosTemporales[usuarioTempIndex].rol,
                password: nuevaPassword,
                nombreCompleto: usuariosTemporales[usuarioTempIndex].nombre,
                fechaCreacion: new Date().toISOString().split('T')[0]
            });

            localStorage.setItem('fresa_usuarios', JSON.stringify(usuarios));
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return false;
    }
}

// Función para obtener actividad de usuarios
function getActividadUsuarios() {
    try {
        const actividad = localStorage.getItem('fresa_actividad');
        return actividad ? JSON.parse(actividad) : [];
    } catch (error) {
        console.error('Error al obtener actividad:', error);
        return [];
    }
}

// Exportar funciones globalmente
window.auth = {
    isAuthenticated,
    logout,
    checkAuth,
    checkPermission,
    getCurrentUser,
    cambiarContraseña,
    getActividadUsuarios,
    getAllUsers,
    authenticateUser,
    loginSuccess,
    loginFailed
};

// Inicializar protección en páginas (excepto login)
if (window.location.pathname.includes('.html') &&
    !window.location.pathname.includes('login.html') &&
    !window.location.pathname.endsWith('/')) {

    document.addEventListener('DOMContentLoaded', function () {
        if (!checkAuth()) return;

        // Actualizar información del usuario en la interfaz
        updateUserProfileInHeader();

        // Agregar evento de logout si existe el botón
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                logout();
            });
        }

        // Agregar eventos a todos los botones de logout
        document.querySelectorAll('.logout-link, .btn-logout').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                logout();
            });
        });

        // Mostrar información del usuario en consola (para desarrollo)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const user = getCurrentUser();
            console.log('Usuario actual:', user);
        }
    });
}
// En auth.js, agregar después de las funciones existentes

// Verificar permisos de página basado en rol
function verificarPermisosPagina() {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const currentPage = window.location.pathname.split('/').pop();

    // Definir qué páginas puede ver cada rol
    const permisos = {
        admin: ['dashboard.html', 'productos.html', 'carrito.html', 'analiticas.html', 'usuarios.html', 'orders.html', 'configuracion.html'],
        supervisor: ['dashboard.html', 'productos.html', 'carrito.html', 'orders.html'],
        vendedor: ['productos.html', 'carrito.html', 'orders.html'],
        vendedor1: ['productos.html', 'carrito.html', 'orders.html']
    };

    const paginasPermitidas = permisos[currentUser.rol] || permisos.vendedor1;

    if (!paginasPermitidas.includes(currentPage)) {
        // Redirigir a la primera página permitida
        if (paginasPermitidas.length > 0) {
            window.location.href = paginasPermitidas[0];
        } else {
            window.location.href = 'login.html';
        }
        return false;
    }

    return true;
}

// Modificar la función initializeProtectedPage para incluir verificación de permisos
const originalInitialize = window.auth.initializeProtectedPage;
window.auth.initializeProtectedPage = function () {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }

    // Verificar permisos de página
    if (!verificarPermisosPagina()) {
        return false;
    }

    // Actualizar UI según el rol
    actualizarUISegunRol(getCurrentUser());

    return true;
};

// Función para actualizar la UI según el rol del usuario
function actualizarUISegunRol(user) {
    if (!user) return;

    // Ocultar elementos que no debería ver según su rol
    const elementosPorRol = {
        admin: ['.admin-only', '.user-management'],
        supervisor: ['.admin-only', '.user-management', '.analytics-only'],
        vendedor: ['.admin-only', '.user-management', '.analytics-only', '.dashboard-only'],
        vendedor1: ['.admin-only', '.user-management', '.analytics-only', '.dashboard-only']
    };

    // Mostrar solo los elementos permitidos para el rol
    const elementosAEliminar = elementosPorRol[user.rol] || elementosPorRol.vendedor1;
    elementosAEliminar.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
}

// Agregar la función al objeto global window.auth
window.auth.actualizarUISegunRol = actualizarUISegunRol;
window.auth.verificarPermisosPagina = verificarPermisosPagina;
