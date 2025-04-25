"use client";

import { useEffect, useState } from "react";
import { TicTacToeGameEngine } from "../../TicTacToeGameEngine";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import ChatBox from "../../../../../components/ChatBox";

export default function TicTacToeRoom() {
  const params = useParams();
  const roomId = params.room as string;
  const createGame = useMutation(api.games.createGame);
  const joinGame = useMutation(api.games.joinGame);
  const updateGameState = useMutation(api.games.updateGameState);
  const getGameState = useQuery(api.games.getGameState, { room: roomId });
  const getGame = useQuery(api.games.getGame, { room: roomId });
  const setGameCompleted = useMutation(api.games.setGameCompleted);
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  const [engine, setEngine] = useState<TicTacToeGameEngine | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  // Effect to handle game state updates from Convex
  useEffect(() => {
    if (getGameState && engine) {
      try {
        const newState = JSON.parse(getGameState[getGameState.length - 1]);
        if (newState.gameOver) {
          setGameCompleted({ room: roomId });
          if (newState.winner) {
            alert(`Player ${newState.winner} wins!`);
          } else {
            alert("It's a draw!");
          }
        } else {
          if (newState) {
            engine.loadState(getGameState[getGameState.length - 1]);
          }
        }
      } catch (e) {
        console.error("Failed to parse game state:", e);
      }
    }
  }, [getGameState, engine, setGameCompleted, roomId]);

  // Effect to initialize the game
  useEffect(() => {
    const game = new TicTacToeGameEngine();
    setEngine(game);

    const newGameId = uuidv4();
    setGameId(newGameId);

    if (userId) {
      async function createOrJoinRoom(userId: Id<"users">) {
        const res = await createGame({
          room: roomId,
          player1: userId,
          initialState: game.serializeState(),
          createdAt: Date.now(),
          game: "tic-tac-toe"
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
  }, [userId, createGame, roomId, joinGame, getGame]);

  async function updateCurrentGameState() {
    if (!engine || !gameId) return;

    await updateGameState({
      room: roomId,
      state: engine.serializeState(),
    });
  }

  function handleCellClick(row: number, col: number) {
    if (!engine || !userId || !getGameState || !getGame) return;

    const currentState = engine.getState();
    const currentPlayer = currentState.currentPlayer;
    const isCurrentPlayer =
      (currentPlayer === 1 && userId === getGame.player1) ||
      (currentPlayer === 2 && userId === getGame.player2);

    if (!isCurrentPlayer) {
      return;
    }

    const success = engine.makeMove({ row, col });
    if (success) {
      updateCurrentGameState();
    }
  }

  return (
    <main className="flex flex-col gap-4 p-4 items-center">
      <div className="flex flex-row gap-4">
        {engine && (
          <div className="grid grid-cols-3 gap-2 bg-gray-200 p-4 rounded-lg">
            {engine.getState().board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className="w-20 h-20 bg-white flex items-center justify-center text-4xl font-bold rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={cell !== null || engine.getState().gameOver}
                >
                  {cell === 1 ? "X" : cell === 2 ? "O" : ""}
                </button>
              ))
            )}
          </div>
        )}
        <ChatBox room={roomId} playerId={userId!} user={user!} />
      </div>
    </main>
  );
}
