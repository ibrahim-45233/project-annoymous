import React from 'react';
import { EngineStatus } from '../../types/chess';
import { UciAdapter } from '../../engine/uciAdapter';
import { Activity, AlertTriangle, CheckCircle2, Cpu } from 'lucide-react';

interface EngineStatusIndicatorProps {
  engineStatus: EngineStatus;
  turn: 'w' | 'b';
  onRestartEngine: () => void;
}

export const EngineStatusIndicator: React.FC<EngineStatusIndicatorProps> = ({
  engineStatus,
  turn,
  onRestartEngine,
}) => {
  const { isReady, isThinking, isError, errorMessage, evalInfo } = engineStatus;

  // Format evaluation score
  const evalScoreDisplay = evalInfo
    ? UciAdapter.formatScore(evalInfo.scoreCp, evalInfo.scoreMate, turn)
    : '0.00';

  return (
    <div className="bg-charcoal-800/70 border border-slate-700/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stockfish WASM Engine</span>
        </div>

        {/* Engine state pill */}
        {isError ? (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Worker Error
          </span>
        ) : isThinking ? (
          <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Calculating
          </span>
        ) : isReady ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Engine Ready
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
            Initializing...
          </span>
        )}
      </div>

      {isError && (
        <div className="p-2 mb-2 rounded bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300">
          <p className="mb-1.5">{errorMessage || 'Worker communication failed.'}</p>
          <button
            onClick={onRestartEngine}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
          >
            Restart Worker
          </button>
        </div>
      )}

      {/* Engine Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 font-mono text-center">
        {/* Depth */}
        <div className="p-1.5 rounded-lg bg-charcoal-900/60 border border-slate-800">
          <span className="block text-[9px] text-slate-500 uppercase">Depth</span>
          <span className="text-xs font-bold text-slate-200">
            {evalInfo?.depth ? `${evalInfo.depth} ply` : '-'}
          </span>
        </div>

        {/* Evaluation Score */}
        <div className="p-1.5 rounded-lg bg-charcoal-900/60 border border-slate-800">
          <span className="block text-[9px] text-slate-500 uppercase">Eval Score</span>
          <span className={`text-xs font-bold ${
            evalScoreDisplay.startsWith('+') 
              ? 'text-cyan-400' 
              : evalScoreDisplay.startsWith('-') 
                ? 'text-indigo-400' 
                : 'text-slate-300'
          }`}>
            {evalInfo ? evalScoreDisplay : '0.00'}
          </span>
        </div>

        {/* Speed / Nodes */}
        <div className="p-1.5 rounded-lg bg-charcoal-900/60 border border-slate-800">
          <span className="block text-[9px] text-slate-500 uppercase">NPS</span>
          <span className="text-xs font-bold text-slate-200">
            {evalInfo?.nps ? `${Math.round(evalInfo.nps / 1000)}k/s` : '-'}
          </span>
        </div>
      </div>

      {/* Principal variation if available */}
      {evalInfo?.pv && (
        <div className="mt-2 text-[10px] font-mono text-slate-400 truncate bg-charcoal-900/40 px-2 py-1 rounded border border-slate-800">
          <span className="text-cyan-500 font-bold mr-1">PV:</span>
          {evalInfo.pv}
        </div>
      )}
    </div>
  );
};
