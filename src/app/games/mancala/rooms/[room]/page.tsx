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
  const recordGameResult = useMutation(api.gameResults.recordGameResult);


  const getGame = useQuery(api.games.getGame, { room: roomId });
  const getGameState = useQuery(api.games.getGameState, { room: roomId });
  const userId = useQuery(api.users.getCurrentUserId);
  const user = useQuery(api.users.getUserById, userId ? { userId } : "skip");

  const [engine, setEngine] = useState<MancalaGameEngine | null>(null);
  const [localState, setLocalState] = useState<MancalaGameState | null>(null);

  const [showEndScreen, setShowEndScreen] = useState(false);
const [didWin, setDidWin] = useState<boolean | null>(null);


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
        game: "mancala"
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
    if (!getGameState || !engine) return;
  
    const syncGameState = async () => {
      const last = getGameState[getGameState.length - 1];
      if (!last) return;
  
      try {
        const parsed = JSON.parse(last);
        engine.loadState(last);
        setLocalState(parsed);
  
        if (parsed.gameOver) {
          setGameCompleted({ room: roomId });
  
          const iWon =
            (parsed.winner === 1 && userId === getGame?.player1) ||
            (parsed.winner === 2 && userId === getGame?.player2);
  
          setDidWin(iWon);
          setShowEndScreen(true);
  
          if (userId && getGame) {
            await recordGameResult({
              userId,
              game: "mancala",
              gameId: getGame._id,
              won: iWon ?? false,
            });
          }
        }
  
      } catch (err) {
        console.error("Bad state parse:", err);
      }
    };
  
    syncGameState(); // 👈 call the async inner function manually
  }, [getGameState, engine, setGameCompleted, roomId, getGame, recordGameResult, userId]);
  

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
  async function handlePlayAgain() {
    if (!engine || !userId) return;
  
    engine.resetGame(); // <-- correct method name
    setLocalState(engine.getState());
  
    await updateGameState({
      room: roomId,
      state: engine.serializeState(),
    });
  
    setShowEndScreen(false);
    setDidWin(null);
  }
  
  

  if (!localState) return <div className="p-4 text-center">Loading...</div>;

  const board = localState.board;

  return (
    <main className="flex gap-12 p-4 justify-center">
      <div className="flex flex-col items-center justify-center">
        <div className="bg-white/90 p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold mb-2">Current Turn</h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${localState.currentPlayer === 1 ? "bg-blue-500" : "bg-gray-300"}`}
            />
            <span className="font-medium">
              Player {localState.currentPlayer}
            </span>
          </div>
          {getGame && (
            <div className="text-sm text-gray-600 mt-2">
              {localState.currentPlayer === 1
                ? userId === getGame.player1
                  ? "Your turn"
                  : "Opponent's turn"
                : userId === getGame.player2
                  ? "Your turn"
                  : "Opponent's turn"}
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex gap-4 items-center bg-[url('/assets/mancala/wood-bg.svg')] bg-cover bg-center h-full py-4 px-8 rounded-xl`}
      >
        <Store label="P2" count={board[13]} labelPos="bottom" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
          {[12, 11, 10, 9, 8, 7].map((index) => (
              <Pit
                key={`p2-${index}`}
                count={board[index]}
                onClick={() => handleMove(index)}
                isClickable={localState.currentPlayer === 2}
                labelPos="bottom"
              />
            ))}
          </div>
          <div className="p-2"></div>
          <div className="flex flex-row gap-2">
            {board.slice(0, 6).map((count, i) => (
              <Pit
                key={`p1-${i}`}
                count={count}
                onClick={() => handleMove(i)}
                isClickable={localState.currentPlayer === 1}
                labelPos="top"
              />
            ))}
          </div>
        </div>
        <Store label="P1" count={board[6]} labelPos="top" />
      </div>

      <ChatBox room={roomId} playerId={userId!} user={user!} />

      {showEndScreen && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full">
      <h1 className={`text-4xl font-bold mb-4 ${didWin ? "text-green-500" : "text-red-500"}`}>
        {didWin ? "YOU WON!" : "YOU LOST"}
      </h1>
      <p className="text-gray-700 text-lg mb-8 text-center">
        {didWin ? "Congratulations on your victory!" : "Better luck next time!"}
      </p>
      <div className="flex gap-4">
        <button
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
          onClick={() => window.location.href = "/games"}
        >
          Browse Games
        </button>
        <button
          className="px-5 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-semibold"
          onClick={handlePlayAgain}
        >
          Play Again
        </button>
      </div>
    </div>
  </div>
)}


    </main>
  );
}

function Pit({
  count,
  onClick,
  isClickable,
  labelPos,
}: {
  count: number;
  onClick: () => void;
  isClickable: boolean;
  labelPos: "top" | "bottom";
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {labelPos === "top" && (
        <span className="relative z-10 font-semibold text-lg">{count}</span>
      )}
      <button
        onClick={onClick}
        disabled={!isClickable || count === 0}
        className="relative w-24 h-24 bg-amber-100 rounded-full shadow-md hover:brightness-105 transition"
      >
        {count === 0 ? (
          <Image
            src="/assets/mancala/pit-empty.svg"
            alt="Pit"
            fill
            className="object-cover rounded-full opacity-90"
          />
        ) : count > 4 ? (
          <Image
            src={`/assets/mancala/pit-4.svg`}
            alt="Pit"
            fill
            className="object-cover rounded-full opacity-90"
          />
        ) : (
          <Image
            src={`/assets/mancala/pit-${count}.svg`}
            alt="Pit"
            fill
            className="object-cover rounded-full opacity-90"
          />
        )}
      </button>
      {labelPos === "bottom" && (
        <span className="relative z-10 font-semibold text-lg">{count}</span>
      )}
    </div>
  );
}

function Store({
  label,
  count,
  labelPos,
}: {
  label: string;
  count: number;
  labelPos: "top" | "bottom";
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {labelPos === "top" && (
        <span className="text-sm font-medium">{label}</span>
      )}
      {labelPos === "bottom" && (
        <span className="relative z-10 font-semibold text-lg">{count}</span>
      )}

      <div className="w-24 h-72 bg-yellow-200 rounded-xl shadow-inner relative">
        {count === 0 ? (
          <Image
            src="/assets/mancala/store-empty.svg"
            alt={`${label} Store`}
            fill
            className="object-cover rounded-xl opacity-90"
          />
        ) : count > 4 ? (
          <Image
            src="/assets/mancala/store-4.svg"
            alt={`${label} Store`}
            fill
            className="object-cover rounded-xl opacity-90"
          />
        ) : (
          <Image
            src={`/assets/mancala/store-${count}.svg`}
            alt={`${label} Store`}
            fill
            className="object-cover rounded-xl opacity-90"
          />
        )}
      </div>
      {labelPos === "bottom" && (
        <span className="text-sm font-medium">{label}</span>
      )}
      {labelPos === "top" && (
        <span className="relative z-10 font-semibold text-lg">{count}</span>
      )}
    </div>
  );
}
