"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Option = string;

type Question = {
  id?: string;
  question: string;
  time_limit_sec: number;
  options: Option[];
  correct_index: number;
};

type KanhootQuiz = {
  id?: string;
  title: string;
  questions: Question[];
};

export default function KanhootBuilder({ 
  initialData, 
  adminKey,
  onSave, 
  onCancel 
}: { 
  initialData?: KanhootQuiz; 
  adminKey: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "Yeni Kanhoot");
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || [
      { question: "", time_limit_sec: 20, options: ["", "", "", ""], correct_index: 0 }
    ]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const activeQ = questions[activeIndex] || null;

  const handleQuestionChange = (val: string) => {
    const newQs = [...questions];
    newQs[activeIndex].question = val;
    setQuestions(newQs);
  };

  const handleTimeChange = (val: number) => {
    const newQs = [...questions];
    newQs[activeIndex].time_limit_sec = val;
    setQuestions(newQs);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newQs = [...questions];
    newQs[activeIndex].options[idx] = val;
    setQuestions(newQs);
  };

  const setCorrectOption = (idx: number) => {
    const newQs = [...questions];
    newQs[activeIndex].correct_index = idx;
    setQuestions(newQs);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: "", time_limit_sec: 20, options: ["", "", "", ""], correct_index: 0 }]);
    setActiveIndex(questions.length);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return alert("En az 1 soru olmalıdır.");
    const newQs = [...questions];
    newQs.splice(idx, 1);
    setQuestions(newQs);
    if (activeIndex >= idx && activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const saveKanhoot = async () => {
    if (!title.trim()) return alert("Lütfen bir başlık girin.");
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) return alert(`${i + 1}. sorunun metni boş olamaz.`);
      if (questions[i].options.some(o => !o.trim())) return alert(`${i + 1}. sorunun tüm şıklarını doldurun.`);
    }

    setSaving(true);
    try {
      const payload: KanhootQuiz = {
        title,
        questions: questions.map(q => ({
          question: q.question,
          time_limit_sec: q.time_limit_sec,
          options: q.options,
          correct_index: q.correct_index
        }))
      };
      if (initialData?.id) payload.id = initialData.id;

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://188.132.232.104:8080";

      const res = await fetch(`${API_URL}/api/kanhoots`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Key": adminKey
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Kayıt başarısız");
      alert("Kanhoot başarıyla kaydedildi!");
      onSave();
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const colors = [
    { bg: "bg-[#e21b3c]", border: "border-[#b8122d]", Icon: "🔺" },
    { bg: "bg-[#1368ce]", border: "border-[#0f52a3]", Icon: "♦️" },
    { bg: "bg-[#d89e00]", border: "border-[#ab7d00]", Icon: "🟡" },
    { bg: "bg-[#26890c]", border: "border-[#1c6609]", Icon: "🟩" }
  ];

  return (
    <div className="flex h-[80vh] bg-[#f2f2f2] rounded-xl overflow-hidden shadow-2xl border-2 border-gray-300">
      
      {/* LEFT SIDEBAR: Questions List */}
      <div className="w-64 bg-white border-r-2 border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-black text-[#0B1B3D] text-lg">Sorular</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={idx} 
                onClick={() => setActiveIndex(idx)}
                className={`relative p-3 rounded-lg border-2 cursor-pointer group transition-all
                  ${activeIndex === idx ? 'border-[#0B1B3D] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                <p className="font-bold text-gray-500 text-xs mb-1">{idx + 1}. Soru</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{q.question || "Boş Soru"}</p>
                
                {questions.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-100 text-red-600 rounded p-1 hover:bg-red-200 transition-all"
                    title="Soruyu Sil"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <button 
            onClick={addQuestion}
            className="w-full py-3 mt-4 border-2 border-dashed border-[#0B1B3D] text-[#0B1B3D] font-bold rounded-lg hover:bg-[#0B1B3D] hover:text-white transition-colors"
          >
            + Soru Ekle
          </button>
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 flex flex-col bg-[#f2f2f2]">
        {/* Top Header */}
        <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10 border-b border-gray-200">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-black text-black border-b-2 border-transparent focus:border-[#fd3e04] outline-none bg-white w-1/2 placeholder-gray-400 transition-colors px-2 py-1"
            placeholder="Kanhoot Başlığı"
          />
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="px-6 py-2 rounded font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={saveKanhoot}
              disabled={saving}
              className="px-8 py-2 rounded font-bold text-white bg-[#fd3e04] hover:bg-[#d23100] transition-colors disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>

        {/* Editor Body */}
        {activeQ && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col relative">
            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
              
              {/* Question Input */}
              <div className="bg-white shadow-md rounded-xl p-6 mb-8 text-center border border-gray-200">
                <input 
                  type="text" 
                  value={activeQ.question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  placeholder="Sorunuzu buraya yazın"
                  className="w-full text-3xl md:text-4xl font-black text-center text-black bg-white outline-none placeholder-gray-300"
                />
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg flex items-center px-4 py-2">
                  <span className="font-bold text-gray-500 mr-4">Zaman Sınırı:</span>
                  <select 
                    value={activeQ.time_limit_sec}
                    onChange={(e) => handleTimeChange(Number(e.target.value))}
                    className="font-bold text-[#0B1B3D] bg-transparent outline-none cursor-pointer text-lg"
                  >
                    <option value={5}>5 Saniye</option>
                    <option value={10}>10 Saniye</option>
                    <option value={20}>20 Saniye</option>
                    <option value={30}>30 Saniye</option>
                    <option value={60}>60 Saniye</option>
                  </select>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-4 mt-auto mb-4">
                {activeQ.options.map((opt, i) => (
                  <div 
                    key={i} 
                    className={`${colors[i].bg} relative rounded-xl shadow-[0_6px_0_0_${colors[i].border}] p-4 flex items-center min-h-[120px] transition-transform hover:scale-[1.02]`}
                    style={{ boxShadow: `0 6px 0 0 ${colors[i].border.replace('border-[', '').replace(']', '')}` }}
                  >
                    <span className="text-3xl absolute left-4 drop-shadow-md">{colors[i].Icon}</span>
                    <textarea 
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Şık ${i+1} ekle`}
                      className="flex-1 bg-transparent text-white placeholder-white/60 font-bold text-2xl outline-none resize-none ml-12 text-center h-full flex items-center justify-center pt-3"
                    />
                    
                    {/* Correct Answer Checkbox */}
                    <button 
                      onClick={() => setCorrectOption(i)}
                      className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all
                        ${activeQ.correct_index === i ? 'bg-[#66bf39] border-white' : 'bg-transparent border-white/40 hover:border-white/80'}`}
                      title="Doğru Cevap Olarak İşaretle"
                    >
                      {activeQ.correct_index === i && (
                        <svg viewBox="0 0 32 32" className="w-6 h-6 fill-white"><path d="M12 24 L4 16 L7 13 L12 18 L25 5 L28 8 Z" /></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
