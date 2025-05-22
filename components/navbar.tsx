'use client'
import { useState } from 'react';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                <div className="text-xl font-bold text-indigo-600">GoodMarketing</div>

                {/* Desktop nav */}
                <nav className="hidden md:flex space-x-6">
                    <a href="#" className="text-gray-600 hover:text-indigo-600">Home</a>
                    <a href="#" className="text-gray-600 hover:text-indigo-600">Features</a>
                    <a href="#" className="text-gray-600 hover:text-indigo-600">Pricing</a>
                    <a href="#" className="text-gray-600 hover:text-indigo-600">Contact</a>
                </nav>

                {/* Mobile menu button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-gray-600 hover:text-indigo-600 focus:outline-none"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"
                         viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile nav dropdown */}
            {isOpen && (
                <div className="md:hidden px-4 pb-4 space-y-2">
                    <a href="#" className="block text-gray-600 hover:text-indigo-600">Home</a>
                    <a href="#" className="block text-gray-600 hover:text-indigo-600">Features</a>
                    <a href="#" className="block text-gray-600 hover:text-indigo-600">Pricing</a>
                    <a href="#" className="block text-gray-600 hover:text-indigo-600">Contact</a>
                </div>
            )}
        </header>
    );
}