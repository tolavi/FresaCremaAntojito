// usuarios.js - Gestión de usuarios con integración al sistema de autenticación

document.addEventListener('DOMContentLoaded', function () {
    // ============================================
    // CONFIGURACIÓN Y CONSTANTES
    // ============================================
    const USUARIOS_KEY = 'fresa_usuarios';

    // ============================================
    // FUNCIONES DE GESTIÓN DE USUARIOS
    // ============================================

    // Obtener todos los usuarios (incluyendo los del sistema de autenticación)
    function obtenerTodosLosUsuarios() {
        let usuariosAuth = [];

        // 1. Intentar obtener del sistema de autenticación
        if (window.auth && typeof window.auth.getAllUsers === 'function') {
            usuariosAuth = window.auth.getAllUsers();
        } else {
            // 2. Fallback: leer directamente de localStorage
            try {
                const usuariosGuardados = localStorage.getItem(USUARIOS_KEY);
                if (usuariosGuardados) {
                    usuariosAuth = JSON.parse(usuariosGuardados);
                } else {
                    // 3. Usuario por defecto (admin)
                    usuariosAuth = [{
                        id: 1,
                        usuario: "admin",
                        correo: "admin@fresaconcrema.com",
                        rol: "admin",
                        password: "admin123",
                        nombreCompleto: "Administrador",
                        foto: "",
                        fechaCreacion: new Date().toISOString().split('T')[0]
                    }];
                }
            } catch (error) {
                console.error('Error al leer usuarios:', error);
            }
        }

        // 4. Asegurar formato consistente
        return usuariosAuth.map(user => ({
            id: user.id,
            usuario: user.usuario || user.username,
            correo: user.correo || user.email,
            rol: user.rol,
            password: user.password,
            foto: user.foto || '',
            nombreCompleto: user.nombreCompleto || user.nombre || user.usuario,
            fechaCreacion: user.fechaCreacion || new Date().toISOString().split('T')[0]
        }));
    }

    // Guardar usuarios en localStorage
    function guardarUsuarios(usuarios) {
        try {
            localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios));

            // Actualizar sistema de autenticación si está disponible
            if (window.auth && typeof window.auth.actualizarUsuarios === 'function') {
                window.auth.actualizarUsuarios(usuarios);
            }
        } catch (error) {
            console.error('Error al guardar usuarios:', error);
        }
    }

    // Recargar usuarios desde el sistema
    function recargarUsuarios() {
        usuarios = obtenerTodosLosUsuarios();
        buscarUsuarios();
    }

    // ============================================
    // MANEJO DE FOTOS
    // ============================================

    // Convertir archivo a Base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Actualizar previsualización de foto
    function actualizarPreview(fotoUrl) {
        if (!fotoPreview) return;

        if (fotoUrl && fotoUrl.trim() !== '') {
            fotoPreview.innerHTML = `<img src="${escapeHtml(fotoUrl)}" alt="Preview" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%;">`;
        } else {
            fotoPreview.innerHTML = '<i class="fas fa-user-circle fa-3x" style="color: #3a7bd5;"></i>';
        }
    }

    // Manejar selección de foto desde archivo
    function manejarSeleccionFoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            mostrarError('foto', 'Por favor selecciona una imagen válida');
            return;
        }

        // Validar tamaño (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            mostrarError('foto', 'La imagen no debe superar los 2MB');
            return;
        }

        // Convertir a Base64
        fileToBase64(file)
            .then(base64 => {
                fotoDataURL = base64;
                actualizarPreview(fotoDataURL);
                if (fotoUrlInput) fotoUrlInput.value = '';
                ocultarError('foto');
            })
            .catch(error => {
                console.error('Error al convertir imagen:', error);
                mostrarError('foto', 'Error al procesar la imagen');
            });
    }

    // Manejar URL de foto externa
    function manejarUrlFoto() {
        if (!fotoUrlInput) return;

        const url = fotoUrlInput.value.trim();
        if (url) {
            fotoDataURL = url;
            actualizarPreview(url);
            if (fotoUsuarioInput) fotoUsuarioInput.value = '';
            if (btnRemoverFoto) btnRemoverFoto.style.display = 'inline-flex';
            ocultarError('foto');
        }
    }

    // Remover foto actual
    function removerFoto() {
        fotoDataURL = '';
        actualizarPreview('');
        if (fotoUsuarioInput) fotoUsuarioInput.value = '';
        if (fotoUrlInput) fotoUrlInput.value = '';
        if (btnRemoverFoto) btnRemoverFoto.style.display = 'none';
    }

    // ============================================
    // MANEJO DEL FORMULARIO (MODAL)
    // ============================================

    // Mostrar formulario (nuevo o edición)
    function mostrarFormulario(usuario = null) {
        if (!overlay || !formularioUsuario) return;

        // Verificar permisos
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        if (currentUser && currentUser.rol !== 'admin') {
            mostrarMensaje('No tienes permisos para realizar esta acción', 'error');
            return;
        }

        overlay.classList.add('active');
        formularioUsuario.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reiniciar foto
        fotoDataURL = '';

        if (usuario) {
            // MODO EDICIÓN
            modoEdicion = true;
            usuarioEditandoId = usuario.id;

            formularioTitulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Actualizar Usuario';

            // Rellenar formulario
            if (nombreUsuarioInput) nombreUsuarioInput.value = usuario.usuario || '';
            if (correoUsuarioInput) correoUsuarioInput.value = usuario.correo || '';
            if (rolUsuarioSelect) rolUsuarioSelect.value = usuario.rol || '';

            // Manejar foto
            if (usuario.foto) {
                fotoDataURL = usuario.foto;
                actualizarPreview(usuario.foto);
                if (btnRemoverFoto) btnRemoverFoto.style.display = 'inline-flex';
            } else {
                actualizarPreview('');
                if (btnRemoverFoto) btnRemoverFoto.style.display = 'none';
            }

            if (fotoUrlInput) fotoUrlInput.value = '';
            if (fotoUsuarioInput) fotoUsuarioInput.value = '';

            // Contraseña: no requerida en edición
            if (passwordUsuarioInput) {
                passwordUsuarioInput.value = '';
                passwordUsuarioInput.placeholder = 'Dejar en blanco para mantener la actual';
                passwordUsuarioInput.removeAttribute('required');
            }
            if (confirmarPasswordInput) {
                confirmarPasswordInput.value = '';
                confirmarPasswordInput.placeholder = 'Dejar en blanco para mantener la actual';
                confirmarPasswordInput.removeAttribute('required');
            }
        } else {
            // MODO NUEVO USUARIO
            modoEdicion = false;
            usuarioEditandoId = null;

            formularioTitulo.innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar Usuario';

            // Limpiar formulario
            if (formNuevoUsuario) formNuevoUsuario.reset();

            fotoDataURL = '';
            actualizarPreview('');
            if (fotoUrlInput) fotoUrlInput.value = '';
            if (fotoUsuarioInput) fotoUsuarioInput.value = '';
            if (btnRemoverFoto) btnRemoverFoto.style.display = 'none';

            // Contraseña: requerida en nuevo usuario
            if (passwordUsuarioInput) {
                passwordUsuarioInput.placeholder = 'Mínimo 6 caracteres';
                passwordUsuarioInput.setAttribute('required', 'required');
            }
            if (confirmarPasswordInput) {
                confirmarPasswordInput.placeholder = 'Repita la contraseña';
                confirmarPasswordInput.setAttribute('required', 'required');
            }
        }

        ocultarTodosLosErrores();
    }

    // Ocultar formulario
    function ocultarFormulario() {
        if (!overlay || !formularioUsuario) return;

        overlay.classList.remove('active');
        formularioUsuario.classList.remove('active');
        document.body.style.overflow = 'auto';

        modoEdicion = false;
        usuarioEditandoId = null;
        fotoDataURL = null;

        // Restaurar atributos de contraseña
        if (passwordUsuarioInput) {
            passwordUsuarioInput.setAttribute('required', 'required');
            passwordUsuarioInput.placeholder = 'Mínimo 6 caracteres';
        }
        if (confirmarPasswordInput) {
            confirmarPasswordInput.setAttribute('required', 'required');
            confirmarPasswordInput.placeholder = 'Repita la contraseña';
        }
    }

    // ============================================
    // VALIDACIÓN DEL FORMULARIO
    // ============================================

    function ocultarError(campoId) {
        const errorElement = document.getElementById(`error-${campoId}`);
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }

        const inputElement = document.getElementById(`${campoId}-usuario`);
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    }

    function mostrarError(campoId, mensaje) {
        const errorElement = document.getElementById(`error-${campoId}`);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.classList.add('show');
        }

        const inputElement = document.getElementById(`${campoId}-usuario`);
        if (inputElement) {
            inputElement.style.borderColor = '#dc3545';
        }
    }

    function ocultarTodosLosErrores() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });

        document.querySelectorAll('.form-group input, .form-group select').forEach(input => {
            input.style.borderColor = '';
        });
    }

    // Validar formulario completo
    function validarFormulario() {
        let isValid = true;
        ocultarTodosLosErrores();

        // 1. Validar nombre de usuario
        const nombre = nombreUsuarioInput ? nombreUsuarioInput.value.trim() : '';
        if (!nombre) {
            mostrarError('nombre', 'El nombre de usuario es requerido');
            isValid = false;
        } else if (nombre.length < 3) {
            mostrarError('nombre', 'El nombre debe tener al menos 3 caracteres');
            isValid = false;
        } else {
            const existeUsuario = usuarios.some(u =>
                u.id !== usuarioEditandoId &&
                u.usuario.toLowerCase() === nombre.toLowerCase()
            );
            if (existeUsuario) {
                mostrarError('nombre', 'Este nombre de usuario ya existe');
                isValid = false;
            }
        }

        // 2. Validar correo electrónico
        const correo = correoUsuarioInput ? correoUsuarioInput.value.trim() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correo) {
            mostrarError('correo', 'El correo electrónico es requerido');
            isValid = false;
        } else if (!emailRegex.test(correo)) {
            mostrarError('correo', 'Ingrese un correo electrónico válido');
            isValid = false;
        } else {
            const existeCorreo = usuarios.some(u =>
                u.id !== usuarioEditandoId &&
                u.correo.toLowerCase() === correo.toLowerCase()
            );
            if (existeCorreo) {
                mostrarError('correo', 'Este correo ya está registrado');
                isValid = false;
            }
        }

        // 3. Validar rol
        const rol = rolUsuarioSelect ? rolUsuarioSelect.value : '';
        if (!rol) {
            mostrarError('rol', 'Seleccione un rol para el usuario');
            isValid = false;
        }

        // 4. Validar contraseña
        const password = passwordUsuarioInput ? passwordUsuarioInput.value : '';
        const confirmarPassword = confirmarPasswordInput ? confirmarPasswordInput.value : '';

        if (modoEdicion) {
            // En edición: solo validar si se ingresó nueva contraseña
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
            // En nuevo usuario: contraseña es obligatoria
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

    // ============================================
    // CRUD: CREAR, LEER, ACTUALIZAR, ELIMINAR
    // ============================================

    // Guardar usuario (crear o actualizar)
    function guardarUsuario(event) {
        event.preventDefault();

        if (!validarFormulario()) return;

        if (modoEdicion) {
            // ACTUALIZAR USUARIO EXISTENTE
            const usuarioIndex = usuarios.findIndex(u => u.id === usuarioEditandoId);
            if (usuarioIndex !== -1) {
                const usuarioActualizado = { ...usuarios[usuarioIndex] };

                usuarioActualizado.usuario = nombreUsuarioInput.value.trim();
                usuarioActualizado.correo = correoUsuarioInput.value.trim();
                usuarioActualizado.rol = rolUsuarioSelect.value;

                if (fotoDataURL) {
                    usuarioActualizado.foto = fotoDataURL;
                }

                const nuevaPassword = passwordUsuarioInput ? passwordUsuarioInput.value : '';
                if (nuevaPassword && nuevaPassword.length >= 6) {
                    usuarioActualizado.password = nuevaPassword;
                }

                usuarios[usuarioIndex] = usuarioActualizado;
                guardarUsuarios(usuarios);
                buscarUsuarios();
                mostrarMensaje('Usuario actualizado exitosamente', 'success');
                ocultarFormulario();
            }
        } else {
            // CREAR NUEVO USUARIO
            const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;

            const nuevoUsuario = {
                id: nuevoId,
                usuario: nombreUsuarioInput.value.trim(),
                correo: correoUsuarioInput.value.trim(),
                rol: rolUsuarioSelect.value,
                password: passwordUsuarioInput.value,
                foto: fotoDataURL || '',
                nombreCompleto: nombreUsuarioInput.value.trim(),
                fechaCreacion: new Date().toISOString().split('T')[0]
            };

            usuarios.push(nuevoUsuario);
            guardarUsuarios(usuarios);
            buscarUsuarios();
            mostrarMensaje('Usuario creado exitosamente', 'success');
            ocultarFormulario();
        }
    }

    // Eliminar usuario
    function eliminarUsuario(id) {
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;

        // Verificar permisos
        if (currentUser && currentUser.rol !== 'admin') {
            mostrarMensaje('No tienes permisos para eliminar usuarios', 'error');
            return;
        }

        const usuarioAEliminar = usuarios.find(u => u.id === id);
        if (!usuarioAEliminar) return;

        // No permitir eliminar el propio usuario
        if (currentUser && currentUser.id === id) {
            mostrarMensaje('No puedes eliminar tu propio usuario', 'error');
            return;
        }

        // Verificar que no sea el último administrador
        const adminsRestantes = usuarios.filter(u => u.rol === 'admin' && u.id !== id).length;
        if (usuarioAEliminar.rol === 'admin' && adminsRestantes === 0) {
            mostrarMensaje('No puedes eliminar el único administrador', 'error');
            return;
        }

        if (confirm(`¿Eliminar al usuario "${usuarioAEliminar.usuario}"?`)) {
            const index = usuarios.findIndex(u => u.id === id);
            if (index !== -1) {
                usuarios.splice(index, 1);
                guardarUsuarios(usuarios);
                buscarUsuarios();
                mostrarMensaje(`Usuario "${usuarioAEliminar.usuario}" eliminado`);
            }
        }
    }

    // Editar usuario (cargar en formulario)
    function editarUsuario(id) {
        const usuario = usuarios.find(u => u.id === id);
        if (usuario) {
            mostrarFormulario(usuario);
        }
    }

    // ============================================
    // MANEJO DE CONTRASEÑA VISIBLE
    // ============================================

    function togglePasswordVisibility(element) {
        const passwordSpan = element.querySelector('.password-text');
        const eyeIcon = element.querySelector('.eye-icon');

        if (!passwordSpan || !eyeIcon) return;

        if (passwordSpan.dataset.visible === 'true') {
            // Ocultar
            const passwordLength = passwordSpan.dataset.password.length;
            passwordSpan.textContent = '•'.repeat(passwordLength);
            passwordSpan.dataset.visible = 'false';
            eyeIcon.className = 'eye-icon fas fa-eye';
            eyeIcon.title = 'Mostrar contraseña';
        } else {
            // Mostrar
            passwordSpan.textContent = passwordSpan.dataset.password;
            passwordSpan.dataset.visible = 'true';
            eyeIcon.className = 'eye-icon fas fa-eye-slash';
            eyeIcon.title = 'Ocultar contraseña';
        }
    }

    // ============================================
    // RENDERIZADO DE TABLA Y PAGINACIÓN
    // ============================================

    function renderTable() {
        if (!usuariosBody) return;

        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        const esAdmin = currentUser && currentUser.rol === 'admin';

        usuariosBody.innerHTML = '';

        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, usuariosFiltrados.length);
        const usuariosPagina = usuariosFiltrados.slice(startIndex, endIndex);

        if (usuariosPagina.length === 0) {
            usuariosBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay usuarios registrados</td></tr>';
            updatePaginationInfo();
            updatePaginationControls(totalPages);
            return;
        }

        usuariosPagina.forEach(usuario => {
            const row = document.createElement('tr');

            // Clase y texto del rol
            const rolClass = usuario.rol === 'admin' ? 'rol-admin' : 'rol-usuario';
            let rolTexto = {
                'admin': 'Administrador',
                'vendedor': 'Vendedor',
                'supervisor': 'Supervisor'
            }[usuario.rol] || 'Vendedor';

            const fechaTexto = usuario.fechaCreacion ?
                `<div class="fecha-creacion">${escapeHtml(usuario.fechaCreacion)}</div>` : '';

            // Contraseña enmascarada
            const passwordLength = usuario.password ? usuario.password.length : 0;
            const passwordDots = '•'.repeat(passwordLength);

            // Foto
            const fotoHtml = usuario.foto && usuario.foto.trim() !== '' ?
                `<img src="${escapeHtml(usuario.foto)}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;">` :
                `<i class="fas fa-user-circle fa-2x" style="color: #3a7bd5;"></i>`;

            // Construir celdas
            const cellId = document.createElement('td');
            cellId.textContent = usuario.id;

            const cellUsuario = document.createElement('td');
            cellUsuario.innerHTML = `
            <div class="usuario-info">
                <strong>${escapeHtml(usuario.usuario)}</strong>
                ${fechaTexto}
            </div>
        `;

            const cellCorreo = document.createElement('td');
            cellCorreo.textContent = usuario.correo;

            const cellRol = document.createElement('td');
            cellRol.innerHTML = `<span class="${rolClass}">${rolTexto}</span>`;

            const cellPassword = document.createElement('td');
            cellPassword.innerHTML = `
            <div class="password-display" style="cursor: pointer;">
                <span class="password-text" 
                      data-password="${escapeHtml(usuario.password)}" 
                      data-visible="false">
                    ${passwordDots}
                </span>
                <i class="eye-icon fas fa-eye" title="Mostrar contraseña"></i>
            </div>
        `;

            const cellFoto = document.createElement('td');
            cellFoto.innerHTML = `<div class="foto-tabla-container">${fotoHtml}</div>`;

            const cellAcciones = document.createElement('td');
            if (esAdmin) {
                cellAcciones.className = 'acciones';
                cellAcciones.innerHTML = `
                <button class="btn-editar" data-id="${usuario.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-eliminar" data-id="${usuario.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            `;
            } else {
                cellAcciones.textContent = '-';
                cellAcciones.className = 'acciones';
            }

            row.appendChild(cellId);
            row.appendChild(cellUsuario);
            row.appendChild(cellCorreo);
            row.appendChild(cellRol);
            row.appendChild(cellPassword);
            row.appendChild(cellFoto);
            row.appendChild(cellAcciones);

            usuariosBody.appendChild(row);
        });

        updatePaginationInfo();
        updatePaginationControls(totalPages);
    }

    function updatePaginationInfo() {
        if (!recordsInfo) return;

        const total = usuariosFiltrados.length;
        const start = total === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1;
        const end = Math.min(start + recordsPerPage - 1, total);

        recordsInfo.textContent = total === 0
            ? 'Mostrando 0 a 0 de 0 registros'
            : `Mostrando ${start} a ${end} de ${total} registros`;

        if (currentPageElement) {
            currentPageElement.textContent = currentPage;
        }
    }

    function updatePaginationControls(totalPages) {
        const noResults = totalPages === 0;

        if (firstPageBtn) firstPageBtn.disabled = currentPage === 1 || noResults;
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1 || noResults;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || noResults;
        if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages || noResults;
    }

    function goToPage(page) {
        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        if (totalPages === 0) return;

        page = Math.max(1, Math.min(page, totalPages));
        currentPage = page;
        renderTable();
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

    // ============================================
    // MENSAJES NOTIFICACIÓN
    // ============================================

    function mostrarMensaje(mensaje, tipo = 'success') {
        const mensajeElement = document.createElement('div');
        mensajeElement.className = 'mensaje-exito';

        const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const color = tipo === 'success' ? '#4CAF50' : '#dc3545';

        mensajeElement.innerHTML = `
            <i class="fas ${icono}"></i>
            <span>${escapeHtml(mensaje)}</span>
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

    // ============================================
    // UTILIDADES
    // ============================================

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ============================================
    // INICIALIZACIÓN Y EVENTOS
    // ============================================

    // Variables de estado
    let usuarios = obtenerTodosLosUsuarios();
    let usuariosFiltrados = [...usuarios];
    let currentPage = 1;
    let recordsPerPage = 5;
    let searchTerm = '';
    let modoEdicion = false;
    let usuarioEditandoId = null;
    let fotoDataURL = null;

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

    // Elementos de foto
    const fotoUsuarioInput = document.getElementById('foto-usuario');
    const btnSubirFoto = document.getElementById('btn-subir-foto');
    const btnRemoverFoto = document.getElementById('btn-remover-foto');
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoUrlInput = document.getElementById('foto-url');

    // Validar elementos críticos
    if (!usuariosBody) {
        console.error('Elemento usuarios-body no encontrado');
        return;
    }

    // Configurar registros por página
    if (recordsPerPageSelect) {
        recordsPerPage = parseInt(recordsPerPageSelect.value);
    }

    // ============================================
    // REGISTRO DE EVENTOS
    // ============================================

    // Formulario - Abrir/Cerrar
    if (btnNuevo) btnNuevo.addEventListener('click', () => mostrarFormulario());
    if (cerrarFormulario) cerrarFormulario.addEventListener('click', ocultarFormulario);
    if (cancelarFormulario) cancelarFormulario.addEventListener('click', ocultarFormulario);
    if (overlay) overlay.addEventListener('click', ocultarFormulario);
    if (formularioUsuario) formularioUsuario.addEventListener('click', e => e.stopPropagation());
    if (formNuevoUsuario) formNuevoUsuario.addEventListener('submit', guardarUsuario);

    // Eventos de foto
    if (btnSubirFoto) btnSubirFoto.addEventListener('click', () => fotoUsuarioInput?.click());
    if (fotoUsuarioInput) fotoUsuarioInput.addEventListener('change', manejarSeleccionFoto);
    if (btnRemoverFoto) btnRemoverFoto.addEventListener('click', removerFoto);
    if (fotoUrlInput) {
        fotoUrlInput.addEventListener('blur', manejarUrlFoto);
        fotoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                manejarUrlFoto();
            }
        });
    }

    // Contraseña - toggle visibility (delegación de eventos)
    if (usuariosBody) {
        usuariosBody.addEventListener('click', (event) => {
            const passwordDisplay = event.target.closest('.password-display');
            if (passwordDisplay) {
                event.stopPropagation();
                togglePasswordVisibility(passwordDisplay);
            }
        });
    }

    // Búsqueda
    if (btnSearch) btnSearch.addEventListener('click', buscarUsuarios);
    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') buscarUsuarios();
        });
    }

    // Registros por página
    if (recordsPerPageSelect) {
        recordsPerPageSelect.addEventListener('change', function () {
            recordsPerPage = parseInt(this.value);
            currentPage = 1;
            renderTable();
        });
    }

    // Paginación
    if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (lastPageBtn) lastPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
        goToPage(totalPages);
    });

    // Acciones de tabla (editar/eliminar) - delegación de eventos
    if (usuariosBody) {
        usuariosBody.addEventListener('click', (event) => {
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

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && formularioUsuario?.classList.contains('active')) {
            ocultarFormulario();
        }
    });

    // Inicializar tabla
    renderTable();
});
