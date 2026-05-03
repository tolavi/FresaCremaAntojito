// Products Data with gramajes - Base inicial
let products = JSON.parse(localStorage.getItem('fresa_products_db') || '[]');

// Si no hay productos en localStorage, cargar los de ejemplo
if (products.length === 0) {
    products = [
        {
            id: '1',
            name: 'FRESAS CON DURAZNO',
            description: 'Fresas frescas con crema dulce y deliciosa',
            price: 45,
            image: 'assets/imagen/FresaDurazno.png',
            category: 'Clásicos',
            estado: 'activo',
            destacado: 'no',
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
            estado: 'activo',
            destacado: 'no',
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
            estado: 'activo',
            destacado: 'no',
            gramajes: [
                { gramos: 30, precio: 22 },
                { gramos: 40, precio: 25 },
                { gramos: 50, precio: 30 },
                { gramos: 60, precio: 35 },
                { gramos: 65, precio: 40 }
            ]
        },
        {
            id: '4',
            name: 'FRESAS CON NUTELLA',
            description: 'Capas de fresas, crema y granola con Nutella',
            price: 50,
            image: 'assets/imagen/FresaNutella.png',
            category: 'Especial',
            estado: 'activo',
            destacado: 'no',
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
            estado: 'activo',
            destacado: 'no',
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
            estado: 'activo',
            destacado: 'no',
            gramajes: [
                { gramos: 30, precio: 22 },
                { gramos: 40, precio: 25 },
                { gramos: 50, precio: 30 },
                { gramos: 60, precio: 35 }
            ]
        }
    ];

    // Guardar en localStorage
    saveProductsToStorage();
}

// Función para guardar productos en localStorage
function saveProductsToStorage() {
    localStorage.setItem('fresa_products_db', JSON.stringify(products));
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartBadgeFromStorage();
    loadGramajeSelections();
});

// Render Products - ACTUALIZADO
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Limpiar grid
    grid.innerHTML = '';

    // Filtrar productos activos
    const productosActivos = products.filter(p => p.estado !== 'inactivo');

    // Mostrar cada producto
    productosActivos.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        // Calcular precio base (el más bajo)
        const basePrice = product.gramajes.length > 0
            ? Math.min(...product.gramajes.map(g => g.precio))
            : product.price || 0;

        productCard.innerHTML = `
            <div class="product-image" data-product-id="${product.id}" ondblclick="showGramajeModal('${product.id}')">
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23ec4899%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2224%22 font-weight=%22bold%22%3E🍓%3C/text%3E%3C/svg%3E'">
                <div class="product-category">${product.category}</div>
                <div class="selected-gramaje-badge" id="selectedGramaje${product.id}" style="display: none;"></div>
                ${product.destacado === 'si' ? '<div class="featured-badge" style="position: absolute; top: 8px; left: 8px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.25rem 0.65rem; border-radius: 16px; font-size: 0.7rem; font-weight: 600;">⭐ Destacado</div>' : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div>
                        <span class="product-price" id="productPrice${product.id}">Bs ${basePrice.toFixed(2)}</span>
                        <div class="selected-gramaje-text" id="selectedGramajeText${product.id}" style="font-size: 0.8rem; color: #6b7280; margin-top: 4px;">
                            Desde ${product.gramajes[0]?.gramos || 30}g
                        </div>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        ➕ Agregar
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(productCard);
    });
}

// Función para actualizar productos desde configuración
function updateProductsFromConfig() {
    const storedProducts = JSON.parse(localStorage.getItem('fresa_productos') || '[]');

    // Si no hay productos en configuración, no hacer nada
    if (storedProducts.length === 0) return;

    // Limpiar productos actuales
    products = [];

    // Convertir productos de configuración a formato de productos.js
    storedProducts.forEach((storedProduct, index) => {
        const newProduct = {
            id: storedProduct.id || (index + 1).toString(),
            name: storedProduct.nombre || 'Producto Sin Nombre',
            description: storedProduct.descripcion || '',
            price: storedProduct.gramajes && storedProduct.gramajes.length > 0
                ? Math.min(...storedProduct.gramajes.map(g => g.precio))
                : 0,
            image: storedProduct.imagen || '',
            category: storedProduct.categoria || 'Otros',
            estado: storedProduct.estado || 'activo',
            destacado: storedProduct.destacado === 'si' ? 'si' : 'no',
            gramajes: storedProduct.gramajes || []
        };

        products.push(newProduct);
    });

    saveProductsToStorage();
    renderProducts();
}

// Función para agregar producto desde configuración
function addProductFromConfig(productData) {
    const newProduct = {
        id: (products.length + 1).toString(),
        name: productData.nombre || 'Nuevo Producto',
        description: productData.descripcion || '',
        price: productData.gramajes && productData.gramajes.length > 0
            ? Math.min(...productData.gramajes.map(g => g.precio))
            : 0,
        image: productData.imagen || '',
        category: productData.categoria || 'Otros',
        estado: productData.estado || 'activo',
        destacado: productData.destacado === 'si' ? 'si' : 'no',
        gramajes: productData.gramajes || []
    };

    products.push(newProduct);
    saveProductsToStorage();
    renderProducts();
}

// Función para actualizar producto desde configuración
function updateProductFromConfig(productIndex, productData) {
    if (productIndex >= 0 && productIndex < products.length) {
        products[productIndex] = {
            ...products[productIndex],
            name: productData.nombre || products[productIndex].name,
            description: productData.descripcion || products[productIndex].description,
            category: productData.categoria || products[productIndex].category,
            estado: productData.estado || 'activo',
            destacado: productData.destacado === 'si' ? 'si' : 'no',
            gramajes: productData.gramajes || products[productIndex].gramajes,
            price: productData.gramajes && productData.gramajes.length > 0
                ? Math.min(...productData.gramajes.map(g => g.precio))
                : products[productIndex].price
        };

        saveProductsToStorage();
        renderProducts();
    }
}

// Mostrar gramaje modal - ACTUALIZADO
function showGramajeModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Cerrar modal si ya existe
    const existingModal = document.getElementById('gramajeModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="modal-overlay" id="gramajeModal">
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
                        ${product.gramajes.map(gramaje => `
                            <tr>
                                <td>${gramaje.gramos}g</td>
                                <td>Bs ${gramaje.precio.toFixed(2)}</td>
                                <td>
                                    <button class="gramaje-select-btn" onclick="selectGramaje(${gramaje.gramos}, ${gramaje.precio}, '${productId}')">
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

// Select gramaje
function selectGramaje(gramos, precio, productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Guardar selección en localStorage para persistencia
    const selections = JSON.parse(localStorage.getItem('gramajeSelections') || '{}');
    selections[productId] = { gramos, precio };
    localStorage.setItem('gramajeSelections', JSON.stringify(selections));

    // Actualizar precio en la interfaz
    updateProductDisplay(productId, gramos, precio);

    // Actualizar el precio en el objeto producto
    product.selectedGramaje = { gramos, precio };
    product.price = precio;

    closeGramajeModal();
}

// Update product display
function updateProductDisplay(productId, gramos, precio) {
    const priceElement = document.getElementById(`productPrice${productId}`);
    const gramajeTextElement = document.getElementById(`selectedGramajeText${productId}`);
    const gramajeBadge = document.getElementById(`selectedGramaje${productId}`);

    if (priceElement) {
        priceElement.textContent = `Bs ${precio.toFixed(2)}`;
    }

    if (gramajeTextElement) {
        gramajeTextElement.textContent = `${gramos}g seleccionado`;
    }

    if (gramajeBadge) {
        gramajeBadge.textContent = `${gramos}g`;
        gramajeBadge.style.display = 'block';
    }
}

// Close modal
function closeGramajeModal() {
    const modal = document.getElementById('gramajeModal');
    if (modal) {
        modal.remove();
    }
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Verificar si hay un gramaje seleccionado
    const selections = JSON.parse(localStorage.getItem('gramajeSelections') || '{}');
    const selectedGramaje = selections[productId];

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Usar el precio del gramaje seleccionado o el precio por defecto
    const priceToUse = selectedGramaje ? selectedGramaje.precio : product.price;
    const gramosToUse = selectedGramaje ? selectedGramaje.gramos : null;

    // Buscar si ya existe el mismo producto con el mismo gramaje
    const existingItemIndex = cart.findIndex(item =>
        item.id === productId &&
        item.selectedGramaje?.gramos === gramosToUse
    );

    if (existingItemIndex !== -1) {
        // Incrementar cantidad si existe
        cart[existingItemIndex].quantity++;
    } else {
        // Agregar nuevo item
        cart.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: priceToUse,
            image: product.image,
            quantity: 1,
            selectedGramaje: selectedGramaje || null
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadgeFromStorage();

    // Show feedback
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Agregado';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1000);
}

// Update Cart Badge desde localStorage
function updateCartBadgeFromStorage() {
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

// Cargar selecciones de gramaje al iniciar
function loadGramajeSelections() {
    const selections = JSON.parse(localStorage.getItem('gramajeSelections') || '{}');

    for (const [productId, gramaje] of Object.entries(selections)) {
        updateProductDisplay(productId, gramaje.gramos, gramaje.precio);

        // Actualizar el objeto producto
        const product = products.find(p => p.id === productId);
        if (product) {
            product.selectedGramaje = gramaje;
            product.price = gramaje.precio;
        }
    }
}

// Exportar funciones globalmente
window.updateProductsFromConfig = updateProductsFromConfig;
window.addProductFromConfig = addProductFromConfig;
window.updateProductFromConfig = updateProductFromConfig;
window.addToCart = addToCart;
window.updateCartBadgeFromStorage = updateCartBadgeFromStorage;
window.showGramajeModal = showGramajeModal;
window.selectGramaje = selectGramaje;
window.closeGramajeModal = closeGramajeModal;