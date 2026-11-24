import React from 'react';
import { Cpu, Shield } from 'lucide-react';

interface HeaderProps {
  isAiThinking: boolean;
  engineReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isAiThinking, engineReady }) => {
  return (
    <header className="border-b border-slate-800/80 bg-charcoal-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-glow-cyan">
            <div className="w-full h-full bg-[#111622] rounded-[10px] flex items-center justify-center text-cyan-400 font-bold text-lg select-none">
              ♟
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Stockfish <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Chess Arena</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                v1.0 WASM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Grandmaster WebAssembly engine running in dedicated Web Worker
            </p>
          </div>
        </div>

        {/* Engine status indicator pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-charcoal-800/80 border border-slate-700/70 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium hidden xs:inline">Engine:</span>
            <span
              className={`font-semibold text-[11px] flex items-center gap-1.5 ${
                isAiThinking
                  ? 'text-cyan-400'
                  : engineReady
                    ? 'text-emerald-400'
                    : 'text-amber-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAiThinking
                    ? 'bg-cyan-400 animate-ping'
                    : engineReady
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                }`}
              />
              {isAiThinking ? 'Calculating' : engineReady ? 'Online' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
