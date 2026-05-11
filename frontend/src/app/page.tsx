"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f2f2f2] text-center overflow-hidden relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#0B1B3D] skew-y-3 origin-top-left -z-10 shadow-lg"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#fd3e04] rounded-full blur-3xl opacity-20 -z-10 translate-x-1/2 translate-y-1/2"></div>
      
      {/* Header & Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-8 flex justify-center mt-12"
      >
        <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-b-4 border-[#fd3e04]">
          <img 
            src="https://kanakademi.com.tr/wp-content/uploads/2024/08/cropped-kanakademi-logo.png" 
            alt="Kan Akademi" 
            className="h-20 object-contain" 
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full z-10"
        >
          <h1 className="text-5xl font-black text-[#0B1B3D] mb-2 tracking-tight">KANHOOT</h1>
          <p className="text-gray-500 font-medium mb-10 text-lg">Eğlenerek Öğrenmenin Yeni Yolu</p>

          <div className="space-y-4 w-full">
            <Link href="/play" className="block w-full">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#fd3e04] hover:bg-[#d23100] text-white text-2xl font-black py-5 rounded-xl shadow-[0_6px_0_0_#b8122d] transition-colors relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                Oyuna Katıl
              </motion.button>
            </Link>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Link href="/admin" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-[#0B1B3D] hover:bg-[#1a2e5a] text-white text-lg font-bold py-4 rounded-xl shadow-[0_4px_0_0_#051024] transition-colors"
                >
                  Admin Paneli
                </motion.button>
              </Link>
              
              <Link href="/host" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-white text-[#0B1B3D] border-2 border-[#0B1B3D] text-lg font-bold py-4 rounded-xl shadow-[0_4px_0_0_#0B1B3D] hover:bg-gray-50 transition-colors"
                >
                  Host Ekranı
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="py-6 text-gray-500 font-medium text-sm z-10 bg-white/50 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} Kan Akademi. Tüm hakları saklıdır.
      </div>
    </div>
  );
}
