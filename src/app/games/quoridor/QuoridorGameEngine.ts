// QuoridorGameEngine.ts
import { eventBus } from "./QuoridorEventSingleton";

export type PlayerId = 1 | 2;

export type Direction = "up" | "down" | "left" | "right";

export type Orientation = "horizontal" | "vertical";

export interface Position {
  row: number;
  col: number;
}

export interface Wall {
  row: number; // Top-left coordinate of the wall
  col: number;
  orientation: Orientation;
}

export interface GameState {
  currentPlayer: PlayerId;
  currentValidMoves: Position[];
  players: {
    [key in PlayerId]: {
      position: Position;
      wallsRemaining: number;
    };
  };
  walls: Wall[];
  boardSize: number; // usually 9
  gameOver: boolean;
  winner: PlayerId | null;
}

export class QuoridorGameEngine {
  private state: GameState;

  constructor() {
    this.state = this.initializeGameState();
  }

  // Initialize board, players, and wall state ******************************************
  private initializeGameState(): GameState {
    const boardSize = 9;

    return {
      currentPlayer: 1,
      currentValidMoves: [],
      players: {
        1: {
          position: { row: 0, col: Math.floor(boardSize / 2) }, // (0, 4)
          wallsRemaining: 10,
        },
        2: {
          position: { row: boardSize - 1, col: Math.floor(boardSize / 2) }, // (8, 4)
          wallsRemaining: 10,
        },
      },
      walls: [], // No walls at start
      boardSize,
      gameOver: false,
      winner: null,
    };
  }

  // Get a deep copy of the current state ******************************************
  public getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Attempt to move a player ******************************************
  public movePawn(playerId: PlayerId, direction: Direction): boolean {
    if (this.state.gameOver) return false;
    if (this.state.currentPlayer !== playerId) return false;

    const { position } = this.state.players[playerId];
    const newPos = { ...position };

    // Determine the target position based on direction
    switch (direction) {
      case "up":
        newPos.row -= 1;
        break;
      case "down":
        newPos.row += 1;
        break;
      case "left":
        newPos.col -= 1;
        break;
      case "right":
        newPos.col += 1;
        break;
    }

    // Check bounds
    if (
      newPos.row < 0 ||
      newPos.row >= this.state.boardSize ||
      newPos.col < 0 ||
      newPos.col >= this.state.boardSize
    ) {
      return false;
    }

    // Check for wall collision (placeholder — we'll do proper wall logic later)
    if (!this.isMoveValid(playerId, direction)) {
      return false;
    }

    // Check if destination is occupied by the other player
    const otherPlayerId: PlayerId = playerId === 1 ? 2 : 1;
    const otherPlayerPos = this.state.players[otherPlayerId].position;
    if (
      newPos.row === otherPlayerPos.row &&
      newPos.col === otherPlayerPos.col
    ) {
      return false; // can't move into opponent's space (for now)
    }

    // Update position
    this.state.players[playerId].position = newPos;

    // Check victory
    this.checkVictory();

    // Switch turn
    if (!this.state.gameOver) {
      this.switchTurn();
    }

    // clear the valid moves
    this.clearCurrentValidMoves();

    eventBus.emit("gameStateUpdated", this.getState());
    return true;
  }

  // Attempt to place a wall ******************************************
  public placeWall(playerId: PlayerId, wall: Wall): boolean {
    if (this.state.gameOver) return false;
    if (this.state.currentPlayer !== playerId) return false;

    const player = this.state.players[playerId];

    // Check if player has walls left
    if (player.wallsRemaining <= 0) return false;

    // Check bounds
    const maxIndex = this.state.boardSize - 2; // wall spans 2 cells
    if (
      wall.row < 0 ||
      wall.col < 0 ||
      wall.row > maxIndex ||
      wall.col > maxIndex
    ) {
      return false;
    }

    // Check for wall overlap
    const isOverlap = this.state.walls.some(
      (w) =>
        w.row === wall.row &&
        w.col === wall.col &&
        w.orientation === wall.orientation
    );
    if (isOverlap) return false;

    // TODO: Check if wall placement blocks all paths (not implemented yet)
    // if (!this.isWallPlacementValid(wall)) return false;

    // Place the wall
    this.state.walls.push(wall);
    this.state.players[playerId].wallsRemaining -= 1;

    // Switch turn
    this.switchTurn();

    return true;
  }

  // Check if a wall placement is valid (doesn't block all paths, etc.)
  //   private isWallPlacementValid(wall: Wall): boolean {
  //     // Placeholder
  //     return false;
  //   }

  // Check if a move is valid for the given player ******************************************
  private isMoveValid(playerId: PlayerId, direction: Direction): boolean {
    const { row, col } = this.state.players[playerId].position;

    for (const wall of this.state.walls) {
      const wRow = wall.row;
      const wCol = wall.col;
      const orientation = wall.orientation;

      if (direction === "up") {
        if (
          orientation === "horizontal" &&
          row === wRow + 1 &&
          col >= wCol &&
          col < wCol + 2
        ) {
          return false;
        }
      }

      if (direction === "down") {
        if (
          orientation === "horizontal" &&
          row === wRow &&
          col >= wCol &&
          col < wCol + 2
        ) {
          return false;
        }
      }

      if (direction === "left") {
        if (
          orientation === "vertical" &&
          col === wCol + 1 &&
          row >= wRow &&
          row < wRow + 2
        ) {
          return false;
        }
      }

      if (direction === "right") {
        if (
          orientation === "vertical" &&
          col === wCol &&
          row >= wRow &&
          row < wRow + 2
        ) {
          return false;
        }
      }
    }

    return true;
  }

  //   // Get list of valid moves for a player
  public getValidMoves(): boolean {
    const { row, col } = this.state.players[this.state.currentPlayer].position;
    const validMoves: Position[] = [];

    // Check all possible directions
    const directions: Direction[] = ["up", "down", "left", "right"];

    for (const direction of directions) {
      // check bounds
      if (direction === "up") {
        if (row - 1 < 0) continue;
      }
      if (direction === "down") {
        if (row + 1 >= this.state.boardSize) continue;
      }
      if (direction === "left") {
        if (col - 1 < 0) continue;
      }
      if (direction === "right") {
        if (col + 1 >= this.state.boardSize) continue;
      }

      if (this.isMoveValid(this.state.currentPlayer, direction)) {
        // update the row and col to match the valid moves
        validMoves.push({
          row: row + (direction === "up" ? -1 : direction === "down" ? 1 : 0),
          col:
            col + (direction === "left" ? -1 : direction === "right" ? 1 : 0),
        });
      }
    }

    console.log("Valid moves:", validMoves);
    this.state.currentValidMoves = validMoves;
    return true;
  }

  public clearCurrentValidMoves(): void {
    this.state.currentValidMoves = [];
  }

  // Switch turn to the other player ******************************************
  private switchTurn(): void {
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
  }

  // Check if a player has reached their goal line ******************************************
  private checkVictory(): void {
    const boardSize = this.state.boardSize;
    const p1Row = this.state.players[1].position.row;
    const p2Row = this.state.players[2].position.row;

    if (p1Row === boardSize - 1) {
      this.state.gameOver = true;
      this.state.winner = 1;
    } else if (p2Row === 0) {
      this.state.gameOver = true;
      this.state.winner = 2;
    }
  }

  // Serialize game state (for saving/transmitting)
  //   public serializeState(): string {
  //     // Placeholder
  //     return '';
  //   }

  // Load from serialized game state
  //   public loadState(serialized: string): void {
  //     // Placeholder
  //   }

  // Reset the game to start over ******************************************
  public resetGame(): void {
    this.state = this.initializeGameState();
  }
}
