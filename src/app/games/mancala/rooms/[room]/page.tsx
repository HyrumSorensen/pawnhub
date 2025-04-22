// app/games/mancala/rooms/[room]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { MancalaGameEngine, MancalaGameState } from "../../MancalaGameEngine";
import { eventBus } from "../../MancalaEventSingleton"; // reuse the same eventBus
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import Image from "next/image";
import ChatBox from "@/components/ChatBox";

export default function MancalaRoomPage() {
  const params = useParams();
  const roomId = params.room as string;

  const createGame = useMutation(api.games.createGame);
  const joinGame = useMutation(api.games.joinGame);
  const updateGameState = useMutation(api.games.updateGameState);
  const setGameCompleted = useMutation(api.games.setGameCompleted);

  const getGame = useQuery(api.games.getGame, { room: roomId });
  const getGameState = useQuery(api.games.getGameState, { room: roomId });
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  const [engine, setEngine] = useState<MancalaGameEngine | null>(null);
  const [localState, setLocalState] = useState<MancalaGameState | null>(null);

  // Initialize engine
  useEffect(() => {
    if (!userId) return;
  
    const eng = new MancalaGameEngine();
    setEngine(eng);
    setLocalState(eng.getState());
  
    (async () => {
      const res = await createGame({
        room: roomId,
        player1: userId,
        initialState: eng.serializeState(),
        createdAt: Date.now(),
      });
  
      const parsed = res && JSON.parse(res);
      if (parsed?.error) {
        await joinGame({ room: roomId, player: userId });
      }
    })();
  
    const handler = () => {
      setLocalState(eng.getState());
    };
    eventBus.on("gameStateUpdated", handler);
  
    return () => {
      eventBus.off("gameStateUpdated", handler);
    };
  }, [createGame, joinGame, roomId, userId]);
  

  // Sync remote state to engine
  useEffect(() => {
    if (getGameState && engine) {
      const last = getGameState[getGameState.length - 1];
      if (!last) return;

      try {
        const parsed = JSON.parse(last);
        engine.loadState(last);
        setLocalState(parsed);
        if (parsed.gameOver) {
          setGameCompleted({ room: roomId });
          const winMsg =
            parsed.winner === 1 ? "Player 1 wins!" : "Player 2 wins!";
          alert(winMsg);
        }
      } catch (err) {
        console.error("Bad state parse:", err);
      }
    }
  }, [getGameState, engine, setGameCompleted, roomId]);

  async function handleMove(pitIndex: number) {
    if (!engine || !userId || !getGame || !localState) return;

    const current = localState.currentPlayer;
    const isMyTurn =
      (current === 1 && userId === getGame.player1) ||
      (current === 2 && userId === getGame.player2);

    if (!isMyTurn) return;

    const success = engine.move(current, pitIndex);
    if (success) {
      setLocalState(engine.getState());
      await updateGameState({
        room: roomId,
        state: engine.serializeState(),
      });
    }
  }

  if (!localState) return <div className="p-4 text-center">Loading...</div>;

  const board = localState.board;

  return (
    <main className="flex flex-col gap-4 p-4 items-center">
      <h1 className="text-3xl font-bold mb-2">Mancala</h1>

      <div className="flex flex-col gap-4 items-center">
        {/* Upper row (Player 2 pits) */}
        <div className="flex flex-row gap-2">
            {[12, 11, 10, 9, 8, 7].map((index) => (
                <Pit
                key={`p2-${index}`}
                count={board[index]}
                onClick={() => handleMove(index)}
                isClickable={localState.currentPlayer === 2}
                />
            ))}
            </div>


        {/* Store row */}
        <div className="flex flex-row items-center gap-2">
          <Store label="P2" count={board[13]} />
          <div className="flex gap-2">{/* space for center or arrow */}</div>
          <Store label="P1" count={board[6]} />
        </div>

        {/* Lower row (Player 1 pits) */}
        <div className="flex flex-row gap-2">
          {board.slice(0, 6).map((count, i) => (
            <Pit
              key={`p1-${i}`}
              count={count}
              onClick={() => handleMove(i)}
              isClickable={localState.currentPlayer === 1}
            />
          ))}
        </div>
      </div>

      <ChatBox room={roomId} playerId={userId!} user={user!} />
    </main>
  );
}

function Pit({
  count,
  onClick,
  isClickable,
}: {
  count: number;
  onClick: () => void;
  isClickable: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isClickable || count === 0}
      className="relative w-16 h-16 bg-amber-100 rounded-full shadow-md hover:brightness-105 transition"
    >
      <Image
        src="/assets/mancala-pit.png"
        alt="Pit"
        fill
        className="object-cover rounded-full opacity-90"
      />
      <span className="relative z-10 font-semibold text-lg">{count}</span>
    </button>
  );
}

function Store({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-32 bg-yellow-200 rounded-lg shadow-inner relative">
        <Image
          src="/assets/mancala-store.png"
          alt={`${label} Store`}
          fill
          className="object-cover rounded-lg opacity-90"
        />
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
          {count}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}
