export type PlayerId = 1 | 2;

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  currentPlayer: PlayerId;
  board: (PlayerId | null)[][];
  gameOver: boolean;
  winner: PlayerId | null;
  lastMove: Position | null;
}

export class TicTacToeGameEngine {
  private state: GameState;

  constructor() {
    this.state = this.initializeGameState();
  }

  private initializeGameState(): GameState {
    return {
      currentPlayer: 1,
      board: Array(3)
        .fill(null)
        .map(() => Array(3).fill(null)),
      gameOver: false,
      winner: null,
      lastMove: null,
    };
  }

  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public makeMove(position: Position): boolean {
    if (this.state.gameOver) return false;
    if (this.state.board[position.row][position.col] !== null) return false;

    this.state.board[position.row][position.col] = this.state.currentPlayer;
    this.state.lastMove = position;

    this.checkGameOver();
    if (!this.state.gameOver) {
      this.switchTurn();
    }

    return true;
  }

  private switchTurn(): void {
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
  }

  private checkGameOver(): void {
    const { board } = this.state;
    const size = 3;

    // Check rows
    for (let row = 0; row < size; row++) {
      if (
        board[row][0] &&
        board[row][0] === board[row][1] &&
        board[row][1] === board[row][2]
      ) {
        this.state.gameOver = true;
        this.state.winner = board[row][0] as PlayerId;
        return;
      }
    }

    // Check columns
    for (let col = 0; col < size; col++) {
      if (
        board[0][col] &&
        board[0][col] === board[1][col] &&
        board[1][col] === board[2][col]
      ) {
        this.state.gameOver = true;
        this.state.winner = board[0][col] as PlayerId;
        return;
      }
    }

    // Check diagonals
    if (
      board[0][0] &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      this.state.gameOver = true;
      this.state.winner = board[0][0] as PlayerId;
      return;
    }

    if (
      board[0][2] &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      this.state.gameOver = true;
      this.state.winner = board[0][2] as PlayerId;
      return;
    }

    // Check for draw
    const isDraw = board.every((row) => row.every((cell) => cell !== null));
    if (isDraw) {
      this.state.gameOver = true;
      this.state.winner = null;
    }
  }

  public resetGame(): void {
    this.state = this.initializeGameState();
  }

  public serializeState(): string {
    return JSON.stringify(this.state);
  }

  public loadState(serialized: string): void {
    try {
      const parsed: GameState = JSON.parse(serialized);
      this.state = parsed;
    } catch (err) {
      console.error("Failed to load game state:", err);
    }
  }
}
