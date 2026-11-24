import { Color, Chess } from 'chess.js';
import { EngineEvaluation, PvMoveItem } from '../types/chess';

export interface ParsedUciLine {
  type: 'uciok' | 'readyok' | 'bestmove' | 'info' | 'other';
  raw: string;
  bestMove?: string;
  ponder?: string;
  evalInfo?: EngineEvaluation;
}

export class UciAdapter {
  /**
   * Parse a raw line emitted by Stockfish engine
   */
  public static parse(
    line: string,
    currentFen?: string,
    playerColor: Color = 'w'
  ): ParsedUciLine {
    const trimmed = line.trim();

    if (trimmed === 'uciok') {
      return { type: 'uciok', raw: trimmed };
    }

    if (trimmed === 'readyok') {
      return { type: 'readyok', raw: trimmed };
    }

    if (trimmed.startsWith('bestmove')) {
      const parts = trimmed.split(' ');
      const bestMove = parts[1] !== '(none)' ? parts[1] : undefined;
      const ponderIndex = parts.indexOf('ponder');
      const ponder = ponderIndex !== -1 ? parts[ponderIndex + 1] : undefined;

      return {
        type: 'bestmove',
        raw: trimmed,
        bestMove,
        ponder,
      };
    }

    if (trimmed.startsWith('info') && (trimmed.includes('score') || trimmed.includes('depth'))) {
      const evalInfo = this.parseInfoLine(trimmed, currentFen, playerColor);
      return {
        type: 'info',
        raw: trimmed,
        evalInfo,
      };
    }

    return { type: 'other', raw: trimmed };
  }

  private static parseInfoLine(
    line: string,
    currentFen?: string,
    playerColor: Color = 'w'
  ): EngineEvaluation {
    const tokens = line.split(' ');
    const result: EngineEvaluation = {
      depth: 0,
    };

    let pvStartIndex = -1;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === 'depth' && tokens[i + 1]) {
        result.depth = parseInt(tokens[i + 1], 10);
      } else if (token === 'seldepth' && tokens[i + 1]) {
        result.seldepth = parseInt(tokens[i + 1], 10);
      } else if (token === 'score') {
        const type = tokens[i + 1];
        const val = parseInt(tokens[i + 2], 10);
        if (type === 'cp') {
          result.scoreCp = val;
        } else if (type === 'mate') {
          result.scoreMate = val;
        }
      } else if (token === 'nodes' && tokens[i + 1]) {
        result.nodes = parseInt(tokens[i + 1], 10);
      } else if (token === 'nps' && tokens[i + 1]) {
        result.nps = parseInt(tokens[i + 1], 10);
      } else if (token === 'time' && tokens[i + 1]) {
        result.timeMs = parseInt(tokens[i + 1], 10);
      } else if (token === 'pv') {
        pvStartIndex = i + 1;
        break; // All remaining tokens belong to PV
      }
    }

    // Capture complete PV tokens
    if (pvStartIndex !== -1 && pvStartIndex < tokens.length) {
      const pvTokens = tokens.slice(pvStartIndex);
      result.pv = pvTokens.join(' ');
      if (pvTokens.length > 0) {
        result.bestMove = pvTokens[0];
      }
    }

    // Determine side to move from FEN (token index 1)
    let turn: Color = 'w';
    if (currentFen) {
      const fenParts = currentFen.split(' ');
      if (fenParts.length > 1 && (fenParts[1] === 'w' || fenParts[1] === 'b')) {
        turn = fenParts[1] as Color;
      }
    }

    // Normalize centipawns and mate to White's perspective
    if (result.scoreCp !== undefined) {
      result.whiteCp = turn === 'w' ? result.scoreCp : -result.scoreCp;
      result.playerCp = playerColor === 'w' ? result.whiteCp : -result.whiteCp;
    }

    if (result.scoreMate !== undefined) {
      result.whiteMate = turn === 'w' ? result.scoreMate : -result.scoreMate;
      result.playerMate = playerColor === 'w' ? result.whiteMate : -result.whiteMate;
    }

    // Calculate White winning percentage for the evaluation bar (5% to 95%, or 0/100% on mate)
    if (result.whiteMate !== undefined) {
      result.winPercentageWhite = result.whiteMate > 0 ? 100 : 0;
    } else if (result.whiteCp !== undefined) {
      const sigmoid = 50 + 50 * (2 / (1 + Math.exp(-0.00368 * result.whiteCp)) - 1);
      result.winPercentageWhite = Math.min(95, Math.max(5, Math.round(sigmoid * 10) / 10));
    } else {
      result.winPercentageWhite = 50;
    }

    // Format PV to SAN if currentFen is provided
    if (result.pv && currentFen) {
      result.pvFormatted = this.formatPvToSan(result.pv, currentFen);
      if (result.pvFormatted.length > 0) {
        result.bestMoveSan = result.pvFormatted[0].san;
      }
    }

    return result;
  }

  /**
   * Convert a UCI move string (e.g. 'e2e4' or 'e7e8q') into chess.js move params
   */
  public static uciToChessMove(uciMove: string): {
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
  } {
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promoChar = uciMove.length > 4 ? uciMove[4].toLowerCase() : undefined;
    const promotion = promoChar && ['q', 'r', 'b', 'n'].includes(promoChar)
      ? (promoChar as 'q' | 'r' | 'b' | 'n')
      : undefined;

    return { from, to, promotion };
  }

  /**
   * Convert a raw UCI PV line into numbered SAN moves
   */
  public static formatPvToSan(pvUci: string, startFen: string): PvMoveItem[] {
    const items: PvMoveItem[] = [];
    const tokens = pvUci.trim().split(/\s+/);
    if (tokens.length === 0 || !tokens[0]) return items;

    try {
      const simulator = new Chess(startFen);

      for (let i = 0; i < Math.min(tokens.length, 12); i++) {
        const uci = tokens[i];
        const { from, to, promotion } = this.uciToChessMove(uci);
        const color = simulator.turn();
        const moveNumber = Math.floor(simulator.history().length / 2) + 1;

        const moveResult = simulator.move({ from, to, promotion });
        if (!moveResult) break;

        items.push({
          ply: i + 1,
          moveNumber,
          color,
          san: moveResult.san,
          uci,
        });
      }
    } catch {
      // Ignore simulation errors on malformed tokens
    }

    return items;
  }

  /**
   * Format score for display
   */
  public static formatScore(
    scoreCp?: number,
    scoreMate?: number,
    turn: Color = 'w'
  ): string {
    if (scoreMate !== undefined) {
      const mateIn = turn === 'w' ? scoreMate : -scoreMate;
      return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
    }

    if (scoreCp !== undefined) {
      const adjusted = turn === 'w' ? scoreCp / 100 : -(scoreCp / 100);
      const sign = adjusted > 0 ? '+' : '';
      return `${sign}${adjusted.toFixed(2)}`;
    }

    return '0.00';
  }

  /**
   * Format normalized White and Player evaluation scores
   */
  public static formatNormalizedScore(evalInfo: EngineEvaluation | null): {
    whiteDisplay: string;
    playerDisplay: string;
    advantageText: string;
    isMate: boolean;
  } {
    if (!evalInfo || (evalInfo.whiteCp === undefined && evalInfo.whiteMate === undefined)) {
      return {
        whiteDisplay: '0.0',
        playerDisplay: '0.0',
        advantageText: 'Evaluating...',
        isMate: false,
      };
    }

    if (evalInfo.whiteMate !== undefined) {
      const isWhiteWin = evalInfo.whiteMate > 0;
      const mateMoves = Math.abs(evalInfo.whiteMate);
      const whiteDisplay = isWhiteWin ? `M${mateMoves}` : `-M${mateMoves}`;
      const isPlayerWin = (evalInfo.playerMate || 0) > 0;
      const playerDisplay = isPlayerWin ? `+M${mateMoves}` : `-M${mateMoves}`;
      const advantageText = isWhiteWin ? `White has Mate in ${mateMoves}` : `Black has Mate in ${mateMoves}`;

      return {
        whiteDisplay,
        playerDisplay,
        advantageText,
        isMate: true,
      };
    }

    if (evalInfo.whiteCp !== undefined) {
      const whiteVal = evalInfo.whiteCp / 100;
      const whiteSign = whiteVal > 0 ? '+' : '';
      const whiteDisplay = `${whiteSign}${whiteVal.toFixed(2)}`;

      const playerVal = (evalInfo.playerCp ?? evalInfo.whiteCp) / 100;
      const playerSign = playerVal > 0 ? '+' : '';
      const playerDisplay = `${playerSign}${playerVal.toFixed(2)}`;

      let advantageText = 'Equal position (0.00)';
      if (whiteVal >= 0.3) {
        advantageText = `White is ahead by ${whiteVal.toFixed(2)} pawns`;
      } else if (whiteVal <= -0.3) {
        advantageText = `Black is ahead by ${Math.abs(whiteVal).toFixed(2)} pawns`;
      }

      return {
        whiteDisplay,
        playerDisplay,
        advantageText,
        isMate: false,
      };
    }

    return {
      whiteDisplay: '0.00',
      playerDisplay: '0.00',
      advantageText: 'Evaluating...',
      isMate: false,
    };
  }
}
