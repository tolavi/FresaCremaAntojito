// configuracion.js
document.addEventListener('DOMContentLoaded', function () {
    // Configurar navegación entre secciones
    setupConfigNavigation();

    // Cargar productos en la sección de configuración
    loadProductsList();

    // Configurar formulario de nuevo producto
    setupProductForm();

    // Configurar eventos de sincronización
    setupSyncEvents();

    // Configurar eventos de filtros de pedidos
    setupPedidosFilters();
});

// ==================== CONFIGURACIÓN DE NAVEGACIÓN ====================

function setupConfigNavigation() {
    const navItems = document.querySelectorAll('.config-nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const { section } = this.dataset;

            // Remover clase activa de todos los items
            navItems.forEach(i => i.classList.remove('active'));
            // Agregar clase activa al item clickeado
            this.classList.add('active');

            // Ocultar todas las secciones
            document.querySelectorAll('.config-section').forEach(s => {
                s.classList.remove('active');
            });

            // Mostrar la sección seleccionada
            document.getElementById(`${section}-section`).classList.add('active');
        });
    });
}

// ==================== GESTIÓN DE PRODUCTOS ====================

function loadProductsList() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    // Obtener productos desde localStorage
    const products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');

    if (products.length === 0) {
        productsList.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    No hay productos configurados
                </td>
            </tr>
        `;
        return;
    }

    // Renderizar productos en tabla
    productsList.innerHTML = products.map((product, index) => {
        // Calcular precio mínimo y máximo
        let minPrice = 0;
        let maxPrice = 0;

        if (product.gramajes && product.gramajes.length > 0) {
            minPrice = Math.min(...product.gramajes.map(g => g.precio));
            maxPrice = Math.max(...product.gramajes.map(g => g.precio));
        } else {
            minPrice = product.price || 0;
            maxPrice = product.price || 0;
        }

        // Formatear gramajes
        const gramajesHTML = product.gramajes && product.gramajes.length > 0
            ? product.gramajes.map(g => `<span class="gramaje-badge">${g.gramos}g</span>`).join('')
            : '<span class="text-gray-500">Sin gramajes</span>';

        // Estado del producto
        const statusClass = product.estado === 'activo' ? 'status-active' : 'status-inactive';
        const statusText = product.estado === 'activo' ? 'Activo' : 'Inactivo';

        return `
            <tr>
                <td>${product.id}</td>
                <td>
                    ${product.image ?
                `<img src="${product.image}" alt="${product.name}" class="product-image" 
                             onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ec4899%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2216%22 font-weight=%22bold%22%3E🍓%3C/text%3E%3C/svg%3E'">` :
                `<div class="product-image-placeholder">🍓</div>`
            }
                </td>
                <td>
                    <strong>${product.name}</strong><br>
                    <small class="text-gray-500">${product.description || ''}</small>
                </td>
                <td>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        ${product.category || 'Sin categoría'}
                    </span>
                </td>
                <td>${gramajesHTML}</td>
                <td>Bs ${minPrice.toFixed(2)}</td>
                <td>Bs ${maxPrice.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editProduct('${product.id}', ${index})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct('${product.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="action-btn sync" onclick="syncSingleProduct('${product.id}')" title="Sincronizar">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== FORMULARIO DE PRODUCTOS ====================

function setupProductForm() {
    const productForm = document.getElementById('productForm');
    if (!productForm) return;

    // Cargar gramajes disponibles para selección
    loadGramajesForSelection();

    // Configurar envío del formulario
    productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveProduct();
    });
}

function openProductModal(mode, productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');

    if (mode === 'new') {
        title.textContent = 'Nuevo Producto';
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productDBId').value = '';
        document.getElementById('productImagePreview').innerHTML = `
            <i class="fas fa-image"></i>
            <span>Vista previa</span>
        `;
    } else if (mode === 'edit' && productId) {
        title.textContent = 'Editar Producto';
        // Cargar datos del producto
        loadProductData(productId);
    }

    modal.style.display = 'block';
}

function loadProductData(productId) {
    const products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');
    const product = products.find(p => p.id === productId);

    if (!product) return;

    // Llenar formulario con datos del producto
    document.getElementById('productId').value = product.id;
    document.getElementById('productDBId').value = productId;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productStatus').value = product.estado || 'activo';
    document.getElementById('productFeatured').value = product.destacado || 'no';
    document.getElementById('productIngredients').value = product.ingredients || '';
    document.getElementById('productAllergens').value = product.allergens || '';

    // Cargar gramajes seleccionados
    if (product.gramajes && product.gramajes.length > 0) {
        const gramajesSelection = document.getElementById('gramajesSelection');
        gramajesSelection.innerHTML = '';

        product.gramajes.forEach(gramaje => {
            const checkbox = document.createElement('div');
            checkbox.className = 'gramaje-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="gramaje_${gramaje.gramos}" value="${gramaje.gramos}" 
                       data-price="${gramaje.precio}" checked>
                <label for="gramaje_${gramaje.gramos}">${gramaje.gramos}g - Bs ${gramaje.precio.toFixed(2)}</label>
            `;
            gramajesSelection.appendChild(checkbox);
        });
    }

    // Mostrar imagen del producto
    if (product.image) {
        const preview = document.getElementById('productImagePreview');
        preview.innerHTML = `
            <img src="${product.image}" alt="${product.name}" 
                 onerror="this.onerror=null; this.style.display='none'">
        `;
    }
}

function saveProduct() {
    // Obtener datos del formulario
    const productId = document.getElementById('productId').value;
    const productDBId = document.getElementById('productDBId').value;
    const productName = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const category = document.getElementById('productCategory').value;
    const status = document.getElementById('productStatus').value;
    const featured = document.getElementById('productFeatured').value;
    const ingredients = document.getElementById('productIngredients').value;
    const allergens = document.getElementById('productAllergens').value;

    // Obtener gramajes seleccionados
    const selectedGramajes = [];
    const gramajeCheckboxes = document.querySelectorAll('#gramajesSelection input[type="checkbox"]:checked');

    gramajeCheckboxes.forEach(checkbox => {
        selectedGramajes.push({
            gramos: parseInt(checkbox.value),
            precio: parseFloat(checkbox.dataset.price)
        });
    });

    // Obtener imagen
    const imageInput = document.getElementById('productImageInput');
    let image = '';
    if (imageInput.files && imageInput.files[0]) {
        // Para producción, aquí subirías la imagen a un servidor
        // Por ahora, guardamos una referencia local
        image = URL.createObjectURL(imageInput.files[0]);
    } else {
        // Mantener imagen existente si se está editando
        const products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');
        const existingProduct = products.find(p => p.id === productDBId);
        if (existingProduct && existingProduct.image) {
            image = existingProduct.image;
        }
    }

    // Crear objeto producto
    const productData = {
        id: productDBId || (Date.now().toString()),
        name: productName,
        description: description,
        price: selectedGramajes.length > 0 ? Math.min(...selectedGramajes.map(g => g.precio)) : 0,
        image: image,
        category: category,
        estado: status,
        destacado: featured,
        gramajes: selectedGramajes,
        ingredients: ingredients,
        allergens: allergens
    };

    // Guardar en localStorage
    let products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');

    if (productDBId) {
        // Actualizar producto existente
        const index = products.findIndex(p => p.id === productDBId);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
        }
    } else {
        // Agregar nuevo producto
        products.push(productData);
    }

    localStorage.setItem('fresa_products_db', JSON.stringify(products));

    // Actualizar lista
    loadProductsList();

    // Cerrar modal
    closeModal('productModal');

    // Mostrar notificación
    showNotification('Producto guardado correctamente', 'success');
}

// ==================== SEGURIDAD Y SINCRONIZACIÓN ====================

function setupSyncEvents() {
    // Botón de sincronización general
    const syncBtn = document.querySelector('button[onclick="syncProducts()"]');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncProducts);
    }

    // Botón de recarga
    const reloadBtn = document.querySelector('button[onclick="loadProductsList()"]');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', loadProductsList);
    }
}

function syncProducts() {
    // Obtener productos desde la página de productos
    const products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');

    // Guardar en el formato de configuración
    const configProducts = products.map(product => ({
        id: product.id,
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        imagen: product.image,
        categoria: product.category,
        estado: product.estado,
        destacado: product.destacado,
        gramajes: product.gramajes || []
    }));

    localStorage.setItem('fresa_productos', JSON.stringify(configProducts));

    // Forzar recarga en la página de productos
    if (typeof window.updateProductsFromConfig === 'function') {
        window.updateProductsFromConfig();
    }

    showNotification('Productos sincronizados correctamente', 'success');
    loadProductsList();
}

function syncSingleProduct(productId) {
    const products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');
    const product = products.find(p => p.id === productId);

    if (!product) return;

    // Actualizar en configuración
    let configProducts = JSON.parse(localStorage.getItem('fresa_productos') || '[]');
    const index = configProducts.findIndex(p => p.id === productId);

    const productData = {
        id: product.id,
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        imagen: product.image,
        categoria: product.category,
        estado: product.estado,
        destacado: product.destacado,
        gramajes: product.gramajes || []
    };

    if (index !== -1) {
        configProducts[index] = productData;
    } else {
        configProducts.push(productData);
    }

    localStorage.setItem('fresa_productos', JSON.stringify(configProducts));

    showNotification(`Producto ${product.name} sincronizado`, 'success');
}

// ==================== FUNCIONES AUXILIARES ====================

function loadGramajesForSelection() {
    const gramajesSelection = document.getElementById('gramajesSelection');
    if (!gramajesSelection) return;

    // Gramajes por defecto
    const defaultGramajes = [
        { gramos: 30, precio: 22 },
        { gramos: 40, precio: 25 },
        { gramos: 50, precio: 30 },
        { gramos: 60, precio: 35 },
        { gramos: 65, precio: 40 }
    ];

    gramajesSelection.innerHTML = defaultGramajes.map(gramaje => `
        <div class="gramaje-checkbox">
            <input type="checkbox" id="gramaje_${gramaje.gramos}" value="${gramaje.gramos}" 
                   data-price="${gramaje.precio}">
            <label for="gramaje_${gramaje.gramos}">${gramaje.gramos}g - Bs ${gramaje.precio.toFixed(2)}</label>
        </div>
    `).join('');
}

function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    let products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');
    products = products.filter(p => p.id !== productId);

    localStorage.setItem('fresa_products_db', JSON.stringify(products));

    // También eliminar de configuración
    let configProducts = JSON.parse(localStorage.getItem('fresa_productos') || '[]');
    configProducts = configProducts.filter(p => p.id !== productId);
    localStorage.setItem('fresa_productos', JSON.stringify(configProducts));

    showNotification('Producto eliminado correctamente', 'warning');
    loadProductsList();
}

function editProduct(productId, index) {
    openProductModal('edit', productId);
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
// ==================== GESTIÓN DE PEDIDOS ====================

// Variables para paginación y filtros de pedidos
let allPedidos = [];
let filteredPedidos = [];
let currentPedidoPage = 1;
const pedidosPerPage = 10;

// Función para cargar pedidos
function loadPedidosList() {
    // Inicializar controles de fecha si no tienen valor
    if (!document.getElementById('filterDateFrom').value) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        document.getElementById('filterDateFrom').value = firstDay.toISOString().split('T')[0];
    }

    if (!document.getElementById('filterDateTo').value) {
        const today = new Date();
        document.getElementById('filterDateTo').value = today.toISOString().split('T')[0];
    }
    try {
        // Obtener pedidos desde localStorage
        allPedidos = JSON.parse(localStorage.getItem('fresa_orders') || '[]');

        // Ordenar por fecha más reciente primero
        allPedidos.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || a.orderDate);
            const dateB = new Date(b.date || b.createdAt || b.orderDate);
            return dateB - dateA;
        });

        // Aplicar filtros iniciales
        applyPedidosFilters();

        // Renderizar tabla
        renderPedidosTable();

    } catch (error) {
        console.error('Error loading pedidos:', error);
        showNotification('Error al cargar los pedidos', 'error');
    }
}

// Aplicar filtros a pedidos
function applyPedidosFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const searchTerm = document.getElementById('searchPedido').value.toLowerCase().trim();

    // Filtrar por estado
    if (statusFilter !== 'todos') {
        filteredPedidos = allPedidos.filter(pedido =>
            pedido.status?.toLowerCase() === statusFilter.toLowerCase()
        );
    } else {
        filteredPedidos = [...allPedidos];
    }

    // Filtrar por fecha
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredPedidos = filteredPedidos.filter(pedido => {
            const pedidoDate = new Date(pedido.date || pedido.createdAt || pedido.orderDate);
            return pedidoDate >= fromDate;
        });
    }

    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Fin del día
        filteredPedidos = filteredPedidos.filter(pedido => {
            const pedidoDate = new Date(pedido.date || pedido.createdAt || pedido.orderDate);
            return pedidoDate <= toDate;
        });
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
        filteredPedidos = filteredPedidos.filter(pedido =>
            (pedido.id && pedido.id.toLowerCase().includes(searchTerm)) ||
            (pedido.userName && pedido.userName.toLowerCase().includes(searchTerm)) ||
            (pedido.userEmail && pedido.userEmail.toLowerCase().includes(searchTerm)) ||
            (pedido.items && pedido.items.some(item =>
                item.name && item.name.toLowerCase().includes(searchTerm)
            ))
        );
    }

    // Resetear a página 1
    currentPedidoPage = 1;

    // Actualizar estadísticas de filtros
    updateFilterStats();

    // Renderizar tabla
    renderPedidosTable();
}

// Resetear filtros
function resetFilters() {
    document.getElementById('filterStatus').value = 'todos';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('searchPedido').value = '';

    applyPedidosFilters();
}

// Actualizar estadísticas de filtros
function updateFilterStats() {
    const statsElement = document.getElementById('filterStats');
    if (!statsElement) return;

    const totalPedidos = allPedidos.length;
    const filteredCount = filteredPedidos.length;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchTerm = document.getElementById('searchPedido').value;

    let statsText = '';

    if (statusFilter !== 'todos') {
        const statusText = getStatusText(statusFilter);
        statsText += `<i class="fas fa-filter"></i> Estado: ${statusText} | `;
    }

    if (searchTerm) {
        statsText += `<i class="fas fa-search"></i> Búsqueda: "${searchTerm}" | `;
    }

    statsText += `<i class="fas fa-chart-bar"></i> Mostrando ${filteredCount} de ${totalPedidos} pedidos`;

    statsElement.innerHTML = statsText;
}


// Obtener texto del estado (FUNCIÓN CORREGIDA)
function getStatusText(status) {
    if (!status) return 'Desconocido';

    const statusMap = {
        'pendiente': 'Pendiente',
        'procesando': 'Procesando',
        'anulado': 'Anulado',
        'active': 'activo',
        'processing': 'Procesando',
        'completed': 'Completado',
        'inactive': 'Anulado'
    };

    const normalizedStatus = status.toLowerCase();
    return statusMap[normalizedStatus] || 'Desconocido';
}

// Obtener clase CSS para estado (FUNCIÓN CORREGIDA)
function getStatusClass(status) {
    if (!status) return 'estado-desconocido';

    const statusMap = {
        'pendiente': 'estado-pendiente',
        'procesando': 'estado-procesando',
        'cancelado': 'estado-cancelado',
        'anulado': 'estado-cancelado',
        'active': 'estado-pendiente',
        'processing': 'estado-procesando',
        'completed': 'estado-entregado',
        'cancelled': 'estado-cancelado',
        'inactive': 'estado-cancelado'
    };

    const normalizedStatus = status.toLowerCase();
    return statusMap[normalizedStatus] || 'estado-desconocido';
}

// Obtener clase CSS para método de pago (FUNCIÓN CORREGIDA)
function getPagoClass(method) {
    if (!method) return 'pago-efectivo';

    const methodMap = {
        'efectivo': 'pago-efectivo',
        'tarjeta': 'pago-tarjeta',
        'qr': 'pago-qr',
        'transferencia': 'pago-transferencia',
        'Efectivo': 'pago-efectivo',
        'QR Code': 'pago-qr',
        'Tarjeta': 'pago-tarjeta',
        'Transferencia': 'pago-transferencia'
    };

    return methodMap[method] || 'pago-efectivo';
}

// Función para formatear fecha para mostrar
function formatDateForDisplay(dateString) {
    if (!dateString) return 'N/A';

    try {
        // Si ya está en formato DD/MM/YYYY, devolverlo
        if (dateString.includes('/')) {
            return dateString;
        }

        // Si es una fecha ISO
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }

        // Formatear a DD/MM/YYYY HH:MM
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error('Error formateando fecha:', dateString, error);
        return dateString;
    }
}
// Formatear items para tabla
function formatPedidoItemsForTable(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return '<span class="text-gray-500">Sin productos</span>';
    }

    const displayItems = items.slice(0, 2);
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const itemsHTML = displayItems.map(item => {
        const gramaje = item.gramaje || '';
        return `
            <div class="producto-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-size: 0.8rem;">
                <span class="producto-nombre" style="font-weight: 500; color: #1f2937;">${item.name}</span>
                <span class="producto-cantidad" style="color: #6b7280;">${item.quantity || 1}x</span>
            </div>
        `;
    }).join('');

    const moreItemsHTML = items.length > 2 ?
        `<div style="font-size: 0.75rem; color: #3b82f6; margin-top: 2px;">+${items.length - 2} más</div>` : '';

    return `
        <div class="productos-lista">
            ${itemsHTML}
            ${moreItemsHTML}
            <div style="font-size: 0.7rem; color: #6b7280; margin-top: 2px;">
                Total items: ${totalItems}
            </div>
        </div>
    `;
}

function renderPedidosTable() {
    const pedidosList = document.getElementById('pedidosList');
    if (!pedidosList) return;

    const totalPages = Math.ceil(filteredPedidos.length / pedidosPerPage);
    const startIndex = (currentPedidoPage - 1) * pedidosPerPage;
    const endIndex = Math.min(startIndex + pedidosPerPage, filteredPedidos.length);
    const currentPedidos = filteredPedidos.slice(startIndex, endIndex);

    // Limpiar tabla
    pedidosList.innerHTML = '';

    // Si no hay pedidos
    if (currentPedidos.length === 0) {
        pedidosList.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: #6b7280;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No hay pedidos que coincidan con los filtros
                </td>
            </tr>
        `;
    } else {
        // Renderizar cada pedido
        currentPedidos.forEach(pedido => {
            const statusClass = getStatusClass(pedido.status);
            const statusText = getStatusText(pedido.status);
            const pagoClass = getPagoClass(pedido.paymentMethod);
            const pagoText = pedido.paymentMethod || 'Efectivo';
            const formattedDate = formatDateForDisplay(pedido.date);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #3b82f6;">${pedido.id || 'N/A'}</strong>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 500;">${formattedDate}</div>
                    ${pedido.orderTime ? `<div style="font-size: 0.85rem; color: #6b7280;">${pedido.orderTime}</div>` : ''}
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 500;">${pedido.userName || 'Cliente'}</div>
                    <div style="font-size: 0.85rem; color: #6b7280;">${pedido.userEmail || 'N/A'}</div>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    ${formatPedidoItemsForTable(pedido.items)}
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #10b981; font-size: 1.1rem;">Bs ${(pedido.totalAmount || 0).toFixed(2)}</strong>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <span class="estado-badge ${statusClass}">${statusText}</span>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <span class="pago-badge ${pagoClass}">${pagoText}</span>
                </td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; gap: 8px;">
                        <button class="action-btn details-btn" onclick="verDetallesPedido('${pedido.id}')" title="Ver detalles completos">
                            <i class="fas fa-eye"></i> Detalles
                        </button>
                        <button class="action-btn delete-btn" onclick="eliminarPedido('${pedido.id}')" title="Eliminar pedido">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            pedidosList.appendChild(row);
        });
    }

    // Actualizar controles de paginación
    updatePaginationControls(totalPages);
}

// Actualizar controles de paginación
function updatePaginationControls(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const startIndex = (currentPedidoPage - 1) * pedidosPerPage + 1;
        const endIndex = Math.min(startIndex + pedidosPerPage - 1, filteredPedidos.length);
        const total = filteredPedidos.length;

        pageInfo.textContent = total === 0 ? 'Sin resultados' : `Página ${currentPedidoPage} de ${totalPages} (${startIndex}-${endIndex} de ${total})`;
    }

    // Habilitar/deshabilitar botones
    const prevBtn = document.querySelector('button[onclick="prevPage()"]');
    const nextBtn = document.querySelector('button[onclick="nextPage()"]');

    if (prevBtn) prevBtn.disabled = currentPedidoPage === 1;
    if (nextBtn) nextBtn.disabled = currentPedidoPage === totalPages || totalPages === 0;
}

// Navegación de páginas
function prevPage() {
    if (currentPedidoPage > 1) {
        currentPedidoPage--;
        renderPedidosTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredPedidos.length / pedidosPerPage);
    if (currentPedidoPage < totalPages) {
        currentPedidoPage++;
        renderPedidosTable();
    }
}
// ==================== FUNCIONES PARA ACCIONES DE PEDIDOS ====================

// Función para ver detalles completos del pedido
function verDetallesPedido(pedidoId) {
    const pedido = allPedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        showNotification('Pedido no encontrado', 'error');
        return;
    }

    // Crear modal de detalles
    const modalId = 'detallesPedidoModal';
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    // Calcular estadísticas
    const totalItems = pedido.items ? pedido.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    const gramajesCount = pedido.items ? pedido.items.filter(item => item.gramaje && item.gramaje !== 'No especificado').length : 0;
    const statusClass = getStatusClass(pedido.status);
    const statusText = getStatusText(pedido.status);
    const pagoClass = getPagoClass(pedido.paymentMethod);
    const pagoText = pedido.paymentMethod || 'Efectivo';

    // Formatear items para detalles
    const itemsHTML = pedido.items && pedido.items.length > 0 ?
        pedido.items.map(item => {
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const subtotal = price * quantity;
            const gramaje = item.gramaje || 'No especificado';

            return `
                <div class="producto-detalle" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
                    <div>
                        <p style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.name}</p>
                        <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 4px;">${item.description || ''}</p>
                        <span class="gramaje-badge" style="background: #fce7f3; color: #be185d; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">
                            ${gramaje}
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-weight: 600; color: #059669;">Bs ${subtotal.toFixed(2)}</p>
                        <p style="font-size: 0.85rem; color: #6b7280;">${quantity} × Bs ${price.toFixed(2)}</p>
                    </div>
                </div>
            `;
        }).join('') : '<p style="color: #6b7280; text-align: center;">No hay productos</p>';

    const modalHTML = `
        <div class="config-modal active" id="${modalId}">
            <div class="config-modal-content" style="max-width: 600px;">
                <div class="config-modal-header">
                    <h3><i class="fas fa-receipt"></i> Detalles del Pedido #${pedido.id}</h3>
                    <button class="close-modal" onclick="closeModal('${modalId}')">&times;</button>
                </div>
                <div class="config-modal-body">
                    <!-- Información del pedido -->
                    <div style="background: linear-gradient(135deg, #ec4899, #ef4444); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0; font-size: 1.2rem;">Pedido #${pedido.id}</h4>
                                <p style="margin: 5px 0 0 0; font-size: 0.9rem; opacity: 0.9;">${pedido.date || 'Fecha no disponible'}</p>
                            </div>
                            <div style="text-align: right;">
                                <span class="estado-badge ${statusClass}" style="background: white; color: #1f2937;">${statusText}</span>
                                <p style="font-size: 1.5rem; font-weight: bold; margin: 10px 0 0 0;">Bs ${(pedido.totalAmount || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Estadísticas rápidas -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Productos</p>
                            <p style="font-size: 1.2rem; font-weight: bold; color: #1f2937; margin: 5px 0 0 0;">${pedido.items ? pedido.items.length : 0}</p>
                        </div>
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Items</p>
                            <p style="font-size: 1.2rem; font-weight: bold; color: #1f2937; margin: 5px 0 0 0;">${totalItems}</p>
                        </div>
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; text-align: center;">
                            <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Con Gramaje</p>
                            <p style="font-size: 1.2rem; font-weight: bold; color: ${gramajesCount > 0 ? '#059669' : '#d97706'}; margin: 5px 0 0 0;">${gramajesCount}</p>
                        </div>
                    </div>
                    
                    <!-- Información del usuario -->
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <h4 style="color: #374151; margin-top: 0; margin-bottom: 10px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">
                            <i class="fas fa-user"></i> Información del Cliente
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Nombre</p>
                                <p style="font-weight: 600; color: #1f2937; margin: 5px 0 0 0;">${pedido.userName || 'No especificado'}</p>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Email</p>
                                <p style="font-weight: 600; color: #1f2937; margin: 5px 0 0 0;">${pedido.userEmail || 'No especificado'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de pago -->
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <h4 style="color: #374151; margin-top: 0; margin-bottom: 10px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">
                            <i class="fas fa-credit-card"></i> Información de Pago
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Método</p>
                                <span class="pago-badge ${pagoClass}">${pagoText}</span>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">Estado Pago</p>
                                <p style="font-weight: 600; color: ${pedido.paymentStatus === 'Pagado' ? '#059669' : '#d97706'}; margin: 5px 0 0 0;">
                                    ${pedido.paymentStatus || 'Pendiente'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Productos del pedido -->
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: #374151; margin: 0;">
                                <i class="fas fa-shopping-bag"></i> Productos (${pedido.items ? pedido.items.length : 0})
                            </h4>
                            <span style="font-size: 0.85rem; color: #6b7280;">${totalItems} items</span>
                        </div>
                        <div style="max-height: 300px; overflow-y: auto;">
                            ${itemsHTML}
                        </div>
                    </div>
                    
                    <!-- Totales -->
                    <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
                        <h4 style="color: #374151; margin-top: 0; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                            <i class="fas fa-calculator"></i> Resumen de Totales
                        </h4>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #6b7280;">Subtotal</span>
                            <span style="font-weight: 600;">Bs ${(pedido.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #6b7280;">Envío</span>
                            <span style="font-weight: 600;">Bs 0.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #6b7280;">Impuestos</span>
                            <span style="font-weight: 600;">Bs 0.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 10px;">
                            <span style="font-size: 1.1rem; font-weight: bold; color: #1f2937;">Total</span>
                            <span style="font-size: 1.3rem; font-weight: bold; color: #ec4899;">Bs ${(pedido.totalAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- Instrucciones especiales -->
                    ${pedido.specialInstructions ? `
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-top: 15px;">
                            <h4 style="color: #92400e; margin-top: 0; margin-bottom: 8px;">
                                <i class="fas fa-sticky-note"></i> Instrucciones Especiales
                            </h4>
                            <p style="color: #92400e; margin: 0;">${pedido.specialInstructions}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="config-modal-footer">
                    <button class="btn-cancel" onclick="closeModal('${modalId}')">Cerrar</button>
                    <button class="btn-save" onclick="imprimirDetallesPedido('${pedido.id}')">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Función para eliminar un pedido
function eliminarPedido(pedidoId) {
    const pedido = allPedidos.find(p => p.id === pedidoId);
    if (!pedido) {
        showNotification('Pedido no encontrado', 'error');
        return;
    }

    // Mostrar confirmación
    if (confirm(`¿Estás seguro de eliminar el pedido #${pedidoId}?\n\nEsta acción no se puede deshacer.`)) {
        // Eliminar del array de pedidos
        const index = allPedidos.findIndex(p => p.id === pedidoId);
        if (index !== -1) {
            allPedidos.splice(index, 1);

            // Actualizar localStorage
            localStorage.setItem('fresa_orders', JSON.stringify(allPedidos));

            // Actualizar estadísticas
            updateOrderStats();

            // Recargar la tabla
            loadPedidosList();

            showNotification(`Pedido #${pedidoId} eliminado correctamente`, 'success');
        }
    }
}

// Función para imprimir detalles del pedido
function imprimirDetallesPedido(pedidoId) {
    const pedido = allPedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    // Usar la función de impresión de orders.js si está disponible
    if (typeof window.printOrderDetails === 'function') {
        window.printOrderDetails(pedidoId);
    } else {
        // Función de impresión alternativa
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .pedido-info { margin-bottom: 15px; }
                    .productos-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .productos-table th, .productos-table td { border: 1px solid #ddd; padding: 8px; }
                    .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Detalle de Pedido #${pedidoId}</h2>
                    <p>${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="pedido-info">
                    <p><strong>Cliente:</strong> ${pedido.userName || 'No especificado'}</p>
                    <p><strong>Fecha:</strong> ${pedido.date || 'No especificado'}</p>
                    <p><strong>Estado:</strong> ${getStatusText(pedido.status)}</p>
                </div>
                
                <table class="productos-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedido.items ? pedido.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity || 1}</td>
                                <td>Bs ${(item.price || 0).toFixed(2)}</td>
                                <td>Bs ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                            </tr>
                        `).join('') : ''}
                    </tbody>
                </table>
                
                <div class="total">
                    <p><strong>TOTAL:</strong> Bs ${(pedido.totalAmount || 0).toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
}

// Función para actualizar estadísticas de pedidos (si no existe)
// Actualizar estadísticas de filtros
function updateFilterStats() {
    const statsElement = document.getElementById('filterStats');
    if (!statsElement) return;

    const totalPedidos = allPedidos.length;
    const filteredCount = filteredPedidos.length;
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const searchTerm = document.getElementById('searchPedido').value;

    let statsHTML = '';

    // Icono de estadísticas
    statsHTML += `<i class="fas fa-chart-bar" style="color: #3b82f6;"></i> `;
    statsHTML += `<strong>${filteredCount}</strong> de <strong>${totalPedidos}</strong> pedidos`;

    // Filtro por estado
    if (statusFilter !== 'todos') {
        const statusText = getStatusText(statusFilter);
        statsHTML += ` | <i class="fas fa-filter" style="color: #8b5cf6;"></i> Estado: <span class="estado-badge ${getStatusClass(statusFilter)}">${statusText}</span>`;
    }

    // Filtro por fechas
    if (dateFrom || dateTo) {
        statsHTML += ` | <i class="fas fa-calendar" style="color: #10b981;"></i> Fecha: `;
        if (dateFrom && dateTo) {
            statsHTML += `${dateFrom} al ${dateTo}`;
        } else if (dateFrom) {
            statsHTML += `desde ${dateFrom}`;
        } else if (dateTo) {
            statsHTML += `hasta ${dateTo}`;
        }
    }

    // Filtro por búsqueda
    if (searchTerm) {
        statsHTML += ` | <i class="fas fa-search" style="color: #f59e0b;"></i> Búsqueda: "${searchTerm}"`;
    }

    // Mostrar mensaje si no hay resultados
    if (filteredCount === 0 && totalPedidos > 0) {
        statsHTML = `<div style="background: #fee2e2; padding: 10px; border-radius: 6px; border-left: 4px solid #ef4444;">
            <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i> 
            <strong>No se encontraron pedidos</strong> con los filtros aplicados
        </div>`;
    }

    statsElement.innerHTML = statsHTML;
}
// Resetear filtros
function resetFilters() {
    console.log('Restableciendo filtros...');

    // Restablecer valores
    document.getElementById('filterStatus').value = 'todos';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('searchPedido').value = '';

    // Aplicar filtros (mostrar todos)
    applyPedidosFilters();

    // Mostrar notificación
    showNotification('Filtros restablecidos', 'info');
}
// Exportar a Excel
function exportPedidosExcel() {
    if (filteredPedidos.length === 0) {
        showNotification('No hay pedidos para exportar', 'warning');
        return;
    }

    // Crear contenido CSV
    let csvContent = "ID,Fecha,Usuario,Email,Productos,Cantidad Total,Total,Estado,Método Pago\n";

    filteredPedidos.forEach(pedido => {
        const productos = pedido.items ? pedido.items.map(i => i.name).join('; ') : '';
        const cantidadTotal = pedido.items ? pedido.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

        csvContent += `"${pedido.id || ''}","${pedido.date || ''}","${pedido.userName || ''}","${pedido.userEmail || ''}","${productos}",${cantidadTotal},${pedido.totalAmount || 0},"${getStatusText(pedido.status)}","${pedido.paymentMethod || 'Efectivo'}"\n`;
    });

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Pedidos exportados a Excel', 'success');
}

// Exportar a PDF
function exportPedidosPDF() {
    showNotification('Exportación a PDF en desarrollo', 'info');
    // Para implementación completa, usar librería como jsPDF
}

// Función para sincronizar pedidos
function syncPedidos() {
    // Recargar pedidos desde localStorage
    loadPedidosList();
    showNotification('Pedidos sincronizados', 'success');
}

// Inicializar eventos de filtros
function setupPedidosFilters() {
    // Configurar eventos para filtros
    const statusFilter = document.getElementById('filterStatus');
    const dateFrom = document.getElementById('filterDateFrom');
    const dateTo = document.getElementById('filterDateTo');
    const searchInput = document.getElementById('searchPedido');

    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            applyPedidosFilters();
        });
    }

    if (dateFrom) {
        dateFrom.addEventListener('change', function () {
            applyPedidosFilters();
        });
    }

    if (dateTo) {
        dateTo.addEventListener('change', function () {
            applyPedidosFilters();
        });
    }

    if (searchInput) {
        // Buscar con delay para mejor performance
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
                applyPedidosFilters();
            }, 300);
        });
    }

    // También agregar al botón "Limpiar"
    const clearBtn = document.querySelector('button[onclick="resetFilters()"]');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            resetFilters();
        });
    }
}
// Aplicar filtros a pedidos
// Aplicar filtros a pedidos (FUNCIÓN MEJORADA)
function applyPedidosFilters() {
    console.log('Aplicando filtros...');

    const statusFilter = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const searchTerm = document.getElementById('searchPedido').value.toLowerCase().trim();

    console.log('Filtros aplicados:', { statusFilter, dateFrom, dateTo, searchTerm });

    // Si no hay pedidos, no hacer nada
    if (allPedidos.length === 0) {
        filteredPedidos = [];
        renderPedidosTable();
        updateFilterStats();
        return;
    }

    // Iniciar con todos los pedidos
    filteredPedidos = [...allPedidos];

    // Filtrar por estado
    if (statusFilter !== 'todos') {
        filteredPedidos = filteredPedidos.filter(pedido => {
            const pedidoStatus = pedido.status?.toLowerCase();
            const filterStatus = statusFilter.toLowerCase();

            // Mapear estados compatibles
            const statusCompatibility = {
                'active': ['active', 'pendiente'],
                'procesando': ['procesando', 'processing'],
                'enviado': ['enviado'],
                'entregado': ['completado', 'completed'],
                'anulado': ['anulado', 'inactive', 'cancelled']
            };

            if (statusCompatibility[filterStatus]) {
                return statusCompatibility[filterStatus].includes(pedidoStatus);
            }

            return pedidoStatus === filterStatus;
        });
        console.log(`Filtrado por estado '${statusFilter}': ${filteredPedidos.length} pedidos`);
    }

    // Filtrar por fecha DESDE
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0); // Inicio del día

        filteredPedidos = filteredPedidos.filter(pedido => {
            try {
                const pedidoDate = parsePedidoDate(pedido);
                if (!pedidoDate) return true; // Si no hay fecha, mantener

                return pedidoDate >= fromDate;
            } catch (error) {
                console.error('Error parseando fecha:', pedido, error);
                return true; // En caso de error, mantener
            }
        });
        console.log(`Filtrado por fecha desde ${dateFrom}: ${filteredPedidos.length} pedidos`);
    }

    // Filtrar por fecha HASTA
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Fin del día

        filteredPedidos = filteredPedidos.filter(pedido => {
            try {
                const pedidoDate = parsePedidoDate(pedido);
                if (!pedidoDate) return true; // Si no hay fecha, mantener

                return pedidoDate <= toDate;
            } catch (error) {
                console.error('Error parseando fecha:', pedido, error);
                return true; // En caso de error, mantener
            }
        });
        console.log(`Filtrado por fecha hasta ${dateTo}: ${filteredPedidos.length} pedidos`);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
        filteredPedidos = filteredPedidos.filter(pedido => {
            // Buscar en ID
            if (pedido.id && pedido.id.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Buscar en nombre de usuario
            if (pedido.userName && pedido.userName.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Buscar en email
            if (pedido.userEmail && pedido.userEmail.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Buscar en teléfono
            if (pedido.userPhone && pedido.userPhone.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Buscar en productos
            if (pedido.items && Array.isArray(pedido.items)) {
                const foundInProducts = pedido.items.some(item =>
                    item.name && item.name.toLowerCase().includes(searchTerm)
                );
                if (foundInProducts) return true;
            }

            // Buscar en método de pago
            if (pedido.paymentMethod && pedido.paymentMethod.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Buscar en estado
            const statusText = getStatusText(pedido.status).toLowerCase();
            if (statusText.includes(searchTerm)) {
                return true;
            }

            // Buscar en instrucciones especiales
            if (pedido.specialInstructions && pedido.specialInstructions.toLowerCase().includes(searchTerm)) {
                return true;
            }

            return false;
        });
        console.log(`Filtrado por búsqueda '${searchTerm}': ${filteredPedidos.length} pedidos`);
    }

    // Resetear a página 1
    currentPedidoPage = 1;

    // Actualizar estadísticas de filtros
    updateFilterStats();

    // Renderizar tabla
    renderPedidosTable();
}
// ==================== FUNCIONES GLOBALES ====================

// Hacer funciones globales para acceso desde HTML
window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.syncProducts = syncProducts;
window.syncSingleProduct = syncSingleProduct;
window.loadProductsList = loadProductsList;
window.openModal = openModal;
window.closeModal = closeModal;
window.loadPedidosList = loadPedidosList;
window.applyPedidosFilters = applyPedidosFilters;
window.resetFilters = resetFilters;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.syncPedidos = syncPedidos;
window.exportPedidosExcel = exportPedidosExcel;
window.exportPedidosPDF = exportPedidosPDF;
window.verDetallesPedido = verDetallesPedido;
window.eliminarPedido = eliminarPedido;
window.imprimirDetallesPedido = imprimirDetallesPedido;
window.getStatusText = getStatusText;
window.getStatusClass = getStatusClass;