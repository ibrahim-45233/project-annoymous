import React, { useRef, useEffect, useState } from 'react';
import { MoveRecord } from '../../types/chess';
import { ScrollText, Copy, Check, Download } from 'lucide-react';

interface MoveHistoryPanelProps {
  history: MoveRecord[];
  pgn: string;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
  history,
  pgn,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Group moves by turn number (white move + black move)
  const pairedMoves: { moveNumber: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Auto-scroll to bottom on new move
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  const handleCopyPgn = async () => {
    try {
      await navigator.clipboard.writeText(pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadPgn = () => {
    if (history.length === 0) return;
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockfish-arena-${new Date().toISOString().slice(0, 10)}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-charcoal-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col h-56 sm:h-64">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <ScrollText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Move History</span>
          <span className="text-slate-500 font-mono text-[10px]">({history.length} ply)</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Copy PGN Button */}
          <button
            onClick={handleCopyPgn}
            disabled={history.length === 0}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
              history.length === 0
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700/50'
            }`}
            title="Copy PGN notation to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download PGN Button */}
          <button
            onClick={handleDownloadPgn}
            disabled={history.length === 0}
            className={`p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-700/50 transition-colors ${
              history.length === 0 ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            title="Download .pgn file"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Moves Table */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1 space-y-0.5 font-mono text-xs select-text scroll-smooth"
      >
        {pairedMoves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-xs">
            <span>No moves played yet.</span>
            <span className="text-[10px] text-slate-600 mt-1">Make your first move to begin!</span>
          </div>
        ) : (
          pairedMoves.map(({ moveNumber, white, black }) => (
            <div
              key={moveNumber}
              className="grid grid-cols-12 py-1 px-1.5 rounded hover:bg-charcoal-700/40 transition-colors items-center"
            >
              {/* Move Number */}
              <span className="col-span-2 text-slate-500 font-medium">{moveNumber}.</span>

              {/* White Move */}
              <span
                className={`col-span-5 font-semibold ${
                  white ? 'text-slate-200' : 'text-slate-600'
                }`}
              >
                {white ? white.san : ''}
              </span>

              {/* Black Move */}
              <span
                className={`col-span-5 font-semibold ${
                  black ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {black ? black.san : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
