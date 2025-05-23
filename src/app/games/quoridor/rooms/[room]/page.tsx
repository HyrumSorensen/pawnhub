"use client";

import { useEffect, useState } from "react";
import { QuoridorGameEngine, GameState } from "../../QuoridorGameEngine";
import { eventBus } from "../../QuoridorEventSingleton";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import Tile from "../../assets/Tile";
import TileValid from "../../assets/TileValid";
import TilePlayer1 from "../../assets/TilePlayer1";
import TilePlayer2 from "../../assets/TilePlayer2";
import TilePlayer3 from "../../assets/TilePlayer3";
import TilePlayer4 from "../../assets/TilePlayer4";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import ChatBox from "../../../../../components/ChatBox";
import QuoridorTutorial from "../../components/QuoridorTutorial";

export default function HomePage() {
  const params = useParams();
  const roomId = params.room as string;
  const createGame = useMutation(api.games.createGame);
  const joinGame = useMutation(api.games.joinGame);
  const updateGameState = useMutation(api.games.updateGameState);
  const getGameState = useQuery(api.games.getGameState, { room: roomId });
  const getGame = useQuery(api.games.getGame, { room: roomId });
  const setGameCompleted = useMutation(api.games.setGameCompleted);
  const closeGame = useMutation(api.games.closeGame);
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  const [engine, setEngine] = useState<QuoridorGameEngine | null>(null);
  const [board, setBoard] = useState<string[][]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [firstSelectedCell, setFirstSelectedCell] = useState<[number, number]>([
    -1, -1,
  ]);
  const [mode, setMode] = useState<"move" | "place-wall">("move");
  const [hoveredWall, setHoveredWall] = useState<{
    row: number;
    col: number;
    orientation: "horizontal" | "vertical";
    length: number;
    hoverSide: "left" | "right" | "top" | "bottom";
  } | null>(null);

  const tileSize = 65;

  // Effect to handle game state updates from Convex
  useEffect(() => {
    if (getGameState && engine) {
      try {
        const newState = JSON.parse(getGameState[getGameState.length - 1]);
        if (newState.gameOver) {
          setGameCompleted({ room: roomId });
          if (newState.winner === 1) {
            alert("Player 1 wins!");
          } else {
            alert("Player 2 wins!");
          }
        } else {
          if (newState) {
            engine.setState(newState);
            setBoard(renderBoard(engine));
          }
        }
      } catch (e) {
        console.error("Failed to parse game state:", e);
      }
    }
  }, [getGameState, engine, setGameCompleted, roomId]);

  // Effect to initialize the game
  useEffect(() => {
    const game = new QuoridorGameEngine();
    setEngine(game);
    setBoard(renderBoard(game));

    const newGameId = uuidv4();
    setGameId(newGameId);

    if (userId) {
      async function createOrJoinRoom(userId: Id<"users">) {
        const res = await createGame({
          room: roomId,
          player1: userId,
          initialState: game.serializeState(),
          createdAt: Date.now(),
          game: "quoridor"
        });

        if (res) {
          const parsedRes = JSON.parse(res);
          if (parsedRes.error) {
            if (parsedRes.error === "A game with this room ID already exists") {
              await joinGame({
                room: roomId,
                player: userId,
              });
            }
          }
        }
      }

      createOrJoinRoom(userId);
    }

    const handler = () => {
      setBoard(renderBoard(game));
    };
    eventBus.on("gameStateUpdated", handler);

    return () => {
      eventBus.off("gameStateUpdated", handler);
    };
  }, [userId, createGame, roomId, joinGame, getGame]);

  useEffect(() => {
    if (
      engine === null ||
      userId === undefined ||
      getGame === undefined ||
      getGame === null ||
      getGameState === undefined ||
      getGameState === null ||
      getGameState.length === 0
    ) {
      return;
    }

    // Parse the latest state from the DB
    const latestSerialized = getGameState[getGameState.length - 1];
    let latestState: GameState;

    try {
      latestState = JSON.parse(latestSerialized);
    } catch (e) {
      console.error("Failed to parse game state:", e);
      return;
    }

    // Already a 4-player game? Do nothing
    const existingPlayerCount = Object.keys(latestState.players).length;
    if (existingPlayerCount >= 4) return;

    // Check how many players have joined the room
    const joinedPlayers = [
      getGame.player1,
      getGame.player2,
      getGame.player3,
      getGame.player4,
    ].filter(Boolean);

    // Promote only if 3 or more players have joined
    if (joinedPlayers.length >= 3) {
      const newEngine = new QuoridorGameEngine(4);
      setEngine(newEngine);
      setBoard(renderBoard(newEngine));

      updateGameState({
        room: roomId,
        state: newEngine.serializeState(),
      });
    }
  }, [engine, userId, getGame, getGameState, updateGameState, roomId]);

  async function maybeCloseGame() {
    if (!getGame || !getGame.open) return;

    const players = [
      getGame.player1,
      getGame.player2,
      getGame.player3,
      getGame.player4,
    ].filter(Boolean);

    const numPlayers = players.length;

    // If 4 players joined, lock the game
    if (numPlayers === 4) {
      await closeGame({ room: roomId });
      return;
    }

    // If 2 players and someone has made a move, lock it
    const gameState = engine?.getState();
    if (
      numPlayers === 2 &&
      gameState &&
      (gameState.players[1].position.row !== 0 ||
        gameState.players[2].position.row !== gameState.boardSize - 1)
    ) {
      await closeGame({ room: roomId });
    }
  }

  async function updateCurrentGameState() {
    if (!engine || !gameId) return;

    await updateGameState({
      room: roomId,
      state: engine.serializeState(),
    });
  }

  function handlePlayerMove(r: number, c: number) {
    if (!engine || mode !== "move" || !userId || !getGameState || !getGame)
      return;

    const currentState = engine.getState();
    const currentPlayer = currentState.currentPlayer;
    const isCurrentPlayer =
      (currentPlayer === 1 && userId === getGame.player1) ||
      (currentPlayer === 2 && userId === getGame.player2) ||
      (currentPlayer === 3 && userId === getGame.player3) ||
      (currentPlayer === 4 && userId === getGame.player4);

    if (!isCurrentPlayer) {
      return;
    }

    if (
      firstSelectedCell[0] === -1 &&
      board[r][c] === currentPlayer.toString()
    ) {
      setFirstSelectedCell([r, c]);
      engine.getValidMoves();
      setBoard(renderBoard(engine));
    } else {
      const success = engine.movePawnTo(currentPlayer, { row: r, col: c });
      if (success) {
        setFirstSelectedCell([-1, -1]);
        updateCurrentGameState();
        maybeCloseGame();
      } else {
        setFirstSelectedCell([-1, -1]);
        engine.clearCurrentValidMoves();
      }
      setBoard(renderBoard(engine));
    }
  }

  function handleWallPlacement(
    row: number,
    col: number,
    orientation: "horizontal" | "vertical",
    length: number = 2
  ) {
    if (!engine || !userId || !getGameState || !getGame) return;

    const currentState = engine.getState();
    const currentPlayer = currentState.currentPlayer;

    // Check if the current user is the current player
    const isCurrentPlayer =
      (currentPlayer === 1 && userId === getGame.player1) ||
      (currentPlayer === 2 && userId === getGame.player2) ||
      (currentPlayer === 3 && userId === getGame.player3) ||
      (currentPlayer === 4 && userId === getGame.player4);

    if (!isCurrentPlayer) {
      console.warn("Not your turn!");
      return;
    }

    const success = engine.placeWall(currentPlayer, {
      row,
      col,
      orientation,
      length,
    });

    // logging success to fix linting error
    console.log("log to fix success var linting error", success);

    setHoveredWall(null);
    updateCurrentGameState();
  }

  return (
    <main className="flex flex-col gap-4 p-4 items-center">
      <div className="flex flex-row gap-4">
        {engine && (
          <>
            <div className="flex flex-col gap-4">
              {/* Top row of buttons (like toggle wall/move) */}
              <div className="flex flex-row gap-2">
                {mode === "move" ? (
                  <button
                    onClick={() => setMode("place-wall")}
                    className="w-36 px-4 py-2 rounded text-sm font-medium shadow bg-gray-200 hover:bg-gray-300"
                  >
                    Place Wall Mode
                  </button>
                ) : (
                  <button
                    onClick={() => setMode("move")}
                    className="w-36 px-4 py-2 rounded text-sm font-medium shadow bg-blue-600 text-white"
                  >
                    Move Mode
                  </button>
                )}

                {/* You can add more buttons here */}
              </div>

              {/* Other UI elements can go below right here */}

              {/* Wall count display */}
              <div className="flex flex-col gap-2 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span>
                    Player 1 Walls Left:{" "}
                    {engine?.getState().players[1].wallsRemaining}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                  <span>
                    Player 2 Walls Left:{" "}
                    {engine?.getState().players[2].wallsRemaining}
                  </span>
                </div>
              </div>
              {engine?.getState().players[3] && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-600"></div>
                  <span>
                    Player 3 Walls Left:{" "}
                    {engine.getState().players[3].wallsRemaining}
                  </span>
                </div>
              )}

              {engine?.getState().players[4] && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>
                    Player 4 Walls Left:{" "}
                    {engine.getState().players[4].wallsRemaining}
                  </span>
                </div>
              )}

              {/* End other ui elements */}
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
                        {/* Order matters here: show player icon above grey dot */}
                        {cell === "1" && (
                          <TilePlayer1 width={tileSize} height={tileSize} />
                        )}
                        {cell === "2" && (
                          <TilePlayer2 width={tileSize} height={tileSize} />
                        )}
                        {cell === "3" && (
                          <TilePlayer3 width={tileSize} height={tileSize} />
                        )}
                        {cell === "4" && (
                          <TilePlayer4 width={tileSize} height={tileSize} />
                        )}
                        {cell === "X" && (
                          <TileValid width={tileSize} height={tileSize} />
                        )}
                        {cell === "." && (
                          <Tile width={tileSize} height={tileSize} />
                        )}
                      </div>
                    );
                  }

                  const isVertical = rowIdx % 2 === 0 && colIdx % 2 === 1;
                  const isHorizontal = rowIdx % 2 === 1 && colIdx % 2 === 0;

                  const wallRow = Math.floor(rowIdx / 2);
                  const wallCol = Math.floor(colIdx / 2);

                  const wallExists = engine.getState().walls.some((w) => {
                    const length = w.length ?? 2;
                    for (let i = 0; i < length; i++) {
                      const wRow =
                        w.orientation === "vertical" ? w.row + i : w.row;
                      const wCol =
                        w.orientation === "horizontal" ? w.col + i : w.col;

                      if (
                        wRow === wallRow &&
                        wCol === wallCol &&
                        w.orientation ===
                          (isHorizontal ? "horizontal" : "vertical")
                      ) {
                        return true;
                      }
                    }
                    return false;
                  });

                  const isHovered = (() => {
                    if (!hoveredWall) return false;

                    const {
                      row: hRow,
                      col: hCol,
                      orientation,
                      length,
                      // hoverSide,
                    } = hoveredWall;

                    if (
                      orientation === "horizontal" &&
                      isHorizontal &&
                      wallRow === hRow
                    ) {
                      // Highlight one or two horizontal segments depending on hover side
                      if (length === 1) {
                        return wallCol === hCol;
                      } else {
                        return wallCol === hCol || wallCol === hCol + 1;
                      }
                    }

                    if (
                      orientation === "vertical" &&
                      isVertical &&
                      wallCol === hCol
                    ) {
                      // Highlight one or two vertical segments depending on hover side
                      if (length === 1) {
                        return wallRow === hRow;
                      } else {
                        return wallRow === hRow || wallRow === hRow + 1;
                      }
                    }

                    return false;
                  })();

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      style={{
                        backgroundImage: wallExists
                          ? `url("/assets/${isHorizontal ? "horizontal-wall" : "wall"}.svg")`
                          : isHovered
                            ? "linear-gradient(gray, gray)" // fallback gray on hover
                            : "none",
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        transition: "background 0.1s",
                      }}
                      onMouseMove={(e) => {
                        if (mode === "place-wall") {
                          const target = e.target as HTMLDivElement;
                          const rect = target.getBoundingClientRect();
                          const offsetX = e.clientX - rect.left;
                          const offsetY = e.clientY - rect.top;

                          const isHoveringLeft = offsetX < tileSize / 2;
                          const isHoveringTop = offsetY < tileSize / 2;

                          let newRow = wallRow;
                          let newCol = wallCol;
                          let length = 2;

                          const orientation = (
                            isHorizontal ? "horizontal" : "vertical"
                          ) as "horizontal" | "vertical";

                          let hoverSide: "left" | "right" | "top" | "bottom" =
                            "left";

                          const boardSize = engine?.getState().boardSize ?? 9;

                          if (orientation === "horizontal") {
                            hoverSide = isHoveringLeft ? "left" : "right";

                            if (isHoveringLeft) {
                              if (wallCol <= 0) {
                                newCol = 0;
                                length = 1;
                              } else {
                                newCol = wallCol - 1;
                                length = 2;
                              }
                            } else {
                              if (wallCol >= boardSize - 1) {
                                newCol = wallCol;
                                length = 1;
                              } else {
                                newCol = wallCol;
                                length = 2;
                              }
                            }
                          }

                          if (orientation === "vertical") {
                            hoverSide = isHoveringTop ? "top" : "bottom";

                            if (isHoveringTop) {
                              if (wallRow <= 0) {
                                newRow = 0;
                                length = 1;
                              } else {
                                newRow = wallRow - 1;
                                length = 2;
                              }
                            } else {
                              if (wallRow >= boardSize - 1) {
                                newRow = wallRow;
                                length = 1;
                              } else {
                                newRow = wallRow;
                                length = 2;
                              }
                            }
                          }

                          const newHovered = {
                            row: newRow,
                            col: newCol,
                            orientation,
                            length,
                            hoverSide,
                          };

                          if (
                            !hoveredWall ||
                            hoveredWall.row !== newHovered.row ||
                            hoveredWall.col !== newHovered.col ||
                            hoveredWall.orientation !==
                              newHovered.orientation ||
                            hoveredWall.length !== newHovered.length ||
                            hoveredWall.hoverSide !== newHovered.hoverSide
                          ) {
                            setHoveredWall(newHovered);
                          }
                        }
                      }}
                      onMouseLeave={() => {
                        if (mode === "place-wall") {
                          setHoveredWall(null);
                        }
                      }}
                      onClick={() => {
                        if (mode === "place-wall" && hoveredWall) {
                          const { row, col, orientation, length } = hoveredWall;

                          handleWallPlacement(row, col, orientation, length);
                        }
                      }}
                    />
                  );
                })
              )}
            </div>
          </>
        )}
        <ChatBox room={roomId} playerId={userId!} user={user!} />
        <QuoridorTutorial />
      </div>
    </main>
  );
}

function renderBoard(engine: QuoridorGameEngine): string[][] {
  const state = engine.getState();
  const board: string[][] = [];

  for (let r = 0; r < state.boardSize; r++) {
    board[r] = [];
    for (let c = 0; c < state.boardSize; c++) {
      board[r][c] = ".";
    }
  }

  // Place valid move hints, unless occupied by a player
  for (const move of state.currentValidMoves) {
    const isPlayer1 =
      state.players[1].position.row === move.row &&
      state.players[1].position.col === move.col;
    const isPlayer2 =
      state.players[2].position.row === move.row &&
      state.players[2].position.col === move.col;

    if (!isPlayer1 && !isPlayer2) {
      board[move.row][move.col] = "X"; // Valid move indicator
    }
  }

  // Place players (always on top)
  Object.entries(state.players).forEach(([playerId, data]) => {
    board[data.position.row][data.position.col] = playerId;
  });

  return board;
}
