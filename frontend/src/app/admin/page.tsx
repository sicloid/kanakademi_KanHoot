"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KanhootBuilder from "../../components/KanhootBuilder";

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
  
  const [activeTab, setActiveTab] = useState<"library" | "stats">("library");
  const [library, setLibrary] = useState<KanhootQuiz[]>([]);
  const [stats, setStats] = useState<GameStat[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<KanhootQuiz | null | "new">(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://188.132.232.104:8080";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Kanakademi2026") {
      setIsAuthenticated(true);
      fetchLibrary();
      fetchStats();
    } else {
      alert("Yanlış şifre!");
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/kanhoots`, {
        headers: { "X-Admin-Key": password }
      });
      const data = await res.json();
      setLibrary(data || []);
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
      setStats(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setLoading(true);

    try {
      const parts = importUrl.split("/");
      const uuid = parts[parts.length - 1];
      const res = await fetch(`https://create.kahoot.it/rest/kahoots/${uuid}`);
      const data = await res.json();

      const newQuiz: KanhootQuiz = {
        id: uuid,
        title: data.title || "İçe Aktarılan Kanhoot",
        questions: data.questions.map((kq: any) => ({
          question: kq.question.replace(/<[^>]*>/g, '').trim(),
          time_limit_sec: kq.time / 1000,
          options: kq.choices.map((c: any) => c.answer),
          correct_index: kq.choices.findIndex((c: any) => c.correct)
        }))
      };

      await fetch(`${API_URL}/api/kanhoots`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Key": password
        },
        body: JSON.stringify(newQuiz)
      });

      setImportUrl("");
      fetchLibrary();
    } catch (e) {
      alert("Hata oluştu, geçerli bir Kanhoot linki girdiğinizden emin olun.");
    } finally {
      setLoading(false);
    }
  };

  const startGameFromLibrary = (quiz: KanhootQuiz) => {
    // We navigate to the Host page and pass the quiz data or ID.
    // For MVP, we can pass it via localStorage so the host page picks it up.
    localStorage.setItem("pendingQuiz", JSON.stringify(quiz.questions));
    window.open("/", "_blank");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1B3D] to-[#fd3e04] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
          <h1 className="text-3xl font-black mb-6 text-[#333]">Admin Girişi</h1>
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
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-[#0B1B3D]">Kan Akademi Admin Paneli</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 font-bold hover:text-gray-800">
            Çıkış Yap
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b-2 border-gray-300 pb-2">
          <button 
            onClick={() => setActiveTab("library")} 
            className={`text-2xl font-bold px-4 py-2 rounded ${activeTab === "library" ? 'bg-[#fd3e04] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Kütüphane
          </button>
          <button 
            onClick={() => setActiveTab("stats")} 
            className={`text-2xl font-bold px-4 py-2 rounded ${activeTab === "stats" ? 'bg-[#fd3e04] text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Sonuçlar & İstatistikler
          </button>
        </div>

        {activeTab === "library" && editingQuiz === null && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Kütüphane</h2>
              <button 
                onClick={() => setEditingQuiz("new")}
                className="bg-[#0B1B3D] text-white font-bold px-6 py-2 rounded hover:bg-[#1a2e5a] transition-colors"
              >
                + Yeni Oluştur
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Mevcut Kahoot Linkinden İçe Aktar</h2>
              <form onSubmit={handleImport} className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://create.kahoot.it/share/... linkini yapıştır"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="flex-1 p-3 border-2 border-gray-300 rounded focus:border-[#fd3e04] outline-none font-medium text-gray-900"
                />
                <button 
                  type="submit" 
                  disabled={loading || !importUrl}
                  className="bg-[#fd3e04] text-white font-bold px-6 rounded disabled:opacity-50"
                >
                  {loading ? "Aktarılıyor..." : "İçe Aktar"}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {library.length === 0 && <div className="text-gray-500 font-medium">Henüz kayıtlı kanhoot yok.</div>}
              {library.map((q, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{q.title}</h3>
                    <p className="text-gray-500">{q.questions.length} Soru</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => startGameFromLibrary(q)}
                      className="flex-1 bg-[#26890c] text-white font-bold py-2 rounded hover:bg-[#1f7309]"
                    >
                      Oyunu Başlat
                    </button>
                    <button 
                      onClick={() => setEditingQuiz(q)}
                      className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded hover:bg-gray-300"
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "library" && editingQuiz !== null && (
          <KanhootBuilder 
            initialData={editingQuiz === "new" ? undefined : editingQuiz} 
            adminKey={password}
            onSave={() => {
              setEditingQuiz(null);
              fetchLibrary();
            }}
            onCancel={() => setEditingQuiz(null)}
          />
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            {stats.length === 0 && <div className="text-gray-500 font-medium">Henüz oynanmış oyun sonucu yok.</div>}
            {stats.slice().reverse().map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Oyun: {s.game_id}</h3>
                  <span className="text-gray-500 text-sm">{new Date(s.date).toLocaleString('tr-TR')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="py-2">Sıra</th>
                        <th className="py-2">Oyuncu</th>
                        <th className="py-2 text-right">Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.leaderboard.map((lb: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 font-bold text-gray-500">#{idx + 1}</td>
                          <td className="py-2 font-medium">{lb.name}</td>
                          <td className="py-2 text-right font-bold text-[#fd3e04]">{lb.score}</td>
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
