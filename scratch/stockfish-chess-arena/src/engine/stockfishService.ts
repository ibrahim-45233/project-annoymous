import { Color } from 'chess.js';
import { DifficultyConfig, EngineEvaluation, EngineStatus } from '../types/chess';
import { UciAdapter } from './uciAdapter';

export type EvalCallback = (evaluation: EngineEvaluation) => void;
export type BestMoveCallback = (bestMove: string, ponder?: string) => void;
export type StatusCallback = (status: EngineStatus) => void;

export class StockfishService {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private isThinking: boolean = false;
  private isAnalyzing: boolean = false;
  private isError: boolean = false;
  private errorMessage?: string;
  private currentEval: EngineEvaluation | null = null;
  private currentFen: string = '';
  private playerColor: Color = 'w';

  private onEvalCallbacks: Set<EvalCallback> = new Set();
  private onStatusCallbacks: Set<StatusCallback> = new Set();
  private pendingMoveResolve: ((bestMove: string) => void) | null = null;
  private pendingMoveReject: ((err: Error) => void) | null = null;
  private watchdogTimer: number | null = null;

  constructor() {
    this.initWorker();
  }

  private notifyStatus() {
    const status: EngineStatus = {
      isReady: this.isReady,
      isThinking: this.isThinking,
      isAnalyzing: this.isAnalyzing,
      isError: this.isError,
      errorMessage: this.errorMessage,
      evalInfo: this.currentEval,
    };
    this.onStatusCallbacks.forEach(cb => cb(status));
  }

  public setPlayerColor(color: Color) {
    this.playerColor = color;
  }

  public setCurrentFen(fen: string) {
    this.currentFen = fen;
  }

  public onStatus(cb: StatusCallback): () => void {
    this.onStatusCallbacks.add(cb);
    this.notifyStatus();
    return () => this.onStatusCallbacks.delete(cb);
  }

  public onEval(cb: EvalCallback): () => void {
    this.onEvalCallbacks.add(cb);
    return () => this.onEvalCallbacks.delete(cb);
  }

  /**
   * Initializes or recreates the Stockfish Web Worker
   */
  public initWorker() {
    this.terminate();

    try {
      this.isReady = false;
      this.isThinking = false;
      this.isAnalyzing = false;
      this.isError = false;
      this.errorMessage = undefined;
      this.currentEval = null;

      // In Vite with publicDir, /stockfish.js is served statically
      this.worker = new Worker('/stockfish.js');

      this.worker.onmessage = (event: MessageEvent) => {
        const line = typeof event.data === 'string' ? event.data : '';
        this.handleEngineOutput(line);
      };

      this.worker.onerror = (err: ErrorEvent) => {
        console.error('Stockfish Worker Error:', err);
        this.isError = true;
        this.errorMessage = err.message || 'Stockfish Web Worker crashed or failed to load.';
        this.isThinking = false;
        this.isAnalyzing = false;
        this.notifyStatus();

        if (this.pendingMoveReject) {
          this.pendingMoveReject(new Error(this.errorMessage));
          this.pendingMoveReject = null;
          this.pendingMoveResolve = null;
        }
      };

      // Bootstrap UCI protocol
      this.send('uci');
      this.send('isready');
      this.notifyStatus();
    } catch (err) {
      console.error('Failed to construct Stockfish Worker:', err);
      this.isError = true;
      this.errorMessage = 'Unable to launch Stockfish Web Worker: ' + String(err);
      this.notifyStatus();
    }
  }

  private send(cmd: string) {
    if (!this.worker) return;
    this.worker.postMessage(cmd);
  }

  private handleEngineOutput(line: string) {
    if (!line) return;

    const parsed = UciAdapter.parse(line, this.currentFen, this.playerColor);

    if (parsed.type === 'uciok') {
      this.send('isready');
    } else if (parsed.type === 'readyok') {
      this.isReady = true;
      this.notifyStatus();
    } else if (parsed.type === 'info' && parsed.evalInfo) {
      this.currentEval = {
        ...this.currentEval,
        ...parsed.evalInfo,
      };
      this.onEvalCallbacks.forEach(cb => cb(this.currentEval!));
      this.notifyStatus();
    } else if (parsed.type === 'bestmove') {
      this.clearWatchdog();
      this.isThinking = false;
      this.isAnalyzing = false;

      if (parsed.bestMove) {
        if (this.currentEval) {
          this.currentEval.bestMove = parsed.bestMove;
          this.currentEval.ponder = parsed.ponder;
        }
      }

      this.notifyStatus();

      if (this.pendingMoveResolve) {
        const resolve = this.pendingMoveResolve;
        this.pendingMoveResolve = null;
        this.pendingMoveReject = null;
        resolve(parsed.bestMove || '');
      }
    }
  }

  /**
   * Applies difficulty options (Skill Level: 0 to 20)
   */
  public setDifficulty(config: DifficultyConfig) {
    if (!this.worker) return;
    this.send(`setoption name Skill Level value ${Math.min(20, Math.max(0, config.skillLevel))}`);
    this.send('isready');
  }

  /**
   * Resets engine state for a fresh game
   */
  public newGame() {
    this.stop();
    this.send('ucinewgame');
    this.send('isready');
    this.currentEval = null;
    this.notifyStatus();
  }

  /**
   * Stops active search or analysis
   */
  public stop() {
    this.clearWatchdog();
    if (this.isThinking || this.isAnalyzing) {
      this.send('stop');
      this.isThinking = false;
      this.isAnalyzing = false;
      this.notifyStatus();
    }
  }

  private clearWatchdog() {
    if (this.watchdogTimer !== null) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * Asynchronously analyzes a given position without playing a move
   */
  public startAnalysis(fen: string, depth: number = 20) {
    if (!this.worker) {
      this.initWorker();
    }

    this.stop();
    this.currentFen = fen;
    this.isAnalyzing = true;
    this.isThinking = false;
    this.notifyStatus();

    // Use full skill level for analysis
    this.send('setoption name Skill Level value 20');
    this.send(`position fen ${fen}`);
    this.send(`go depth ${Math.max(1, depth)}`);
  }

  /**
   * Asks Stockfish to calculate the best move for given FEN position.
   * Returns a promise that resolves with the UCI move (e.g. 'e7e5').
   */
  public calculateBestMove(fen: string, config: DifficultyConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }

      // If already thinking or analyzing, stop previous task
      this.stop();

      this.currentFen = fen;
      this.isThinking = true;
      this.isAnalyzing = false;
      this.pendingMoveResolve = resolve;
      this.pendingMoveReject = reject;
      this.notifyStatus();

      // Configure skill level
      this.setDifficulty(config);

      // Setup position
      this.send(`position fen ${fen}`);

      // Issue go command with depth and/or movetime
      const depth = Math.max(1, config.depth);
      const moveTime = config.moveTime ? Math.max(100, config.moveTime) : undefined;
      const goCmd = moveTime ? `go depth ${depth} movetime ${moveTime}` : `go depth ${depth}`;
      this.send(goCmd);

      // Safety watchdog: if engine takes > (moveTime + 7000ms), force stop
      const timeoutLimit = (moveTime || depth * 600) + 7000;
      this.watchdogTimer = window.setTimeout(() => {
        console.warn('Stockfish search exceeded timeout limit. Issuing stop.');
        this.send('stop');
      }, timeoutLimit);
    });
  }

  /**
   * Terminate worker process
   */
  public terminate() {
    this.clearWatchdog();
    if (this.worker) {
      try {
        this.worker.postMessage('quit');
        this.worker.terminate();
      } catch (e) {
        console.error('Error terminating worker:', e);
      }
      this.worker = null;
    }
    this.isReady = false;
    this.isThinking = false;
    this.isAnalyzing = false;
  }
}

// Global engine singleton instance
export const stockfishEngine = new StockfishService();
