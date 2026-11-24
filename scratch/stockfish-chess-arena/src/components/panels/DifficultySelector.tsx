import React from 'react';
import { GameDifficulty, DIFFICULTY_PRESETS, DifficultyConfig } from '../../types/chess';
import { Sliders, Gauge, HelpCircle } from 'lucide-react';

interface DifficultySelectorProps {
  difficulty: GameDifficulty;
  onSelectDifficulty: (difficulty: GameDifficulty) => void;
  customConfig: DifficultyConfig;
  onUpdateCustomConfig: (config: DifficultyConfig) => void;
  disabled: boolean;
}

const PRESET_KEYS: Exclude<GameDifficulty, 'custom'>[] = [
  'beginner',
  'easy',
  'medium',
  'hard',
  'expert',
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onSelectDifficulty,
  customConfig,
  onUpdateCustomConfig,
  disabled,
}) => {
  return (
    <div className="bg-charcoal-800/70 border border-slate-700/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Engine Difficulty</span>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono font-bold">
          {difficulty === 'custom' ? `Depth ${customConfig.depth}` : `Depth ${DIFFICULTY_PRESETS[difficulty].depth}`}
        </span>
      </div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-2.5">
        {PRESET_KEYS.map((key) => {
          const preset = DIFFICULTY_PRESETS[key];
          const isSelected = difficulty === key;

          return (
            <button
              key={key}
              onClick={() => onSelectDifficulty(key)}
              disabled={disabled}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all duration-150 border text-center ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                  : 'bg-charcoal-700/60 text-slate-300 border-slate-600/40 hover:bg-slate-700/70 hover:border-slate-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Custom Option Button */}
      <button
        onClick={() => onSelectDifficulty('custom')}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium border mb-2 transition-colors ${
          difficulty === 'custom'
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60'
            : 'bg-charcoal-700/40 text-slate-400 border-slate-700 hover:text-slate-200'
        }`}
      >
        <Sliders className="w-3 h-3" />
        <span>Custom Search Depth & Time</span>
      </button>

      {/* Description or Custom Sliders */}
      {difficulty !== 'custom' ? (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-charcoal-900/50 text-[11px] text-slate-400 border border-slate-800">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-tight">
            {DIFFICULTY_PRESETS[difficulty].description}
          </p>
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-charcoal-900/60 border border-slate-800 space-y-2.5">
          {/* Depth Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Search Depth:</span>
              <span className="font-mono text-cyan-300 font-bold">{customConfig.depth} plies</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={customConfig.depth}
              disabled={disabled}
              onChange={(e) =>
                onUpdateCustomConfig({
                  ...customConfig,
                  depth: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-1.5 bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Time Limit Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Thinking Time:</span>
              <span className="font-mono text-cyan-300 font-bold">{customConfig.moveTime} ms</span>
            </div>
            <input
              type="range"
              min={200}
              max={5000}
              step={100}
              value={customConfig.moveTime || 1500}
              disabled={disabled}
              onChange={(e) =>
                onUpdateCustomConfig({
                  ...customConfig,
                  moveTime: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-1.5 bg-charcoal-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};
