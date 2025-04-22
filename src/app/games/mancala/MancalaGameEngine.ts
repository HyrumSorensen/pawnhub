// MancalaGameEngine.ts
import { eventBus } from "./MancalaEventSingleton"; // reuse same event bus

export type MancalaPlayerId = 1 | 2;

export interface MancalaGameState {
  board: number[]; // 14 pits: 0–5 and 7–12 are pits, 6 and 13 are stores
  currentPlayer: MancalaPlayerId;
  gameOver: boolean;
  winner: MancalaPlayerId | null;
}

export class MancalaGameEngine {
  private state: MancalaGameState;

  constructor() {
    this.state = this.initializeGameState();
  }

  private initializeGameState(): MancalaGameState {
    const pits = new Array(14).fill(4);
    pits[6] = 0;  // Player 1's store
    pits[13] = 0; // Player 2's store

    return {
      board: pits,
      currentPlayer: 1,
      gameOver: false,
      winner: null,
    };
  }

  public getState(): MancalaGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(newState: MancalaGameState): void {
    this.state = JSON.parse(JSON.stringify(newState));
    eventBus.emit("gameStateUpdated", this.getState());
  }

  public move(playerId: MancalaPlayerId, pitIndex: number): boolean {
    if (this.state.gameOver || this.state.currentPlayer !== playerId) return false;

    const isPlayer1 = playerId === 1;
    const validRange = isPlayer1 ? [0, 5] : [7, 12];
    if (pitIndex < validRange[0] || pitIndex > validRange[1]) return false;

    let stones = this.state.board[pitIndex];
    if (stones === 0) return false;

    this.state.board[pitIndex] = 0;
    let index = pitIndex;

    while (stones > 0) {
      index = (index + 1) % 14;
      // Skip opponent's store
      if ((playerId === 1 && index === 13) || (playerId === 2 && index === 6)) continue;
      this.state.board[index]++;
      stones--;
    }

    // Capture
    if (
      ((playerId === 1 && index >= 0 && index <= 5) || (playerId === 2 && index >= 7 && index <= 12)) &&
      this.state.board[index] === 1
    ) {
      const opposite = 12 - index;
      const store = playerId === 1 ? 6 : 13;
      const captured = this.state.board[opposite];
      if (captured > 0) {
        this.state.board[store] += captured + 1;
        this.state.board[index] = 0;
        this.state.board[opposite] = 0;
      }
    }

    // Last stone in player's store = another turn
    const endInStore = (playerId === 1 && index === 6) || (playerId === 2 && index === 13);
    if (!endInStore) {
      this.switchTurn();
    }

    this.checkGameOver();
    eventBus.emit("gameStateUpdated", this.getState());
    return true;
  }

  private switchTurn(): void {
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
  }

  private checkGameOver(): void {
    const player1Empty = this.state.board.slice(0, 6).every((val) => val === 0);
    const player2Empty = this.state.board.slice(7, 13).every((val) => val === 0);

    if (player1Empty || player2Empty) {
      // Sweep remaining stones to respective stores
      const player1Stones = this.state.board.slice(0, 6).reduce((a, b) => a + b, 0);
      const player2Stones = this.state.board.slice(7, 13).reduce((a, b) => a + b, 0);
      this.state.board[6] += player1Stones;
      this.state.board[13] += player2Stones;

      for (let i = 0; i < 6; i++) this.state.board[i] = 0;
      for (let i = 7; i < 13; i++) this.state.board[i] = 0;

      this.state.gameOver = true;
      this.state.winner =
        this.state.board[6] > this.state.board[13] ? 1 :
        this.state.board[13] > this.state.board[6] ? 2 :
        null;
    }
  }

  public resetGame(): void {
    this.state = this.initializeGameState();
    eventBus.emit("gameStateUpdated", this.getState());
  }

  public serializeState(): string {
    return JSON.stringify(this.state);
  }

  public loadState(serialized: string): void {
    try {
      const parsed: MancalaGameState = JSON.parse(serialized);
      this.state = parsed;
      eventBus.emit("gameStateUpdated", this.getState());
    } catch (err) {
      console.error("Failed to load game state:", err);
    }
  }
}
