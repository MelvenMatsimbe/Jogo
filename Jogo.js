t React, { useState, useEffect, useCallback, useRef } from 'react';
import GameSetup from './components/GameSetup';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import PlayerInfo from './components/PlayerInfo';
import { checkWin, checkDraw, initializeBoard, getComputerMove } from './utils/gameLogic';
import { ROWS, COLS, MAX_TIME } from './utils/constants';
import './App.css';

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([
    { name: '', color: '#FF5252' },
    { name: '', color: '#FFEB3B' }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [board, setBoard] = useState([]);
  const [timer, setTimer] = useState(0);
  const [gameMode, setGameMode] = useState('pvp');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [hoverColumn, setHoverColumn] = useState(null);
  const [animatingColumn, setAnimatingColumn] = useState(null);
  const [animatingRow, setAnimatingRow] = useState(null);
  const [specialCells, setSpecialCells] = useState([]);
  const [winningCells, setWinningCells] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameStarted) {
      const { board: newBoard, specialCells: specialPositions } = initializeBoard();
      setBoard(newBoard);
      setSpecialCells(specialPositions);
    }
  }, [gameStarted]);

  // Timer
  useEffect(() => {
    if (gameStarted && winner === null && !isDraw) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev >= MAX_TIME - 1) {
            setCurrentPlayer(1 - currentPlayer);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [gameStarted, winner, isDraw, currentPlayer]);

  const startGame = (player1Name, player2Name, mode) => {
    const firstPlayer = Math.floor(Math.random() * 2);
    const colors = ['#FF5252', '#FFEB3B'];
    const randomColorIndex = Math.floor(Math.random() * 2);
    
    setPlayers([
      { name: player1Name, color: colors[randomColorIndex] },
      { name: mode === 'pvp' ? player2Name : 'Computer', color: colors[1 - randomColorIndex] }
    ]);
    setGameMode(mode);
    setCurrentPlayer(firstPlayer);
    setTimer(0);
    setWinner(null);
    setIsDraw(false);
    setWinningCells([]);
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setCurrentPlayer(0);
    setBoard([]);
    setTimer(0);
    setWinner(null);
    setIsDraw(false);
    setHoverColumn(null);
    setAnimatingColumn(null);
    setAnimatingRow(null);
    setWinningCells([]);
  };

  const handleColumnClick = (col) => {
  if (winner !== null || isDraw || animatingColumn !== null) return;

  let row = ROWS - 1;
  while (row >= 0 && board[row][col].player !== null) row--;
  if (row < 0) return;

  setAnimatingColumn(col);
  setAnimatingRow(row);

  setTimeout(() => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = { ...newBoard[row][col], player: currentPlayer };

    const winResult = checkWin(newBoard, row, col, currentPlayer);
    if (winResult.isWin) {
      clearInterval(timerRef.current);
      setBoard(newBoard);
      setWinner(currentPlayer);
      setWinningCells(winResult.winningCells);
      setAnimatingColumn(null);
      setAnimatingRow(null);
      return;
    }

    if (checkDraw(newBoard)) {
      clearInterval(timerRef.current);
      setBoard(newBoard);
      setIsDraw(true);
      setAnimatingColumn(null);
      setAnimatingRow(null);
      return;
    }

    setBoard(newBoard);
    setTimer(0);
    if (!newBoard[row][col].isSpecial) {
      setCurrentPlayer(cp => 1 - cp);
    }
    setAnimatingColumn(null);
    setAnimatingRow(null);
  }, 500);
};

  useEffect(() => {
    if (
      gameStarted &&
      gameMode === 'pvc' &&
      players[1].name === 'Computer' &&
      currentPlayer === 1 &&
      winner === null &&
      !isDraw
    ) {
      const timeout = setTimeout(() => {
        const col = getComputerMove(board);
        if (col !== -1) {
          handleColumnClick(col);
        }
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, gameStarted, gameMode, players, winner, isDraw, board]);

  return (
    <div className="app">
      <h1 className="app-title">4 em Linha Especial</h1>
      
      {!gameStarted ? (
        <GameSetup 
          startGame={startGame} 
          gameMode={gameMode} 
          setGameMode={setGameMode}
        />
      ) : (
        <div className="game-container">
          <PlayerInfo 
            players={players} 
            currentPlayer={currentPlayer} 
            winner={winner} 
            isDraw={isDraw} 
            timer={timer} 
            maxTime={MAX_TIME}
          />
          
          {board && board.length > 0 && board[0] && board[0].length > 0 ? (
            <GameBoard 
              board={board}
              players={players}
              currentPlayer={currentPlayer}
              hoverColumn={hoverColumn}
              animatingColumn={animatingColumn}
              animatingRow={animatingRow}
              winningCells={winningCells}
              handleColumnClick={handleColumnClick}
              setHoverColumn={setHoverColumn}
            />
          ) : (
            <div>Loading...</div>
          )}
          
          <GameControls resetGame={resetGame} />
        </div>
      )}
    </div>
  );
};

export default App;
