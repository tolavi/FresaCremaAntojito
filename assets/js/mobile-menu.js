// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    updateCartBadge();
    initializeLogout();
});

// Inicializar menú móvil
function initializeMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!hamburgerBtn || !sidebar) return;
    
    // Mostrar/ocultar botón hamburguesa según tamaño de pantalla
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            hamburgerBtn.style.display = 'flex';
        } else {
            hamburgerBtn.style.display = 'none';
            sidebar.classList.remove('mobile-open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    }
    
    // Verificar tamaño inicial
    checkScreenSize();
    
    // Verificar en cambios de tamaño
    window.addEventListener('resize', checkScreenSize);
    
    // Toggle sidebar
    hamburgerBtn.addEventListener('click', function() {
        sidebar.classList.toggle('mobile-open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    });
    
    // Cerrar sidebar al hacer clic en overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('mobile-open');
            this.classList.remove('active');
        });
    }
    
    // Cerrar sidebar al hacer clic en items (solo en móvil)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
            }
        });
    });
}

// Actualizar badge del carrito
function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        // Badge en header
        const badge = document.getElementById('cartBadge');
        if (badge) {
            if (totalItems > 0) {
                badge.style.display = 'flex';
                badge.textContent = totalItems;
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Badge en sidebar móvil
        const badgeMobile = document.getElementById('cartBadgeMobile');
        if (badgeMobile) {
            if (totalItems > 0) {
                badgeMobile.style.display = 'inline';
                badgeMobile.textContent = totalItems;
            } else {
                badgeMobile.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// Inicializar logout
function initializeLogout() {
    // Agregar opción de logout si no existe
    setTimeout(() => {
        const sidebarNav = document.querySelector('aside nav');
        if (sidebarNav && !sidebarNav.querySelector('.logout-item')) {
            const logoutItem = document.createElement('a');
            logoutItem.className = 'nav-item logout-item';
            logoutItem.href = '#';
            logoutItem.innerHTML = `
                <span class="nav-icon">🚪</span>
                <span>Cerrar Sesión</span>
            `;
            
            logoutItem.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    // Llamar a la función de logout si existe
                    if (window.auth && typeof window.auth.logout === 'function') {
                        window.auth.logout();
                    } else {
                        // Fallback
                        localStorage.removeItem('fresa_user');
                        localStorage.removeItem('fresa_login_time');
                        window.location.href = 'login.html';
                    }
                }
            });
            
            sidebarNav.appendChild(logoutItem);
        }
    }, 500);
}

// Actualizar nombre de usuario
function updateUserName() {
    try {
        const userData = localStorage.getItem('fresa_user');
        if (userData) {
            const user = JSON.parse(userData);
            const userSpans = document.querySelectorAll('.user-profile span');
            userSpans.forEach(span => {
                if (user && user.nombre) {
                    span.textContent = user.nombre;
                }
            });
        }
    } catch (error) {
        console.error('Error updating user name:', error);
    }
}

// Inicializar cuando la página carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeMobileMenu();
        updateCartBadge();
        updateUserName();
        initializeLogout();
    });
} else {
    initializeMobileMenu();
    updateCartBadge();
    updateUserName();
    initializeLogout();
}