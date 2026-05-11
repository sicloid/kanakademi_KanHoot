"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, MonitorPlay, Trophy, BarChart3, Smile, Infinity, Zap, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 overflow-hidden relative flex flex-col">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1368ce] rounded-full blur-[120px] opacity-10 -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#fd3e04] rounded-full blur-[150px] opacity-10 -z-10 -translate-x-1/2 translate-y-1/3"></div>
      {/* Dotted pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:32px_32px] opacity-40 -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 w-full">
        
        {/* Left Content */}
        <div className="flex-1 text-center md:text-left z-10 w-full mt-8 md:mt-0">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start gap-4 mb-6"
          >
            <img 
              src="https://kanakademi.com.tr/wp-content/uploads/2024/08/kanakademi-logo.png" 
              alt="Kan Akademi" 
              className="h-28 md:h-36 object-contain drop-shadow-md" 
            />
            <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tight leading-none">
              <span className="text-[#fd3e04]">Kan</span><span className="text-[#1368ce]">hoot</span>
            </h1>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-6">
              <span className="text-[#fd3e04]">Eğlenceli. </span>
              <span className="text-[#1368ce]">Etkileşimli. Öğretici.</span>
            </h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed">
              Kanhoot, öğrenmeyi eğlenceli bir oyuna dönüştüren etkileşimli bir bilgi yarışması platformudur.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left mb-12">
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#fd3e04]/10 text-[#fd3e04] rounded-2xl"><Users size={28} /></div>
                <h3 className="font-bold text-gray-900">Canlı Katılım</h3>
                <p className="text-sm text-gray-500">Gerçek zamanlı oyun deneyimi</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#1368ce]/10 text-[#1368ce] rounded-2xl"><MonitorPlay size={28} /></div>
                <h3 className="font-bold text-gray-900">Kolay Kullanım</h3>
                <p className="text-sm text-gray-500">Sorularını oluştur, oyununu başlat</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#fd3e04]/10 text-[#fd3e04] rounded-2xl"><Trophy size={28} /></div>
                <h3 className="font-bold text-gray-900">Rekabet & Eğlence</h3>
                <p className="text-sm text-gray-500">Puan topla, liderlik tablosunda yerini al</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#1368ce]/10 text-[#1368ce] rounded-2xl"><BarChart3 size={28} /></div>
                <h3 className="font-bold text-gray-900">Raporlama</h3>
                <p className="text-sm text-gray-500">Detaylı sonuçlarla performansı takip et</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Content (Join Box) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-white rounded-3xl shadow-2xl shadow-[#1368ce]/10 border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#fd3e04] to-[#1368ce]"></div>
            
            <h3 className="text-3xl font-black text-center text-[#0B1B3D] mb-8">Hemen Başla</h3>
            
            <div className="space-y-4 w-full">
              <Link href="/play" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#fd3e04] to-[#ff6b3d] text-white text-2xl font-black py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  Oyuna Katıl!
                </motion.button>
              </Link>

              <div className="relative py-6 flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">VEYA</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <Link href="/admin" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white border-2 border-[#1368ce] text-[#1368ce] hover:bg-[#1368ce] hover:text-white text-lg font-bold py-4 rounded-2xl transition-colors"
                >
                  Admin Paneli
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient Bar */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full mt-auto"
      >
        <div className="bg-gradient-to-r from-[#fd3e04] to-[#1368ce] text-white py-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <Smile size={36} className="text-white/90" />
              <div>
                <div className="font-bold text-2xl">%100</div>
                <div className="text-sm text-white/90 font-medium">Eğlenceli</div>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <Infinity size={36} className="text-white/90" />
              <div>
                <div className="font-bold text-2xl">Sınırsız</div>
                <div className="text-sm text-white/90 font-medium">Oyuncu Katılımı</div>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <Zap size={36} className="text-white/90" />
              <div>
                <div className="font-bold text-2xl">Anında</div>
                <div className="text-sm text-white/90 font-medium">Geri Bildirim</div>
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <Star size={36} className="text-white/90" />
              <div>
                <div className="font-bold text-2xl">Etkili</div>
                <div className="text-sm text-white/90 font-medium">Öğrenme Deneyimi</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Footer */}
      <div className="py-4 text-center text-gray-500 font-medium text-sm z-10 bg-white">
        &copy; {new Date().getFullYear()} Kan Akademi. Tüm hakları saklıdır. | Created by sicloid
      </div>
    </div>
  );
}
