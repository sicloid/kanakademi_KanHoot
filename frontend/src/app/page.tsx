"use client";

import { useEffect, useState, useRef } from "react";
import { WSClient } from "@/lib/websocket";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

type Status = "lobby" | "get_ready" | "question" | "result" | "leaderboard" | "podium";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: any = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, opacity: 1, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 } 
  },
};

const viewVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Kanhoot specific SVGs
const Triangle = ({ className = "w-8 h-8 fill-white" }) => (
  <svg viewBox="0 0 32 32" className={className}>
    <path d="M16 4 L28 26 L4 26 Z" />
  </svg>
);

const Diamond = ({ className = "w-8 h-8 fill-white" }) => (
  <svg viewBox="0 0 32 32" className={className}>
    <path d="M16 2 L30 16 L16 30 L2 16 Z" />
  </svg>
);

const Circle = ({ className = "w-8 h-8 fill-white" }) => (
  <svg viewBox="0 0 32 32" className={className}>
    <circle cx="16" cy="16" r="12" />
  </svg>
);

const Square = ({ className = "w-8 h-8 fill-white" }) => (
  <svg viewBox="0 0 32 32" className={className}>
    <rect x="5" y="5" width="22" height="22" rx="3" />
  </svg>
);

export default function HostPage() {
  const [pin, setPin] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; score: number }[]>([]);
  const [status, setStatus] = useState<Status>("lobby");
  const wsRef = useRef<WSClient | null>(null);

  const [kanhootLink, setKanhootLink] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [joinUrl, setJoinUrl] = useState("Yükleniyor...");
  const [qrUrl, setQrUrl] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Question state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalQ, setTotalQ] = useState(0);

  // Countdown state
  const [readyCountdown, setReadyCountdown] = useState<number | string>(3);

  const colors = [
    { bg: "bg-[#e21b3c]", shadow: "#b8122d", Icon: Triangle },
    { bg: "bg-[#1368ce]", shadow: "#0f52a3", Icon: Diamond },
    { bg: "bg-[#d89e00]", shadow: "#ab7d00", Icon: Circle },
    { bg: "bg-[#26890c]", shadow: "#1c6609", Icon: Square }
  ];

  useEffect(() => {
    setJoinUrl(window.location.host + "/play");
    setQrUrl(window.location.origin + "/play");
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://188.132.232.104:8080";
    const client = new WSClient(`${wsUrl}/ws/host`);
    wsRef.current = client;

    client.on("game_created", (data) => {
      setPin(data.pin);
      
      const pendingQuiz = localStorage.getItem("pendingQuiz");
      if (pendingQuiz) {
        try {
          const questions = JSON.parse(pendingQuiz);
          client.send("set_questions", { questions });
          setImportStatus("Kütüphaneden yüklendi! Başlamaya hazır.");
          localStorage.removeItem("pendingQuiz");
        } catch(e) {}
      }
    });

    client.on("player_joined", (data) => {
      setPlayers((prev) => [...prev, { id: data.id, name: data.name }]);
    });

    client.on("player_left", (data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.id));
    });

    client.on("kanhoot_imported", () => {
      setImportStatus("Başarıyla içe aktarıldı! Başlamaya hazır.");
      setKanhootLink("");
    });

    client.on("question_started", (data) => {
      setQuestionText(data.question);
      setOptions(data.options);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setCurrentQ(data.current);
      setTotalQ(data.total);
      setCorrectIndex(null);
      
      if (data.current === 1) {
        // Show get ready screen for 3 seconds before showing FIRST question
        setStatus("get_ready");
        let counter = 3;
        setReadyCountdown(counter);
        
        const timer = setInterval(() => {
          counter--;
          setReadyCountdown(counter);
          if (counter === 0) {
            clearInterval(timer);
            setStatus("question");
            setTimeLeft(data.timeLimit);
          }
        }, 1000);
      } else {
        // For subsequent questions, start immediately with a brief 1-second transition
        setStatus("get_ready");
        setReadyCountdown("Hazır...");
        setTimeout(() => {
          setStatus("question");
          setTimeLeft(data.timeLimit);
        }, 1000);
      }
    });

    client.on("question_ended", (data) => {
      setCorrectIndex(data.correctIndex);
      setLeaderboard(data.leaderboard.sort((a: any, b: any) => b.score - a.score));
      setStatus("result");
    });

    client.on("game_ended", (data) => {
      setLeaderboard(data.leaderboard.sort((a: any, b: any) => b.score - a.score));
      setStatus("podium");
      triggerConfetti();
    });

    client.connect();

    return () => client.close();
  }, []);

  // Timer logic for Questions
  useEffect(() => {
    if (status === "question" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "question" && timeLeft === 0) {
      if (wsRef.current) wsRef.current.send("end_question");
    }
  }, [timeLeft, status]);

  // Timer logic for Get Ready Countdown
  useEffect(() => {
    if (status === "get_ready" && typeof readyCountdown === "number" && readyCountdown > 0) {
      const timer = setTimeout(() => setReadyCountdown((prev) => (typeof prev === "number" ? prev - 1 : 0)), 1000);
      return () => clearTimeout(timer);
    } else if (status === "get_ready" && readyCountdown === 0) {
      if (wsRef.current) {
        if (currentQ === 0) {
          wsRef.current.send("start_game");
        } else {
          wsRef.current.send("next_question");
        }
      }
    }
  }, [readyCountdown, status, currentQ]);

  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);
  };

  const startGame = () => {
    setReadyCountdown(3);
    setStatus("get_ready");
  };

  const nextQuestion = () => {
    setReadyCountdown(3);
    setStatus("get_ready");
  };

  const importKanhoot = () => {
    if (wsRef.current && kanhootLink) {
      setImportStatus("İçe aktarılıyor...");
      wsRef.current.send("import_kanhoot", { url: kanhootLink });
    }
  };

  const showLeaderboard = () => setStatus("leaderboard");

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        
        {status === "lobby" && (
          <motion.div 
            key="lobby"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center p-0 relative"
            style={{
              background: "linear-gradient(135deg, #fd3e04 0%, #d23100 100%)",
            }}
          >
            {/* Top Bar matching Kanhoot */}
            <div className="w-full bg-white/95 backdrop-blur-sm shadow-sm py-4 px-8 flex justify-between items-center z-10 rounded-b-xl mb-8">
              <div className="flex items-center gap-4">
                <img src="https://kanakademi.com/wp-content/uploads/2024/08/cropped-kanakademi-logo.png" alt="Kan Akademi" className="h-10 object-contain mr-4" />
                <span className="text-2xl font-bold text-[#333]">Oyuna katılmak için</span>
                <span className="text-3xl font-black text-[#fd3e04]">{joinUrl}</span>
                <span className="text-2xl font-bold text-[#333]">adresine git</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 rounded p-2 flex items-center">
                  <input 
                    type="text" 
                    placeholder="Kanhoot linki yapıştır (Opsiyonel)" 
                    value={kanhootLink}
                    onChange={(e) => setKanhootLink(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-semibold w-64 text-gray-700"
                  />
                  <button 
                    onClick={importKanhoot}
                    disabled={!kanhootLink}
                    className="bg-[#26890c] text-white px-3 py-1 rounded font-bold text-sm hover:bg-[#1e6b0a] disabled:opacity-50 transition-colors"
                  >
                    İçe Aktar
                  </button>
                </div>
                {importStatus && <span className="text-xs text-[#26890c] font-bold">{importStatus}</span>}
              </div>
            </div>

            {/* Center Area: PIN and QR */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl mt-4 mb-16">
              
              {/* PIN Box */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center justify-center min-w-[400px] border-b-8 border-gray-200"
              >
                <h2 className="text-2xl font-bold text-gray-500 mb-2">Oyun PIN'i</h2>
                <div className="text-7xl md:text-8xl font-black tracking-tight text-[#333]">
                  {pin || "..."}
                </div>
              </motion.div>

              {/* QR Code Box */}
              {pin && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center justify-center border-b-8 border-gray-200"
                >
                  <p className="text-lg font-bold text-gray-500 mb-4 uppercase tracking-wider">Hızlı Katılım</p>
                  <div 
                    className="bg-white p-2 border-4 border-[#fd3e04] rounded-lg cursor-pointer hover:scale-105 transition-transform relative group"
                    onClick={() => setQrModalOpen(true)}
                  >
                    {/* Hover Expand Icon */}
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-sm">
                      <svg viewBox="0 0 32 32" className="w-10 h-10 fill-white"><path d="M24 9.414L18.707 14.707L17.293 13.293L22.586 8H20V6H26V12H24V9.414ZM9.414 24H12V26H6V20H8V22.586L13.293 17.293L14.707 18.707L9.414 24ZM8 9.414L13.293 14.707L14.707 13.293L9.414 8H12V6H6V12H8V9.414ZM20 26V24H22.586L17.293 18.707L18.707 17.293L24 22.586V20H26V26H20Z" /></svg>
                    </div>
                    {/* Dynamically generate the URL based on domain */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrUrl}?pin=${pin}`} alt="QR Code" className="w-32 h-32 md:w-40 md:h-40" />
                  </div>
                </motion.div>
              )}

            </div>
            
            {/* Action Bar (Players count & Start) */}
            <div className="flex justify-between items-center w-full max-w-6xl px-8 mb-8 z-10">
              <div className="flex flex-col items-start bg-black/30 backdrop-blur-md rounded-lg px-6 py-3">
                <span className="text-white/80 text-sm font-bold uppercase tracking-wider">Oyuncular</span>
                <span className="text-4xl md:text-5xl font-black text-white">{players.length}</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                disabled={players.length === 0}
                className="bg-[#333333] hover:bg-black text-white text-2xl font-black py-4 px-12 rounded shadow-xl transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Başlat
              </motion.button>
            </div>

            {/* QR Modal overlay */}
            <AnimatePresence>
              {qrModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm"
                  onClick={() => setQrModalOpen(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 50 }}
                    className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-full flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <img src="https://kanakademi.com/wp-content/uploads/2024/08/cropped-kanakademi-logo.png" alt="Kan Akademi" className="h-8 object-contain" />
                        <h2 className="text-2xl font-bold text-gray-800">Oyuna Katıl</h2>
                      </div>
                      <button 
                        onClick={() => setQrModalOpen(false)}
                        className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gray-600"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                      </button>
                    </div>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${qrUrl}?pin=${pin}`} alt="QR Code" className="w-64 h-64 md:w-96 md:h-96" />
                    <div className="mt-8 text-center bg-gray-100 w-full py-4 rounded-xl">
                      <p className="text-gray-500 font-bold mb-1">Oyun PIN'i</p>
                      <p className="text-5xl font-black text-[#fd3e04] tracking-widest">{pin}</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Players Grid */}
            <motion.div 
              className="w-full flex-1 flex flex-wrap justify-center content-start gap-4 px-8 pb-8 overflow-y-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {players.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-white/60 text-2xl font-bold mt-12"
                  >
                    Oyuncuların katılması bekleniyor...
                  </motion.div>
                )}
                {players.map((p) => (
                  <motion.div 
                    key={p.id} 
                    variants={itemVariants}
                    layout
                    className="bg-white text-[#333] text-2xl font-bold px-6 py-3 rounded shadow-md"
                  >
                    {p.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {status === "get_ready" && (
          <motion.div 
            key="get_ready"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center bg-[#fd3e04]"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-12 tracking-tight">Hazır Ol!</h2>
            <motion.div 
              key={readyCountdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-[12rem] md:text-[20rem] font-black text-white leading-none drop-shadow-lg"
            >
              {typeof readyCountdown === "number" && readyCountdown > 0 ? readyCountdown : "BAŞLA!"}
            </motion.div>
          </motion.div>
        )}

        {(status === "question" || status === "result") && (
          <motion.div 
            key="question_view"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col w-full h-full relative"
          >
            {/* Top Question Bar */}
            <motion.div 
              layoutId="questionBox"
              className="bg-white w-full py-6 px-4 md:px-12 shadow-sm border-b border-gray-200 z-10"
            >
              <h2 className="text-3xl md:text-5xl font-black text-center text-[#333] tracking-tight">{questionText}</h2>
            </motion.div>

            {/* Middle Area: Timer and Counters */}
            <div className="flex-1 flex justify-between items-center px-8 relative">
              <motion.div 
                key={timeLeft}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`text-6xl font-black rounded-full w-28 h-28 flex items-center justify-center shadow-lg border-4 ${timeLeft <= 5 ? 'bg-[#e21b3c] text-white border-white' : 'bg-white text-[#333] border-gray-200'}`}
              >
                {timeLeft}
              </motion.div>

              {/* Next Button (Result State) */}
              {status === "result" && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showLeaderboard} 
                  className="absolute right-8 top-8 bg-[#fd3e04] hover:bg-[#d23100] text-white text-xl font-black py-4 px-10 rounded shadow-md border-b-4 border-[#d23100] active:translate-y-1 active:border-b-0 z-20"
                >
                  Sonraki
                </motion.button>
              )}
            </div>

            {/* Bottom Answers Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full px-4 md:px-8 pb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 max-w-7xl mx-auto">
                {options.map((opt, i) => {
                  const isCorrect = status === "result" && i === correctIndex;
                  const isWrong = status === "result" && i !== correctIndex;
                  const { bg, shadow, Icon } = colors[i];
                  
                  return (
                    <motion.div 
                      key={i} 
                      variants={itemVariants}
                      layout
                      className={`
                        ${bg} min-h-24 md:min-h-32 rounded flex items-center p-4 transition-all duration-300 relative overflow-hidden
                        ${isCorrect ? 'ring-8 ring-[#66bf39] scale-[1.02] z-10' : ''}
                        ${isWrong ? 'opacity-40' : ''}
                      `}
                      style={{ boxShadow: `inset 0 -6px 0 ${shadow}` }}
                    >
                      <div className="flex-shrink-0 w-12 md:w-16 flex items-center justify-center mr-4">
                        <Icon className="w-10 h-10 md:w-12 md:h-12 fill-white" />
                      </div>
                      <span className="text-white text-2xl md:text-3xl font-bold flex-1 leading-tight drop-shadow-sm">{opt}</span>
                      
                      {/* Checkmark for correct answer */}
                      {isCorrect && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                          <svg viewBox="0 0 32 32" className="w-12 h-12 fill-white drop-shadow-md">
                            <path d="M12 24 L4 16 L7 13 L12 18 L25 5 L28 8 Z" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {status === "leaderboard" && (
          <motion.div 
            key="leaderboard"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center py-12 px-4"
          >
            <div className="w-full max-w-4xl flex justify-between items-center mb-10">
              <h2 className="text-4xl md:text-5xl font-black text-[#333] tracking-tight">Skor Tablosu</h2>
              <button 
                onClick={nextQuestion}
                className="bg-[#fd3e04] hover:bg-[#d23100] text-white text-xl font-black py-4 px-10 rounded shadow-md border-b-4 border-[#d23100] active:translate-y-1 active:border-b-0"
              >
                Sonraki
              </button>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-4xl space-y-3"
            >
              {leaderboard.slice(0, 5).map((player, index) => (
                <motion.div 
                  key={player.id} 
                  variants={itemVariants}
                  className="bg-white p-5 rounded shadow-sm border border-gray-200 flex justify-between items-center"
                >
                  <div className="flex items-center gap-6">
                    <span className={`text-4xl font-black w-12 text-center drop-shadow-sm ${index === 0 ? 'text-[#d89e00]' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-[#ab7d00]' : 'text-[#333]'}`}>
                      {index + 1}
                    </span>
                    <span className="text-2xl font-bold text-[#333]">{player.name}</span>
                  </div>
                  <span className="text-3xl font-black text-[#333] bg-[#f2f2f2] px-4 py-2 rounded">{player.score}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {status === "podium" && (
          <motion.div 
            key="podium"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-end w-full relative bg-[#fd3e04] overflow-hidden"
          >
            <h2 className="text-5xl md:text-7xl font-black text-white mt-12 absolute top-12 tracking-tight drop-shadow-lg">Podyum</h2>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-end justify-center gap-2 md:gap-6 w-full max-w-5xl h-full pb-0 mt-40"
            >
              {/* 2nd Place */}
              {leaderboard.length >= 2 && (
                <motion.div variants={itemVariants} className="flex flex-col items-center w-1/3 z-10 relative">
                  <span className="text-2xl md:text-3xl font-black text-white mb-2 truncate max-w-full px-4 drop-shadow-md">{leaderboard[1].name}</span>
                  <span className="text-lg md:text-xl font-bold text-white/80 mb-4">{leaderboard[1].score}</span>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "40vh" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                    className="bg-[#26890c] w-full rounded-t flex justify-center items-start pt-6 shadow-2xl relative"
                    style={{ boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15)" }}
                  >
                    <span className="text-6xl font-black text-white/50">2</span>
                  </motion.div>
                </motion.div>
              )}
              
              {/* 1st Place */}
              {leaderboard.length >= 1 && (
                <motion.div variants={itemVariants} className="flex flex-col items-center w-1/3 z-20 relative">
                  <span className="text-3xl md:text-4xl font-black text-white mb-2 truncate max-w-full px-4 drop-shadow-md">{leaderboard[0].name}</span>
                  <span className="text-xl md:text-2xl font-bold text-yellow-300 mb-4 drop-shadow-sm">{leaderboard[0].score}</span>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "50vh" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 1 }}
                    className="bg-[#d89e00] w-full rounded-t flex justify-center items-start pt-6 shadow-2xl relative"
                    style={{ boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15)" }}
                  >
                    <span className="text-8xl font-black text-white/50">1</span>
                  </motion.div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {leaderboard.length >= 3 && (
                <motion.div variants={itemVariants} className="flex flex-col items-center w-1/3 z-10 relative">
                  <span className="text-2xl md:text-3xl font-black text-white mb-2 truncate max-w-full px-4 drop-shadow-md">{leaderboard[2].name}</span>
                  <span className="text-lg md:text-xl font-bold text-white/80 mb-4">{leaderboard[2].score}</span>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "30vh" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    className="bg-[#1368ce] w-full rounded-t flex justify-center items-start pt-6 shadow-2xl relative"
                    style={{ boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15)" }}
                  >
                    <span className="text-6xl font-black text-white/50">3</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
