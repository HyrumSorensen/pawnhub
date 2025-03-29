"use client";

import { useEffect, useState } from "react";
import { QuoridorGameEngine } from "./QuoridorGameEngine";
import { eventBus } from "./QuoridorEventSingleton";
import Tile from "./assets/Tile";
import TileValid from "./assets/TileValid";
import TilePlayer1 from "./assets/TilePlayer1";
import TilePlayer2 from "./assets/TilePlayer2";

export default function HomePage() {
  const [engine, setEngine] = useState<QuoridorGameEngine | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [firstSelectedCell, setFirstSelectedCell] = useState<[number, number]>([
    -1, -1,
  ]);
  const tileSize = 65;

  function handlePlayerMove(r: number, c: number) {
    if (!engine) return;
    if (
      firstSelectedCell[0] === -1 &&
      board[r][c] === engine.getState().currentPlayer.toString()
    ) {
      setFirstSelectedCell([r, c]);
      const validMoves = engine?.getValidMoves();
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
      }
    }
  }

  function getDirection(
    firstSelectedCell: [number, number],
    secondSelectedCell: [number, number]
  ) {
    const rowDiff = secondSelectedCell[0] - firstSelectedCell[0];
    const colDiff = secondSelectedCell[1] - firstSelectedCell[1];
    if (rowDiff === 1) {
      return "down";
    }
    if (rowDiff === -1) {
      return "up";
    }
    if (colDiff === 1) {
      return "right";
    }
    if (colDiff === -1) {
      return "left";
    }
  }

  useEffect(() => {
    const game = new QuoridorGameEngine();
    setEngine(game);
    setBoard(renderBoard(game));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).engine = game;

    const handler = () => {
      setBoard(renderBoard(game));
    };
    eventBus.on("gameStateUpdated", handler);
  }, []);

  return (
    <main className="flex flex-col gap-4 p-4 items-center">
      {engine && (
        <div className="text-sm text-gray-700">
          {/* <div className="flex gap-8">
            <p>Current Player: Player {engine.getState().currentPlayer}</p>
            <p>
              Player 1 Walls Remaining:{" "}
              {engine.getState().players[1].wallsRemaining}
            </p>
            <p>
              Player 2 Walls Remaining:{" "}
              {engine.getState().players[2].wallsRemaining}
            </p>
            <p>Total Walls Placed: {engine.getState().walls.length}</p>
            {engine.getState().gameOver && (
              <p className="text-green-700 font-semibold">
                🎉 Player {engine.getState().winner} wins!
              </p>
            )}
          </div> */}
          {/* board */}
          <div className="flex flex-col gap-2">
            {board.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((cell, c) => (
                  <div
                    key={c}
                    className="border border-gray-300"
                    onClick={() => handlePlayerMove(r, c)}
                  >
                    {cell === "." && (
                      <Tile width={tileSize} height={tileSize} />
                    )}
                    {cell === "1" && (
                      <TilePlayer1 width={tileSize} height={tileSize} />
                    )}
                    {cell === "2" && (
                      <TilePlayer2 width={tileSize} height={tileSize} />
                    )}
                    {cell === "X" && (
                      <TileValid width={tileSize} height={tileSize} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
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

  for (const wall of state.walls) {
    if (wall.orientation === "horizontal") {
      board[wall.row][wall.col] = "-";
    } else {
      board[wall.row][wall.col] = "|";
    }
  }

  return board;
}
