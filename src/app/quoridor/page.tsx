'use client';

import { useEffect, useState } from 'react';
import { QuoridorGameEngine } from './QuoridorGameEngine';

export default function HomePage() {
  const [engine, setEngine] = useState<QuoridorGameEngine | null>(null);

  useEffect(() => {
    const game = new QuoridorGameEngine();
    setEngine(game);

    console.log('New game started.');
    printBoard(game);

    // Expose to console for manual testing
    (window as any).engine = game;
    (window as any).printBoard = () => printBoard(game);
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-2">Quoridor Dev Console</h1>
      <p className="mb-2">Open the browser console to test moves manually.</p>
      <ul className="mb-4 list-disc pl-6 text-sm text-gray-600">
        <li>
          <code>engine.movePawn(1, 'down')</code>
        </li>
        <li>
          <code>engine.placeWall(1, &#123; row: 2, col: 4, orientation: 'horizontal' &#125;)</code>
        </li>
        <li>
          <code>printBoard()</code>
        </li>
      </ul>

      {engine && (
        <div className="text-sm text-gray-700">
          <p>Current Player: Player {engine.getState().currentPlayer}</p>
          <p>Player 1 Walls Remaining: {engine.getState().players[1].wallsRemaining}</p>
          <p>Player 2 Walls Remaining: {engine.getState().players[2].wallsRemaining}</p>
          <p>Total Walls Placed: {engine.getState().walls.length}</p>
          {engine.getState().gameOver && (
            <p className="text-green-700 font-semibold">
              🎉 Player {engine.getState().winner} wins!
            </p>
          )}
        </div>
      )}
    </main>
  );
}

// 👇 Simple console-based board printer
function printBoard(engine: QuoridorGameEngine) {
    const state = engine.getState();
    const board: string[][] = [];
  
    for (let r = 0; r < state.boardSize; r++) {
      board[r] = [];
      for (let c = 0; c < state.boardSize; c++) {
        board[r][c] = '.';
      }
    }
  
    board[state.players[1].position.row][state.players[1].position.col] = '1';
    board[state.players[2].position.row][state.players[2].position.col] = '2';
  
    let output = 'Current board:\n';
    for (let row of board) {
      output += row.join(' ') + '\n';
    }
  
    output += `\nWalls placed: ${state.walls.length}\n`;
    output += `Player 1 walls remaining: ${state.players[1].wallsRemaining}\n`;
    output += `Player 2 walls remaining: ${state.players[2].wallsRemaining}\n`;
    output += `Current turn: Player ${state.currentPlayer}\n`;
  
    if (state.gameOver) {
      output += `🎉 Player ${state.winner} wins!\n`;
    }
  
    // Send to server to write to file
    fetch('/api/log-board', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: output,
    });
  }
  
  
