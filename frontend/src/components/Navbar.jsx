import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-pink-600">🍓 FresaCremaAntojito</span>
          </div>
          
          <div className="hidden md:flex space-x-6">
            <a href="/" className="text-gray-700 hover:text-pink-600 transition font-medium">Inicio</a>
            <a href="/orders" className="text-gray-700 hover:text-pink-600 transition font-medium">Mis Pedidos</a>
            <a href="/profile" className="text-gray-700 hover:text-pink-600 transition font-medium">Mi Perfil</a>
            <button className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition">
              Salir
            </button>
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              ☰
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <a href="/" className="block text-gray-700 hover:text-pink-600 font-medium">Inicio</a>
            <a href="/orders" className="block text-gray-700 hover:text-pink-600 font-medium">Mis Pedidos</a>
            <a href="/profile" className="block text-gray-700 hover:text-pink-600 font-medium">Mi Perfil</a>
            <button className="w-full bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition">
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
