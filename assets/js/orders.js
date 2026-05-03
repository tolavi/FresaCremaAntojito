document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const ordersTableBody = document.getElementById('ordersTableBody');
    const searchOrdersInput = document.getElementById('searchOrders');
    const recordsPerPageSelect = document.getElementById('recordsPerPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const visibleCountSpan = document.getElementById('visibleCount');
    const totalCountSpan = document.getElementById('totalCount');
    const orderDetailModal = document.getElementById('orderDetailModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalIcon = document.getElementById('closeModal');
    const orderDetailContent = document.getElementById('orderDetailContent');
    const printOrderBtn = document.getElementById('printOrder');

    // Variables de estado
    let allOrders = [];
    let filteredOrders = [];
    let currentPage = 1;
    let recordsPerPage = 10;
    let searchTerm = '';
    let currentOrderIdForPrint = '';

    // ==================== FUNCIONES PRINCIPALES ====================

    // Cargar pedidos
    function loadOrders() {
        try {
            // Obtener pedidos desde localStorage
            allOrders = JSON.parse(localStorage.getItem('fresa_orders') || '[]');

            // Ordenar por fecha más reciente primero
            allOrders.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt || a.orderDate);
                const dateB = new Date(b.date || b.createdAt || b.orderDate);
                return dateB - dateA;
            });

            // Filtrar pedidos
            filterOrders();

            // Renderizar tabla
            renderTable();

            // Actualizar estadísticas
            updateStats();

        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Error al cargar los pedidos', 'error');
        }
    }

    // Filtrar pedidos
    function filterOrders() {
        if (searchTerm === '') {
            filteredOrders = [...allOrders];
        } else {
            filteredOrders = allOrders.filter(order =>
                (order.id && order.id.toLowerCase().includes(searchTerm)) ||
                (order.userName && order.userName.toLowerCase().includes(searchTerm)) ||
                (order.userEmail && order.userEmail.toLowerCase().includes(searchTerm)) ||
                (order.date && order.date.toLowerCase().includes(searchTerm)) ||
                (order.status && order.status.toLowerCase().includes(searchTerm)) ||
                (order.items && order.items.some(item =>
                    item.name && item.name.toLowerCase().includes(searchTerm)
                ))
            );
        }
    }

    // ==================== FUNCIONES DE UTILIDAD ====================

    // Obtener usuario del pedido
    function getOrderUser(order) {
        const orderUser = {
            name: order.userName || 'Usuario',
            email: order.userEmail || 'N/A',
            id: order.userId || null,
            phone: order.userPhone || 'No especificado'
        };

        // Si no hay datos en el pedido, intentar obtener del usuario actual
        if ((!orderUser.name || orderUser.name === 'Usuario') && window.auth) {
            try {
                const currentUser = window.auth.getCurrentUser();
                if (currentUser) {
                    orderUser.name = currentUser.nombre || currentUser.usuario || 'Usuario';
                    orderUser.email = currentUser.correo || currentUser.email || 'N/A';
                    orderUser.id = currentUser.id || null;
                    orderUser.phone = currentUser.telefono || currentUser.phone || 'No especificado';

                    // Actualizar el pedido con la información del usuario
                    if (!order.userName) order.userName = orderUser.name;
                    if (!order.userEmail) order.userEmail = orderUser.email;
                    if (!order.userId) order.userId = orderUser.id;
                    if (!order.userPhone) order.userPhone = orderUser.phone;
                }
            } catch (error) {
                console.warn('No se pudo obtener usuario actual:', error);
            }
        }

        return orderUser;
    }

    // Formatear items del pedido para tabla
    function formatOrderItemsForTable(items) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return '<span class="text-gray-500 italic">Sin productos</span>';
        }

        const displayItems = items.slice(0, 2);
        const totalItems = items.length;

        const itemsHTML = displayItems.map(item => {
            const quantity = item.quantity || 1;
            const gramajeInfo = item.gramaje ? `<span class="text-xs text-pink-600 font-semibold">${item.gramaje}</span>` : '';
            return `
                <div class="product-item flex justify-between items-center mb-1">
                    <div class="flex-1">
                        <span class="text-sm truncate max-w-[120px]">${item.name || 'Producto'}</span>
                        ${gramajeInfo}
                    </div>
                    <span class="text-xs text-gray-500 ml-2">${quantity}x</span>
                </div>
            `;
        }).join('');

        const moreItemsHTML = totalItems > 2 ?
            `<div class="text-xs text-blue-600 mt-1">+${totalItems - 2} más...</div>` : '';

        return `
            <div class="product-list">
                ${itemsHTML}
                ${moreItemsHTML}
            </div>
        `;
    }

    // Formatear items del pedido para detalles
    function formatOrderItemsForDetails(items) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return '<p class="text-gray-500 italic">Sin productos</p>';
        }

        return `
            <div class="space-y-3">
                ${items.map(item => {
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const total = quantity * price;
            const gramajeInfo = item.gramaje ?
                `<div class="flex items-center gap-2 mt-1">
                            <span class="text-xs font-medium bg-pink-100 text-pink-800 px-2 py-1 rounded">${item.gramaje}</span>
                            <span class="text-xs text-gray-500">Gramaje seleccionado</span>
                        </div>`
                :
                `<div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-yellow-600">⚠️ No hay gramaje seleccionado</span>
                        </div>`;

            return `
                        <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <p class="font-semibold text-gray-800">${item.name || 'Producto'}</p>
                                        <span class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">${quantity}x</span>
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">${item.description || ''}</p>
                                    ${gramajeInfo}
                                </div>
                                <div class="text-right">
                                    <p class="font-medium text-gray-900">bs ${total.toFixed(2)}</p>
                                    <p class="text-xs text-gray-500">${quantity} × bs ${price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    // Obtener clase CSS para el estado
    function getStatusClass(status) {
        const statusMap = {
            'ACTIVO': 'order-status-active',
            'active': 'order-status-active',
            'ANULADO': 'order-status-inactive',
            'inactive': 'order-status-inactive',
            'cancelled': 'order-status-inactive',
            'PROCESANDO': 'order-status-processing',
            'processing': 'order-status-processing',
            'COMPLETADO': 'order-status-completed',
            'completed': 'order-status-completed'
        };

        return statusMap[status] || 'order-status-inactive';
    }

    // Obtener texto del estado
    function getStatusText(status) {
        const statusMap = {
            'active': 'ACTIVO',
            'inactive': 'ANULADO',
            'cancelled': 'ANULADO',
            'processing': 'PROCESANDO',
            'completed': 'COMPLETADO'
        };

        return statusMap[status] || status.toUpperCase();
    }

    // ==================== FUNCIONES DE INTERFAZ ====================

    // Renderizar tabla
    function renderTable() {
        const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, filteredOrders.length);
        const currentOrders = filteredOrders.slice(startIndex, endIndex);

        // Limpiar tabla
        ordersTableBody.innerHTML = '';

        // Si no hay pedidos
        if (currentOrders.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        No hay pedidos para mostrar
                    </td>
                </tr>
            `;
        } else {
            // Renderizar cada pedido
            currentOrders.forEach(order => {
                const user = getOrderUser(order);
                const statusClass = getStatusClass(order.status);
                const statusText = getStatusText(order.status);

                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 border-b';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${order.id || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">${user.name}</div>
                        <div class="text-sm text-gray-500">${user.email}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">${formatOrderItemsForTable(order.items)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${order.date || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="action-buttons-group">
                            ${order.status === 'inactive' || order.status === 'cancelled' ? `
                                <button class="action-btn activate-btn" onclick="activateOrder('${order.id}')" data-tooltip="Activar pedido">
                                    <i class="fas fa-check mr-1"></i> Activar
                                </button>
                            ` : `
                                <button class="action-btn deactivate-btn" onclick="deactivateOrder('${order.id}')" data-tooltip="Anular pedido">
                                    <i class="fas fa-times mr-1"></i> Anular
                                </button>
                            `}
                            
                            ${order.status === 'active' ? `
                                <button class="action-btn Procesar-btn" onclick="processOrder('${order.id}')" data-tooltip="Procesar pedido">
                                    <i class="fas fa-cog mr-1"></i> Procesar
                                </button>
                            ` : ''}
                            
                            ${order.status === 'processing' ? `
                                <button class="action-btn completar-btn" onclick="completeOrder('${order.id}')" data-tooltip="Completar pedido">
                                    <i class="fas fa-check-circle mr-1"></i> Completar
                                </button>
                            ` : ''}
                            
                            <button class="action-btn edit-btn" onclick="editOrder('${order.id}')" data-tooltip="Editar pedido">
                                <i class="fas fa-edit mr-1"></i> Editar
                            </button>
                            
                            <button class="action-btn details-btn" onclick="showOrderDetails('${order.id}')" data-tooltip="Ver detalles">
                                <i class="fas fa-eye mr-1"></i> Detalles
                            </button>
                        </div>
                    </td>
                `;
                ordersTableBody.appendChild(row);
            });
        }

        // Actualizar controles de paginación
        updatePaginationControls(totalPages);

        // Actualizar información
        updatePaginationInfo();
    }

    // Actualizar controles de paginación
    function updatePaginationControls(totalPages) {
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
        currentPageSpan.textContent = currentPage;
    }

    // Actualizar información de paginación
    function updatePaginationInfo() {
        const startIndex = (currentPage - 1) * recordsPerPage + 1;
        const endIndex = Math.min(startIndex + recordsPerPage - 1, filteredOrders.length);
        const total = filteredOrders.length;

        visibleCountSpan.textContent = total === 0 ? '0' : `${startIndex}-${endIndex}`;
        totalCountSpan.textContent = total;
    }

    // Actualizar estadísticas
    function updateStats() {
        try {
            const stats = {
                totalOrders: allOrders.length,
                totalRevenue: allOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0),
                processingOrders: allOrders.filter(o => o.status === 'processing').length,
                completedOrders: allOrders.filter(o => o.status === 'completed').length
            };

            // Guardar estadísticas
            localStorage.setItem('fresa_order_stats', JSON.stringify(stats));

            // Actualizar tarjetas del dashboard si están visibles
            updateDashboardStats(stats);

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Actualizar dashboard stats
    function updateDashboardStats(stats) {
        if (document.getElementById('totalOrdersCard')) {
            document.getElementById('totalOrdersCard').textContent = stats.totalOrders || 0;
        }
        if (document.getElementById('revenueCard')) {
            document.getElementById('revenueCard').textContent = `bs ${(stats.totalRevenue || 0).toLocaleString()}`;
        }
        if (document.getElementById('processingOrdersCard')) {
            document.getElementById('processingOrdersCard').textContent = stats.processingOrders || 0;
        }
        if (document.getElementById('completedOrdersCard')) {
            document.getElementById('completedOrdersCard').textContent = stats.completedOrders || 0;
        }
    }

    // Mostrar detalles del pedido
    function showOrderDetails(orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Pedido no encontrado', 'error');
            return;
        }

        // Guardar el ID para impresión
        currentOrderIdForPrint = orderId;

        const user = getOrderUser(order);
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        const totalItems = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        const gramajesCount = order.items ? order.items.filter(item => item.gramaje && item.gramaje !== 'No especificado').length : 0;

        orderDetailContent.innerHTML = `
            <div class="space-y-4">
                <!-- Encabezado del pedido -->
                <div class="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">Pedido #${order.id || 'N/A'}</h3>
                            <p class="text-sm text-gray-600">Fecha: ${order.date || 'N/A'}</p>
                        </div>
                        <div class="text-right">
                            <span class="${statusClass} text-sm px-3 py-1 rounded-full">${statusText}</span>
                            <p class="text-2xl font-bold text-pink-600 mt-2">bs ${(order.totalAmount || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Estadísticas del pedido -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-500">Productos</p>
                        <p class="text-lg font-bold text-gray-800">${order.items ? order.items.length : 0}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-500">Items</p>
                        <p class="text-lg font-bold text-gray-800">${totalItems}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                        <p class="text-sm text-gray-500">Con Gramaje</p>
                        <p class="text-lg font-bold ${gramajesCount > 0 ? 'text-green-600' : 'text-yellow-600'}">${gramajesCount}</p>
                    </div>
                </div>
                
                <!-- Información del usuario -->
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 class="font-bold text-gray-700 mb-3 pb-2 border-b">📋 Información del Usuario</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <p class="text-sm text-gray-500">Nombre</p>
                            <p class="font-medium">${user.name}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Email</p>
                            <p class="font-medium">${user.email}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Teléfono</p>
                            <p class="font-medium">${user.phone}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">ID Usuario</p>
                            <p class="font-medium">${user.id || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Información del pago -->
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 class="font-bold text-gray-700 mb-3 pb-2 border-b">💳 Información de Pago</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <p class="text-sm text-gray-500">Método de Pago</p>
                            <p class="font-medium">${order.paymentMethod || 'Efectivo'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Estado del Pago</p>
                            <p class="font-medium ${order.paymentStatus === 'Pagado' ? 'text-green-600' : 'text-yellow-600'}">
                                ${order.paymentStatus || 'Pendiente'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Productos del pedido -->
                <div class="bg-white border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3 pb-2 border-b">
                        <h4 class="font-bold text-gray-700">🍓 Productos del Pedido</h4>
                        <span class="text-sm text-gray-500">${totalItems} items</span>
                    </div>
                    ${formatOrderItemsForDetails(order.items)}
                </div>
                
                <!-- Totales -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-bold text-gray-700 mb-3 pb-2 border-b">💰 Resumen de Totales</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Subtotal</span>
                            <span class="font-medium">bs ${(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Envío</span>
                            <span class="font-medium">bs 0.00</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Impuestos</span>
                            <span class="font-medium">bs 0.00</span>
                        </div>
                        <div class="flex justify-between border-t pt-2 mt-2">
                            <span class="text-lg font-bold text-gray-800">Total</span>
                            <span class="text-xl font-bold text-pink-600">bs ${(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Instrucciones especiales -->
                ${order.specialInstructions ? `
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-bold text-yellow-700 mb-2">📝 Instrucciones Especiales</h4>
                        <p class="text-gray-700">${order.specialInstructions}</p>
                    </div>
                ` : ''}
                
                <!-- Notas adicionales -->
                ${order.notes ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-bold text-blue-700 mb-2">📌 Notas Adicionales</h4>
                        <p class="text-gray-700">${order.notes}</p>
                    </div>
                ` : ''}
                
                <!-- Fechas importantes -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 class="font-bold text-gray-700 mb-2">📅 Fechas Importantes</h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-gray-500">Fecha del Pedido</p>
                            <p class="font-medium">${order.date || 'N/A'}</p>
                        </div>
                        ${order.completedAt ? `
                            <div>
                                <p class="text-gray-500">Completado</p>
                                <p class="font-medium text-green-600">${new Date(order.completedAt).toLocaleString()}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Configurar el botón de impresión para este pedido específico
        printOrderBtn.onclick = function () {
            printOrderDetails(orderId);
        };

        // Mostrar modal
        orderDetailModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }

    // Cerrar modal de detalles
    function closeOrderDetails() {
        orderDetailModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    // ==================== FUNCIONES DE IMPRESIÓN ====================

    // Imprimir detalles del pedido
    function printOrderDetails(orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Pedido no encontrado', 'error');
            return;
        }

        const user = getOrderUser(order);
        const statusText = getStatusText(order.status);

        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        const currentDate = new Date();
        const printDate = currentDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const printTime = currentDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Calcular subtotal
        const subtotal = order.totalAmount || (order.items ?
            order.items.reduce((sum, item) => {
                const price = item.price || 0;
                const quantity = item.quantity || 1;
                return sum + (price * quantity);
            }, 0) : 0);

        // Crear contenido HTML para impresión con gramaje
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Detalle de Pedido - ${order.id}</title>
                <style>
                    /* RESET COMPLETO PARA IMPRESIÓN */
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Segoe UI', Arial, sans-serif;
                    }
                    
                    /* ESTILOS PARA IMPRESIÓN */
                    @media print {
                        /* Configurar página para una sola hoja */
                        @page {
                            size: A4 portrait;
                            margin: 5mm 5mm;
                        }
                        
                        body {
                            font-size: 9pt;
                            line-height: 1.1;
                            color: #000;
                            background: white;
                            width: 100%;
                            height: 100%;
                            padding: 0;
                        }
                        
                        /* CONTENEDOR PRINCIPAL - Compacto */
                        .receipt-container {
                            width: 100%;
                            max-width: 190mm;
                            margin: 0 auto;
                            padding: 2mm;
                        }
                        
                        /* CABECERA IDÉNTICA A LA IMAGEN */
                        .header {
                            text-align: center;
                            margin-bottom: 3mm;
                            padding-bottom: 2mm;
                            border-bottom: 2px solid #ec4899;
                        }
                        
                        .company-name {
                            font-size: 12pt;
                            font-weight: bold;
                            color: #ec4899;
                            margin-bottom: 1mm;
                            letter-spacing: 0.5px;
                        }
                        
                        .document-title {
                            font-size: 10pt;
                            color: #333;
                            font-weight: normal;
                            margin-bottom: 2mm;
                        }
                        
                        .print-date {
                            font-size: 8pt;
                            color: #666;
                            margin-bottom: 3mm;
                            text-align: right;
                        }
                        
                        /* SEPARADORES */
                        hr {
                            border: none;
                            border-top: 1px dashed #ccc;
                            margin: 2mm 0;
                        }
                        
                        /* SECCIONES COMPACTAS */
                        .section {
                            margin-bottom: 2mm;
                            page-break-inside: avoid;
                        }
                        
                        .section-title {
                            font-weight: bold;
                            color: #333;
                            margin-bottom: 1mm;
                            font-size: 9pt;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 0.5mm;
                        }
                        
                        /* INFORMACIÓN EN LÍNEAS COMPACTAS */
                        .info-line {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 0.5mm;
                            font-size: 8pt;
                        }
                        
                        .info-label {
                            font-weight: bold;
                            min-width: 40%;
                        }
                        
                        .info-value {
                            text-align: right;
                            flex: 1;
                        }
                        
                        /* DATOS DEL CLIENTE - Más compacto */
                        .client-info {
                            margin-bottom: 2mm;
                        }
                        
                        /* TABLA DE PRODUCTOS - CON GRAMAJE */
                        .products-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 1mm 0 2mm 0;
                            font-size: 7pt;
                        }
                        
                        .products-table th {
                            background-color: #f8f8f8;
                            padding: 1mm;
                            text-align: left;
                            font-weight: bold;
                            border-bottom: 1px solid #ddd;
                            font-size: 7pt;
                        }
                        
                        .products-table td {
                            padding: 0.8mm;
                            border-bottom: 0.5px solid #eee;
                            vertical-align: top;
                            font-size: 7pt;
                        }
                        
                        .product-name {
                            font-weight: bold;
                        }
                        
                        .product-desc {
                            color: #666;
                            font-size: 6pt;
                            line-height: 1;
                            margin-top: 0.3mm;
                        }
                        
                        .product-gramaje {
                            display: inline-block;
                            background-color: #fce7f3;
                            color: #be185d;
                            padding: 0.2mm 1mm;
                            border-radius: 2mm;
                            font-size: 6pt;
                            font-weight: bold;
                            margin-top: 0.3mm;
                        }
                        
                        /* TOTALES - Alineado a la derecha como en la imagen */
                        .payment-info {
                            margin-top: 2mm;
                        }
                        
                        .total-section {
                            margin-top: 2mm;
                            text-align: right;
                            font-size: 9pt;
                        }
                        
                        .grand-total {
                            font-size: 10pt;
                            font-weight: bold;
                            color: #ec4899;
                            margin-top: 1mm;
                            padding-top: 1mm;
                            border-top: 1px solid #ec4899;
                        }
                        
                        /* INSTRUCCIONES ESPECIALES */
                        .special-instructions {
                            margin-top: 2mm;
                            padding: 1mm;
                            background-color: #fff9e6;
                            border-left: 2px solid #f59e0b;
                            font-size: 7pt;
                            line-height: 1.2;
                        }
                        
                        /* PIE DE PÁGINA - Más pequeño */
                        .footer {
                            margin-top: 3mm;
                            padding-top: 1mm;
                            border-top: 1px solid #ddd;
                            font-size: 6pt;
                            color: #888;
                            text-align: center;
                            line-height: 1;
                        }
                        
                        /* ESTADO - Pequeño */
                        .status-badge {
                            display: inline-block;
                            padding: 0.5mm 1.5mm;
                            border-radius: 8px;
                            font-size: 7pt;
                            font-weight: bold;
                        }
                        
                        .status-active {
                            background-color: #d1fae5;
                            color: #065f46;
                        }
                        
                        .status-completed {
                            background-color: #dbeafe;
                            color: #1e40af;
                        }
                        
                        .status-cancelled {
                            background-color: #fee2e2;
                            color: #991b1b;
                        }
                        
                        .status-processing {
                            background-color: #fef3c7;
                            color: #92400e;
                        }
                        
                        /* EVITAR SALTO DE PÁGINA DENTRO DE ELEMENTOS */
                        .no-break {
                            page-break-inside: avoid;
                        }
                        
                        /* OCULTAR ELEMENTOS NO NECESARIOS */
                        .no-print, button, .print-actions {
                            display: none !important;
                        }
                        
                        /* Asegurar que todo quepa en una sola página */
                        html, body {
                            height: auto !important;
                            overflow: hidden !important;
                        }
                        
                        .receipt-container {
                            height: auto !important;
                            max-height: 275mm !important;
                        }
                    }
                    
                    /* ESTILOS PARA VISTA PREVIA */
                    body {
                        padding: 2px;
                        font-family: 'Segoe UI', Arial, sans-serif;
                    }
                    
                    .receipt-container {
                        background: white;
                        padding: 10px;
                        max-width: 210mm;
                        margin: 0 auto;
                        box-shadow: 0 0 5px rgba(0,0,0,0.1);
                        border-radius: 3px;
                    }
                    
                    .print-actions {
                        text-align: center;
                        margin: 10px 0;
                        padding: 10px;
                    }
                    
                    .print-btn, .close-btn {
                        border: none;
                        padding: 6px 15px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 10pt;
                        margin: 0 3px;
                    }
                    
                    .print-btn {
                        background: #ec4899;
                        color: white;
                    }
                    
                    .print-btn:hover {
                        background: #d13d86;
                    }
                    
                    .close-btn {
                        background: #6b7280;
                        color: white;
                    }
                    
                    .close-btn:hover {
                        background: #4b5563;
                    }
                </style>
            </head>
            <body>
                <!-- RECIBO COMPACTO - Una sola hoja -->
                <div class="receipt-container no-break">
                    <!-- CABECERA -->
                    <div class="header">
                        <div class="company-name">FRESA CON CREMA - Tu Antojito</div>
                        <div class="document-title">DETALLE DE PEDIDO</div>
                    </div>
                    
                    <!-- FECHA DE IMPRESIÓN -->
                    <div class="print-date">
                        Fecha de impresión: ${printDate}
                    </div>
                    
                    <hr>
                    
                    <!-- INFORMACIÓN DEL PEDIDO -->
                    <div class="section">
                        <div class="section-title">INFORMACIÓN DEL PEDIDO</div>
                        <div class="info-line">
                            <span class="info-label">ID DEL PEDIDO:</span>
                            <span class="info-value"><strong>${order.id || 'N/A'}</strong></span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">ESTADO:</span>
                            <span class="info-value">
                                <span class="status-badge status-${order.status}">${statusText}</span>
                            </span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">FECHA:</span>
                            <span class="info-value"><strong>${order.date || 'N/A'}</strong></span>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <!-- DATOS DEL USUARIO -->
                    <div class="section">
                        <div class="section-title">DATOS DEL USUARIO</div>
                        <div class="info-line">
                            <span class="info-label">NOMBRE:</span>
                            <span class="info-value"><strong>${user.name || 'No especificado'}</strong></span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">TELÉFONO:</span>
                            <span class="info-value">${user.phone || 'No especificado'}</span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">EMAIL:</span>
                            <span class="info-value">${user.email || 'No especificado'}</span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">ID USUARIO:</span>
                            <span class="info-value">${user.id || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <!-- PRODUCTOS CON GRAMAJE -->
                    <div class="section">
                        <div class="section-title">PRODUCTOS (CON GRAMAJE)</div>
                        ${order.items && order.items.length > 0 ? `
                            <table class="products-table">
                                <thead>
                                    <tr>
                                        <th width="45%">PRODUCTO</th>
                                        <th width="10%">CANT.</th>
                                        <th width="15%">PRECIO</th>
                                        <th width="15%">GRAMAJE</th>
                                        <th width="15%">SUBTOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.items.map(item => {
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            const itemTotal = quantity * price;
            const gramaje = item.gramaje || 'No especificado';
            return `
                                            <tr>
                                                <td>
                                                    <div class="product-name">${item.name || 'Producto'}</div>
                                                    <div class="product-desc">${item.description || ''}</div>
                                                </td>
                                                <td>${quantity}</td>
                                                <td>bs ${price.toFixed(2)}</td>
                                                <td>
                                                    ${gramaje !== 'No especificado' ?
                    `<span class="product-gramaje">${gramaje}</span>` :
                    '<span style="color: #888; font-size: 6pt;">N/A</span>'
                }
                                                </td>
                                                <td>bs ${itemTotal.toFixed(2)}</td>
                                            </tr>
                                        `;
        }).join('')}
                                </tbody>
                            </table>
                        ` : '<div style="text-align: center; font-style: italic; color: #888; font-size: 8pt;">No hay productos</div>'}
                    </div>
                    
                    <hr>
                    
                    <!-- INFORMACIÓN DE PAGO -->
                    <div class="section payment-info">
                        <div class="section-title">INFORMACIÓN DE PAGO</div>
                        <div class="info-line">
                            <span class="info-label">MÉTODO DE PAGO:</span>
                            <span class="info-value"><strong>${order.paymentMethod || 'Efectivo'}</strong></span>
                        </div>
                        <div class="info-line">
                            <span class="info-label">ESTADO PAGO:</span>
                            <span class="info-value"><strong>${order.paymentStatus || 'Pendiente'}</strong></span>
                        </div>
                    </div>

                    <!-- TOTAL -->
                    <div class="total-section">
                        <div class="info-line">
                            <span class="info-label" style="font-size: 9pt;">TOTAL:</span>
                            <span class="info-value" style="font-size: 10pt;">
                                <strong>bs ${order.totalAmount ? order.totalAmount.toFixed(2) : subtotal.toFixed(2)}</strong>
                            </span>
                        </div>
                    </div>
                    
                    <!-- INSTRUCCIONES ESPECIALES -->
                    ${order.specialInstructions ? `
                        <div class="section">
                            <div class="special-instructions">
                                <strong>INSTRUCCIONES ESPECIALES:</strong><br>
                                ${order.specialInstructions}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- LÍNEA DE TOTAL GRANDE -->
                    <div style="margin-top: 3mm; text-align: right;">
                        <div style="font-size: 11pt; font-weight: bold; color: #ec4899;">
                            TOTAL: bs ${order.totalAmount ? order.totalAmount.toFixed(2) : subtotal.toFixed(2)}
                        </div>
                    </div>
                    
                    <hr>
                    
                    <!-- PIE DE PÁGINA -->
                    <div class="footer">
                        <div style="margin-bottom: 0.5mm;">FRESA CON CREMA - Delicias frescas todos los días</div>
                        <div>Pedido: ${order.id} | Impreso: ${printDate} ${printTime}</div>
                        <div style="margin-top: 0.5mm; font-size: 5pt;">Documento generado automáticamente</div>
                    </div>
                </div>
                
                <!-- BOTONES DE ACCIÓN (solo en vista previa) -->
                <div class="print-actions no-print">
                    <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
                    <button class="close-btn" onclick="window.close()">✖️ Cerrar</button>
                </div>
                
                <script>
                    // Auto-imprimir al cargar
                    window.onload = function() {
                        // Verificar que todo el contenido quepa en una página
                        const container = document.querySelector('.receipt-container');
                        const containerHeight = container.scrollHeight;
                        const maxPageHeight = 1122;
                        
                        // Si excede la altura, reducir fuentes
                        if (containerHeight > maxPageHeight) {
                            const scaleFactor = maxPageHeight / containerHeight;
                            const currentFontSize = parseFloat(getComputedStyle(document.body).fontSize);
                            document.body.style.fontSize = (currentFontSize * scaleFactor * 0.95) + 'pt';
                        }
                        
                        // Pequeña demora para asegurar que todo se cargue
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    };
                    
                    // Cerrar ventana después de imprimir
                    window.onafterprint = function() {
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                    
                    // Función para obtener clase de estado
                    function getPrintStatusClass(status) {
                        const statusMap = {
                            'active': 'active',
                            'inactive': 'cancelled',
                            'cancelled': 'cancelled',
                            'processing': 'processing',
                            'completed': 'completed',
                            'COMPLETADO': 'completed'
                        };
                        return statusMap[status] || 'cancelled';
                    }
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
    }

    // ==================== FUNCIONES DE ACCIONES ====================

    // Activar pedido
    window.activateOrder = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (order && confirm('¿Estás seguro de activar este pedido?')) {
            order.status = 'active';
            order.updatedAt = new Date().toISOString();
            saveOrders();
            loadOrders();
            showNotification('Pedido activado correctamente', 'success');
        }
    };

    // Anular pedido
    window.deactivateOrder = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (order && confirm('¿Estás seguro de anular este pedido?')) {
            order.status = 'inactive';
            order.updatedAt = new Date().toISOString();
            saveOrders();
            loadOrders();
            showNotification('Pedido anulado correctamente', 'warning');
        }
    };

    // Procesar pedido
    window.processOrder = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (order && confirm('¿Marcar este pedido como en proceso?')) {
            order.status = 'processing';
            order.updatedAt = new Date().toISOString();
            saveOrders();
            loadOrders();
            showNotification('Pedido en proceso', 'info');
        }
    };

    // Completar pedido
    window.completeOrder = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (order && confirm('¿Marcar este pedido como completado?')) {
            order.status = 'completed';
            order.updatedAt = new Date().toISOString();
            order.completedAt = new Date().toISOString();
            saveOrders();
            loadOrders();
            showNotification('Pedido completado', 'success');
        }
    };

    // Editar pedido
    window.editOrder = function (orderId) {
        // Redirigir a la página de edición
        window.location.href = `orders.html?edit=${orderId}`;
    };

    // Asignar función global
    window.showOrderDetails = showOrderDetails;

    // ==================== FUNCIONES AUXILIARES ====================

    // Guardar pedidos en localStorage
    function saveOrders() {
        localStorage.setItem('fresa_orders', JSON.stringify(allOrders));
    }

    // Mostrar notificación
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 fade-in ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} text-white`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ==================== EVENT LISTENERS ====================

    // Búsqueda
    searchOrdersInput.addEventListener('input', function () {
        searchTerm = this.value.toLowerCase().trim();
        currentPage = 1;
        filterOrders();
        renderTable();
    });

    // Cambiar registros por página
    recordsPerPageSelect.addEventListener('change', function () {
        recordsPerPage = parseInt(this.value);
        currentPage = 1;
        renderTable();
    });

    // Paginación
    prevPageBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', function () {
        const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // Cerrar modal con botones
    closeModalBtn.addEventListener('click', closeOrderDetails);
    closeModalIcon.addEventListener('click', closeOrderDetails);

    // Cerrar modal haciendo clic fuera
    orderDetailModal.addEventListener('click', function (event) {
        if (event.target === orderDetailModal) {
            closeOrderDetails();
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !orderDetailModal.classList.contains('hidden')) {
            closeOrderDetails();
        }
    });

    // ==================== INICIALIZACIÓN ====================

    // Cargar pedidos al inicio
    loadOrders();
});