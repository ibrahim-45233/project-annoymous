import React from 'react';
import { PieceSymbol } from 'chess.js';
import { CapturedState } from '../../hooks/useChessGame';

interface CapturedPiecesProps {
  captured: CapturedState;
}

const PIECE_SYMBOLS: Record<PieceSymbol, { w: string; b: string }> = {
  p: { w: '♙', b: '♟' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  r: { w: '♖', b: '♜' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

const PIECE_ORDER: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ captured }) => {
  // Sort pieces by value
  const sortPieces = (pieces: PieceSymbol[]) => {
    return [...pieces].sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));
  };

  const whiteCapturedSorted = sortPieces(captured.whiteCaptured);
  const blackCapturedSorted = sortPieces(captured.blackCaptured);

  return (
    <div className="bg-charcoal-800/70 border border-slate-700/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Captured Pieces
        </span>
        {captured.materialDifference !== 0 && (
          <span
            className={`text-xs font-extrabold px-1.5 py-0.5 rounded font-mono ${
              captured.materialDifference > 0
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}
          >
            {captured.materialDifference > 0
              ? `White +${captured.materialDifference}`
              : `Black +${Math.abs(captured.materialDifference)}`}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {/* By White (Black pieces off board) */}
        <div className="flex items-center gap-1 min-h-[22px] px-2 py-1 rounded-lg bg-charcoal-900/60">
          <span className="text-[10px] font-bold text-slate-400 w-12">White:</span>
          <div className="flex flex-wrap gap-0.5 text-slate-200 text-sm">
            {whiteCapturedSorted.length > 0 ? (
              whiteCapturedSorted.map((piece, idx) => (
                <span key={idx} className="leading-none text-slate-400" title={`Black ${piece}`}>
                  {PIECE_SYMBOLS[piece].b}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-600 italic">None</span>
            )}
          </div>
        </div>

        {/* By Black (White pieces off board) */}
        <div className="flex items-center gap-1 min-h-[22px] px-2 py-1 rounded-lg bg-charcoal-900/60">
          <span className="text-[10px] font-bold text-slate-400 w-12">Black:</span>
          <div className="flex flex-wrap gap-0.5 text-slate-200 text-sm">
            {blackCapturedSorted.length > 0 ? (
              blackCapturedSorted.map((piece, idx) => (
                <span key={idx} className="leading-none text-slate-200" title={`White ${piece}`}>
                  {PIECE_SYMBOLS[piece].w}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-600 italic">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
