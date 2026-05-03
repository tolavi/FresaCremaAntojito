// usuarios.js - Gestión de usuarios con integración al sistema de autenticación

document.addEventListener('DOMContentLoaded', function () {
    // Clave para almacenar usuarios en localStorage
    const USUARIOS_KEY = 'fresa_usuarios';

    // Función para obtener todos los usuarios (incluyendo los temporales del auth)
    function obtenerTodosLosUsuarios() {
        // 1. Obtener usuarios del sistema de autenticación
        let usuariosAuth = [];
        if (window.auth && typeof window.auth.getAllUsers === 'function') {
            usuariosAuth = window.auth.getAllUsers();
        } else {
            // Fallback: intentar obtener directamente de localStorage
            try {
                const usuariosGuardados = localStorage.getItem(USUARIOS_KEY);
                if (usuariosGuardados) {
                    usuariosAuth = JSON.parse(usuariosGuardados);
                }
            } catch (error) {
                console.error('Error al leer usuarios:', error);
            }
        }

        // 2. Asegurar que los usuarios tengan el formato correcto
        return usuariosAuth.map(user => ({
            id: user.id,
            usuario: user.usuario || user.username,
            correo: user.correo || user.email,
            rol: user.rol,
            password: user.password,
            nombreCompleto: user.nombreCompleto || user.nombre || user.usuario,
            fechaCreacion: user.fechaCreacion || new Date().toISOString().split('T')[0]
        }));
    }

    // Función para guardar usuarios en localStorage
    function guardarUsuarios(usuarios) {
        try {
            // Guardar en localStorage
            localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));

            // También actualizar el sistema de autenticación si es posible
            if (window.auth && window.auth.actualizarUsuarios) {
                window.auth.actualizarUsuarios(usuarios);
            }
        } catch (error) {
            console.error('Error al guardar usuarios en localStorage:', error);
        }
    }

    // Cargar usuarios desde el sistema
    let usuarios = obtenerTodosLosUsuarios();

    // Variables de estado
    let usuariosFiltrados = [...usuarios];
    let currentPage = 1;
    let recordsPerPage = 5;
    let searchTerm = '';
    let modoEdicion = false;
    let usuarioEditandoId = null;

    // Elementos del DOM
    const usuariosBody = document.getElementById('usuarios-body');
    const recordsInfo = document.getElementById('records-info');
    const currentPageElement = document.getElementById('current-page');
    const firstPageBtn = document.getElementById('first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const lastPageBtn = document.getElementById('last-page');
    const searchInput = document.getElementById('search-input');
    const recordsPerPageSelect = document.getElementById('records-per-page');
    const btnSearch = document.querySelector('.btn-search');
    const btnNuevo = document.getElementById('btn-nuevo');

    // Elementos del formulario
    const overlay = document.getElementById('overlay');
    const formularioUsuario = document.getElementById('formulario-usuario');
    const cerrarFormulario = document.getElementById('cerrar-formulario');
    const cancelarFormulario = document.getElementById('cancelar-formulario');
    const formNuevoUsuario = document.getElementById('form-nuevo-usuario');
    const nombreUsuarioInput = document.getElementById('nombre-usuario');
    const correoUsuarioInput = document.getElementById('correo-usuario');
    const rolUsuarioSelect = document.getElementById('rol-usuario');
    const passwordUsuarioInput = document.getElementById('password-usuario');
    const confirmarPasswordInput = document.getElementById('confirmar-password');
    const formularioTitulo = document.querySelector('.form-header h2');
    const btnGuardar = document.querySelector('.btn-guardar');

    // Verificar que los elementos críticos existan
    if (!usuariosBody || !recordsPerPageSelect) {
        console.error('Elementos críticos del DOM no encontrados');
        return;
    }

    // Establecer recordsPerPage desde el select
    if (recordsPerPageSelect) {
        recordsPerPage = parseInt(recordsPerPageSelect.value);
    }

    // Función para recargar usuarios desde el sistema
    function recargarUsuarios() {
        usuarios = obtenerTodosLosUsuarios();
        buscarUsuarios();
    }

    // Función para mostrar/ocultar contraseña en la tabla
    function togglePasswordVisibility(element) {
        const passwordSpan = element.querySelector('.password-text');
        const eyeIcon = element.querySelector('.eye-icon');

        if (!passwordSpan || !eyeIcon) return;

        if (passwordSpan.dataset.visible === 'true') {
            // Ocultar contraseña
            const passwordLength = passwordSpan.dataset.password.length;
            passwordSpan.textContent = '•'.repeat(passwordLength);
            passwordSpan.dataset.visible = 'false';
            eyeIcon.className = 'eye-icon fas fa-eye';
            eyeIcon.title = 'Mostrar contraseña';
        } else {
            // Mostrar contraseña
            passwordSpan.textContent = passwordSpan.dataset.password;
            passwordSpan.dataset.visible = 'true';
            eyeIcon.className = 'eye-icon fas fa-eye-slash';
            eyeIcon.title = 'Ocultar contraseña';
        }
    }

    // Función para mostrar formulario (nuevo o edición)
    function mostrarFormulario(usuario = null) {
        if (!overlay || !formularioUsuario) return;

        // Verificar permisos para editar/crear usuarios
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        if (currentUser && currentUser.rol !== 'admin') {
            mostrarMensajeExito('No tienes permisos para realizar esta acción', 'error');
            return;
        }

        overlay.classList.add('active');
        formularioUsuario.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (usuario) {
            // Modo edición
            modoEdicion = true;
            usuarioEditandoId = usuario.id;
            if (formularioTitulo) formularioTitulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
            if (btnGuardar) btnGuardar.innerHTML = '<i class="fas fa-save"></i> Actualizar Usuario';

            // Rellenar formulario con datos del usuario
            nombreUsuarioInput.value = usuario.usuario;
            correoUsuarioInput.value = usuario.correo;
            rolUsuarioSelect.value = usuario.rol;

            // No mostrar la contraseña actual por seguridad
            passwordUsuarioInput.value = '';
            confirmarPasswordInput.value = '';

            // Cambiar placeholder para indicar que es opcional en edición
            passwordUsuarioInput.placeholder = 'Dejar en blanco para mantener la actual';
            confirmarPasswordInput.placeholder = 'Dejar en blanco para mantener la actual';

            // Quitar required en modo edición
            passwordUsuarioInput.removeAttribute('required');
            confirmarPasswordInput.removeAttribute('required');
        } else {
            // Modo nuevo
            modoEdicion = false;
            usuarioEditandoId = null;
            if (formularioTitulo) formularioTitulo.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
            if (btnGuardar) btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Usuario';

            // Restaurar placeholder original
            passwordUsuarioInput.placeholder = 'Mínimo 6 caracteres';
            confirmarPasswordInput.placeholder = 'Repita la contraseña';

            // Agregar required en modo nuevo
            passwordUsuarioInput.setAttribute('required', 'required');
            confirmarPasswordInput.setAttribute('required', 'required');

            limpiarFormulario();
        }

        // Remover mensajes de error
        ocultarTodosLosErrores();
    }

    function ocultarFormulario() {
        if (!overlay || !formularioUsuario) return;

        overlay.classList.remove('active');
        formularioUsuario.classList.remove('active');
        document.body.style.overflow = 'auto';
        limpiarFormulario();
        modoEdicion = false;
        usuarioEditandoId = null;

        // Restaurar atributos originales
        if (passwordUsuarioInput) {
            passwordUsuarioInput.setAttribute('required', 'required');
            passwordUsuarioInput.placeholder = 'Mínimo 6 caracteres';
        }
        if (confirmarPasswordInput) {
            confirmarPasswordInput.setAttribute('required', 'required');
            confirmarPasswordInput.placeholder = 'Repita la contraseña';
        }
    }

    // Función para limpiar el formulario
    function limpiarFormulario() {
        if (formNuevoUsuario) formNuevoUsuario.reset();
        ocultarTodosLosErrores();
        if (nombreUsuarioInput) nombreUsuarioInput.style.borderColor = '#ddd';
        if (correoUsuarioInput) correoUsuarioInput.style.borderColor = '#ddd';
        if (rolUsuarioSelect) rolUsuarioSelect.style.borderColor = '#ddd';
        if (passwordUsuarioInput) passwordUsuarioInput.style.borderColor = '#ddd';
        if (confirmarPasswordInput) confirmarPasswordInput.style.borderColor = '#ddd';
    }

    // Función para ocultar todos los mensajes de error
    function ocultarTodosLosErrores() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }

    // Función para mostrar error en un campo específico
    function mostrarError(campoId, mensaje) {
        const errorElement = document.getElementById(`error-${campoId}`);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.classList.add('show');
        }

        // Resaltar el campo con error
        const inputElement = document.getElementById(`${campoId}-usuario`);
        if (inputElement) {
            inputElement.style.borderColor = '#dc3545';
            inputElement.focus();
        }
    }

    // Función para validar el formulario
    function validarFormulario() {
        let isValid = true;
        ocultarTodosLosErrores();

        // Validar nombre de usuario
        const nombre = nombreUsuarioInput ? nombreUsuarioInput.value.trim() : '';
        if (!nombre) {
            mostrarError('nombre', 'El nombre de usuario es requerido');
            isValid = false;
        } else if (nombre.length < 3) {
            mostrarError('nombre', 'El nombre debe tener al menos 3 caracteres');
            isValid = false;
        } else if (modoEdicion) {
            if (usuarios.some(u => u.id !== usuarioEditandoId && u.usuario.toLowerCase() === nombre.toLowerCase())) {
                mostrarError('nombre', 'Este nombre de usuario ya existe');
                isValid = false;
            }
        } else {
            if (usuarios.some(u => u.usuario.toLowerCase() === nombre.toLowerCase())) {
                mostrarError('nombre', 'Este nombre de usuario ya existe');
                isValid = false;
            }
        }

        // Validar correo electrónico
        const correo = correoUsuarioInput ? correoUsuarioInput.value.trim() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correo) {
            mostrarError('correo', 'El correo electrónico es requerido');
            isValid = false;
        } else if (!emailRegex.test(correo)) {
            mostrarError('correo', 'Ingrese un correo electrónico válido');
            isValid = false;
        } else if (modoEdicion) {
            if (usuarios.some(u => u.id !== usuarioEditandoId && u.correo.toLowerCase() === correo.toLowerCase())) {
                mostrarError('correo', 'Este correo electrónico ya está registrado');
                isValid = false;
            }
        } else {
            if (usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
                mostrarError('correo', 'Este correo electrónico ya está registrado');
                isValid = false;
            }
        }

        // Validar rol
        const rol = rolUsuarioSelect ? rolUsuarioSelect.value : '';
        if (!rol) {
            mostrarError('rol', 'Seleccione un rol para el usuario');
            isValid = false;
        }

        // Validar contraseña
        const password = passwordUsuarioInput ? passwordUsuarioInput.value : '';
        const confirmarPassword = confirmarPasswordInput ? confirmarPasswordInput.value : '';

        if (modoEdicion) {
            if (password || confirmarPassword) {
                if (password.length < 6) {
                    mostrarError('password', 'La contraseña debe tener al menos 6 caracteres');
                    isValid = false;
                } else if (password !== confirmarPassword) {
                    mostrarError('confirmar', 'Las contraseñas no coinciden');
                    isValid = false;
                }
            }
        } else {
            if (!password) {
                mostrarError('password', 'La contraseña es requerida');
                isValid = false;
            } else if (password.length < 6) {
                mostrarError('password', 'La contraseña debe tener al menos 6 caracteres');
                isValid = false;
            } else if (!confirmarPassword) {
                mostrarError('confirmar', 'Confirme la contraseña');
                isValid = false;
            } else if (password !== confirmarPassword) {
                mostrarError('confirmar', 'Las contraseñas no coinciden');
                isValid = false;
            }
        }

        return isValid;
    }

    // Función para guardar usuario
    function guardarUsuario(event) {
        event.preventDefault();

        if (!validarFormulario()) {
            return;
        }

        if (modoEdicion) {
            // Actualizar usuario existente
            const usuarioIndex = usuarios.findIndex(u => u.id === usuarioEditandoId);
            if (usuarioIndex !== -1) {
                const usuarioActualizado = { ...usuarios[usuarioIndex] };

                usuarioActualizado.usuario = nombreUsuarioInput.value.trim();
                usuarioActualizado.correo = correoUsuarioInput.value.trim();
                usuarioActualizado.rol = rolUsuarioSelect.value;

                const nuevaPassword = passwordUsuarioInput.value;
                if (nuevaPassword && nuevaPassword.length >= 6) {
                    usuarioActualizado.password = nuevaPassword;
                }

                usuarios[usuarioIndex] = usuarioActualizado;
                guardarUsuarios(usuarios);
                buscarUsuarios();
                mostrarMensajeExito('Usuario actualizado exitosamente');
                ocultarFormulario();
            }
        } else {
            // Crear nuevo usuario
            const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;

            const nuevoUsuario = {
                id: nuevoId,
                usuario: nombreUsuarioInput.value.trim(),
                correo: correoUsuarioInput.value.trim(),
                rol: rolUsuarioSelect.value,
                password: passwordUsuarioInput.value,
                nombreCompleto: nombreUsuarioInput.value.trim(),
                fechaCreacion: new Date().toISOString().split('T')[0]
            };

            usuarios.push(nuevoUsuario);
            guardarUsuarios(usuarios);
            buscarUsuarios();
            mostrarMensajeExito('Usuario creado exitosamente');
            ocultarFormulario();
        }
    }

    // Función para mostrar mensaje de éxito o error
    function mostrarMensajeExito(mensaje, tipo = 'success') {
        const mensajeElement = document.createElement('div');
        mensajeElement.className = 'mensaje-exito';

        const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const color = tipo === 'success' ? 'linear-gradient(to right, #4CAF50, #45a049)' : 'linear-gradient(to right, #dc3545, #c82333)';

        mensajeElement.innerHTML = `
            <i class="fas ${icono}"></i>
            <span>${mensaje}</span>
        `;

        mensajeElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(mensajeElement);

        setTimeout(() => {
            mensajeElement.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(mensajeElement)) {
                    document.body.removeChild(mensajeElement);
                }
            }, 300);
        }, 3000);
    }

    // Función para renderizar la tabla

    function renderTable() {
        if (!usuariosBody) return;

        // Obtener usuario actual para verificar permisos
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        const esAdmin = currentUser && currentUser.rol === 'admin';

        usuariosBody.innerHTML = '';

        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, usuariosFiltrados.length);
        const usuariosPagina = usuariosFiltrados.slice(startIndex, endIndex);

        if (usuariosPagina.length === 0) {
            usuariosBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay usuarios registrados</td></tr>';
            updatePaginationInfo();
            updatePaginationControls(totalPages);
            return;
        }

        usuariosPagina.forEach(usuario => {
            const row = document.createElement('tr');

            let rolClass = usuario.rol === 'admin' ? 'rol-admin' : 'rol-usuario';
            let rolTexto = usuario.rol === 'admin' ? 'Administrador' :
                (usuario.rol === 'vendedor' ? 'Vendedor' :
                    (usuario.rol === 'supervisor' ? 'Supervisor' : 'Vendedor 1'));

            const fechaTexto = usuario.fechaCreacion ?
                `<div class="fecha-creacion">${usuario.fechaCreacion}</div>` : '';

            const passwordLength = usuario.password ? usuario.password.length : 0;
            const passwordDots = '•'.repeat(passwordLength);

            // Solo mostrar acciones si es administrador
            const accionesHtml = esAdmin ? `
            <td class="acciones">
                <button class="btn-editar" data-id="${usuario.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-eliminar" data-id="${usuario.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        ` : '<td class="acciones">-</td>';

            row.innerHTML = `
            <td>${usuario.id}</td>
            <td>
                <div class="usuario-info">
                    <strong>${escapeHtml(usuario.usuario)}</strong>
                    ${fechaTexto}
                </div>
            </td>
            <td>${escapeHtml(usuario.correo)}</td>
            <td><span class="${rolClass}">${rolTexto}</span></td>
            <td>
                <div class="password-display" style="cursor: pointer;">
                    <span class="password-text" 
                          data-password="${escapeHtml(usuario.password)}" 
                          data-visible="false">
                        ${passwordDots}
                    </span>
                    <i class="eye-icon fas fa-eye" title="Mostrar contraseña"></i>
                </div>
            </td>
            ${accionesHtml}
        `;

            usuariosBody.appendChild(row);
        });

        updatePaginationInfo();
        updatePaginationControls(totalPages);
    }

    // Función para escapar HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Event delegation para contraseñas
    if (usuariosBody) {
        usuariosBody.addEventListener('click', function (event) {
            const passwordDisplay = event.target.closest('.password-display');
            if (passwordDisplay) {
                event.stopPropagation();
                togglePasswordVisibility(passwordDisplay);
            }
        });
    }

    function updatePaginationInfo() {
        if (!recordsInfo) return;

        const totalUsuarios = usuariosFiltrados.length;
        const startIndex = (currentPage - 1) * recordsPerPage + 1;
        const endIndex = Math.min(startIndex + recordsPerPage - 1, totalUsuarios);

        if (totalUsuarios === 0) {
            recordsInfo.textContent = 'Mostrando 0 a 0 de 0 registros';
        } else {
            recordsInfo.textContent = `Mostrando ${startIndex} a ${endIndex} de ${totalUsuarios} registros`;
        }

        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }
    }

    function updatePaginationControls(totalPages) {
        if (firstPageBtn) firstPageBtn.disabled = currentPage === 1 || totalPages === 0;
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1 || totalPages === 0;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function buscarUsuarios() {
        searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

        if (searchTerm === '') {
            usuariosFiltrados = [...usuarios];
        } else {
            usuariosFiltrados = usuarios.filter(usuario =>
                usuario.usuario.toLowerCase().includes(searchTerm) ||
                usuario.correo.toLowerCase().includes(searchTerm) ||
                usuario.rol.toLowerCase().includes(searchTerm) ||
                usuario.id.toString().includes(searchTerm)
            );
        }

        currentPage = 1;
        renderTable();
    }

    function goToPage(page) {
        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        if (totalPages === 0) return;

        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        currentPage = page;
        renderTable();
    }

    function eliminarUsuario(id) {
        // Verificar permisos
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        if (currentUser && currentUser.rol !== 'admin') {
            mostrarMensajeExito('No tienes permisos para eliminar usuarios', 'error');
            return;
        }

        const usuarioAEliminar = usuarios.find(u => u.id === id);

        if (!usuarioAEliminar) return;

        // No permitir eliminar el propio usuario
        if (currentUser && currentUser.id === id) {
            mostrarMensajeExito('No puedes eliminar tu propio usuario', 'error');
            return;
        }

        const adminsRestantes = usuarios.filter(u => u.rol === 'admin' && u.id !== id).length;

        if (usuarioAEliminar.rol === 'admin' && adminsRestantes === 0) {
            mostrarMensajeExito('No puedes eliminar el único usuario administrador', 'error');
            return;
        }

        if (confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuarioAEliminar.usuario}"?`)) {
            const index = usuarios.findIndex(u => u.id === id);
            if (index !== -1) {
                usuarios.splice(index, 1);
                guardarUsuarios(usuarios);
                buscarUsuarios();
                mostrarMensajeExito(`Usuario "${usuarioAEliminar.usuario}" eliminado correctamente.`);
            }
        }
    }

    function editarUsuario(id) {
        const usuario = usuarios.find(u => u.id === id);
        if (usuario) {
            mostrarFormulario(usuario);
        }
    }

    // Event Listeners
    if (btnNuevo) btnNuevo.addEventListener('click', () => mostrarFormulario());
    if (cerrarFormulario) cerrarFormulario.addEventListener('click', ocultarFormulario);
    if (cancelarFormulario) cancelarFormulario.addEventListener('click', ocultarFormulario);
    if (overlay) overlay.addEventListener('click', ocultarFormulario);

    if (formularioUsuario) {
        formularioUsuario.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    }

    if (formNuevoUsuario) {
        formNuevoUsuario.addEventListener('submit', guardarUsuario);
    }

    // Eventos de búsqueda y paginación
    if (btnSearch) btnSearch.addEventListener('click', buscarUsuarios);

    if (searchInput) {
        searchInput.addEventListener('keyup', function (event) {
            if (event.key === 'Enter') {
                buscarUsuarios();
            }
        });
    }

    if (recordsPerPageSelect) {
        recordsPerPageSelect.addEventListener('change', function () {
            recordsPerPage = parseInt(this.value);
            currentPage = 1;
            renderTable();
        });
    }

    if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (lastPageBtn) lastPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        goToPage(totalPages);
    });

    // Delegación de eventos para botones de acción
    if (usuariosBody) {
        usuariosBody.addEventListener('click', function (event) {
            const eliminarBtn = event.target.closest('.btn-eliminar');
            if (eliminarBtn) {
                const id = parseInt(eliminarBtn.getAttribute('data-id'));
                eliminarUsuario(id);
                return;
            }

            const editarBtn = event.target.closest('.btn-editar');
            if (editarBtn) {
                const id = parseInt(editarBtn.getAttribute('data-id'));
                editarUsuario(id);
                return;
            }
        });
    }

    // Cerrar con Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && formularioUsuario && formularioUsuario.classList.contains('active')) {
            ocultarFormulario();
        }
    });

    // Agregar estilos CSS
    function addStyles() {
        if (document.getElementById('dynamic-user-styles')) return;

        const style = document.createElement('style');
        style.id = 'dynamic-user-styles';
        style.textContent = `
            .rol-admin {
                background-color: #d4edda;
                color: #155724;
                padding: 5px 10px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 12px;
                display: inline-block;
            }
            
            .rol-usuario {
                background-color: #fff3cd;
                color: #856404;
                padding: 5px 10px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 12px;
                display: inline-block;
            }
            
            .usuario-info {
                display: flex;
                flex-direction: column;
            }
            
            .fecha-creacion {
                font-size: 11px;
                color: #6c757d;
                margin-top: 2px;
            }
            
            .password-display {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background-color: #f8f9fa;
                border-radius: 4px;
                transition: background-color 0.2s;
                cursor: pointer;
            }
            
            .password-display:hover {
                background-color: #e9ecef;
            }
            
            .password-text {
                font-family: 'Courier New', monospace;
                font-size: 14px;
                user-select: none;
            }
            
            .eye-icon {
                color: #6c757d;
                font-size: 14px;
                transition: color 0.2s;
                cursor: pointer;
            }
            
            .eye-icon:hover {
                color: #495057;
            }
        `;

        document.head.appendChild(style);
    }

    // Inicializar
    addStyles();
    renderTable();
});