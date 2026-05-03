import React, { useState } from 'react';

const Orders = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      date: '2026-05-02',
      status: 'Entregado',
      total: 25.50,
      items: 3
    },
    {
      id: 2,
      date: '2026-05-01',
      status: 'En preparación',
      total: 18.90,
      items: 2
    },
    {
      id: 3,
      date: '2026-04-30',
      status: 'Pendiente',
      total: 32.00,
      items: 4
    }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Entregado':
        return 'bg-green-100 text-green-800';
      case 'En preparación':
        return 'bg-blue-100 text-blue-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h2>
        
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pedido #{order.id}</h3>
                    <p className="text-sm text-gray-600 mt-1">Fecha: {order.date}</p>
                    <p className="text-sm text-gray-600">Artículos: {order.items}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">${order.total}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="text-pink-600 hover:text-pink-700 font-medium text-sm">
                    Ver detalles →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">No tienes pedidos aún</p>
              <button className="mt-4 bg-pink-500 text-white font-bold py-2 px-6 rounded-md hover:bg-pink-600 transition">
                Hacer un pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
