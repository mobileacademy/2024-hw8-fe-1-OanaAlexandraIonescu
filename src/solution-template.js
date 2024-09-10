let board = [];
let openedSquares = [];
let flaggedSquares = [];
let bombCount = 0;
let squaresLeft = 0;
let bombProbability = 10;
let maxProbability = 30;
let probabilitiesUpdated = false;

// functia pentru inceperea unui joc nou
function startGame() {
    const difficulty = document.getElementById('gameDifficulty').value;
    const difficulties = {
        easy: { rowCount: 9, colCount: 9, bombProbability: 10, maxProbability: 30 },
        medium: { rowCount: 16, colCount: 16, bombProbability: 20, maxProbability: 30 },
        hard: { rowCount: 30, colCount: 30, bombProbability: 30, maxProbability: 30 }
    };

    const selectedDifficulty = difficulties[difficulty] || difficulties.easy;
    
    // setez probabilitatile predefinite in functie de nivel (in cazul in care nu au fost actualizate prin inputuri si repornit jocul)
    if (!probabilitiesUpdated) {
        document.getElementById('bombProbability').value = selectedDifficulty.bombProbability;
        document.getElementById('maxProbability').value = selectedDifficulty.maxProbability;
        bombProbability = selectedDifficulty.bombProbability;
        maxProbability = selectedDifficulty.maxProbability;
    }

    document.body.classList.remove('easy', 'medium', 'hard')
    document.body.classList.add(difficulty)

    probabilitiesUpdated = false
    generateBoard(selectedDifficulty);
}

// functia pentru actualizarea probabilitatilor daca sunt modificate din inputuri
function updateProbabilities() {
    // se preiau valorile din inputuri
    bombValue = parseInt(document.getElementById('bombProbability').value);
    maxValue = parseInt(document.getElementById('maxProbability').value);
    
    // validez ca probabilitatea plasarii bombelor sa fie mai mica decat probabilitatea maxima
    bombValue = validateProbabilities(bombValue, maxValue)

    bombProbability = bombValue
    maxProbability = maxValue
    probabilitiesUpdated = true

    // se reincepe jocul cu noile probabilitati
    startGame()
}

// functia pentru a genera tabla
function generateBoard(boardMetadata) {
    squaresLeft = boardMetadata.colCount * boardMetadata.rowCount;
    bombCount = 0;
    board = [];
    openedSquares = [];
    flaggedSquares = [];

    // generez o tabla goala
    for (let i = 0; i < boardMetadata.rowCount; i++) {
        board[i] = new Array(boardMetadata.colCount);
        for (let j = 0; j < boardMetadata.colCount; j++) {
            board[i][j] = new BoardSquare(false, 0);
        }
    }

    // plasez bombele intr-un mod aleatoriu
    let bombsToPlace = Math.floor((bombProbability / 100) * squaresLeft);
    bombsToPlace = Math.min(bombsToPlace, squaresLeft);
    while (bombsToPlace > 0) {
        const x = Math.floor(Math.random() * boardMetadata.rowCount);
        const y = Math.floor(Math.random() * boardMetadata.colCount);
        if (!board[x][y].hasBomb) {
            board[x][y].hasBomb = true;
            bombCount++;
            bombsToPlace--;
        }
    }

    // calculez bombele din jurul patratelelor
    for (let i = 0; i < boardMetadata.rowCount; i++) {
        for (let j = 0; j < boardMetadata.colCount; j++) {
            if (!board[i][j].hasBomb) {
                board[i][j].bombsAround = countAdjacentBombs(i, j, boardMetadata.rowCount, boardMetadata.colCount);
            }
        }
    }

    renderBoard(boardMetadata.rowCount, boardMetadata.colCount);
}

// functia pentru a numara bombele care se afla in jurul unui patrat
function countAdjacentBombs(x, y, rowCount, colCount) {
    let bombCount = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const x2 = x + i;
            const y2 = y + j;
            if (x2 >= 0 && x2 < rowCount && y2 >= 0 && y2 < colCount && board[x2][y2].hasBomb) {
                bombCount++;
            }
        }
    }
    return bombCount;
}

// functia pentru a afisa tabla
function renderBoard(rowCount, colCount) {
    const boardContainer = document.getElementById('gameBoard');
    boardContainer.innerHTML = '';

    for (let i = 0; i < rowCount; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        
        for (let j = 0; j < colCount; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.id = `tile-${i}-${j}`;
        
            tile.addEventListener('click', () => handleTiles(i, j));

            // evenimentul pentru click dreapta (adaugarea unui flag)
            tile.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                flagTile(i, j);
            });
            
            row.appendChild(tile);
        }
        boardContainer.appendChild(row);
    }
}

function handleTiles(x, y) {

    // verific daca patratelul a fost deschis sau marcat cu flag
    // in caz pozitiv, nu va fi realizat nimic
    if (openedSquares.some(pair => pair.x === x && pair.y === y) || flaggedSquares.some(pair => pair.x === x && pair.y === y)) {
        return;
    }

    // in caz contrar, se selecteaza patratelul, e marcat ca fiind deschis,
    // se scade numarul de patratele ramase si se adauga stilul "revealed"
    const tile = board[x][y];
    openedSquares.push(new Pair(x, y));
    squaresLeft--;
    const tileElement = document.getElementById(`tile-${x}-${y}`);
    tileElement.classList.add('revealed');

    if (tile.hasBomb) {
        tileElement.classList.add('bomb');
        showMessage("Game over!", "red");
        revealBombs();
        // se asteaptaa 6 secunde inainte de resetarea jocului pentru
        // a vizualiza locurile in care erau amplasate bombele
        setTimeout(() => {
            resetGame()
        }, 6000)
        return;
    }

    if (tile.bombsAround > 0) {
        tileElement.textContent = tile.bombsAround;
    } else {
        revealAdjacentTiles(x, y);
    }

    if (squaresLeft === bombCount) {
        showMessage("You win!", "green");
        revealBombs();
        setTimeout(() => {
            resetGame()
        }, 6000)
    }
}

// functia pentru a afisa patratelele adiacente daca nu sunt bombe
function revealAdjacentTiles(x, y) {
    // parcurg fiecare pozitie adiacenta din cele 8
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const x2 = x + i;
            const y2 = y + j;
            if (x2 >= 0 && x2 < board.length && y2 >= 0 && y2 < board[0].length) {
                if (!openedSquares.some(pair => pair.x === x2 && pair.y === y2)) {
                    // se apeleaza metoda handleTiles pentru a deschide patratul
                    handleTiles(x2, y2);
                }
            }
        }
    }
}

// functia pentru a afisa toate bombele (apelata daca utilizatorul pierde prin selectarea unei bombe sau castiga)
function revealBombs() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
            if (board[i][j].hasBomb) {
                const tileElement = document.getElementById(`tile-${i}-${j}`);
                tileElement.classList.add('bomb');
            }
        }
    }
}

// functia pentru a marca patratelele cu flag
function flagTile(x, y) {
    const index = flaggedSquares.findIndex(pair => pair.x === x && pair.y === y);

    // daca patratelul este deja marcat cu flag, acesta va fi scos, altfel va fi marcat
    if (index >= 0) {
        flaggedSquares.splice(index, 1);
        document.getElementById(`tile-${x}-${y}`).classList.remove('flagged');
    } else {
        flaggedSquares.push(new Pair(x, y));
        document.getElementById(`tile-${x}-${y}`).classList.add('flagged');
    }
}

// funtia pentru a afisa mesajele de finalizare a jocului (castig / pierdere)
function showMessage(message, color) {
    const messageContainer = document.getElementById('message');
    messageContainer.textContent = message;
    messageContainer.style.color = color;

    messageContainer.classList.add('show');
    messageContainer.classList.remove('hide');

    // mesajul este ascuns automat dupa 3 secunde
    setTimeout(() => {
        messageContainer.classList.add('hide');
        messageContainer.classList.remove('show');
    }, 3000);

}

// functia pentru validarea probabilitatilor dupa modificarea acestora din inputuri
function validateProbabilities(bombValue, maxValue) {
    const bombInput = document.getElementById('bombProbability');
    if (bombValue > maxValue) {
        bombValue = maxValue;
        bombInput.value = bombValue;
    }
    return bombValue
}

// functia pentru resetarea jocului
function resetGame() {
    // sunt sterse toate datele si stilurile adaugate anterior
    board = [];
    openedSquares = [];
    flaggedSquares = [];
    bombCount = 0;
    squaresLeft = 0;

    const allTiles = document.querySelectorAll('.tile');
    allTiles.forEach(tile => {
        tile.classList.remove('revealed', 'bomb', 'flagged');
        tile.textContent = '';
    });
 
    startGame();
}

class BoardSquare {
    constructor(hasBomb, bombsAround) {
        this.hasBomb = hasBomb;
        this.bombsAround = bombsAround;
    }
}

class Pair {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// initializarea jocului cu valorile default
startGame();
