"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, MonitorPlay, Trophy, BarChart3, Smile, Infinity, Zap, Star, Moon, Sun } from "lucide-react";

// tema seçimi kanakademi.com.tr ile ortak: .kanakademi.com.tr çerezinde (alt alan adları arası)
function temaDegistir() {
  const yeni = document.documentElement.dataset.tema === "koyu" ? "acik" : "koyu";
  document.documentElement.dataset.tema = yeni;
  const alan = location.hostname.endsWith("kanakademi.com.tr") ? "; domain=.kanakademi.com.tr" : "";
  document.cookie = `kk-tema=${yeni}; path=/; max-age=31536000; SameSite=Lax${alan}`;
}

export default function LandingPage() {
  return (
    <div className="kk-zemin min-h-screen font-sans text-gray-800 dark:text-gray-100 overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={temaDegistir}
        aria-label="Koyu temayı aç/kapat"
        title="Tema"
        className="absolute top-4 right-4 z-20 grid place-items-center w-10 h-10 rounded-full text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Moon size={20} className="dark:hidden" />
        <Sun size={20} className="hidden dark:block" />
      </button>

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
              src="/kan-akademi-logo.png" 
              alt="Kan Akademi" 
              className="h-28 md:h-36 object-contain drop-shadow-md" 
            />
            <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tight leading-none">
              <span className="text-[#e3262f]">Kan</span><span className="text-[#1ba6df]">hoot</span>
            </h1>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-6">
              <span className="text-[#e3262f]">Eğlenceli. </span>
              <span className="bg-gradient-to-r from-[#9b3bb5] to-[#1ba6df] bg-clip-text text-transparent">Etkileşimli. Öğretici.</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed">
              Kanhoot, öğrenmeyi eğlenceli bir oyuna dönüştüren etkileşimli bir bilgi yarışması platformudur.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left mb-12">
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#e3262f]/10 text-[#e3262f] rounded-2xl"><Users size={28} /></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Canlı Katılım</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">Gerçek zamanlı oyun deneyimi</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#1ba6df]/10 text-[#1ba6df] rounded-2xl"><MonitorPlay size={28} /></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Kolay Kullanım</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">Sorularını oluştur, oyununu başlat</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#e3262f]/10 text-[#e3262f] rounded-2xl"><Trophy size={28} /></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Rekabet & Eğlence</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">Puan topla, liderlik tablosunda yerini al</p>
              </div>
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="p-3 bg-[#1ba6df]/10 text-[#1ba6df] rounded-2xl"><BarChart3 size={28} /></div>
                <h3 className="font-bold text-gray-900 dark:text-white">Raporlama</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">Detaylı sonuçlarla performansı takip et</p>
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
          <div className="bg-white dark:bg-[#1b1546] rounded-3xl shadow-2xl shadow-[#9b3bb5]/15 border border-gray-100 dark:border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#e3262f] via-[#9b3bb5] to-[#1ba6df]"></div>
            
            <h3 className="text-3xl font-black text-center text-[#0e0a2e] dark:text-white mb-8">Hemen Başla</h3>
            
            <div className="space-y-4 w-full">
              <Link href="/play" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#e3262f] to-[#9b3bb5] text-white text-2xl font-black py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  Oyuna Katıl!
                </motion.button>
              </Link>

              <div className="relative py-6 flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-white/15"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-300 font-medium text-sm">VEYA</span>
                <div className="flex-grow border-t border-gray-200 dark:border-white/15"></div>
              </div>

              <Link href="/admin" className="block w-full">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-transparent border-2 border-[#1ba6df] text-[#1268a8] dark:text-[#5ccdf5] hover:bg-[#1ba6df] hover:text-white text-lg font-bold py-4 rounded-2xl transition-colors"
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
        <div className="bg-gradient-to-r from-[#e3262f] via-[#9b3bb5] to-[#1ba6df] text-white py-8">
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
      <div className="py-4 text-center text-gray-500 dark:text-gray-300 font-medium text-sm z-10 bg-white dark:bg-[#0e0a2e]">
        &copy; {new Date().getFullYear()} Kan Akademi. Tüm hakları saklıdır. | Created by sicloid
      </div>
    </div>
  );
}
