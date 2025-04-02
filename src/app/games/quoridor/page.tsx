"use client";

import { useEffect, useState } from "react";
import { QuoridorGameEngine } from "./QuoridorGameEngine";
import { eventBus } from "./QuoridorEventSingleton";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import Tile from "./assets/Tile";
import TileValid from "./assets/TileValid";
import TilePlayer1 from "./assets/TilePlayer1";
import TilePlayer2 from "./assets/TilePlayer2";

export default function HomePage() {
  const initializeGame = useMutation(api.gameSaves.initializeGame);
  const appendGameState = useMutation(api.gameSaves.appendGameState);
  const userId = useQuery(api.users.getCurrentUserId);

  const [engine, setEngine] = useState<QuoridorGameEngine | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [firstSelectedCell, setFirstSelectedCell] = useState<[number, number]>([-1, -1]);
  const [mode, setMode] = useState<"move" | "place-wall">("move");
  const [hoveredWall, setHoveredWall] = useState<{
    row: number;
    col: number;
    orientation: "horizontal" | "vertical";
  } | null>(null);

  const tileSize = 65;

  async function saveCurrentGameState() {
    if (!engine || !gameId) return;

    await appendGameState({
      gameId,
      newState: engine.serializeState(),
    });
  }

  function handlePlayerMove(r: number, c: number) {
    if (!engine || mode !== "move") return;

    if (
      firstSelectedCell[0] === -1 &&
      board[r][c] === engine.getState().currentPlayer.toString()
    ) {
      setFirstSelectedCell([r, c]);
      const validMoves = engine.getValidMoves();
      if (validMoves) {
        setBoard(renderBoard(engine));
      }
    } else {
      const direction = getDirection(firstSelectedCell, [r, c]);
      if (
        direction &&
        engine
          .getState()
          .currentValidMoves.some((move) => move.row === r && move.col === c)
      ) {
        engine.movePawn(engine.getState().currentPlayer, direction);
        setFirstSelectedCell([-1, -1]);
        saveCurrentGameState();
      }
    }
  }

  function handleWallPlacement(
    row: number,
    col: number,
    orientation: "horizontal" | "vertical"
  ) {
    if (!engine) return;
    const success = engine.placeWall(engine.getState().currentPlayer, {
      row,
      col,
      orientation,
    });

    if (success) {
      saveCurrentGameState();
    } else {
      console.warn("Invalid wall placement");
    }

    setHoveredWall(null);
  }

  function getDirection(
    firstSelectedCell: [number, number],
    secondSelectedCell: [number, number]
  ) {
    const rowDiff = secondSelectedCell[0] - firstSelectedCell[0];
    const colDiff = secondSelectedCell[1] - firstSelectedCell[1];
    if (rowDiff === 1) return "down";
    if (rowDiff === -1) return "up";
    if (colDiff === 1) return "right";
    if (colDiff === -1) return "left";
  }

  useEffect(() => {
    const game = new QuoridorGameEngine();
    setEngine(game);
    setBoard(renderBoard(game));

    const newGameId = uuidv4();
    setGameId(newGameId);

    if (userId) {
      initializeGame({
        userId: userId,
        gameId: newGameId,
        initialState: game.serializeState(),
        createdAt: Date.now(),
      });
    }

    const handler = () => {
      setBoard(renderBoard(game));
    };
    eventBus.on("gameStateUpdated", handler);

    return () => {
      eventBus.off("gameStateUpdated", handler);
    };
  }, [userId, initializeGame]);

  return (
    <main className="flex flex-col gap-4 p-4 items-center">
      {engine && (
        <>
          <div className="mb-4 flex gap-4">
            <button
              onClick={() =>
                setMode((prev) => (prev === "move" ? "place-wall" : "move"))
              }
              className={`px-4 py-2 rounded ${
                mode === "place-wall" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {mode === "move" ? "Switch to Place Wall" : "Switch to Move Mode"}
            </button>
          </div>

          {/* Board */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: Array.from(
                { length: board.length * 2 - 1 },
                (_, i) => (i % 2 === 0 ? `${tileSize}px` : "6px")
              ).join(" "),
              gridTemplateRows: Array.from(
                { length: board.length * 2 - 1 },
                (_, i) => (i % 2 === 0 ? `${tileSize}px` : "6px")
              ).join(" "),
            }}
          >
            {Array.from({ length: board.length * 2 - 1 }, (_, rowIdx) =>
              Array.from({ length: board.length * 2 - 1 }, (_, colIdx) => {
                const isCell = rowIdx % 2 === 0 && colIdx % 2 === 0;
                const cellRow = rowIdx / 2;
                const cellCol = colIdx / 2;

                if (isCell) {
                  const cell = board[cellRow][cellCol];
                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className="border border-gray-300"
                      onClick={() => handlePlayerMove(cellRow, cellCol)}
                    >
                      {cell === "." && <Tile width={tileSize} height={tileSize} />}
                      {cell === "1" && <TilePlayer1 width={tileSize} height={tileSize} />}
                      {cell === "2" && <TilePlayer2 width={tileSize} height={tileSize} />}
                      {cell === "X" && <TileValid width={tileSize} height={tileSize} />}
                    </div>
                  );
                }

                const isVertical = rowIdx % 2 === 0 && colIdx % 2 === 1;
                const isHorizontal = rowIdx % 2 === 1 && colIdx % 2 === 0;

                const wallRow = Math.floor(rowIdx / 2);
                const wallCol = Math.floor(colIdx / 2);

                const wallExists = engine.getState().walls.some((w) => {
                  if (isHorizontal && w.orientation === "horizontal") {
                    return (
                      (w.row === wallRow && w.col === wallCol) ||
                      (w.row === wallRow && w.col === wallCol - 1)
                    );
                  }
                  if (isVertical && w.orientation === "vertical") {
                    return (
                      (w.row === wallRow && w.col === wallCol) ||
                      (w.row === wallRow - 1 && w.col === wallCol)
                    );
                  }
                  return false;
                });

                const isHovered =
                  hoveredWall &&
                  ((hoveredWall.orientation === "horizontal" &&
                    isHorizontal &&
                    wallRow === hoveredWall.row &&
                    (wallCol === hoveredWall.col || wallCol === hoveredWall.col + 1)) ||
                    (hoveredWall.orientation === "vertical" &&
                      isVertical &&
                      wallCol === hoveredWall.col &&
                      (wallRow === hoveredWall.row || wallRow === hoveredWall.row + 1)));

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`transition-colors duration-100 ${
                      wallExists
                        ? "bg-red-500"
                        : isHovered
                        ? "bg-gray-400"
                        : "bg-transparent"
                    }`}
                    onMouseEnter={() => {
                      if (mode === "place-wall") {
                        setHoveredWall({
                          row: wallRow,
                          col: wallCol,
                          orientation: isHorizontal ? "horizontal" : "vertical",
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      if (mode === "place-wall") {
                        setHoveredWall(null);
                      }
                    }}
                    onClick={() => {
                      if (mode === "place-wall") {
                        handleWallPlacement(
                          wallRow,
                          wallCol,
                          isHorizontal ? "horizontal" : "vertical"
                        );
                      }
                    }}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </main>
  );
}

function renderBoard(engine: QuoridorGameEngine) {
  const state = engine.getState();
  const board: string[][] = [];

  for (let r = 0; r < state.boardSize; r++) {
    board[r] = [];
    for (let c = 0; c < state.boardSize; c++) {
      board[r][c] = ".";
    }
  }

  board[state.players[1].position.row][state.players[1].position.col] = "1";
  board[state.players[2].position.row][state.players[2].position.col] = "2";

  if (state.currentValidMoves.length > 0) {
    for (const move of state.currentValidMoves) {
      board[move.row][move.col] = "X";
    }
  }

  return board;
}
