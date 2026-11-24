import React, { useState } from 'react';
import { Color } from 'chess.js';
import { useChessGame } from './hooks/useChessGame';
import { useStockfish } from './hooks/useStockfish';
import { Header } from './components/layout/Header';
import { ChessboardContainer } from './components/board/ChessboardContainer';
import { BoardControls } from './components/board/BoardControls';
import { PromotionModal } from './components/board/PromotionModal';
import { NewGameModal } from './components/dialogs/NewGameModal';
import { PlayerCard } from './components/panels/PlayerCard';
import { MoveHistoryPanel } from './components/panels/MoveHistoryPanel';
import { CapturedPieces } from './components/panels/CapturedPieces';
import { DifficultySelector } from './components/panels/DifficultySelector';
import { BestMoveAnalysisPanel } from './components/panels/BestMoveAnalysisPanel';
import { GameStatusBanner } from './components/panels/GameStatusBanner';
import { GameDifficulty, TimeControlConfig, TIME_CONTROL_PRESETS } from './types/chess';
import { ShieldCheck, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState<boolean>(false);

  // Core chess rule management via chess.js
  const {
    chess,
    fen,
    turn,
    playerColor,
    history,
    isGameOver,
    gameStatus,
    selectedSquare,
    legalMoves,
    lastMove,
    checkSquare,
    boardOrientation,
    pendingPromotion,
    timeControl,
    whiteTime,
    blackTime,
    captured,
    onPieceDrop,
    onSquareClick,
    executeMove,
    completePromotion,
    cancelPromotion,
    undoMove,
    resignGame,
    resetGame,
    flipBoard,
  } = useChessGame(TIME_CONTROL_PRESETS[5]); // Default: 10 min Rapid

  const aiColor: Color = playerColor === 'w' ? 'b' : 'w';

  // Stockfish Web Worker, AI calculations & live position analysis
  const {
    difficulty,
    setDifficulty,
    customConfig,
    setCustomConfig,
    currentConfig,
    engineStatus,
    evalInfo,
    isAiThinking,
    isAnalyzing,
    isLiveAnalysisEnabled,
    toggleLiveAnalysis,
    analyzeCurrentPosition,
    isCalculatingHint,
    hintInfo,
    requestHint,
    dismissHint,
    applyHint,
    playBestMove,
    stopThinking,
    resetEngine,
    restartWorker,
  } = useStockfish({
    chess,
    fen,
    turn,
    isGameOver,
    playerColor,
    aiColor,
    executeMove,
  });

  // Handle New Game from Modal
  const handleStartNewGame = (
    chosenColor: Color,
    chosenDifficulty: GameDifficulty,
    chosenTimeControl: TimeControlConfig
  ) => {
    resetEngine();
    setDifficulty(chosenDifficulty);
    resetGame(chosenColor, chosenTimeControl);
  };

  // Handle Undo: cleanly aborts active engine search if thinking and reverts moves
  const handleUndo = () => {
    if (history.length === 0) return;

    if (isAiThinking || isAnalyzing) {
      stopThinking();
      undoMove(1);
      return;
    }

    if (turn === playerColor && history.length >= 2) {
      undoMove(2);
    } else {
      undoMove(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        isAiThinking={isAiThinking || isAnalyzing}
        engineReady={engineStatus.isReady}
      />

      {/* Main Arena Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: PLAYER INFO & MATCH OVERVIEW ================= */}
          <aside className="lg:col-span-3 order-2 lg:order-1 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Competitors
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {timeControl.name}
              </span>
            </div>

            {/* AI Opponent Card */}
            <PlayerCard
              name="Stockfish AI"
              isAi={true}
              color={aiColor}
              isActiveTurn={turn === aiColor && !isGameOver}
              timeLeftSeconds={aiColor === 'w' ? whiteTime : blackTime}
              isUnlimitedTime={timeControl.isUnlimited}
              isAiThinking={isAiThinking}
              ratingLabel="WASM Engine"
              depth={evalInfo?.depth || currentConfig.depth}
            />

            {/* Human Player Card */}
            <PlayerCard
              name="Challenger (You)"
              isAi={false}
              color={playerColor}
              isActiveTurn={turn === playerColor && !isGameOver}
              timeLeftSeconds={playerColor === 'w' ? whiteTime : blackTime}
              isUnlimitedTime={timeControl.isUnlimited}
              ratingLabel="Human Player"
            />

            {/* Match Information & Controls Overview */}
            <div className="bg-charcoal-800/60 border border-slate-700/50 rounded-2xl p-4 hidden lg:block space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Analysis Features</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Evaluation Bar:</strong> Real-time centipawn & mate meter beside the board.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Deep Analysis:</strong> Stockfish continuously calculates the best line and PV continuation.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>One-Click Play:</strong> Click "Play" in the analysis panel to play the engine's best move.</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* ================= CENTER COLUMN: THE CHESSBOARD & EVAL BAR ================= */}
          <section className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center justify-center">
            {/* Status alerts (e.g. In Check or Game Over) */}
            <div className="w-full max-w-[620px]">
              <GameStatusBanner
                status={gameStatus}
                turn={turn}
                playerColor={playerColor}
                onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
              />
            </div>

            {/* Responsive Interactive Chessboard with Vertical Evaluation Bar */}
            <ChessboardContainer
              fen={fen}
              boardOrientation={boardOrientation}
              isAiThinking={isAiThinking}
              isAnalyzing={isAnalyzing}
              isGameOver={isGameOver}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={lastMove}
              checkSquare={checkSquare}
              hintInfo={hintInfo}
              evalInfo={evalInfo}
              chess={chess}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              onApplyHint={applyHint}
              onDismissHint={dismissHint}
            />

            {/* Action Buttons */}
            <BoardControls
              onOpenNewGameModal={() => setIsNewGameModalOpen(true)}
              onUndo={handleUndo}
              onFlipBoard={flipBoard}
              onRequestHint={requestHint}
              onResign={resignGame}
              isAiThinking={isAiThinking}
              isCalculatingHint={isCalculatingHint}
              canUndo={history.length > 0}
              isGameOver={isGameOver}
              onRestartEngine={restartWorker}
            />
          </section>

          {/* ================= RIGHT COLUMN: PANELS & CONTROLS ================= */}
          <aside className="lg:col-span-3 order-3 space-y-4">
            {/* 1. Best Move Analysis & Real-Time Engine Evaluation Panel */}
            <BestMoveAnalysisPanel
              evalInfo={evalInfo}
              isAnalyzing={isAnalyzing}
              isThinking={isAiThinking}
              isLiveAnalysisEnabled={isLiveAnalysisEnabled}
              playerColor={playerColor}
              turn={turn}
              onToggleLiveAnalysis={toggleLiveAnalysis}
              onAnalyzeCurrentPosition={analyzeCurrentPosition}
              onPlayBestMove={playBestMove}
            />

            {/* 2. AI Difficulty Selector */}
            <DifficultySelector
              difficulty={difficulty}
              onSelectDifficulty={setDifficulty}
              customConfig={customConfig}
              onUpdateCustomConfig={setCustomConfig}
              disabled={isAiThinking}
            />

            {/* 3. Captured Pieces Tray */}
            <CapturedPieces captured={captured} />

            {/* 4. Move History with PGN export */}
            <MoveHistoryPanel
              history={history}
              pgn={chess.pgn()}
            />
          </aside>

        </div>
      </main>

      {/* Pawn Promotion Modal */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        color={pendingPromotion ? (chess.get(pendingPromotion.from)?.color || playerColor) : playerColor}
        onSelect={completePromotion}
        onCancel={cancelPromotion}
      />

      {/* New Game Match Config Modal */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onStartGame={handleStartNewGame}
        currentDifficulty={difficulty}
        currentTimeControl={timeControl}
        currentPlayerColor={playerColor}
      />
    </div>
  );
};

export default App;
