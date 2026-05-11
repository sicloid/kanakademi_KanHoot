"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KanhootBuilder from "@/components/KanhootBuilder";

type KanhootQuiz = {
  id: string;
  title: string;
  questions: any[];
};

type GameStat = {
  game_id: string;
  date: string;
  leaderboard: any[];
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"library" | "stats" | "builder">("library");
  const [library, setLibrary] = useState<KanhootQuiz[]>([]);
  const [stats, setStats] = useState<GameStat[]>([]);
  
  const [editingQuiz, setEditingQuiz] = useState<KanhootQuiz | undefined>(undefined);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://188.132.232.104:8080";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Kanakademi2026" || password === "K2026") {
      setIsAuthenticated(true);
      fetchLibrary();
      fetchStats();
    } else {
      alert("Yanlış şifre!");
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`/api/kanhoots`, {
        headers: { "X-Admin-Key": "K2026" } // or password if it's dynamic
      });
      const data = await res.json();
      if (!data.error) setLibrary(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`, {
        headers: { "X-Admin-Key": password }
      });
      const data = await res.json();
      if (!data.error) setStats(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const startGameFromLibrary = (quiz: KanhootQuiz) => {
    localStorage.setItem("pendingQuiz", JSON.stringify(quiz.questions));
    window.open("/", "_blank");
  };

  const handleEdit = (quiz: KanhootQuiz) => {
    setEditingQuiz(quiz);
    setActiveTab("builder");
  };

  const openBuilderNew = () => {
    setEditingQuiz(undefined);
    setActiveTab("builder");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #fd3e04 100%)" }}>
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full border-t-8 border-[#0B1B3D]">
          <img src="https://kanakademi.com/wp-content/uploads/2024/08/cropped-kanakademi-logo.png" alt="Kan Akademi" className="h-16 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-black mb-6 text-[#0B1B3D]">Kanhoot Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-center text-xl font-bold p-3 border-2 border-gray-300 rounded focus:border-[#fd3e04] focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-[#fd3e04] text-white text-xl font-bold py-3 rounded hover:bg-[#d23100] transition-colors"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <img src="https://kanakademi.com/wp-content/uploads/2024/08/cropped-kanakademi-logo.png" alt="Kan Akademi" className="h-10 object-contain" />
            <h1 className="text-3xl font-black text-[#0B1B3D]">Kanhoot Paneli</h1>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 font-bold hover:text-[#fd3e04] transition-colors">
            Çıkış Yap
          </button>
        </div>

        <div className="flex gap-4 mb-6 pb-2">
          <button 
            onClick={() => setActiveTab("library")} 
            className={`text-xl font-bold px-6 py-3 rounded-lg shadow-sm transition-colors ${activeTab === "library" ? 'bg-[#0B1B3D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Kütüphane
          </button>
          <button 
            onClick={openBuilderNew} 
            className={`text-xl font-bold px-6 py-3 rounded-lg shadow-sm transition-colors ${activeTab === "builder" ? 'bg-[#fd3e04] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            + Yeni Kanhoot Oluştur
          </button>
          <button 
            onClick={() => setActiveTab("stats")} 
            className={`text-xl font-bold px-6 py-3 rounded-lg shadow-sm transition-colors ${activeTab === "stats" ? 'bg-[#0B1B3D] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Sonuçlar
          </button>
        </div>

        {activeTab === "builder" && (
          <KanhootBuilder 
            initialData={editingQuiz} 
            onSave={() => { setActiveTab("library"); fetchLibrary(); }} 
            onCancel={() => setActiveTab("library")} 
          />
        )}

        {activeTab === "library" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {library.length === 0 && <div className="text-gray-500 font-medium bg-white p-6 rounded-xl text-center shadow-sm col-span-3">Henüz kayıtlı kanhoot yok. İlk Kanhoot'unuzu oluşturun!</div>}
              {library.map((q, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="text-2xl font-black text-[#0B1B3D] mb-2">{q.title}</h3>
                    <p className="text-gray-500 font-medium">{q.questions.length} Soru</p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button 
                      onClick={() => startGameFromLibrary(q)}
                      className="flex-1 bg-[#26890c] text-white font-bold py-3 rounded hover:bg-[#1f7309] transition-colors"
                    >
                      Oyna
                    </button>
                    <button 
                      onClick={() => handleEdit(q)}
                      className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded hover:bg-gray-200 transition-colors"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            {stats.length === 0 && <div className="text-gray-500 font-medium bg-white p-6 rounded-xl text-center shadow-sm">Henüz oynanmış oyun sonucu yok.</div>}
            {stats.slice().reverse().map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <h3 className="text-xl font-black text-[#0B1B3D]">Oyun ID: <span className="font-medium text-gray-500">{s.game_id}</span></h3>
                  <span className="text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full">{new Date(s.date).toLocaleString('tr-TR')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-400">
                        <th className="py-3 px-4 font-bold uppercase text-xs">Sıra</th>
                        <th className="py-3 px-4 font-bold uppercase text-xs">Oyuncu</th>
                        <th className="py-3 px-4 font-bold uppercase text-xs text-right">Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.leaderboard.map((lb: any, idx: number) => (
                         <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-black text-gray-400">#{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#333]">{lb.name}</td>
                          <td className="py-3 px-4 text-right font-black text-[#fd3e04]">{lb.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
