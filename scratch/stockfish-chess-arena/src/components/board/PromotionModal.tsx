import React from 'react';
import { PieceSymbol, Color } from 'chess.js';
import { motion, AnimatePresence } from 'framer-motion';

interface PromotionModalProps {
  isOpen: boolean;
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

const PIECES: { type: PieceSymbol; label: string; symbol: { w: string; b: string } }[] = [
  { type: 'q', label: 'Queen', symbol: { w: '♕', b: '♛' } },
  { type: 'r', label: 'Rook', symbol: { w: '♖', b: '♜' } },
  { type: 'b', label: 'Bishop', symbol: { w: '♗', b: '♝' } },
  { type: 'n', label: 'Knight', symbol: { w: '♘', b: '♞' } },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="bg-charcoal-800 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-1">Pawn Promotion</h3>
          <p className="text-xs text-slate-400 mb-5">Select a piece to promote your pawn:</p>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {PIECES.map(({ type, label, symbol }) => (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className="group flex flex-col items-center justify-center p-3 rounded-xl bg-charcoal-700/70 hover:bg-cyan-500/20 border border-slate-600/50 hover:border-cyan-400 transition-all duration-150 transform hover:-translate-y-1 focus:outline-none"
              >
                <span className="text-4xl select-none group-hover:scale-110 transition-transform">
                  {color === 'w' ? symbol.w : symbol.b}
                </span>
                <span className="text-[11px] font-semibold text-slate-300 group-hover:text-cyan-300 mt-2">
                  {label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-4 rounded-lg hover:bg-slate-700/40"
          >
            Cancel move
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
