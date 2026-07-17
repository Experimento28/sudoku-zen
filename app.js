"use strict";

const SIZE = 9;
const BOX_SIZE = 3;

const boardElement = document.getElementById("sudokuBoard");
const numberPadElement = document.getElementById("numberPad");
const messageElement = document.getElementById("message");
const gameStatusElement = document.getElementById("gameStatus");
const newGameButton = document.getElementById("newGameButton");
const solveButton = document.getElementById("solveButton");
const eraseButton = document.getElementById("eraseButton");
const difficultySelect = document.getElementById("difficulty");

let puzzle = createEmptyBoard();
let currentBoard = createEmptyBoard();
let solution = createEmptyBoard();
let selectedCell = null;
let gameFinished = false;

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function isPlacementValid(board, row, col, value) {
  for (let index = 0; index < SIZE; index += 1) {
    if (index !== col && board[row][index] === value) {
      return false;
    }

    if (index !== row && board[index][col] === value) {
      return false;
    }
  }

  const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
    for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function findEmptyCell(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === 0) {
        return [row, col];
      }
    }
  }

  return null;
}

function fillBoard(board) {
  const emptyCell = findEmptyCell(board);

  if (!emptyCell) {
    return true;
  }

  const [row, col] = emptyCell;
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (const value of candidates) {
    if (isPlacementValid(board, row, col, value)) {
      board[row][col] = value;

      if (fillBoard(board)) {
        return true;
      }

      board[row][col] = 0;
    }
  }

  return false;
}

function countSolutions(board, limit = 2) {
  let solutionsFound = 0;

  function search() {
    if (solutionsFound >= limit) {
      return;
    }

    const emptyCell = findEmptyCell(board);

    if (!emptyCell) {
      solutionsFound += 1;
      return;
    }

    const [row, col] = emptyCell;

    for (let value = 1; value <= SIZE; value += 1) {
      if (isPlacementValid(board, row, col, value)) {
        board[row][col] = value;
        search();
        board[row][col] = 0;

        if (solutionsFound >= limit) {
          return;
        }
      }
    }
  }

  search();
  return solutionsFound;
}

function getRemovalTarget(difficulty) {
  const targets = {
    easy: 38,
    medium: 46,
    hard: 52,
  };

  return targets[difficulty] ?? targets.medium;
}

function createPuzzle(solvedBoard, difficulty) {
  const generatedPuzzle = cloneBoard(solvedBoard);
  const targetRemovals = getRemovalTarget(difficulty);
  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, index) => index),
  );

  let removed = 0;

  for (const position of positions) {
    if (removed >= targetRemovals) {
      break;
    }

    const row = Math.floor(position / SIZE);
    const col = position % SIZE;
    const backup = generatedPuzzle[row][col];

    generatedPuzzle[row][col] = 0;

    const testBoard = cloneBoard(generatedPuzzle);
    const hasUniqueSolution = countSolutions(testBoard, 2) === 1;

    if (hasUniqueSolution) {
      removed += 1;
    } else {
      generatedPuzzle[row][col] = backup;
    }
  }

  return generatedPuzzle;
}

function generateNewGame() {
  setMessage("Generando un tablero nuevo…");
  gameStatusElement.textContent = "Preparando";
  gameFinished = false;
  selectedCell = null;

  window.setTimeout(() => {
    const solvedBoard = createEmptyBoard();
    fillBoard(solvedBoard);

    solution = solvedBoard;
    puzzle = createPuzzle(solution, difficultySelect.value);
    currentBoard = cloneBoard(puzzle);

    renderBoard();
    gameStatusElement.textContent = "En progreso";
    setMessage("Selecciona una celda vacía y luego un número.");
  }, 20);
}

function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const cell = document.createElement("button");
      const value = currentBoard[row][col];
      const isFixed = puzzle[row][col] !== 0;

      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute(
        "aria-label",
        `Fila ${row + 1}, columna ${col + 1}${value ? `, número ${value}` : ", vacía"}`,
      );

      if (value !== 0) {
        cell.textContent = String(value);
      }

      if (isFixed) {
        cell.classList.add("fixed");
        cell.setAttribute("aria-readonly", "true");
      }

      if (col === 2 || col === 5) {
        cell.classList.add("box-right");
      }

      if (row === 2 || row === 5) {
        cell.classList.add("box-bottom");
      }

      cell.addEventListener("click", () => selectCell(row, col));
      boardElement.appendChild(cell);
    }
  }

  refreshHighlights();
}

function getCellElement(row, col) {
  return boardElement.querySelector(
    `.cell[data-row="${row}"][data-col="${col}"]`,
  );
}

function selectCell(row, col) {
  selectedCell = { row, col };
  refreshHighlights();

  const cell = getCellElement(row, col);
  cell?.focus({ preventScroll: true });

  if (puzzle[row][col] !== 0) {
    setMessage("Ese número pertenece al tablero original.");
  } else {
    setMessage("Elige un número del 1 al 9.");
  }
}

function refreshHighlights() {
  const cells = boardElement.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("selected", "related", "same-number", "invalid");
  });

  if (!selectedCell) {
    return;
  }

  const { row, col } = selectedCell;
  const selectedValue = currentBoard[row][col];
  const selectedBoxRow = Math.floor(row / BOX_SIZE);
  const selectedBoxCol = Math.floor(col / BOX_SIZE);

  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const cell = getCellElement(r, c);
      const sameBox =
        Math.floor(r / BOX_SIZE) === selectedBoxRow &&
        Math.floor(c / BOX_SIZE) === selectedBoxCol;

      if (r === row || c === col || sameBox) {
        cell?.classList.add("related");
      }

      if (selectedValue !== 0 && currentBoard[r][c] === selectedValue) {
        cell?.classList.add("same-number");
      }
    }
  }

  getCellElement(row, col)?.classList.add("selected");
}

function enterNumber(value) {
  if (!selectedCell || gameFinished) {
    setMessage(
      gameFinished
        ? "El juego ya terminó. Genera un tablero nuevo."
        : "Primero selecciona una celda vacía.",
      "error",
    );
    return;
  }

  const { row, col } = selectedCell;

  if (puzzle[row][col] !== 0) {
    setMessage("No puedes modificar una pista original.", "error");
    return;
  }

  const previousValue = currentBoard[row][col];
  currentBoard[row][col] = 0;

  if (!isPlacementValid(currentBoard, row, col, value)) {
    currentBoard[row][col] = previousValue;
    const cell = getCellElement(row, col);
    cell?.classList.add("invalid");
    setMessage(
      `El ${value} se repite en la fila, columna o subcuadrícula.`,
      "error",
    );
    return;
  }

  currentBoard[row][col] = value;
  updateCell(row, col);
  refreshHighlights();

  if (isBoardComplete()) {
    finishGame();
  } else {
    setMessage("Número ingresado correctamente.");
  }
}

function eraseSelectedCell() {
  if (!selectedCell || gameFinished) {
    return;
  }

  const { row, col } = selectedCell;

  if (puzzle[row][col] !== 0) {
    setMessage("No puedes borrar una pista original.", "error");
    return;
  }

  currentBoard[row][col] = 0;
  updateCell(row, col);
  refreshHighlights();
  setMessage("Celda borrada.");
}

function updateCell(row, col) {
  const cell = getCellElement(row, col);
  const value = currentBoard[row][col];

  if (!cell) {
    return;
  }

  cell.textContent = value === 0 ? "" : String(value);
  cell.setAttribute(
    "aria-label",
    `Fila ${row + 1}, columna ${col + 1}${value ? `, número ${value}` : ", vacía"}`,
  );
}

function isBoardComplete() {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (currentBoard[row][col] === 0) {
        return false;
      }

      if (!isPlacementValid(currentBoard, row, col, currentBoard[row][col])) {
        return false;
      }
    }
  }

  return true;
}

function finishGame() {
  gameFinished = true;
  gameStatusElement.textContent = "Completado";
  setMessage("¡Excelente! Completaste el Sudoku correctamente.", "success");
}

function showSolution() {
  currentBoard = cloneBoard(solution);
  gameFinished = true;
  gameStatusElement.textContent = "Solución visible";
  selectedCell = null;
  renderBoard();

  boardElement.querySelectorAll(".cell").forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (puzzle[row][col] === 0) {
      cell.classList.add("solved-highlight");
    }
  });

  setMessage("Se ha mostrado la solución completa.", "success");
}

function setMessage(text, type = "") {
  messageElement.textContent = text;
  messageElement.className = "message";

  if (type) {
    messageElement.classList.add(type);
  }
}

function createNumberPad() {
  for (let value = 1; value <= SIZE; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-button";
    button.textContent = String(value);
    button.setAttribute("aria-label", `Ingresar número ${value}`);
    button.addEventListener("click", () => enterNumber(value));
    numberPadElement.appendChild(button);
  }
}

function handleKeyboardInput(event) {
  if (/^[1-9]$/.test(event.key)) {
    enterNumber(Number(event.key));
    return;
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    eraseSelectedCell();
    return;
  }

  if (!selectedCell) {
    return;
  }

  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };

  const move = moves[event.key];

  if (move) {
    event.preventDefault();
    const nextRow = Math.max(0, Math.min(8, selectedCell.row + move[0]));
    const nextCol = Math.max(0, Math.min(8, selectedCell.col + move[1]));
    selectCell(nextRow, nextCol);
  }
}

newGameButton.addEventListener("click", generateNewGame);
solveButton.addEventListener("click", showSolution);
eraseButton.addEventListener("click", eraseSelectedCell);
difficultySelect.addEventListener("change", generateNewGame);
document.addEventListener("keydown", handleKeyboardInput);

createNumberPad();
generateNewGame();


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
  });
}
