"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Inicio", href: "#hero" },
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Centralización", href: "#centralizacion" },
  { label: "Done For You", href: "#done-for-you" },
  { label: "Precios", href: "#precios" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Contacto", href: "#contacto" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <motion.a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("#hero");
              }}
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
                alt="Bralto Logo"
                className="h-8 w-auto"
              />
            </motion.a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <motion.a
              href="https://checkout.bralto.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #DB2777 100%)",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.4)",
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 6px 25px rgba(249, 115, 22, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Empezar Ahora
            </motion.a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 lg:hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-2">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {item.label}
                  </motion.a>
                ))}
                <motion.a
                  href="https://checkout.bralto.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 }}
                  className="mt-2 px-4 py-3 text-center text-base font-semibold text-white rounded-lg transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg, #F97316 0%, #DB2777 100%)",
                  }}
                >
                  Empezar Ahora
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
