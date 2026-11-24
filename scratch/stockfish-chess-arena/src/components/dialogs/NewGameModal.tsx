import React, { useState } from 'react';
import { Color } from 'chess.js';
import { GameDifficulty, DifficultyConfig, DIFFICULTY_PRESETS, TimeControlConfig, TIME_CONTROL_PRESETS } from '../../types/chess';
import { Play, X, Shield, Clock, Bot, User, Shuffle } from 'lucide-react';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (color: Color, difficulty: GameDifficulty, timeControl: TimeControlConfig) => void;
  currentDifficulty: GameDifficulty;
  currentTimeControl: TimeControlConfig;
  currentPlayerColor: Color;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentDifficulty,
  currentTimeControl,
  currentPlayerColor,
}) => {
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>(currentPlayerColor);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>(currentDifficulty);
  const [selectedTimeControlId, setSelectedTimeControlId] = useState<string>(currentTimeControl.id);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrement, setCustomIncrement] = useState<number>(5);

  if (!isOpen) return null;

  const handleStart = () => {
    let resolvedColor: Color = 'w';
    if (selectedColor === 'random') {
      resolvedColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      resolvedColor = selectedColor;
    }

    let resolvedTimeControl: TimeControlConfig;
    if (selectedTimeControlId === 'custom') {
      resolvedTimeControl = {
        id: 'custom',
        name: `${customMinutes}m + ${customIncrement}s`,
        category: 'custom',
        initialMinutes: customMinutes,
        incrementSeconds: customIncrement,
      };
    } else {
      resolvedTimeControl =
        TIME_CONTROL_PRESETS.find((tc) => tc.id === selectedTimeControlId) || TIME_CONTROL_PRESETS[5];
    }

    onStartGame(resolvedColor, selectedDifficulty, resolvedTimeControl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-charcoal-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 max-w-lg w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Start New Game</h2>
            <p className="text-xs text-slate-400">Configure your match settings and chess clock</p>
          </div>
        </div>

        {/* 1. Choose Side */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            1. Choose Your Side
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Play as White */}
            <button
              type="button"
              onClick={() => setSelectedColor('w')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                selectedColor === 'w'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-cyan'
                  : 'bg-charcoal-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center text-xl mb-1 shadow-md">
                ♔
              </div>
              <span className="text-xs font-bold">White</span>
              <span className="text-[10px] text-slate-400">Moves First</span>
            </button>

            {/* Random Side */}
            <button
              type="button"
              onClick={() => setSelectedColor('random')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                selectedColor === 'random'
                  ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-glow-blue'
                  : 'bg-charcoal-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-200 to-slate-800 text-white font-bold flex items-center justify-center text-sm mb-1 shadow-md">
                <Shuffle className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-xs font-bold">Random</span>
              <span className="text-[10px] text-slate-400">50% Chance</span>
            </button>

            {/* Play as Black */}
            <button
              type="button"
              onClick={() => setSelectedColor('b')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                selectedColor === 'b'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-glow-cyan'
                  : 'bg-charcoal-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-white font-bold flex items-center justify-center text-xl mb-1 shadow-md">
                ♚
              </div>
              <span className="text-xs font-bold">Black</span>
              <span className="text-[10px] text-slate-400">AI Moves First</span>
            </button>
          </div>
        </div>

        {/* 2. Choose Time Control */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Chess Clock / Time Control</span>
            </label>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
            {TIME_CONTROL_PRESETS.map((tc) => {
              const isSelected = selectedTimeControlId === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setSelectedTimeControlId(tc.id)}
                  className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-charcoal-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-bold">{tc.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{tc.category}</div>
                </button>
              );
            })}

            {/* Custom Time Control Option */}
            <button
              type="button"
              onClick={() => setSelectedTimeControlId('custom')}
              className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                selectedTimeControlId === 'custom'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-charcoal-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="text-xs font-bold">Custom</div>
              <div className="text-[10px] text-slate-400 uppercase">Clock</div>
            </button>
          </div>

          {/* Custom Time Inputs */}
          {selectedTimeControlId === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-charcoal-800 border border-slate-700/80 mt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Minutes per side:</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Increment (seconds):</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={customIncrement}
                  onChange={(e) => setCustomIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Choose AI Difficulty */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. AI Difficulty Level</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {(['beginner', 'easy', 'medium', 'hard', 'expert'] as const).map((diff) => {
              const preset = DIFFICULTY_PRESETS[diff];
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-charcoal-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">D{preset.depth}</div>
                </button>
              );
            })}
          </div>
          {selectedDifficulty !== 'custom' && (
            <p className="text-[11px] text-slate-400 italic px-1">
              {DIFFICULTY_PRESETS[selectedDifficulty as Exclude<GameDifficulty, 'custom'>].description}
            </p>
          )}
        </div>

        {/* Start Game Action Button */}
        <button
          onClick={handleStart}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-glow-cyan transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Match</span>
        </button>
      </div>
    </div>
  );
};
