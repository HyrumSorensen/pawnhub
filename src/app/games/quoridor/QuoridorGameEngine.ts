// QuoridorGameEngine.ts
import { eventBus } from "./QuoridorEventSingleton";

export type PlayerId = number;

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
  players: Record<PlayerId, {
    position: Position;
    wallsRemaining: number;
  }>;
  
  walls: Wall[];
  boardSize: number; // usually 9
  gameOver: boolean;
  winner: PlayerId | null;
}

export class QuoridorGameEngine {
  private state: GameState;
  private numPlayers: 2 | 4 = 2;

  constructor(numPlayers: 2 | 4 = 2) {
    this.numPlayers = numPlayers;
    this.state = this.initializeGameState(numPlayers);
  }
  

  // Initialize board, players, and wall state ******************************************
  private initializeGameState(numPlayers: 2 | 4 = 2): GameState {
    const boardSize = 9;
    const mid = Math.floor(boardSize / 2);
  
    const players: Record<number, { position: Position; wallsRemaining: number }> = {
      1: {
        position: { row: 0, col: mid }, // Top middle
        wallsRemaining: numPlayers === 2 ? 10 : 5,
      },
      2: {
        position: { row: boardSize - 1, col: mid }, // Bottom middle
        wallsRemaining: numPlayers === 2 ? 10 : 5,
      },
    };
  
    if (numPlayers === 4) {
      players[3] = {
        position: { row: mid, col: 0 }, // Left middle
        wallsRemaining: 5,
      };
      players[4] = {
        position: { row: mid, col: boardSize - 1 }, // Right middle
        wallsRemaining: 5,
      };
    }
  
    return {
      currentPlayer: 1,
      currentValidMoves: [],
      players,
      walls: [],
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
  
    if (!this.state.players[playerId]) return false; // ✅ sanity check
  
    const valid = this.state.currentValidMoves.some(
      (pos) => pos.row === dest.row && pos.col === dest.col
    );
    if (!valid) return false;
  
    // Move
    this.state.players[playerId].position = { ...dest };
  
    this.checkVictory(); // 🔜 we'll update this to support all 4
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
  
    const wallLength = wall.length ?? 2;
  
    const boardLimit = this.state.boardSize;
    if (wall.row < 0 || wall.col < 0) return false;
  
    if (wall.orientation === "horizontal") {
      if (wall.col + wallLength > boardLimit || wall.row >= boardLimit - 1)
        return false;
    } else if (wall.orientation === "vertical") {
      if (wall.row + wallLength > boardLimit || wall.col >= boardLimit - 1)
        return false;
    }
  
    // ✅ Check for overlapping walls of the same orientation
    const isOverlap = this.state.walls.some((w) => {
      const wLength = w.length ?? 2;
      if (w.orientation !== wall.orientation) return false;
  
      for (let i = 0; i < wLength; i++) {
        const wRow = w.orientation === "vertical" ? w.row + i : w.row;
        const wCol = w.orientation === "horizontal" ? w.col + i : w.col;
  
        for (let j = 0; j < wallLength; j++) {
          const newRow =
            wall.orientation === "vertical" ? wall.row + j : wall.row;
          const newCol =
            wall.orientation === "horizontal" ? wall.col + j : wall.col;
  
          if (wRow === newRow && wCol === newCol) return true;
        }
      }
  
      return false;
    });
  
    if (isOverlap) return false;
  
    // ✅ Check for crossing walls of opposite orientation
    const isCrossing = this.state.walls.some((w) => {
      const wLength = w.length ?? 2;
  
      // Horizontal wall trying to cross vertical wall
      if (wall.orientation === "horizontal" && w.orientation === "vertical") {
        // Crossing happens at (wall.row, wall.col + 1)
        const crossRow = wall.row;
        const crossCol = wall.col;
  
        for (let i = 0; i < wLength; i++) {
          const wRow = w.row + i;
          const wCol = w.col;
          if (wRow === crossRow && wCol === crossCol) return true;
        }
      }
  
      // Vertical wall trying to cross horizontal wall
      if (wall.orientation === "vertical" && w.orientation === "horizontal") {
        // Crossing happens at (wall.row + 1, wall.col)
        const crossRow = wall.row;
        const crossCol = wall.col;
  
        for (let i = 0; i < wLength; i++) {
          const wRow = w.row;
          const wCol = w.col + i;
          if (wRow === crossRow && wCol === crossCol) return true;
        }
      }
  
      return false;
    });
  
    if (isCrossing) return false;
  
    // ✅ Check if wall blocks all paths
    if (!this.isWallPlacementValid({ ...wall, length: wallLength }))
      return false;
  
    // ✅ Place the wall
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
        row: wall.orientation === "vertical" ? wall.row + i : wall.row,
        col: wall.orientation === "horizontal" ? wall.col + i : wall.col,
        orientation: wall.orientation,
        length: 1,
      });
    }

    // Temporarily add simulated walls to a copy of state
    const originalWalls = [...this.state.walls];
    this.state.walls.push(...simulatedWallSegments);

    const allPlayersCanReach = Object.keys(this.state.players).every((id) =>
      this.canPlayerReachGoal(parseInt(id))
    );
    

    // Restore the original wall state
    this.state.walls = originalWalls;

    return allPlayersCanReach;
  }

  private canPlayerReachGoal(playerId: PlayerId): boolean {
    const start = this.state.players[playerId]?.position;
    if (!start) return false;
  
    const visited = new Set<string>();
    const queue: Position[] = [start];
    const boardSize = this.state.boardSize;
  
    const isGoal = (pos: Position): boolean => {
      switch (playerId) {
        case 1:
          return pos.row === boardSize - 1;
        case 2:
          return pos.row === 0;
        case 3:
          return pos.col === boardSize - 1;
        case 4:
          return pos.col === 0;
        default:
          return false;
      }
    };
  
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) continue;
  
      visited.add(key);
  
      if (isGoal(current)) return true;
  
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
  
    const allOpponentPositions = Object.entries(this.state.players)
      .filter(([id]) => parseInt(id) !== this.state.currentPlayer)
      .map(([, data]) => data.position);
  
    for (const dir of directions) {
      const deltaRow = dir === "up" ? -1 : dir === "down" ? 1 : 0;
      const deltaCol = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  
      const intermediate: Position = {
        row: pos.row + deltaRow,
        col: pos.col + deltaCol,
      };
  
      // Skip if wall blocks path to intermediate square
      if (!this.canMove(pos, intermediate)) continue;
  
      const occupyingOpponents = allOpponentPositions.filter(
        (p) => p.row === intermediate.row && p.col === intermediate.col
      );
  
      if (occupyingOpponents.length === 0) {
        neighbors.push(intermediate);
        continue;
      }
  
      // If there's more than one opponent in the direction — can't jump
      if (occupyingOpponents.length > 1) {
        // Only sidestep
        const sideDirs: Direction[] =
          dir === "up" || dir === "down" ? ["left", "right"] : ["up", "down"];
  
        for (const side of sideDirs) {
          const sideDeltaRow = side === "up" ? -1 : side === "down" ? 1 : 0;
          const sideDeltaCol = side === "left" ? -1 : side === "right" ? 1 : 0;
  
          const sideStep: Position = {
            row: intermediate.row + sideDeltaRow,
            col: intermediate.col + sideDeltaCol,
          };
  
          if (this.isInBounds(sideStep) && this.canMove(intermediate, sideStep)) {
            neighbors.push(sideStep);
          }
        }
        continue;
      }
  
      // Only 1 opponent in that direction — try jumping over
      const jump: Position = {
        row: intermediate.row + deltaRow,
        col: intermediate.col + deltaCol,
      };
  
      if (this.isInBounds(jump) && this.canMove(intermediate, jump)) {
        neighbors.push(jump);
      } else {
        // Can't jump — try sidesteps
        const sideDirs: Direction[] =
          dir === "up" || dir === "down" ? ["left", "right"] : ["up", "down"];
  
        for (const side of sideDirs) {
          const sideDeltaRow = side === "up" ? -1 : side === "down" ? 1 : 0;
          const sideDeltaCol = side === "left" ? -1 : side === "right" ? 1 : 0;
  
          const sideStep: Position = {
            row: intermediate.row + sideDeltaRow,
            col: intermediate.col + sideDeltaCol,
          };
  
          if (this.isInBounds(sideStep) && this.canMove(intermediate, sideStep)) {
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
    const playerIds = Object.keys(this.state.players)
      .map((id) => parseInt(id))
      .sort((a, b) => a - b);
  
    const currentIndex = playerIds.indexOf(this.state.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
  
    this.state.currentPlayer = playerIds[nextIndex];
  }
  

  // Check if a player has reached their goal line ******************************************
  private checkVictory(): void {
    const boardSize = this.state.boardSize;
  
    for (const playerId in this.state.players) {
      const id = parseInt(playerId) as PlayerId;
      const pos = this.state.players[id].position;
  
      let hasWon = false;
  
      switch (id) {
        case 1:
          hasWon = pos.row === boardSize - 1;
          break;
        case 2:
          hasWon = pos.row === 0;
          break;
        case 3:
          hasWon = pos.col === boardSize - 1;
          break;
        case 4:
          hasWon = pos.col === 0;
          break;
      }
  
      if (hasWon) {
        this.state.gameOver = true;
        this.state.winner = id;
        break;
      }
    }
  }
  

  // Serialize game state (for saving/transmitting)
  public serializeState(): string {
    return JSON.stringify(this.state);
  }

  // Load from serialized game state
  public loadState(serialized: string): void {
    try {
      const parsed: GameState = JSON.parse(serialized);
      this.state = parsed;
      this.numPlayers = Object.keys(parsed.players).length as 2 | 4;
      eventBus.emit("gameStateUpdated", this.getState());
    } catch (err) {
      console.error("Failed to load game state:", err);
    }
  }
  

  // Reset the game to start over ******************************************
  public resetGame(): void {
    this.state = this.initializeGameState(this.numPlayers);
  }
}
