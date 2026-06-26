"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="w-full px-8 py-6 flex items-center justify-between z-50 relative">
        <Link href="/" className="font-heading font-bold text-xl tracking-[0.3em] flex items-center gap-1">
          ZENITH<span className="text-xs absolute -top-1 -right-3">®</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-12">
          <Link href="/" className="nav-link">HOME</Link>
          <Link href="/location" className="nav-link">LOCATIONS</Link>
          <Link href="/dashboard" className="nav-link">TRACKING</Link>
          <Link href="/manage" className="nav-link">MANAGE</Link>
        </nav>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-ice-blue transition-colors md:hidden relative z-[60]"
          aria-label="Toggle mobile menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-space-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex flex-col items-center gap-8 text-2xl font-heading tracking-widest">
          <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-ice-blue transition-colors">HOME</Link>
          <Link href="/location" onClick={() => setIsOpen(false)} className="hover:text-ice-blue transition-colors">LOCATIONS</Link>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="hover:text-ice-blue transition-colors">TRACKING</Link>
          <Link href="/manage" onClick={() => setIsOpen(false)} className="hover:text-ice-blue transition-colors">MANAGE</Link>
        </nav>
      </div>
    </>
  );
}
