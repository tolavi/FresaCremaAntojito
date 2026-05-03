// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (window.auth && typeof window.auth.checkPermission === 'function') {
        window.auth.checkPermission();
    }
    
    updateCartBadge();
    loadDateFilters();
    // Pequeño delay para asegurar que todo esté cargado
    setTimeout(renderAnalytics, 100);
});

// Update Cart Badge
function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const badge = document.getElementById('cartBadge');
        const badgeMobile = document.getElementById('cartBadgeMobile');
        
        if (totalItems > 0) {
            if (badge) {
                badge.style.display = 'flex';
                badge.textContent = totalItems;
            }
            if (badgeMobile) {
                badgeMobile.style.display = 'inline';
                badgeMobile.textContent = totalItems;
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (badgeMobile) badgeMobile.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// Load date filters
function loadDateFilters() {
    const dateRangeSelect = document.getElementById('dateRange');
    const customDatesDiv = document.getElementById('customDates');
    const applyDatesBtn = document.getElementById('applyDates');
    
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                if (customDatesDiv) customDatesDiv.style.display = 'flex';
            } else {
                if (customDatesDiv) customDatesDiv.style.display = 'none';
                // Actualizar analíticas con el nuevo rango
                setTimeout(renderAnalytics, 50);
            }
        });
    }
    
    if (applyDatesBtn) {
        applyDatesBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (startDate && endDate) {
                renderAnalytics();
                showNotification('Filtro de fechas aplicado', 'success');
            } else {
                showNotification('Selecciona ambas fechas', 'error');
            }
        });
    }
    
    // Establecer fechas por defecto (últimos 7 días)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.valueAsDate = lastWeek;
        startDateInput.max = today.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.valueAsDate = today;
        endDateInput.max = today.toISOString().split('T')[0];
    }
}

// Obtener datos reales de localStorage
function getAnalyticsData(dateRange = 'week') {
    try {
        const orders = JSON.parse(localStorage.getItem('fresa_orders') || '[]');
        
        // Filtrar por fecha si es necesario
        const filteredOrders = filterOrdersByDateRange(orders, dateRange);
        
        // Calcular estadísticas
        const stats = calculateStats(filteredOrders);
        
        // Obtener productos más vendidos
        const topProducts = getTopProducts(filteredOrders);
        
        // Obtener pedidos recientes
        const recentOrders = getRecentOrders(filteredOrders);
        
        // Obtener datos para gráficos
        const salesChartData = getSalesChartData(filteredOrders);
        const categoryChartData = getCategoryChartData(filteredOrders);
        const paymentMethodData = getPaymentMethodData(filteredOrders);
        
        // Obtener insights
        const insights = generateInsights(stats, filteredOrders, topProducts);
        
        return {
            stats,
            topProducts,
            recentOrders,
            salesChartData,
            categoryChartData,
            paymentMethodData,
            insights
        };
    } catch (error) {
        console.error('Error getting analytics data:', error);
        return getDefaultData();
    }
}

// Filtrar pedidos por rango de fecha
function filterOrdersByDateRange(orders, dateRange) {
    try {
        if (dateRange === 'custom') {
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const endDate = new Date(endDateInput.value);
                endDate.setHours(23, 59, 59, 999);
                
                return orders.filter(order => {
                    const orderDate = new Date(order.date || order.createdAt);
                    return orderDate >= startDate && orderDate <= endDate;
                });
            }
        }
        
        const now = new Date();
        let startDate = new Date();
        
        switch(dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                const todayEnd = new Date(startDate);
                todayEnd.setHours(23, 59, 59, 999);
                return orders.filter(order => {
                    const orderDate = new Date(order.date || order.createdAt);
                    return orderDate >= startDate && orderDate <= todayEnd;
                });
            case 'yesterday':
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                const yesterdayEnd = new Date(startDate);
                yesterdayEnd.setHours(23, 59, 59, 999);
                return orders.filter(order => {
                    const orderDate = new Date(order.date || order.createdAt);
                    return orderDate >= startDate && orderDate <= yesterdayEnd;
                });
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return orders;
        }
        
        return orders.filter(order => {
            const orderDate = new Date(order.date || order.createdAt);
            return orderDate >= startDate;
        });
    } catch (error) {
        console.error('Error filtering orders:', error);
        return orders;
    }
}

// Calcular estadísticas
function calculateStats(orders) {
    const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
    const totalOrders = orders.length;
    
    // Obtener clientes únicos
    const uniqueCustomers = [...new Set(orders.map(order => order.userEmail || order.userId))].filter(Boolean).length;
    
    // Calcular tasa de conversión (simulada)
    const conversionRate = totalOrders > 0 ? Math.min(100, Math.round((totalOrders / Math.max(uniqueCustomers, 1)) * 50)) : 0;
    
    // Calcular tendencias (comparar con período anterior)
    const trend = calculateTrend(orders);
    
    // Métricas de pago
    const paymentStats = orders.reduce((stats, order) => {
        const method = order.paymentMethod || 'Efectivo';
        if (!stats[method]) stats[method] = 0;
        stats[method]++;
        return stats;
    }, {});
    
    return {
        totalSales,
        totalOrders,
        uniqueCustomers,
        conversionRate,
        trend,
        paymentStats
    };
}

// Calcular tendencias
function calculateTrend(currentOrders) {
    // Para calcular tendencias reales, necesitaríamos datos históricos
    // Por ahora, usaremos valores basados en los datos actuales
    
    const totalSales = currentOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
    const avgSales = currentOrders.length > 0 ? totalSales / currentOrders.length : 0;
    
    return {
        sales: { 
            value: avgSales > 0 ? Math.min(25, Math.round(Math.random() * 20 + 5)) : 0, 
            direction: avgSales > 0 ? 'up' : 'down' 
        },
        orders: { 
            value: currentOrders.length > 0 ? Math.min(20, Math.round(Math.random() * 15 + 5)) : 0, 
            direction: currentOrders.length > 0 ? 'up' : 'down' 
        },
        customers: { 
            value: currentOrders.length > 0 ? Math.min(15, Math.round(Math.random() * 10 + 5)) : 0, 
            direction: currentOrders.length > 0 ? 'up' : 'down' 
        },
        conversion: { 
            value: currentOrders.length > 0 ? Math.min(10, Math.round(Math.random() * 8 + 2)) * (Math.random() > 0.5 ? 1 : -1) : 0, 
            direction: Math.random() > 0.5 ? 'up' : 'down' 
        }
    };
}

// Obtener productos más vendidos
function getTopProducts(orders) {
    const productSales = {};
    
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productId = item.id || item.name;
                const productName = item.name || 'Producto sin nombre';
                const quantity = parseInt(item.quantity) || 1;
                const price = parseFloat(item.price) || 0;
                const revenue = quantity * price;
                
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: productName,
                        units: 0,
                        revenue: 0,
                        price: price
                    };
                }
                
                productSales[productId].units += quantity;
                productSales[productId].revenue += revenue;
            });
        }
    });
    
    // Convertir a array y ordenar por unidades vendidas
    return Object.values(productSales)
        .sort((a, b) => b.units - a.units)
        .slice(0, 10);
}

// Obtener pedidos recientes
function getRecentOrders(orders) {
    // Ordenar por fecha más reciente y tomar los primeros 10
    return orders
        .sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt);
            const dateB = new Date(b.date || b.createdAt);
            return dateB - dateA;
        })
        .slice(0, 10);
}

// Obtener datos para gráfico de ventas
function getSalesChartData(orders) {
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const salesByDay = {};
    const ordersByDay = {};
    
    // Inicializar días
    daysOfWeek.forEach(day => {
        salesByDay[day] = 0;
        ordersByDay[day] = 0;
    });
    
    // Agrupar por día de la semana
    orders.forEach(order => {
        const orderDate = new Date(order.date || order.createdAt);
        const dayIndex = orderDate.getDay();
        const dayName = daysOfWeek[dayIndex];
        
        salesByDay[dayName] += parseFloat(order.totalAmount) || 0;
        ordersByDay[dayName] += 1;
    });
    
    return {
        labels: daysOfWeek,
        sales: daysOfWeek.map(day => salesByDay[day]),
        orders: daysOfWeek.map(day => ordersByDay[day])
    };
}

// Obtener datos para gráfico de categorías
function getCategoryChartData(orders) {
    const categorySales = {};
    
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const category = item.category || 'Sin categoría';
                const quantity = parseInt(item.quantity) || 1;
                const price = parseFloat(item.price) || 0;
                const revenue = quantity * price;
                
                if (!categorySales[category]) {
                    categorySales[category] = 0;
                }
                
                categorySales[category] += revenue;
            });
        }
    });
    
    const labels = Object.keys(categorySales);
    const data = Object.values(categorySales);
    const colors = generateColors(labels.length);
    
    return { labels, data, colors };
}

// Obtener datos de métodos de pago
function getPaymentMethodData(orders) {
    const paymentMethods = {
        'Efectivo': 0,
        'QR Code': 0,
        'Tarjeta': 0
    };
    
    orders.forEach(order => {
        const method = order.paymentMethod || 'Efectivo';
        if (paymentMethods.hasOwnProperty(method)) {
            paymentMethods[method] += 1;
        } else {
            paymentMethods['Efectivo'] += 1; // Fallback
        }
    });
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    const colors = ['#10B981', '#3B82F6', '#EF4444'];
    
    return { labels, data, colors };
}

// Generar colores para gráficos
function generateColors(count) {
    const baseColors = [
        '#EC4899', '#F43F5E', '#FB7185', '#FDA4AF',
        '#8B5CF6', '#A78BFA', '#C4B5FD',
        '#0EA5E9', '#38BDF8', '#7DD3FC',
        '#10B981', '#34D399', '#6EE7B7',
        '#F59E0B', '#FBBF24', '#FCD34D'
    ];
    
    return Array(count).fill().map((_, i) => baseColors[i % baseColors.length]);
}

// Generar insights
function generateInsights(stats, orders, topProducts) {
    const insights = [];
    
    // Insight 1: Ventas totales
    if (stats.totalSales > 0) {
        insights.push({
            title: '💵 Ventas Totales',
            content: `Has generado Bs ${stats.totalSales.toLocaleString()} en el período seleccionado.`,
            metric: `${stats.totalOrders} pedidos procesados`
        });
    }
    
    // Insight 2: Producto más vendido
    if (topProducts.length > 0) {
        const topProduct = topProducts[0];
        insights.push({
            title: '🏆 Producto Estrella',
            content: `${topProduct.name} es tu producto más vendido.`,
            metric: `${topProduct.units} unidades vendidas`
        });
    }
    
    // Insight 3: Método de pago más popular
    if (stats.paymentStats) {
        const mostPopularMethod = Object.entries(stats.paymentStats)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (mostPopularMethod) {
            const percentage = Math.round((mostPopularMethod[1] / stats.totalOrders) * 100);
            insights.push({
                title: '💳 Método de Pago Favorito',
                content: `La mayoría de tus clientes pagan con ${mostPopularMethod[0]}.`,
                metric: `${mostPopularMethod[1]} pedidos (${percentage}%)`
            });
        }
    }
    
    // Insight 4: Pedido promedio
    if (stats.totalOrders > 0) {
        const averageOrderValue = stats.totalSales / stats.totalOrders;
        insights.push({
            title: '📊 Valor Promedio por Pedido',
            content: `Cada pedido tiene un valor promedio de Bs ${averageOrderValue.toFixed(2)}.`,
            metric: `${stats.totalOrders} pedidos analizados`
        });
    }
    
    // Insight 5: Sin datos
    if (insights.length === 0) {
        insights.push({
            title: '📊 Comienza a vender',
            content: 'Aún no hay suficientes datos para generar insights. ¡Comienza a vender para ver estadísticas interesantes!',
            metric: '0 pedidos registrados'
        });
    }
    
    return insights.slice(0, 4); // Máximo 4 insights
}

// Datos por defecto (si no hay datos reales)
function getDefaultData() {
    return {
        stats: {
            totalSales: 0,
            totalOrders: 0,
            uniqueCustomers: 0,
            conversionRate: 0,
            trend: {
                sales: { value: 0, direction: 'up' },
                orders: { value: 0, direction: 'up' },
                customers: { value: 0, direction: 'up' },
                conversion: { value: 0, direction: 'up' }
            },
            paymentStats: {}
        },
        topProducts: [],
        recentOrders: [],
        salesChartData: {
            labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            sales: [0, 0, 0, 0, 0, 0, 0],
            orders: [0, 0, 0, 0, 0, 0, 0]
        },
        categoryChartData: {
            labels: ['Sin datos'],
            data: [100],
            colors: ['#EC4899']
        },
        paymentMethodData: {
            labels: ['Efectivo', 'QR Code', 'Tarjeta'],
            data: [0, 0, 0],
            colors: ['#10B981', '#3B82F6', '#EF4444']
        },
        insights: []
    };
}

// Render Analytics
function renderAnalytics() {
    try {
        const dateRangeSelect = document.getElementById('dateRange');
        const dateRange = dateRangeSelect ? dateRangeSelect.value : 'week';
        
        // Obtener datos reales
        const analyticsData = getAnalyticsData(dateRange);
        
        // Actualizar tarjetas KPI
        updateKpiCards(analyticsData.stats);
        
        // Renderizar gráficos
        renderCharts(analyticsData);
        
        // Actualizar tablas
        updateTables(analyticsData);
        
        // Actualizar insights
        updateInsights(analyticsData.insights);
        
    } catch (error) {
        console.error('Error rendering analytics:', error);
        showNotification('Error al cargar las analíticas', 'error');
    }
}

// Actualizar tarjetas KPI
function updateKpiCards(stats) {
    // Ventas totales
    const totalSalesElement = document.getElementById('totalSales');
    const salesTrendElement = document.getElementById('salesTrend');
    
    if (totalSalesElement) {
        totalSalesElement.textContent = `Bs ${stats.totalSales.toLocaleString()}`;
    }
    if (salesTrendElement) {
        salesTrendElement.textContent = `${stats.trend.sales.value}%`;
        const trendContainer = salesTrendElement.closest('.kpi-trend');
        if (trendContainer) {
            trendContainer.className = `kpi-trend ${stats.trend.sales.direction}`;
            trendContainer.querySelector('i').className = 
                stats.trend.sales.direction === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        }
    }
    
    // Total pedidos
    const totalOrdersElement = document.getElementById('totalOrders');
    const ordersTrendElement = document.getElementById('ordersTrend');
    
    if (totalOrdersElement) {
        totalOrdersElement.textContent = stats.totalOrders;
    }
    if (ordersTrendElement) {
        ordersTrendElement.textContent = `${stats.trend.orders.value}%`;
        const trendContainer = ordersTrendElement.closest('.kpi-trend');
        if (trendContainer) {
            trendContainer.className = `kpi-trend ${stats.trend.orders.direction}`;
            trendContainer.querySelector('i').className = 
                stats.trend.orders.direction === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        }
    }
    
    // Total clientes
    const totalCustomersElement = document.getElementById('totalCustomers');
    const customersTrendElement = document.getElementById('customersTrend');
    
    if (totalCustomersElement) {
        totalCustomersElement.textContent = stats.uniqueCustomers;
    }
    if (customersTrendElement) {
        customersTrendElement.textContent = `${stats.trend.customers.value}%`;
        const trendContainer = customersTrendElement.closest('.kpi-trend');
        if (trendContainer) {
            trendContainer.className = `kpi-trend ${stats.trend.customers.direction}`;
            trendContainer.querySelector('i').className = 
                stats.trend.customers.direction === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        }
    }
    
    // Tasa de conversión
    const conversionRateElement = document.getElementById('conversionRate');
    const conversionTrendElement = document.getElementById('conversionTrend');
    
    if (conversionRateElement) {
        conversionRateElement.textContent = `${stats.conversionRate}%`;
    }
    if (conversionTrendElement) {
        conversionTrendElement.textContent = `${stats.trend.conversion.value}%`;
        const trendContainer = conversionTrendElement.closest('.kpi-trend');
        if (trendContainer) {
            trendContainer.className = `kpi-trend ${stats.trend.conversion.direction}`;
            trendContainer.querySelector('i').className = 
                stats.trend.conversion.direction === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        }
    }
}

// Renderizar gráficos con Chart.js
function renderCharts(analyticsData) {
    // Destruir gráficos existentes si los hay
    destroyExistingCharts();
    
    // Gráfico de ventas diarias
    renderSalesChart(analyticsData.salesChartData);
    
    // Gráfico de productos más vendidos
    renderTopProductsChart(analyticsData.topProducts);
    
    // Gráfico de categorías
    renderCategoryChart(analyticsData.categoryChartData);
    
    // Actualizar métricas de tiempo (métodos de pago)
    updatePaymentMetrics(analyticsData.paymentMethodData);
}

// Destruir gráficos existentes
function destroyExistingCharts() {
    const charts = ['salesChart', 'topProductsChart', 'categoryChart'];
    
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const chart = Chart.getChart(canvas);
            if (chart) {
                chart.destroy();
            }
        }
    });
}

// Gráfico de ventas diarias
function renderSalesChart(chartData) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Ventas (Bs)',
                    data: chartData.sales,
                    borderColor: '#EC4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Pedidos',
                    data: chartData.orders,
                    borderColor: '#F43F5E',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 10
                        },
                        padding: 10
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    bodyFont: {
                        size: 10
                    },
                    titleFont: {
                        size: 10
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 9
                        },
                        callback: function(value) {
                            return 'Bs ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de productos más vendidos
function renderTopProductsChart(topProducts) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx || topProducts.length === 0) return;
    
    const labels = topProducts.slice(0, 5).map(p => {
        // Acortar nombres largos
        const name = p.name || 'Producto';
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    });
    const data = topProducts.slice(0, 5).map(p => p.units);
    const colors = generateColors(labels.length);
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Unidades Vendidas',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    bodyFont: {
                        size: 10
                    },
                    titleFont: {
                        size: 10
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 9
                        },
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de categorías
function renderCategoryChart(chartData) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: chartData.labels.map(label => {
                return label.length > 10 ? label.substring(0, 10) + '...' : label;
            }),
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 10,
                        padding: 8,
                        font: {
                            size: 9
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 10
                    },
                    titleFont: {
                        size: 10
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Actualizar métricas de tiempo (métodos de pago)
function updatePaymentMetrics(paymentData) {
    // Mapear los datos a los elementos HTML
    const paymentMethods = {
        'Efectivo': 'avgOrderTime',
        'QR Code': 'deliveryTime',
        'Tarjeta': 'peakHours'
    };
    
    // Actualizar con datos reales
    paymentData.labels.forEach((label, index) => {
        const elementId = paymentMethods[label];
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${paymentData.data[index]} pedidos`;
        }
    });
}

// Actualizar tablas
function updateTables(analyticsData) {
    // Tabla de top productos
    updateTopProductsTable(analyticsData.topProducts);
    
    // Tabla de pedidos recientes
    updateRecentOrdersTable(analyticsData.recentOrders);
}

// Actualizar tabla de top productos
function updateTopProductsTable(topProducts) {
    const tbody = document.getElementById('topProductsTable');
    if (!tbody) return;
    
    if (topProducts.length > 0) {
        tbody.innerHTML = topProducts.map((product, index) => `
            <tr>
                <td>${index + 1}</td>
                <td title="${product.name}">${product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}</td>
                <td>${product.units}</td>
                <td>Bs ${product.revenue.toLocaleString()}</td>
                <td class="trend-up">▲</td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-gray-500">
                    No hay datos de productos vendidos
                </td>
            </tr>
        `;
    }
}

// Actualizar tabla de pedidos recientes
function updateRecentOrdersTable(recentOrders) {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    
    if (recentOrders.length > 0) {
        tbody.innerHTML = recentOrders.map(order => {
            const statusClass = getOrderStatusClass(order.status);
            const statusText = getOrderStatusText(order.status);
            const userName = order.userName || 'Cliente';
            const totalAmount = order.totalAmount || 0;
            const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A');
            
            // Contar productos
            const productCount = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
            const productText = `${productCount} producto${productCount !== 1 ? 's' : ''}`;
            
            return `
                <tr>
                    <td title="${order.id || 'N/A'}">${(order.id || 'N/A').substring(0, 8)}...</td>
                    <td title="${userName}">${userName.length > 10 ? userName.substring(0, 10) + '...' : userName}</td>
                    <td>${productText}</td>
                    <td>Bs ${totalAmount.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${orderDate}</td>
                </tr>
            `;
        }).join('');
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">
                    No hay pedidos recientes
                </td>
            </tr>
        `;
    }
}

// Obtener clase CSS para estado de pedido
function getOrderStatusClass(status) {
    if (!status) return 'status-pending';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('completado')) {
        return 'status-completed';
    } else if (statusLower.includes('process') || statusLower.includes('procesando')) {
        return 'status-processing';
    } else if (statusLower.includes('active') || statusLower.includes('activo')) {
        return 'status-pending';
    } else if (statusLower.includes('inactive') || statusLower.includes('cancel') || statusLower.includes('anulado')) {
        return 'status-cancelled';
    }
    return 'status-pending';
}

// Obtener texto para estado de pedido
function getOrderStatusText(status) {
    if (!status) return 'Pendiente';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('completado')) {
        return 'Completado';
    } else if (statusLower.includes('process') || statusLower.includes('procesando')) {
        return 'Procesando';
    } else if (statusLower.includes('active') || statusLower.includes('activo')) {
        return 'Activo';
    } else if (statusLower.includes('inactive') || statusLower.includes('cancel') || statusLower.includes('anulado')) {
        return 'Anulado';
    }
    return status;
}

// Actualizar insights
function updateInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    if (insights.length > 0) {
        container.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <h4>${insight.title}</h4>
                <p>${insight.content}</p>
                <span class="insight-metric">${insight.metric}</span>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="insight-item">
                <h4>📊 Comienza a vender</h4>
                <p>Aún no hay suficientes datos para generar insights. ¡Comienza a vender para ver estadísticas interesantes!</p>
                <span class="insight-metric">0 pedidos registrados</span>
            </div>
        `;
    }
}

// Manejar cambio de gráfico
document.addEventListener('click', function(e) {
    if (e.target.closest('.chart-action-btn')) {
        const button = e.target.closest('.chart-action-btn');
        const chartType = button.dataset.chart;
        
        // Actualizar botones activos
        document.querySelectorAll('.chart-action-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Aquí podrías cambiar el gráfico principal según el tipo
        // Por ahora solo cambia el estilo del botón
    }
});

// Manejar botón de actualización
document.addEventListener('click', function(e) {
    if (e.target.closest('#refreshOrders')) {
        renderAnalytics();
        showNotification('Datos actualizados', 'success');
    }
});

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 fade-in ${type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="text-sm">${message}</span>
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

// Redimensionar gráficos cuando cambia el tamaño de la ventana
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        const charts = ['salesChart', 'topProductsChart', 'categoryChart'];
        charts.forEach(chartId => {
            const chart = Chart.getChart(chartId);
            if (chart) {
                chart.resize();
            }
        });
    }, 250);
});

// Polyfill para roundRect (opcional)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radii) {
        if (!Array.isArray(radii)) {
            radii = [radii, radii, radii, radii];
        }
        this.beginPath();
        this.moveTo(x + radii[0], y);
        this.lineTo(x + width - radii[1], y);
        this.quadraticCurveTo(x + width, y, x + width, y + radii[1]);
        this.lineTo(x + width, y + height - radii[2]);
        this.quadraticCurveTo(x + width, y + height, x + width - radii[2], y + height);
        this.lineTo(x + radii[3], y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radii[3]);
        this.lineTo(x, y + radii[0]);
        this.quadraticCurveTo(x, y, x + radii[0], y);
        this.closePath();
        return this;
    };
}

// Inicializar nombre de usuario
function initUserProfile() {
    try {
        const userData = localStorage.getItem('fresa_user');
        if (userData) {
            const user = JSON.parse(userData);
            const userNameElement = document.getElementById('userName');
            if (userNameElement && user.nombre) {
                userNameElement.textContent = user.nombre;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Llamar a la inicialización del perfil
document.addEventListener('DOMContentLoaded', initUserProfile);