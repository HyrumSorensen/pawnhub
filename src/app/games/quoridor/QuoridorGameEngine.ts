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
  length?: number; // Number of tiles the wall spans (defaults to 2 if not provided)
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

  public setState(newState: GameState): void {
    this.state = JSON.parse(JSON.stringify(newState));
    eventBus.emit("gameStateUpdated", this.getState());
  }

  public movePawnTo(playerId: PlayerId, dest: Position): boolean {
    if (this.state.gameOver || this.state.currentPlayer !== playerId)
      return false;

    const valid = this.state.currentValidMoves.some(
      (pos) => pos.row === dest.row && pos.col === dest.col
    );
    if (!valid) return false;

    // Move
    this.state.players[playerId].position = { ...dest };

    this.checkVictory();
    if (!this.state.gameOver) this.switchTurn();
    this.clearCurrentValidMoves();

    eventBus.emit("gameStateUpdated", this.getState());
    return true;
  }

  // Attempt to place a wall ******************************************
  public placeWall(playerId: PlayerId, wall: Wall): boolean {
    if (this.state.gameOver) return false;
    if (this.state.currentPlayer !== playerId) return false;
  
    const player = this.state.players[playerId];
    if (player.wallsRemaining <= 0) return false;
  
    const wallLength = wall.length ?? 2; // Default to 2 if undefined
  
    // Check bounds based on orientation and length
    const boardLimit = this.state.boardSize;
    if (wall.row < 0 || wall.col < 0) return false;
  
    if (wall.orientation === 'horizontal') {
      if (wall.col + wallLength > boardLimit || wall.row >= boardLimit - 1) return false;
    } else if (wall.orientation === 'vertical') {
      if (wall.row + wallLength > boardLimit || wall.col >= boardLimit - 1) return false;
    }
  
    // Check for wall overlap across all spanned tiles
    const isOverlap = this.state.walls.some((w) => {
      const wLength = w.length ?? 2;
      if (w.orientation !== wall.orientation) return false;
  
      for (let i = 0; i < wLength; i++) {
        const wRow = w.orientation === 'vertical' ? w.row + i : w.row;
        const wCol = w.orientation === 'horizontal' ? w.col + i : w.col;
  
        for (let j = 0; j < wallLength; j++) {
          const newRow = wall.orientation === 'vertical' ? wall.row + j : wall.row;
          const newCol = wall.orientation === 'horizontal' ? wall.col + j : wall.col;
  
          if (wRow === newRow && wCol === newCol) return true;
        }
      }
  
      return false;
    });
  
    if (isOverlap) return false;
  
    if (!this.isWallPlacementValid({ ...wall, length: wallLength })) return false;
  
    // Place the wall
    this.state.walls.push({ ...wall, length: wallLength });
    this.state.players[playerId].wallsRemaining -= 1;
  
    this.switchTurn();
    return true;
  }
  

  // Check for valid wall placement *********************************
  private isWallPlacementValid(wall: Wall): boolean {
    const length = wall.length ?? 2;
  
    // Simulate new wall segments
    const simulatedWallSegments: Wall[] = [];
  
    for (let i = 0; i < length; i++) {
      simulatedWallSegments.push({
        row: wall.orientation === 'vertical' ? wall.row + i : wall.row,
        col: wall.orientation === 'horizontal' ? wall.col + i : wall.col,
        orientation: wall.orientation,
        length: 1,
      });
    }
  
    // Temporarily add simulated walls to a copy of state
    const originalWalls = [...this.state.walls];
    this.state.walls.push(...simulatedWallSegments);
  
    const p1CanReach = this.canPlayerReachGoal(1);
    const p2CanReach = this.canPlayerReachGoal(2);
  
    // Restore the original wall state
    this.state.walls = originalWalls;
  
    return p1CanReach && p2CanReach;
  }
  
  

  private canPlayerReachGoal(playerId: PlayerId): boolean {
    const start = this.state.players[playerId].position;
    const visited = new Set<string>();
    const queue: Position[] = [start];

    const goalRow = playerId === 1 ? this.state.boardSize - 1 : 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) continue;

      visited.add(key);

      if (playerId === 1 && current.row === goalRow) return true;
      if (playerId === 2 && current.row === goalRow) return true;

      const neighbors = this.getValidNeighbors(current);
      for (const neighbor of neighbors) {
        const nKey = `${neighbor.row},${neighbor.col}`;
        if (!visited.has(nKey)) {
          queue.push(neighbor);
        }
      }
    }

    return false; // No path to goal
  }

  private isInBounds(pos: Position): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.state.boardSize &&
      pos.col >= 0 &&
      pos.col < this.state.boardSize
    );
  }

  private canMove(from: Position, to: Position): boolean {
    if (!this.isInBounds(to)) return false;
  
    const dRow = to.row - from.row;
    const dCol = to.col - from.col;
  
    let dir: Direction | null = null;
    if (dRow === -1 && dCol === 0) dir = "up";
    else if (dRow === 1 && dCol === 0) dir = "down";
    else if (dRow === 0 && dCol === -1) dir = "left";
    else if (dRow === 0 && dCol === 1) dir = "right";
    else return false;
  
    const row = from.row;
    const col = from.col;
  
    for (const wall of this.state.walls) {
      const wRow = wall.row;
      const wCol = wall.col;
      const orientation = wall.orientation;
      const wLength = wall.length ?? 2;
  
      if (dir === "up") {
        if (
          orientation === "horizontal" &&
          row === wRow + 1 &&
          col >= wCol &&
          col < wCol + wLength
        ) {
          return false;
        }
      }
  
      if (dir === "down") {
        if (
          orientation === "horizontal" &&
          row === wRow &&
          col >= wCol &&
          col < wCol + wLength
        ) {
          return false;
        }
      }
  
      if (dir === "left") {
        if (
          orientation === "vertical" &&
          col === wCol + 1 &&
          row >= wRow &&
          row < wRow + wLength
        ) {
          return false;
        }
      }
  
      if (dir === "right") {
        if (
          orientation === "vertical" &&
          col === wCol &&
          row >= wRow &&
          row < wRow + wLength
        ) {
          return false;
        }
      }
    }
  
    return true;
  }
  

  private getValidNeighbors(pos: Position): Position[] {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const neighbors: Position[] = [];

    const otherPlayerId: PlayerId = this.state.currentPlayer === 1 ? 2 : 1;
    const otherPos = this.state.players[otherPlayerId].position;

    for (const dir of directions) {
      const deltaRow = dir === "up" ? -1 : dir === "down" ? 1 : 0;
      const deltaCol = dir === "left" ? -1 : dir === "right" ? 1 : 0;

      const intermediate: Position = {
        row: pos.row + deltaRow,
        col: pos.col + deltaCol,
      };

      // Skip if wall blocks path to intermediate square
      if (!this.canMove(pos, intermediate)) continue;

      const isBlockedByOpponent =
        intermediate.row === otherPos.row && intermediate.col === otherPos.col;

      if (!isBlockedByOpponent) {
        neighbors.push(intermediate);
        continue;
      }

      // Jump logic: try to hop over
      const jump: Position = {
        row: intermediate.row + deltaRow,
        col: intermediate.col + deltaCol,
      };

      if (this.isInBounds(jump) && this.canMove(intermediate, jump)) {
        neighbors.push(jump); // Successful jump over opponent
      } else {
        // Can't jump — check sidesteps (diagonals)
        const sideDirs: Direction[] =
          dir === "up" || dir === "down" ? ["left", "right"] : ["up", "down"];

        for (const side of sideDirs) {
          const sideDeltaRow = side === "up" ? -1 : side === "down" ? 1 : 0;
          const sideDeltaCol = side === "left" ? -1 : side === "right" ? 1 : 0;

          const sideStep: Position = {
            row: intermediate.row + sideDeltaRow,
            col: intermediate.col + sideDeltaCol,
          };

          if (
            this.isInBounds(sideStep) &&
            this.canMove(intermediate, sideStep)
          ) {
            neighbors.push(sideStep);
          }
        }
      }
    }

    return neighbors;
  }

  //   // Get list of valid moves for a player
  public getValidMoves(): boolean {
    const playerPos = this.state.players[this.state.currentPlayer].position;

    // Use full jump/side-step aware logic
    const validMoves = this.getValidNeighbors(playerPos);

    // Update state
    this.state.currentValidMoves = validMoves;

    return validMoves.length > 0;
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
  public serializeState(): string {
    return JSON.stringify(this.state);
  }

  // Load from serialized game state
  //   public loadState(serialized: string): void {
  //     // Placeholder
  //   }

  // Reset the game to start over ******************************************
  public resetGame(): void {
    this.state = this.initializeGameState();
  }
}
