import React from 'react';
import { GameStatus } from '../../types/chess';
import { Trophy, AlertCircle, Handshake, ShieldAlert, Flag } from 'lucide-react';
import { Color } from 'chess.js';

interface GameStatusBannerProps {
  status: GameStatus;
  turn: Color;
  playerColor: Color;
  onOpenNewGameModal: () => void;
}

export const GameStatusBanner: React.FC<GameStatusBannerProps> = ({
  status,
  turn,
  playerColor,
  onOpenNewGameModal,
}) => {
  if (status === 'in_progress') return null;

  let title = '';
  let description = '';
  let isWin = false;
  let isLoss = false;

  if (status === 'checkmate') {
    // If it's turn's turn to move and checkmated, the opponent won!
    const winnerColor = turn === 'w' ? 'b' : 'w';
    if (winnerColor === playerColor) {
      title = 'Checkmate — Victory!';
      description = 'Spectacular tactical play! You defeated Stockfish!';
      isWin = true;
    } else {
      title = 'Checkmate — Defeat';
      description = 'Stockfish found the winning tactical sequence.';
      isLoss = true;
    }
  } else if (status === 'check') {
    const isPlayerInCheck = turn === playerColor;
    title = isPlayerInCheck ? 'Warning: You are in Check!' : 'Stockfish is in Check!';
    description = `${turn === 'w' ? 'White' : 'Black'} king must evade or block the attack.`;
  } else if (status === 'stalemate') {
    title = 'Stalemate — Draw';
    description = 'No legal moves remaining and the king is not in check. The game is a draw.';
  } else if (status === 'threefold_repetition') {
    title = 'Draw by Threefold Repetition';
    description = 'The exact same board position occurred 3 times.';
  } else if (status === 'insufficient_material') {
    title = 'Draw by Insufficient Material';
    description = 'Neither competitor has sufficient material to force checkmate.';
  } else if (status === 'fifty_moves') {
    title = 'Draw by 50-Move Rule';
    description = '50 consecutive moves elapsed without a pawn push or capture.';
  } else if (status === 'timeout') {
    const winnerColor = turn === 'w' ? 'b' : 'w';
    isWin = winnerColor === playerColor;
    isLoss = !isWin;
    title = isWin ? 'Victory on Time!' : 'Defeat — Time Expired';
    description = isWin
      ? 'Stockfish ran out of time on the clock!'
      : 'Your chess clock reached zero.';
  } else if (status === 'resigned') {
    title = 'Game Forfeited';
    description = 'You resigned the game.';
    isLoss = true;
  }

  // Check state banner (subtle, non-blocking)
  if (status === 'check') {
    return (
      <div className="flex items-center justify-between p-2.5 px-4 mb-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 animate-pulse">
        <div className="flex items-center gap-2 text-xs font-bold">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>{title}</span>
          <span className="font-normal text-rose-300">{description}</span>
        </div>
      </div>
    );
  }

  // Game over banner
  return (
    <div
      className={`p-4 rounded-2xl border mb-4 text-center transition-all shadow-xl ${
        isWin
          ? 'bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 border-emerald-500/70 shadow-emerald-950/50'
          : isLoss
            ? 'bg-gradient-to-r from-rose-950/90 to-charcoal-900 border-rose-600/70 shadow-rose-950/50'
            : 'bg-gradient-to-r from-slate-900 to-charcoal-800 border-slate-600 shadow-black/50'
      }`}
    >
      <div className="flex justify-center mb-2">
        {isWin ? (
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
        ) : isLoss ? (
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-500 flex items-center justify-center text-slate-300">
            <Handshake className="w-6 h-6" />
          </div>
        )}
      </div>

      <h2 className="text-lg font-extrabold text-white mb-1">{title}</h2>
      <p className="text-xs text-slate-300 mb-3 max-w-sm mx-auto">{description}</p>

      <button
        onClick={onOpenNewGameModal}
        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg active:scale-95"
      >
        Play Rematch
      </button>
    </div>
  );
};
