import React from 'react';
import { RotateCcw, Lightbulb, RefreshCw, ArrowUpDown, Volume2, VolumeX, Cpu, Flag } from 'lucide-react';
import { sounds } from '../../audio/soundEffects';

interface BoardControlsProps {
  onOpenNewGameModal: () => void;
  onUndo: () => void;
  onFlipBoard: () => void;
  onRequestHint: () => void;
  onResign: () => void;
  isAiThinking: boolean;
  isCalculatingHint: boolean;
  canUndo: boolean;
  isGameOver: boolean;
  onRestartEngine: () => void;
}

export const BoardControls: React.FC<BoardControlsProps> = ({
  onOpenNewGameModal,
  onUndo,
  onFlipBoard,
  onRequestHint,
  onResign,
  isAiThinking,
  isCalculatingHint,
  canUndo,
  isGameOver,
  onRestartEngine,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(sounds.getMuted());

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 w-full max-w-[580px] mt-4">
      {/* New Game Button */}
      <button
        onClick={onOpenNewGameModal}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm border border-cyan-400/40 shadow-sm transition-all duration-150 active:scale-95"
        title="Start a new game or adjust clock/difficulty"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>New Game</span>
      </button>

      {/* Undo Move Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 shadow-sm active:scale-95 ${
          !canUndo
            ? 'opacity-40 cursor-not-allowed bg-charcoal-800 text-slate-500 border-slate-700/50'
            : 'bg-charcoal-700/80 hover:bg-slate-600/70 text-slate-200 hover:text-white border-slate-600/60 hover:border-slate-500'
        }`}
        title="Undo previous move"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Undo</span>
      </button>

      {/* Hint Button */}
      <button
        onClick={onRequestHint}
        disabled={isAiThinking || isCalculatingHint || isGameOver}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 shadow-sm active:scale-95 ${
          isAiThinking || isCalculatingHint || isGameOver
            ? 'opacity-40 cursor-not-allowed bg-charcoal-800 text-slate-500 border-slate-700/50'
            : 'bg-charcoal-700/80 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border-slate-600/60 hover:border-emerald-500/50'
        }`}
        title="Ask Stockfish for the best move in this position"
      >
        <Lightbulb className={`w-3.5 h-3.5 ${isCalculatingHint ? 'animate-spin text-emerald-400' : ''}`} />
        <span>{isCalculatingHint ? 'Analyzing...' : 'Hint'}</span>
      </button>

      {/* Flip Board Button */}
      <button
        onClick={onFlipBoard}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-charcoal-700/80 hover:bg-slate-600/70 text-slate-200 hover:text-white border border-slate-600/60 hover:border-slate-500 text-xs sm:text-sm font-semibold transition-all duration-150 shadow-sm active:scale-95"
        title="Flip board perspective"
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>Flip</span>
      </button>

      {/* Resign Button */}
      <button
        onClick={onResign}
        disabled={isGameOver}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 shadow-sm active:scale-95 ${
          isGameOver
            ? 'opacity-30 cursor-not-allowed bg-charcoal-800 text-slate-500 border-slate-700/50'
            : 'bg-charcoal-700/80 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border-slate-600/60 hover:border-rose-700/60'
        }`}
        title="Resign game"
      >
        <Flag className="w-3.5 h-3.5" />
        <span>Resign</span>
      </button>

      {/* Sound Mute Toggle */}
      <button
        onClick={handleToggleSound}
        className="p-2 rounded-xl bg-charcoal-700/80 hover:bg-slate-600/70 text-slate-300 hover:text-white border border-slate-600/60 hover:border-slate-500 transition-all duration-150 shadow-sm active:scale-95"
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
      </button>

      {/* Reset Engine Worker */}
      <button
        onClick={onRestartEngine}
        className="p-2 rounded-xl bg-charcoal-700/80 hover:bg-slate-600/70 text-slate-400 hover:text-cyan-300 border border-slate-600/60 hover:border-slate-500 transition-all duration-150 shadow-sm active:scale-95"
        title="Reload Stockfish Worker"
      >
        <Cpu className="w-4 h-4" />
      </button>
    </div>
  );
};
