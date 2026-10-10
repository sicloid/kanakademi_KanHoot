"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type Renk = { bg: string; shadow: string; Icon: ComponentType<{ className?: string }> };

interface Props {
  /** her şıkkı kaç oyuncu seçti (backend question_ended → answerCounts) */
  counts: number[];
  correctIndex: number | null;
  playerCount: number;
  colors: Renk[];
}

// Kahoot'taki soru sonu ekranı: şık başına sütun; yükseklik ve yüzde, cevap verenlere göre.
export default function SoruIstatistigi({ counts, correctIndex, playerCount, colors }: Props) {
  const cevaplayan = counts.reduce((a, b) => a + b, 0);
  const yuzde = (n: number) => (cevaplayan ? Math.round((n / cevaplayan) * 100) : 0);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-end justify-center gap-3 md:gap-6 h-56 md:h-72">
        {counts.map((n, i) => {
          const { bg, shadow, Icon } = colors[i];
          const dogru = i === correctIndex;
          return (
            <div key={i} className={`flex flex-col items-center justify-end h-full w-20 md:w-28 ${dogru ? "" : "opacity-50"}`}>
              <div className="text-center mb-2 leading-none">
                <div className="text-3xl md:text-4xl font-black text-[#333]">%{yuzde(n)}</div>
                <div className="text-sm md:text-base font-bold text-gray-500 mt-1">{n} kişi</div>
              </div>
              {/* en az %3: kimse seçmese de şık görünsün; 0.75 → üstteki yazıya yer kalsın */}
              <motion.div
                initial={{ height: "0%" }}
                animate={{ height: `${Math.max(yuzde(n) * 0.75, 3)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 * i }}
                className={`${bg} w-full rounded-t`}
                style={{ boxShadow: `inset 0 -6px 0 ${shadow}` }}
              />
              <div className={`${bg} w-full flex items-center justify-center gap-1 py-2 rounded-b`}>
                <Icon className="w-6 h-6 md:w-8 md:h-8 fill-white" />
                {dogru && (
                  <svg viewBox="0 0 32 32" className="w-6 h-6 md:w-8 md:h-8 fill-white" aria-label="Doğru cevap">
                    <path d="M12 24 L4 16 L7 13 L12 18 L25 5 L28 8 Z" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-lg md:text-xl font-bold text-[#333]">
        {cevaplayan}/{playerCount} kişi cevapladı
      </p>
    </div>
  );
}
