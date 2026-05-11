"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { WSClient } from "@/lib/websocket";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

type Status = "join" | "waiting" | "get_ready" | "question" | "answered" | "result" | "podium";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 } 
  },
};

const viewVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// Kanhoot specific SVGs
const Triangle = () => (
  <svg viewBox="0 0 32 32" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
    <path d="M16 4 L28 26 L4 26 Z" />
  </svg>
);

const Diamond = () => (
  <svg viewBox="0 0 32 32" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
    <path d="M16 2 L30 16 L16 30 L2 16 Z" />
  </svg>
);

const Circle = () => (
  <svg viewBox="0 0 32 32" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
    <circle cx="16" cy="16" r="12" />
  </svg>
);

const Square = () => (
  <svg viewBox="0 0 32 32" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
    <rect x="5" y="5" width="22" height="22" rx="3" />
  </svg>
);

function PlayScreen() {
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const searchParams = useSearchParams();
  const urlPin = searchParams.get("pin");

  useEffect(() => {
    if (urlPin) setPin(urlPin);
  }, [urlPin]);

  const [status, setStatus] = useState<Status>("join");
  const wsRef = useRef<WSClient | null>(null);

  // Result state
  const [score, setScore] = useState(0);
  const [gainedScore, setGainedScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [optionCount, setOptionCount] = useState(4);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !name) return;

    let playerId = localStorage.getItem("kanhoot_player_id");
    if (!playerId) {
      playerId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem("kanhoot_player_id", playerId);
    }

    const wsUrl = process.env.NODE_ENV === "production" ? "wss://vpn.sicloid.xyz:8443" : "ws://localhost:8080";
    const client = new WSClient(`${wsUrl}/ws/player?pin=${pin}&name=${encodeURIComponent(name)}&id=${playerId}`);
    wsRef.current = client;

    client.on("joined_game", () => {
      setStatus("waiting");
    });

    client.on("question_started", (data) => {
      setStatus("question");
      setGainedScore(0);
      if (data && data.optionCount) {
        setOptionCount(data.optionCount);
      } else {
        setOptionCount(4);
      }
    });

    client.on("question_ended", (data) => {
      setScore(data.score);
      setGainedScore(data.score - score);
      setIsCorrect(data.score > score);
      setStatus("result");
    });

    client.on("game_ended", () => {
      setStatus("podium");
    });

    client.connect();
  };

  const submitAnswer = (color: string) => {
    if (wsRef.current && status === "question") {
      wsRef.current.send("answer", { color });
      setStatus("answered");
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        
        {status === "join" && (
          <motion.div 
            key="join"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center p-4"
            style={{
              background: "linear-gradient(135deg, #fd3e04 0%, #0B1B3D 100%)",
            }}
          >
            <div className="w-full max-w-sm bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0B1B3D] to-[#fd3e04]"></div>
              <img src="https://kanakademi.com.tr/wp-content/uploads/2024/08/kanakademi-logo.png" alt="Kan Akademi" className="h-16 mx-auto mb-6 object-contain" />
              <form onSubmit={handleJoin} className="space-y-4">
                <input
                  type="text"
                  placeholder="Oyun PIN'i"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  readOnly={!!urlPin}
                  className={`w-full text-center text-xl font-bold p-3 border-2 border-[#cccccc] rounded focus:border-[#333] focus:outline-none placeholder-gray-500 text-black ${urlPin ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
                <input
                  type="text"
                  placeholder="Takma Ad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full text-center text-xl font-bold p-3 border-2 border-[#cccccc] rounded focus:border-[#333] focus:outline-none placeholder-gray-500 text-black bg-white"
                />
                <motion.button
                  whileTap={{ y: 2 }}
                  type="submit"
                  disabled={!pin || !name}
                  className="w-full bg-[#333333] text-white text-xl font-bold py-3 rounded mt-4 hover:bg-black transition-colors disabled:opacity-50"
                  style={{ boxShadow: "0 4px 0 #000000" }}
                >
                  Giriş Yap
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {status === "waiting" && (
          <motion.div 
            key="waiting"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #fd3e04 0%, #0B1B3D 100%)",
            }}
          >
            <motion.h2 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-3xl md:text-5xl font-black text-white text-center leading-tight tracking-tight relative z-10"
            >
              İçeridesin!<br />Adını ana ekranda görebilirsin
            </motion.h2>
          </motion.div>
        )}

        {status === "get_ready" && (
          <motion.div 
            key="get_ready"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #fd3e04 0%, #0B1B3D 100%)",
            }}
          >
            <motion.h2 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl md:text-6xl font-black text-white text-center relative z-10"
            >
              Hazırlan!
            </motion.h2>
          </motion.div>
        )}

        {status === "question" && (
          <motion.div 
            key="question"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {/* Top Bar with Logo */}
            <div className="w-full bg-white shadow-sm py-3 px-4 flex justify-between items-center z-10 border-b-2 border-gray-200">
               <img src="https://kanakademi.com.tr/wp-content/uploads/2024/08/kanakademi-logo.png" alt="Kan Akademi" className="h-6 object-contain" />
               <span className="font-black text-[#fd3e04]">Kanhoot!</span>
            </div>

            <div className={`flex-1 grid gap-2 p-2 bg-[#f2f2f2] ${optionCount === 2 ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>

            <motion.button 
              variants={itemVariants}
              whileTap={{ scale: 0.96, filter: "brightness(0.9)" }}
              onClick={() => submitAnswer("red")}
              className="bg-[#e21b3c] rounded flex items-center justify-center relative overflow-hidden"
              style={{ boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.15)" }}
              aria-label="Red"
            >
              <Triangle />
            </motion.button>
            <motion.button 
              variants={itemVariants}
              whileTap={{ scale: 0.96, filter: "brightness(0.9)" }}
              onClick={() => submitAnswer("blue")}
              className="bg-[#1368ce] rounded flex items-center justify-center relative overflow-hidden"
              style={{ boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.15)" }}
              aria-label="Blue"
            >
              <Diamond />
            </motion.button>
            {optionCount > 2 && (
              <motion.button 
                variants={itemVariants}
                whileTap={{ scale: 0.96, filter: "brightness(0.9)" }}
                onClick={() => submitAnswer("yellow")}
                className="bg-[#d89e00] rounded flex items-center justify-center relative overflow-hidden"
                style={{ boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.15)" }}
                aria-label="Yellow"
              >
                <Circle />
              </motion.button>
            )}
            {optionCount > 3 && (
              <motion.button 
                variants={itemVariants}
                whileTap={{ scale: 0.96, filter: "brightness(0.9)" }}
                onClick={() => submitAnswer("green")}
                className="bg-[#26890c] rounded flex items-center justify-center relative overflow-hidden"
                style={{ boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.15)" }}
                aria-label="Green"
              >
                <Square />
              </motion.button>
            )}
          </motion.div>
        )}

        {status === "answered" && (
          <motion.div 
            key="answered"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {/* Top Bar with Logo */}
            <div className="w-full bg-white shadow-sm py-3 px-4 flex justify-between items-center z-10 border-b-2 border-gray-200">
               <img src="https://kanakademi.com.tr/wp-content/uploads/2024/08/kanakademi-logo.png" alt="Kan Akademi" className="h-6 object-contain" />
               <span className="font-black text-[#fd3e04]">Kanhoot!</span>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#f2f2f2] p-4">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-[#333] mb-8 tracking-tight">Cevap Bekleniyor...</h2>
                <div className="flex justify-center gap-2">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-5 h-5 bg-[#333] rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-5 h-5 bg-[#333] rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-5 h-5 bg-[#333] rounded-full"></motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {status === "result" && (
          <motion.div 
            key="result"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {/* Top Bar with Logo */}
            <div className="w-full bg-white shadow-sm py-3 px-4 flex justify-between items-center z-10 border-b-2 border-gray-200">
               <img src="https://kanakademi.com.tr/wp-content/uploads/2024/08/kanakademi-logo.png" alt="Kan Akademi" className="h-6 object-contain" />
               <span className="font-black text-[#fd3e04]">Kanhoot!</span>
            </div>
            <div className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-500 ${isCorrect ? 'bg-[#66bf39]' : 'bg-[#ff3355]'}`}>
              <div className="text-center text-white w-full max-w-sm">
              <motion.h2 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="text-5xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-md"
              >
                {isCorrect ? 'Doğru!' : 'Yanlış!'}
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl font-bold bg-black/20 rounded-md px-6 py-3 inline-block mb-12 shadow-inner"
              >
                {isCorrect ? `+${gainedScore}` : '+0'}
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 bg-white text-[#333] p-6 rounded-md shadow-lg flex justify-between items-center"
              >
                <p className="text-xl font-bold">Puanın</p>
                <p className="text-3xl font-black">{score}</p>
              </motion.div>
            </div>
            </div>
          </motion.div>
        )}

        {status === "podium" && (
          <motion.div 
            key="podium"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center p-4 text-center"
            style={{
              background: "linear-gradient(135deg, #0B1B3D 0%, #fd3e04 100%)",
            }}
          >
            <motion.h2 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-4xl md:text-5xl font-black mb-8 text-white tracking-tight drop-shadow-md"
            >
              Oyun Bitti!
            </motion.h2>
            <p className="text-xl md:text-2xl mb-8 font-bold text-white/90">Büyük ekrandan podyumu izle!</p>
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center min-w-[300px] border-b-8 border-gray-200"
            >
              <p className="text-gray-500 font-bold mb-2 uppercase tracking-widest text-sm">Nihai Puanın</p>
              <div className="text-5xl font-black text-[#0B1B3D] bg-gray-100 py-4 px-8 rounded-lg">
                {score}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center font-sans font-bold">Yükleniyor...</div>}>
      <PlayScreen />
    </Suspense>
  );
}
