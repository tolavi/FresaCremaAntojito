// Datos de productos para referencia (con gramajes actualizados)
const productosBase = [
    {
        id: '1',
        name: 'FRESAS CON DURAZNO',
        description: 'Fresas frescas con crema dulce y deliciosa',
        price: 45,
        image: 'assets/imagen/FresaDurazno.png',
        category: 'Clásicos',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
    {
        id: '2',
        name: 'FRESAS CON PIÑA O PURA PIÑA',
        description: 'Fresas cubiertas con piña y crema',
        price: 55,
        image: 'assets/imagen/FresaPiña.png',
        category: 'Premium',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
    {
        id: '3',
        name: 'JALEA FRUTILLAS CHOCOLATE',
        description: 'Fresas frescas del día con un toque de crema',
        price: 25,
        image: 'assets/imagen/FresaFrutilla.png',
        category: 'Natural',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
    {
        id: '4',
        name: 'FRESAS CON NUTELLA',
        description: 'Capas de fresas, crema y granola con Nutella',
        price: 50,
        image: 'assets/imagen/FresaNutella.png',
        category: 'Especial',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
    {
        id: '5',
        name: 'FRESAS CON PLÁTANO',
        description: 'Extra porción de crema para los más golosos',
        price: 60,
        image: 'assets/imagen/FresaPlatano.png',
        category: 'Premium',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
    {
        id: '6',
        name: 'FRESAS CON DULCE DE LECHE',
        description: 'Porción pequeña perfecta para una probadita',
        price: 25,
        image: 'assets/imagen/FresaDulceLeche.png',
        category: 'Clásicos',
        gramajes: [
            { gramos: 30, precio: 22 },
            { gramos: 40, precio: 25 },
            { gramos: 50, precio: 30 },
            { gramos: 60, precio: 35 }
        ]
    },
];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (window.auth && typeof window.auth.checkAuth === 'function') {
        window.auth.checkAuth();
    }
    
    renderCart();
    updateCartBadge();
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePaymentModal();
            closeQRModal();
            closeCardModal();
            closeGramajeModal();
        }
    });
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('payment-modal-overlay')) {
            closePaymentModal();
            closeQRModal();
            closeCardModal();
            closeGramajeModal();
        }
    });
});

// Renderizar carrito
function renderCart() {
    const cartContent = document.getElementById('cartContent');
    if (!cartContent) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos deliciosos para comenzar tu pedido</p>
                <button onclick="window.location.href='productos.html'">Ver Productos</button>
            </div>
        `;
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.00; // 0% de impuesto
    const total = subtotal + tax;

    cartContent.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image" 
                             ondblclick="showGramajeModalInCart('${item.id}')"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23ec4899%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2224%22 font-weight=%22bold%22%3E🍓%3C/text%3E%3C/svg%3E'">
                        <div class="cart-item-info">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-description">${item.description}</p>
                            ${item.selectedGramaje ? 
                                `<div class="cart-item-gramaje">
                                    <span class="gramaje-badge">${item.selectedGramaje.gramos}g</span>
                                    <span class="gramaje-info">seleccionado</span>
                                    <button class="change-gramaje-btn" onclick="showGramajeModalInCart('${item.id}')">Cambiar</button>
                                </div>` 
                                : 
                                `<div class="cart-item-gramaje">
                                    <span class="gramaje-warning">⚠️ No hay gramaje seleccionado</span>
                                    <button class="change-gramaje-btn" onclick="showGramajeModalInCart('${item.id}')">Seleccionar Gramaje</button>
                                </div>`
                            }
                            <div class="cart-item-footer">
                                <div class="quantity-controls">
                                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                                    <span class="quantity-value">${item.quantity}</span>
                                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                                </div>
                                <span class="cart-item-price">bs ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
                    </div>
                `).join('')}
            </div>
            
            <div class="cart-summary">
                <h4>Resumen del Pedido</h4>
                <div class="summary-line">
                    <span>Subtotal</span>
                    <span>bs ${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-line">
                    <span>Envío</span>
                    <span>bs 0.00</span>
                </div>
                <div class="summary-line">
                    <span>Impuestos</span>
                    <span>bs ${tax.toFixed(2)}</span>
                </div>
                <div class="summary-total">
                    <span class="label">Total</span>
                    <span class="value">bs ${total.toFixed(2)}</span>
                </div>
                <button class="checkout-btn" onclick="showPaymentModal()">
                    Proceder al Pago 💳
                </button>
                <button class="continue-btn" onclick="window.location.href='productos.html'">
                    Continuar Comprando
                </button>
                <div class="delivery-info">
                    <span class="delivery-icon">🚚</span>
                    <div>
                        <p>Entrega disponible</p>
                        <p style="font-size: 0.75rem;">Recibe tu pedido en 30-45 minutos</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Obtener carrito desde localStorage
function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Asegurarse de que cada item tenga todos los datos necesarios
        return cart.map(item => {
            // Buscar producto en productosBase para completar datos faltantes
            const baseProduct = productosBase.find(p => p.id === item.id);
            if (baseProduct) {
                return {
                    ...baseProduct,
                    quantity: item.quantity || 1,
                    price: item.price || baseProduct.price,
                    selectedGramaje: item.selectedGramaje || null,
                    gramajes: item.gramajes || baseProduct.gramajes || []
                };
            }
            return item;
        }).filter(item => item); // Filtrar items nulos
    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        return [];
    }
}

// Guardar carrito en localStorage
function saveCart(cart) {
    try {
        // Guardar datos esenciales incluyendo gramaje seleccionado
        const simplifiedCart = cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            selectedGramaje: item.selectedGramaje || null
        }));
        localStorage.setItem('cart', JSON.stringify(simplifiedCart));
    } catch (error) {
        console.error('Error guardando carrito:', error);
    }
}

// Actualizar cantidad
function updateQuantity(productId, newQuantity) {
    let cart = getCart();
    
    if (newQuantity <= 0) {
        // Eliminar producto si cantidad es 0 o menor
        cart = cart.filter(item => item.id !== productId);
    } else {
        // Actualizar cantidad
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    
    saveCart(cart);
    updateCartBadge();
    renderCart();
    
    // Mostrar notificación si se eliminó
    if (newQuantity <= 0) {
        showNotification('Producto eliminado del carrito', 'info');
    }
}

// Eliminar producto del carrito
function removeFromCart(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto del carrito?')) {
        return;
    }
    
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartBadge();
    renderCart();
    
    // Mostrar notificación
    showNotification('Producto eliminado del carrito', 'info');
}

// Actualizar badge del carrito
function updateCartBadge() {
    try {
        const cart = getCart();
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

// Función para mostrar modal de gramaje en el carrito
function showGramajeModalInCart(productId) {
    const cart = getCart();
    const cartItem = cart.find(item => item.id === productId);
    const baseProduct = productosBase.find(p => p.id === productId);
    
    if (!cartItem && !baseProduct) return;
    
    const product = cartItem || baseProduct;
    
    // Cerrar modal si ya existe
    const existingModal = document.getElementById('gramajeModalCart');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="gramajeModalCart">
            <div class="gramaje-modal">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">Seleccionar Gramaje</h3>
                    <button onclick="closeGramajeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.25rem; line-height: 1;">×</button>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <p style="color: #4b5563; font-size: 0.95rem; padding: 0.5rem; background: #f3f4f6; border-radius: 8px;">Selecciona el gramaje para <strong style="color: #ec4899;">${product.name}</strong></p>
                </div>
                
                <table class="gramaje-table">
                    <thead>
                        <tr>
                            <th>Gramaje</th>
                            <th>Precio</th>
                            <th>Seleccionar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(product.gramajes || product.gramajes || [
                            { gramos: 30, precio: 22 },
                            { gramos: 40, precio: 25 },
                            { gramos: 50, precio: 30 },
                            { gramos: 60, precio: 35 }
                        ]).map(gramaje => `
                            <tr>
                                <td>${gramaje.gramos}g</td>
                                <td>Bs ${gramaje.precio}</td>
                                <td>
                                    <button class="gramaje-select-btn" onclick="selectGramajeInCart(${gramaje.gramos}, ${gramaje.precio}, '${productId}')">
                                        Seleccionar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="gramaje-cancel-btn" onclick="closeGramajeModal()">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Seleccionar gramaje en el carrito
function selectGramajeInCart(gramos, precio, productId) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        // Actualizar precio y gramaje del producto
        item.price = precio;
        item.selectedGramaje = { gramos, precio };
        
        // Guardar selección en localStorage
        const selections = JSON.parse(localStorage.getItem('gramajeSelections') || '{}');
        selections[productId] = { gramos, precio };
        localStorage.setItem('gramajeSelections', JSON.stringify(selections));
        
        // Guardar carrito actualizado
        saveCart(cart);
        
        // Actualizar visualización
        updateCartBadge();
        renderCart();
        
        // Mostrar notificación
        showNotification(`✅ Gramaje actualizado: ${gramos}g seleccionado`, 'success');
    }
    
    closeGramajeModal();
}

// Cerrar modal de gramaje
function closeGramajeModal() {
    const modal = document.getElementById('gramajeModalCart');
    if (modal) {
        modal.remove();
    }
}

// Función auxiliar para limpiar carrito y redirigir
function completePurchaseAndRedirect(destination = 'productos.html', delay = 1500) {
    // Limpiar carrito
    localStorage.removeItem('cart');
    updateCartBadge();
    renderCart();
    
    // Redirigir después del delay especificado
    setTimeout(() => {
        window.location.href = destination;
    }, delay);
}

// ============================================
// FUNCIONES DE PROCESAMIENTO DE PAGOS
// ============================================

// Función para mostrar modal de pago
function showPaymentModal() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    // Verificar si todos los productos tienen gramaje seleccionado
    const productosSinGramaje = cart.filter(item => !item.selectedGramaje);
    if (productosSinGramaje.length > 0) {
        if (!confirm(`⚠️ Hay ${productosSinGramaje.length} producto(s) sin gramaje seleccionado.\n\n¿Deseas continuar de todos modos?`)) {
            return;
        }
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const userName = getCurrentUserName();
    
    // Crear modal de pago
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'payment-modal-overlay';
    
    modal.innerHTML = `
        <div class="payment-modal">
            <div class="payment-modal-body">
                <div class="order-summary">
                    <h4>Resumen del Pedido</h4>
                    <div class="summary-details">
                        <p><strong>Usuario:</strong> ${userName}</p>
                        <p><strong>Total:</strong> <span class="total-amount">Bs ${total.toFixed(2)}</span></p>
                        <p><strong>Items:</strong> ${cart.length} producto(s)</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                        ${productosSinGramaje.length > 0 ? 
                            `<p><strong>⚠️ Advertencia:</strong> ${productosSinGramaje.length} producto(s) sin gramaje seleccionado</p>` 
                            : ''}
                    </div>
                </div>
                
                <div class="payment-options">
                    <h4>¿Cómo deseas pagar?</h4>
                    <div class="payment-methods">
                        <button class="payment-method-btn cash-btn" onclick="processCashPayment()">
                            <div class="payment-icon">💵</div>
                            <div class="payment-info">
                                <strong>EFECTIVO</strong>
                                <small>Paga al recibir tu pedido</small>
                            </div>
                        </button>
                        
                        <button class="payment-method-btn qr-btn" onclick="processQRPayment()">
                            <div class="payment-icon">📱</div>
                            <div class="payment-info">
                                <strong>PAGO POR QR</strong>
                                <small>Escanear código para pagar</small>
                            </div>
                        </button>
                        
                        <button class="payment-method-btn card-btn" onclick="processCardPayment()">
                            <div class="payment-icon">💳</div>
                            <div class="payment-info">
                                <strong>TARJETA</strong>
                                <small>Próximamente</small>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="payment-modal-footer">
                <button class="cancel-btn" onclick="closePaymentModal()">
                    Cancelar
                </button>
                <p class="payment-note">
                    <small>Tu pedido será procesado inmediatamente después del pago</small>
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Añadir estilos si no existen
    addPaymentModalStyles();
}

// Función para cerrar modal de pago
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.remove();
    }
}

// Procesar pago en efectivo
function processCashPayment() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (confirm(`¿Confirmar pedido en EFECTIVO por Bs ${total.toFixed(2)}?\n\nPagarás al recibir tu pedido.`)) {
        const orderId = generateOrderId();
        const userName = getCurrentUserName();
        
        // Preparar productos con toda la información incluyendo gramaje
        const productsWithDetails = cart.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
            gramaje: item.selectedGramaje ? `${item.selectedGramaje.gramos}g` : 'No especificado',
            subtotal: (item.price * item.quantity).toFixed(2)
        }));
        
        // Obtener fecha y hora actual
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Crear pedido para efectivo
        const order = {
            id: orderId,
            userId: getCurrentUserId(),
            userName: userName,
            userEmail: getCurrentUserEmail(),
            items: productsWithDetails,
            totalAmount: total,
            date: `${day}/${month}/${year} ${hours}:${minutes}`,
            orderDate: now.toISOString().split('T')[0],
            orderTime: `${hours}:${minutes}`,
            status: 'processing',
            paymentMethod: 'Efectivo',
            paymentStatus: 'Pendiente',
            specialInstructions: 'Pago en efectivo al recibir',
            orderDetails: {
                productsCount: cart.length,
                itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
                gramajesSeleccionados: productsWithDetails.filter(p => p.gramaje !== 'No especificado').length
            }
        };
        
        // Guardar pedido
        if (saveOrder(order)) {
            // Mostrar notificación de éxito
            showNotification(`✅ Pedido #${orderId} creado! Paga Bs ${total.toFixed(2)} en efectivo al recibir.`, 'success');
            
            // Limpiar selecciones de gramaje
            localStorage.removeItem('gramajeSelections');
            
            // Usar función auxiliar para limpiar carrito y redirigir
            completePurchaseAndRedirect('productos.html', 1500);
            
            // Cerrar modal
            closePaymentModal();
            
            // Actualizar estadísticas
            updateOrderStats();
        } else {
            showNotification('Error al procesar el pedido', 'error');
        }
    }
}

// Procesar pago por QR
function processQRPayment() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = generateOrderId();
    const userName = getCurrentUserName();
    
    // Cerrar modal anterior
    closePaymentModal();
    
    // Crear modal de QR
    const qrModal = document.createElement('div');
    qrModal.id = 'qrPaymentModal';
    qrModal.className = 'payment-modal-overlay';
    
    // Generar un código QR simulado
    const qrData = `FRESA-CON-CREMA|${orderId}|${total}|${new Date().getTime()}`;
    
    qrModal.innerHTML = `
        <div class="qr-modal">
            <div class="qr-modal-header">
                <h3>📱 Pago con Código QR</h3>
                <button class="close-qr-modal" onclick="closeQRModal()">
                    &times;
                </button>
            </div>
            
            <div class="qr-modal-body">
                <div class="order-details-qr">
                    <h4>Detalles del Pedido</h4>
                    <div class="order-info">
                        <p><strong>Pedido #:</strong> ${orderId}</p>
                        <p><strong>Usuario:</strong> ${userName}</p>
                        <p><strong>Total a Pagar:</strong> <span class="qr-total">Bs ${total.toFixed(2)}</span></p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div class="qr-instructions">
                        <p>📋 <strong>Instrucciones:</strong></p>
                        <ol>
                            <li>Escanear el código QR con tu app de pagos móviles</li>
                            <li>Verificar que el monto sea <strong>Bs ${total.toFixed(2)}</strong></li>
                            <li>Completar la transacción</li>
                            <li>Presionar "Confirmar Pago"</li>
                        </ol>
                    </div>
                </div>
                
                <div class="qr-code-container">
                    <div class="qr-code-placeholder">
                        <div class="qr-code">
                            <div class="qr-grid">
                                <div class="qr-corner top-left"></div>
                                <div class="qr-corner top-right"></div>
                                <div class="qr-corner bottom-left"></div>
                                <div class="qr-pattern">
                                    <div class="qr-line"></div>
                                    <div class="qr-line"></div>
                                    <div class="qr-line"></div>
                                    <div class="qr-line"></div>
                                </div>
                                <div class="qr-text">
                                    <div class="qr-logo">🍓</div>
                                    <div class="qr-amount">Bs ${total.toFixed(2)}</div>
                                    <div class="qr-order">#${orderId}</div>
                                </div>
                            </div>
                        </div>
                        <p class="qr-scan-text">Escanea con tu app de pagos</p>
                    </div>
                    
                    <div class="qr-banks">
                        <p><strong>Apps compatibles:</strong></p>
                        <div class="bank-icons">
                            <span class="bank-icon">🏦</span>
                            <span class="bank-icon">📲</span>
                            <span class="bank-icon">💸</span>
                            <span class="bank-icon">💰</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="qr-modal-footer">
                <div class="qr-buttons">
                    <button class="cancel-qr-btn" onclick="closeQRModal()">
                        Cancelar
                    </button>
                    <button class="confirm-payment-btn" onclick="completeQRPayment('${orderId}', ${total})">
                        ✅ Confirmar Pago
                    </button>
                </div>
                <p class="qr-note">
                    <small>⚠️ No cierres esta ventana hasta confirmar el pago</small>
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(qrModal);
    addQRModalStyles();
}

// Cerrar modal QR
function closeQRModal() {
    const modal = document.getElementById('qrPaymentModal');
    if (modal) {
        modal.remove();
    }
}

// Completar pago QR
function completeQRPayment(orderId, total) {
    const cart = getCart();
    
    if (confirm(`¿Has completado el pago de Bs ${total.toFixed(2)}?\n\nPedido #${orderId}`)) {
        const userName = getCurrentUserName();
        
        // Obtener fecha y hora actual
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Preparar productos con toda la información incluyendo gramaje
        const productsWithDetails = cart.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
            gramaje: item.selectedGramaje ? `${item.selectedGramaje.gramos}g` : 'No especificado',
            subtotal: (item.price * item.quantity).toFixed(2)
        }));
        
        // Crear pedido para QR
        const order = {
            id: orderId,
            userId: getCurrentUserId(),
            userName: userName,
            userEmail: getCurrentUserEmail(),
            items: productsWithDetails,
            totalAmount: total,
            date: `${day}/${month}/${year} ${hours}:${minutes}`,
            orderDate: now.toISOString().split('T')[0],
            orderTime: `${hours}:${minutes}`,
            status: 'completed',
            paymentMethod: 'QR Code',
            paymentStatus: 'Pagado',
            paymentDate: now.toISOString(),
            specialInstructions: 'Pago completado vía QR',
            orderDetails: {
                productsCount: cart.length,
                itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
                gramajesSeleccionados: productsWithDetails.filter(p => p.gramaje !== 'No especificado').length
            }
        };
        
        // Guardar pedido
        if (saveOrder(order)) {
            showNotification(`✅ Pago QR confirmado! Pedido #${orderId} completado.`, 'success');
            
            // Limpiar selecciones de gramaje
            localStorage.removeItem('gramajeSelections');
            
            // Usar función auxiliar para limpiar carrito y redirigir a pedidos
            completePurchaseAndRedirect('orders.html', 1500);
            
            // Cerrar modal
            closeQRModal();
            
            // Actualizar estadísticas
            updateOrderStats();
        }
    }
}

// Procesar pago con tarjeta (no disponible)
function processCardPayment() {
    // Cerrar modal anterior
    closePaymentModal();
    
    // Crear modal de tarjeta no disponible
    const cardModal = document.createElement('div');
    cardModal.id = 'cardPaymentModal';
    cardModal.className = 'payment-modal-overlay';
    
    cardModal.innerHTML = `
        <div class="card-modal">
            <div class="card-modal-header">
                <div class="card-warning-icon">❓</div>
                <h3>Pago con Tarjeta</h3>
                <button class="close-card-modal" onclick="closeCardModal()">
                    &times;
                </button>
            </div>
            
            <div class="card-modal-body">
                <div class="card-warning-message">
                    <div class="warning-icon">🚫</div>
                    <h4>Método no disponible temporalmente</h4>
                    <p>Los pagos con tarjeta de crédito/débito están actualmente deshabilitados para mantenimiento.</p>
                    
                    <div class="card-alternatives">
                        <p><strong>Métodos disponibles:</strong></p>
                        <ul>
                            <li>💵 <strong>Efectivo:</strong> Paga al recibir tu pedido</li>
                            <li>📱 <strong>QR Code:</strong> Pago rápido y seguro con apps móviles</li>
                        </ul>
                    </div>
                    
                    <div class="card-estimate">
                        <p>Los pagos con tarjeta estarán disponibles próximamente.</p>
                        <div class="card-coming-soon">
                            <span class="clock-icon">⏰</span>
                            <span>Próximamente...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card-modal-footer">
                <button class="try-other-btn" onclick="closeCardModalAndReturn()">
                    Probar otro método
                </button>
                <button class="ok-btn" onclick="closeCardModal()">
                    Entendido
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cardModal);
    addCardModalStyles();
}

// Cerrar modal tarjeta y volver a métodos
function closeCardModalAndReturn() {
    closeCardModal();
    setTimeout(() => {
        showPaymentModal();
    }, 300);
}

// Cerrar modal tarjeta
function closeCardModal() {
    const modal = document.getElementById('cardPaymentModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

// Generar ID único para pedido
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

// Obtener datos del usuario actual
function getCurrentUserId() {
    try {
        const user = JSON.parse(localStorage.getItem('fresa_user') || '{}');
        return user.id || 'USR-001';
    } catch {
        return 'USR-001';
    }
}

function getCurrentUserName() {
    try {
        const user = JSON.parse(localStorage.getItem('fresa_user') || '{}');
        return user.nombre || 'Cliente';
    } catch {
        return 'Cliente';
    }
}

function getCurrentUserEmail() {
    try {
        const user = JSON.parse(localStorage.getItem('fresa_user') || '{}');
        return user.email || 'cliente@email.com';
    } catch {
        return 'cliente@email.com';
    }
}

// Guardar pedido en localStorage
function saveOrder(order) {
    try {
        // Obtener pedidos existentes
        let orders = [];
        try {
            orders = JSON.parse(localStorage.getItem('fresa_orders') || '[]');
        } catch (e) {
            console.warn('No hay pedidos previos, creando nueva lista');
            orders = [];
        }
        
        // Asegurarse de que items tenga toda la información necesaria
        if (order.items && Array.isArray(order.items)) {
            order.items = order.items.map(item => ({
                ...item,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1,
                subtotal: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)
            }));
        }
        
        // Asegurar que totalAmount sea número
        order.totalAmount = parseFloat(order.totalAmount) || 0;
        
        // AGREGAR FECHA Y HORA EN FORMATO PARA LA TABLA
        const now = new Date();
        
        // Formato de fecha para la tabla: "DD/MM/YYYY HH:MM"
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Guardar en dos formatos
        order.date = `${day}/${month}/${year} ${hours}:${minutes}`;  // Para mostrar en tabla
        order.orderDate = now.toISOString().split('T')[0];  // Para ordenamiento
        
        // Timestamps adicionales
        order.createdAt = now.toISOString();
        order.updatedAt = now.toISOString();
        
        // Agregar nuevo pedido al principio
        orders.unshift(order);
        
        // Limitar a 100 pedidos máximo (opcional)
        if (orders.length > 100) {
            orders = orders.slice(0, 100);
        }
        
        // Guardar
        localStorage.setItem('fresa_orders', JSON.stringify(orders));
        
        console.log('Pedido guardado:', order);
        
        // Actualizar estadísticas inmediatamente
        updateOrderStats();
        
        return true;
    } catch (error) {
        console.error('Error saving order:', error);
        showNotification('Error al guardar el pedido', 'error');
        return false;
    }
}

// Función para actualizar estadísticas de pedidos
function updateOrderStats() {
    try {
        const orders = JSON.parse(localStorage.getItem('fresa_orders') || '[]');
        
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0),
            processingOrders: orders.filter(order => order.status === 'processing').length,
            completedOrders: orders.filter(order => order.status === 'completed').length
        };
        
        localStorage.setItem('fresa_order_stats', JSON.stringify(stats));
        
        // Actualizar dashboard si está abierto
        updateDashboardStats();
        
        return stats;
    } catch (error) {
        console.error('Error updating order stats:', error);
        return null;
    }
}

// Función para actualizar estadísticas del dashboard
function updateDashboardStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('fresa_order_stats') || '{}');
        
        // Actualizar tarjetas en dashboard si están visibles
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
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 fade-in ${type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remover notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ============================================
// ESTILOS PARA LOS MODALES DE PAGO
// ============================================

function addPaymentModalStyles() {
    // Verificar si los estilos ya existen
    if (document.getElementById('paymentModalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'paymentModalStyles';
    styles.textContent = `
        /* Estilos para gramaje en carrito */
        .cart-item-gramaje {
            margin: 8px 0;
            padding: 8px;
            background: #f8fafc;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .gramaje-badge {
            background: linear-gradient(135deg, #ec4899, #ef4444);
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .gramaje-info {
            font-size: 0.85rem;
            color: #6b7280;
            flex-grow: 1;
        }
        
        .gramaje-warning {
            color: #dc2626;
            font-size: 0.85rem;
            flex-grow: 1;
        }
        
        .change-gramaje-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .change-gramaje-btn:hover {
            background: #2563eb;
        }
        
        /* Modal overlay */
        .payment-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            animation: fadeIn 0.3s ease;
        }
        
        /* Modal principal */
        .payment-modal {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .payment-modal-body {
            padding: 20px;
        }
        
        .order-summary {
            background: #f8fafc;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
            border-left: 4px solid #4f46e5;
        }
        
        .order-summary h4 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #1f2937;
        }
        
        .summary-details p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        
        .total-amount {
            font-size: 1.3rem;
            font-weight: bold;
            color: #ec4899;
        }
        
        .payment-options h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #1f2937;
            font-size: 1.2rem;
        }
        
        .payment-methods {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .payment-method-btn {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: left;
            width: 100%;
            background: white;
            border: 2px solid #e5e7eb;
        }
        
        .payment-method-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .payment-icon {
            font-size: 2rem;
            width: 50px;
            text-align: center;
        }
        
        .payment-info {
            flex: 1;
        }
        
        .payment-info strong {
            display: block;
            font-size: 1.1rem;
            margin-bottom: 4px;
        }
        
        .payment-info small {
            color: #6b7280;
        }
        
        .cash-btn {
            border-color: #10b981;
        }
        
        .cash-btn:hover {
            background: #f0fdf4;
            border-color: #10b981;
        }
        
        .qr-btn {
            border-color: #3b82f6;
        }
        
        .qr-btn:hover {
            background: #eff6ff;
            border-color: #3b82f6;
        }
        
        .card-btn {
            border-color: #9ca3af;
            opacity: 0.7;
        }
        
        .card-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
        }
        
        .payment-modal-footer {
            padding: 15px 20px;
            border-top: 2px solid #f3f4f6;
            text-align: center;
        }
        
        .cancel-btn {
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.3s;
        }
        
        .cancel-btn:hover {
            background: #4b5563;
        }
        
        .payment-note {
            margin-top: 10px;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        /* QR Modal Styles */
        .qr-modal {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }
        
        .qr-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #f3f4f6;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border-radius: 20px 20px 0 0;
        }
        
        .qr-modal-body {
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .order-details-qr {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
        }
        
        .order-details-qr h4 {
            margin-top: 0;
            color: #1e40af;
        }
        
        .order-info p {
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
        }
        
        .qr-total {
            font-size: 1.5rem;
            font-weight: bold;
            color: #10b981;
        }
        
        .qr-instructions {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
        }
        
        .qr-instructions ol {
            margin: 10px 0 0 20px;
            padding: 0;
        }
        
        .qr-instructions li {
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .qr-code-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .qr-code-placeholder {
            text-align: center;
        }
        
        .qr-code {
            width: 200px;
            height: 200px;
            background: white;
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .qr-grid {
            width: 180px;
            height: 180px;
            position: relative;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                #1e40af 8px,
                #1e40af 9px
            ),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 8px,
                #1e40af 8px,
                #1e40af 9px
            );
        }
        
        .qr-corner {
            position: absolute;
            width: 25px;
            height: 25px;
            border: 4px solid #1e40af;
            border-radius: 6px;
        }
        
        .qr-corner.top-left {
            top: 10px;
            left: 10px;
        }
        
        .qr-corner.top-right {
            top: 10px;
            right: 10px;
        }
        
        .qr-corner.bottom-left {
            bottom: 10px;
            left: 10px;
        }
        
        .qr-pattern {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 8px;
        }
        
        .qr-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 2;
        }
        
        .qr-logo {
            font-size: 2rem;
        }
        
        .qr-amount {
            font-weight: bold;
            color: #1e40af;
            margin: 5px 0;
        }
        
        .qr-order {
            font-size: 0.8rem;
            color: #6b7280;
        }
        
        .qr-scan-text {
            font-size: 0.9rem;
            color: #6b7280;
            font-style: italic;
        }
        
        .qr-banks {
            margin-top: 20px;
            text-align: center;
        }
        
        .bank-icons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
        }
        
        .bank-icon {
            font-size: 1.5rem;
            background: #f3f4f6;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .qr-modal-footer {
            padding: 15px 20px;
            border-top: 2px solid #f3f4f6;
        }
        
        .qr-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .cancel-qr-btn {
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .confirm-payment-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .qr-note {
            text-align: center;
            margin-top: 10px;
            color: #dc2626;
            font-size: 0.85rem;
        }
        
        /* Card Modal Styles */
        .card-modal {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            animation: slideUp 0.3s ease;
        }
        
        .card-modal-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            border-bottom: 2px solid #f3f4f6;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            border-radius: 20px 20px 0 0;
        }
        
        .card-warning-icon {
            font-size: 2rem;
            background: rgba(255, 255, 255, 0.2);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .card-modal-body {
            padding: 30px 20px;
        }
        
        .card-warning-message {
            text-align: center;
        }
        
        .warning-icon {
            font-size: 3rem;
            margin-bottom: 15px;
            display: block;
        }
        
        .card-warning-message h4 {
            color: #dc2626;
            margin-bottom: 10px;
            font-size: 1.5rem;
        }
        
        .card-warning-message p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .card-alternatives {
            background: #f8fafc;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
        
        .card-alternatives ul {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        
        .card-alternatives li {
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card-estimate {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed #e5e7eb;
        }
        
        .card-coming-soon {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: #fef3c7;
            color: #92400e;
            padding: 10px 20px;
            border-radius: 20px;
            margin-top: 10px;
            font-weight: 600;
        }
        
        .card-modal-footer {
            padding: 15px 20px;
            border-top: 2px solid #f3f4f6;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .try-other-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .ok-btn {
            background: #6b7280;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .cart-item-gramaje {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
            
            .change-gramaje-btn {
                align-self: flex-start;
            }
            
            .qr-modal-body {
                grid-template-columns: 1fr;
            }
            
            .qr-code {
                width: 150px;
                height: 150px;
            }
            
            .qr-grid {
                width: 130px;
                height: 130px;
            }
            
            .payment-modal, .qr-modal, .card-modal {
                width: 95%;
                margin: 10px;
            }
            
            .card-modal-footer {
                flex-direction: column;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Añadir estilos específicos para QR modal
function addQRModalStyles() {
    if (document.getElementById('qrModalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'qrModalStyles';
    styles.textContent = `
        .qr-line {
            position: absolute;
            background: #1e40af;
        }
        
        .qr-line:nth-child(1) {
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 4px;
        }
        
        .qr-line:nth-child(2) {
            top: 50%;
            left: 10px;
            transform: translateY(-50%);
            width: 4px;
            height: 40px;
        }
        
        .qr-line:nth-child(3) {
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 4px;
        }
        
        .qr-line:nth-child(4) {
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            width: 4px;
            height: 40px;
        }
    `;
    document.head.appendChild(styles);
}

// Añadir estilos específicos para card modal
function addCardModalStyles() {
    if (document.getElementById('cardModalStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'cardModalStyles';
    styles.textContent = `
        .clock-icon {
            font-size: 1.2rem;
        }
        
        .card-warning-message h4 {
            font-size: 1.3rem;
        }
    `;
    document.head.appendChild(styles);
}

// Exportar funciones para uso global
window.updateCartBadge = updateCartBadge;
window.renderCart = renderCart;
window.showPaymentModal = showPaymentModal;
window.processCashPayment = processCashPayment;
window.processQRPayment = processQRPayment;
window.processCardPayment = processCardPayment;
window.showGramajeModalInCart = showGramajeModalInCart;
window.selectGramajeInCart = selectGramajeInCart;
window.closeGramajeModal = closeGramajeModal;