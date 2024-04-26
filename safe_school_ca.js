let grid;
let cols = 17;
let rows = 17;
let cellSize = 35;
let nextGrid;
let probability = 70; // Početna vrednost, možete je promeniti

// Globalne promenljive koje prate iscrtavanje rozih pravougaonika
var drawnHorizontalPink = [];
var drawnVerticalPink = [];

// Inicijalizacija globalnih promenljivih
function initializeDrawnArrays() {
  for (let i = 0; i < cols; i++) {
    drawnHorizontalPink[i] = [];
    drawnVerticalPink[i] = [];
    for (let j = 0; j < rows; j++) {
      drawnHorizontalPink[i][j] = false;
      drawnVerticalPink[i][j] = false;
    }
  }
}
let color_parcela;
let color_koridor;
let color_atrijum;
let color_ucionice;
let color_pomocna;


let autoSaveIndex = 0; // Globalni brojač za automatsko snimanje


function drawBorder() {
  stroke(0); // Postavlja boju ivice na crnu
  strokeWeight(1); // Postavlja debljinu ivice
  noFill(); // Osigurava da se unutrašnjost pravougaonika ne popunjava
  rect(0, 0, cols * cellSize, rows * cellSize); // Crtanje pravougaonika koji odgovara dimenzijama grida
}


let showGrid = true; // Da li da se prikaže mreža
let showYellowSquares = false; // Da li da se prikažu žuti kvadrati

let imageCounter = 0; // Globalni brojač slika

let isInitialSetupDone = false;


let resetCounter = 1; // Počinje od 1


function setup() {
  background(255); // Postavlja pozadinu na belu boju

  // Inicijalizacija boja
  color_parcela = color(255); // Bela
  color_koridor = color(200); // Siva
  color_atrijum = color(153, 153, 102); // Zelena
  color_ucionice = color(255, 102, 204); // Roza
  color_pomocna = color(0, 255, 255); // Roza

  // Dodavanje paspartua dodajući 2 * cellSize na obe dimenzije
  let canvasWidth = 2 * cols * cellSize + 2 * cellSize;
  let canvasHeight = rows * cellSize + 2 * cellSize;
  createCanvas(canvasWidth, canvasHeight).parent('sketch-holder');




  // Pomeranje početne tačke za crtanje kako bi se uzela u obzir paspartu širina
  translate(cellSize, cellSize);

  // Ostatak inicijalizacije
  grid = make2DArray(cols, rows);
  initializeDrawnArrays();
  resetGrid();

  // Postavljanje UI elemenata
  setupUI();

  // Oznaka da je inicijalno postavljanje završeno
  isInitialSetupDone = true;
}

function setupUI() {
  let probabilityText = createP('Probability');
  probabilityText.parent('controls');

  let probabilitySlider = createSlider(0, 100, probability, 1);
  probabilitySlider.parent('controls');
  probabilitySlider.input(() => {
    probability = probabilitySlider.value();
    probabilityDisplay.html('Probability: ' + probability);
  });

  probabilityDisplay = createP('Probability: ' + probability);
  probabilityDisplay.parent('controls');

  let resetButton = createButton('Reset');
  resetButton.parent('controls');
  resetButton.mousePressed(resetGrid);

  let saveButton = createButton('Save Image');
  saveButton.parent('controls');
  saveButton.mousePressed(saveCanvasImage);

  let autoSaveButton = createButton('Auto Save Images');
  autoSaveButton.parent('controls');
  autoSaveButton.mousePressed(autoSaveImages);

  let toggleGridButton = createButton('Toggle Grid');
  toggleGridButton.parent('controls');
  toggleGridButton.mousePressed(() => {
    showGrid = !showGrid;
    redraw();
  });

  let toggleYellowSquaresButton = createButton('Toggle Yellow Squares');
  toggleYellowSquaresButton.parent('controls');
  toggleYellowSquaresButton.mousePressed(() => {
    showYellowSquares = !showYellowSquares;
    redraw();
  });
}
  


function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

function initializeGrid() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }
  let grid_x = floor(random(2, cols - 2))
  let grid_y = floor(random(2, rows - 2))

  grid[grid_x][grid_y] = 1;
  grid[grid_x - 1][grid_y - 1] = 2;


  applyRules();

}

function countVonNeumannNeighbors(grid, x, y, targetState) {
  let sum = 0;
  let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Gore, dole, levo, desno

  for (let i = 0; i < directions.length; i++) {
    let col = x + directions[i][0];
    let row = y + directions[i][1];

    // Provera da li je sused unutar granica mreže
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      sum += grid[col][row] == targetState ? 1 : 0;
    }
  }

  return sum;
}


function countMooreNeighbors(grid, x, y, targetState) {
  let sum = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i == 0 && j == 0) continue; // Preskoči trenutnu ćeliju

      let col = x + i;
      let row = y + j;

      // Provera da li je sused unutar granica mreže
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        sum += grid[col][row] == targetState ? 1 : 0;
      }
    }
  }
  return sum;
}

function areOppositeCellsInSameState(grid, x, y, state) {
  const vonNeumannPairs = [
    { dx1: -1, dy1: 0, dx2: 1, dy2: 0 }, // Left and right pairs
    { dx1: 0, dy1: -1, dx2: 0, dy2: 1 }  // Top and bottom pairs
  ];

  for (let pair of vonNeumannPairs) {
    let neighborX1 = x + pair.dx1;
    let neighborY1 = y + pair.dy1;
    let neighborX2 = x + pair.dx2;
    let neighborY2 = y + pair.dy2;

    // Check if neighbors are outside the grid bounds
    if (neighborX1 < 0 || neighborX1 >= cols || neighborY1 < 0 || neighborY1 >= rows ||
      neighborX2 < 0 || neighborX2 >= cols || neighborY2 < 0 || neighborY2 >= rows) {
      return false;
    }

    // Check if both neighbors are in the same state as 'state'
    if (grid[neighborX1][neighborY1] === state && grid[neighborX2][neighborY2] === state) {
      return true;
    }
  }

  return false;
}

function areAllDiagonalNeighborsInSameState(grid, x, y, state) {
  let directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Dijagonalni smerovi

  for (let i = 0; i < directions.length; i++) {
    let col = x + directions[i][0];
    let row = y + directions[i][1];

    // Provera da li je dijagonalni sused unutar granica mreže
    if (col < 0 || col >= cols || row < 0 || row >= rows || grid[col][row] != state) {
      return false;
    }
  }
  return true;
}

function countDiagonalNeighborsInState(grid, x, y, state) {
  let count = 0;
  let directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Dijagonalni smerovi

  for (let i = 0; i < directions.length; i++) {
    let col = x + directions[i][0];
    let row = y + directions[i][1];

    // Provera da li je dijagonalni sused unutar granica mreže
    if (col >= 0 && col < cols && row >= 0 && row < rows && grid[col][row] == state) {
      count++;
    }
  }
  return count;
}

function calculateNeighborStates(grid, x, y) {
  return {
    countDiagonal0: countDiagonalNeighborsInState(grid, x, y, 0),
    countDiagonal1: countDiagonalNeighborsInState(grid, x, y, 1),
    countDiagonal2: countDiagonalNeighborsInState(grid, x, y, 2),
    countDiagonal3: countDiagonalNeighborsInState(grid, x, y, 3),
    mooreNeighbors0: countMooreNeighbors(grid, x, y, 0),
    mooreNeighbors1: countMooreNeighbors(grid, x, y, 1),
    mooreNeighbors2: countMooreNeighbors(grid, x, y, 2),
    mooreNeighbors3: countMooreNeighbors(grid, x, y, 3),
    vonNeumannNeighbors0: countVonNeumannNeighbors(grid, x, y, 0),
    vonNeumannNeighbors1: countVonNeumannNeighbors(grid, x, y, 1),
    vonNeumannNeighbors2: countVonNeumannNeighbors(grid, x, y, 2),
    vonNeumannNeighbors3: countVonNeumannNeighbors(grid, x, y, 3),
    areOpposite_0: areOppositeCellsInSameState(grid, x, y, 0),
    areOpposite_1: areOppositeCellsInSameState(grid, x, y, 1),
    areOpposite_2: areOppositeCellsInSameState(grid, x, y, 2),
    areOpposite_3: areOppositeCellsInSameState(grid, x, y, 3),
    allDiagonalSameState0: areAllDiagonalNeighborsInSameState(grid, x, y, 0),
    allDiagonalSameState1: areAllDiagonalNeighborsInSameState(grid, x, y, 1),
    allDiagonalSameState2: areAllDiagonalNeighborsInSameState(grid, x, y, 2),
    allDiagonalSameState3: areAllDiagonalNeighborsInSameState(grid, x, y, 3)
  };
}

function rule1(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  // 000
  // 001
  // 000
  if (state == 0 &&
    neighborStates.vonNeumannNeighbors1 >= 1 &&

    neighborStates.mooreNeighbors1 <= 2 &&
    neighborStates.mooreNeighbors2 >= 1 &&
    neighborStates.countDiagonal1 < 2


  ) {
    let chance = random(100);
    return (chance < probability) ? 1 : 2;
  }



  return null; // Ako nema promena  
}

function rule2(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  // IZ CRVENOG U BELO

  if (state == 2

  ) {


    return (0);
  }



  return null; // Ako nema promena  
}

function rule3(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  // OVO PRAVI KRIVINU
  if (state == 1 &&
    neighborStates.vonNeumannNeighbors0 == 3 &&
    neighborStates.vonNeumannNeighbors1 == 1 &&

    neighborStates.mooreNeighbors1 >= 2 &&

    neighborStates.countDiagonal0 >= 2 &&
    neighborStates.countDiagonal1 >= 1




  ) {

    return (0);
  }


  return null; // Ako nema promena  

}


function rule4(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  // OVO PRAVI KRIVINU
  if (state == 0 &&
    neighborStates.vonNeumannNeighbors0 == 2 &&
    neighborStates.vonNeumannNeighbors1 == 2 &&

    neighborStates.areOpposite_0 == true &&
    neighborStates.areOpposite_1 == true

  ) {
    return (1);
  }

  return null; // Ako nema promena  

}

/////////////////////////////////////////////////////////////////////// OVO SKIDA MALCE
function rule5(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 1 &&
    neighborStates.vonNeumannNeighbors0 == 3 &&
    neighborStates.vonNeumannNeighbors1 == 1 &&

    neighborStates.mooreNeighbors1 >= 3 &&

    neighborStates.areOpposite_0 == true &&
    neighborStates.areOpposite_1 == false &&
    neighborStates.countDiagonal0 >= 1 &&
    neighborStates.countDiagonal1 >= 2


  ) {
    return (0);
  }

  return null; // Ako nema promena  

}

function rule6(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);


  if (state == 0 &&

    neighborStates.vonNeumannNeighbors1 == 1 &&
    neighborStates.vonNeumannNeighbors0 == 3 &&

    neighborStates.mooreNeighbors0 == 7


  ) {

    return (2);
  }

  return null; // Ako nema promena  
}

function rule7(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 0 &&

    neighborStates.vonNeumannNeighbors1 >= 1 &&
    neighborStates.vonNeumannNeighbors3 <= 1 &&

    neighborStates.areOpposite_1 == false

  ) {

    return (3);
  }

  return null; // Ako nema promena  

}

function rule8(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 0 &&

    neighborStates.vonNeumannNeighbors3 == 2 &&
    neighborStates.vonNeumannNeighbors0 == 2 &&

    neighborStates.mooreNeighbors1 == 1 &&


    neighborStates.areOpposite_1 == false &&
    neighborStates.areOpposite_0 == false

  ) {

    return (3);
  }

  return null; // Ako nema promena  

}
function rule9(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 3 &&

    neighborStates.vonNeumannNeighbors3 == 2 &&
    neighborStates.vonNeumannNeighbors0 == 0 &&
    neighborStates.vonNeumannNeighbors1 == 2 &&

    neighborStates.mooreNeighbors3 == 3 &&
    neighborStates.mooreNeighbors0 == 0



  ) {

    return (0);
  }

  return null; // Ako nema promena  

}
function rule10(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 3 &&

    neighborStates.vonNeumannNeighbors3 == 3 &&
    neighborStates.vonNeumannNeighbors0 == 0 &&
    neighborStates.vonNeumannNeighbors1 == 1 &&

    neighborStates.mooreNeighbors3 >= 4 &&
    neighborStates.mooreNeighbors0 == 0



  ) {

    return (0);
  }

  return null; // Ako nema promena  

}
function rule11(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 2

  ) {

    return (0);
  }

  return null; // Ako nema promena  

}

function rule12(grid, x, y) {

  if (x == 0 || y == 0 || x == cols - 1 || y == rows - 1) {
    // Ako je ćelija na obodu, zadržava svoje trenutno stanje
    return null;
  }

  let state = grid[x][y];
  let neighborStates = calculateNeighborStates(grid, x, y);

  if (state == 0 &&

    neighborStates.vonNeumannNeighbors0 <= 1 &&


    neighborStates.mooreNeighbors0 <= 3




  ) {

    return (4);
  }

  return null; // Ako nema promena  
}


function applyRules() {
  let rules = [rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9, rule10, rule11, rule12]; // Dodajte više pravila ako je potrebno
  rules.forEach(rule => {
    let changes;
    do {
      changes = false;
      nextGrid = make2DArray(cols, rows);

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          let newState = rule(grid, x, y);
          if (newState !== null) {
            nextGrid[x][y] = newState;
            if (newState != grid[x][y]) {
              changes = true;
            }
          } else {
            nextGrid[x][y] = grid[x][y];
          }
        }
      }

      grid = nextGrid;
    } while (changes);
  });

  drawGrid();

}


let yellowSquaresCount = 0;
let saveIndex = 0;




function resetGrid() {
  // clear(); // ili background(bojaPozadine);
  background(255); // Postavlja pozadinu na belu boju
  yellowSquaresCount = 0; // Resetovanje brojača žutih kvadrata
  initializeGrid(); // Ponovna inicijalizacija ili resetovanje grida
  drawBorder(); // Ako imate funkciju za iscrtavanje granica
  // Ponovno iscrtavanje bilo kojih statičnih elemenata koji su potrebni

  saveIndex = 0;

  resetCounter++; // Povećavanje brojača resetovanja

}





// Funkcija za crtanje rozih pravougaonika sa ažuriranjem globalnih promenljivih
function drawPinkRectangles(x, y) {
  let posX = x * cellSize;
  let posY = y * cellSize;
  let quarterSize = cellSize / 4;
  let hasDrawn = { horizontal: false, vertical: false }; // Objekat za praćenje iscrtavanja

  fill(color_ucionice); // Roze boja

  // Crtanje pravougaonika i ažuriranje hasDrawn objekta
  if (y > 0 && grid[x][y - 1] === 3) {
      rect(posX, posY, cellSize, quarterSize);
      hasDrawn.horizontal = true;
  }
  if (y < rows - 1 && grid[x][y + 1] === 3) {
      rect(posX, posY + 3 * quarterSize, cellSize, quarterSize);
      hasDrawn.horizontal = true;
  }
  if (x > 0 && grid[x - 1][y] === 3) {
      rect(posX, posY, quarterSize, cellSize);
      hasDrawn.vertical = true;
  }
  if (x < cols - 1 && grid[x + 1][y] === 3) {
      rect(posX + 3 * quarterSize, posY, quarterSize, cellSize);
      hasDrawn.vertical = true;
  }

  return hasDrawn; // Vraćanje objekta sa informacijama o iscrtavanju
}


// Funkcija za crtanje rozih kvadrata
function drawPinkSquares(x, y) {
  let posX = x * cellSize;
  let posY = y * cellSize;
  let quarterSize = cellSize / 4;

  fill(color_ucionice); // Roze boja

  // Provera i crtanje kvadrata na osnovu dijagonalnih suseda
  if (x > 0 && y > 0 && grid[x - 1][y - 1] === 3) {
    // Gornji levi ugao
    rect(posX, posY, quarterSize, quarterSize);
  }
  if (x < cols - 1 && y > 0 && grid[x + 1][y - 1] === 3) {
    // Gornji desni ugao
    rect(posX + 3 * quarterSize, posY, quarterSize, quarterSize);
  }
  if (x > 0 && y < rows - 1 && grid[x - 1][y + 1] === 3) {
    // Donji levi ugao
    rect(posX, posY + 3 * quarterSize, quarterSize, quarterSize);
  }
  if (x < cols - 1 && y < rows - 1 && grid[x + 1][y + 1] === 3) {
    // Donji desni ugao
    rect(posX + 3 * quarterSize, posY + 3 * quarterSize, quarterSize, quarterSize);
  }
}


function drawWhiteRectangles(x, y) {
  let posX = x * cellSize;
  let posY = y * cellSize;
  let quarterSize = cellSize / 4;

  fill(color_parcela); // Bela boja

  // Horizontalni pravougaonik u donjoj zoni
  if (grid[x][y] == 1 && y < rows - 1 && grid[x][y + 1] == 4 && (x == 0 || grid[x - 1][y] != 3) && (x == cols - 1 || grid[x + 1][y] != 3) && !(grid[x - 1][y + 1] == 0 && grid[x + 1][y + 1] == 0)) {
      rect(posX, posY + 3 * quarterSize, cellSize, quarterSize);
  }

  // Horizontalni pravougaonik u gornjoj zoni
  if (grid[x][y] == 1 && y > 0 && grid[x][y - 1] == 4 && (x == 0 || grid[x - 1][y] != 3) && (x == cols - 1 || grid[x + 1][y] != 3) && !(grid[x - 1][y - 1] == 0 && grid[x + 1][y - 1] == 0)) {
      rect(posX, posY, cellSize, quarterSize);
  }

  // Vertikalni pravougaonik u levoj zoni
  if (grid[x][y] == 1 && x > 0 && grid[x - 1][y] == 4 && (y == 0 || grid[x][y - 1] != 3) && (y == rows - 1 || grid[x][y + 1] != 3) && !(grid[x - 1][y - 1] == 0 && grid[x - 1][y + 1] == 0)) {
      rect(posX, posY, quarterSize, cellSize);
  }

  // Vertikalni pravougaonik u desnoj zoni
  if (grid[x][y] == 1 && x < cols - 1 && grid[x + 1][y] == 4 && (y == 0 || grid[x][y - 1] != 3) && (y == rows - 1 || grid[x][y + 1] != 3) && !(grid[x + 1][y - 1] == 0 && grid[x + 1][y + 1] == 0)) {
      rect(posX + 3 * quarterSize, posY, quarterSize, cellSize);
  }
}


function drawGreenSquares(x, y) {
  let posX = x * cellSize;
  let posY = y * cellSize;
  let quarterSize = cellSize / 4;

  fill(color_parcela); // Zelena boja

  // Kvadrat u gornjem-desnom uglu
  if (grid[x][y] == 4 && x < cols - 1 && y > 0 && grid[x + 1][y] == 1 && grid[x][y - 1] == 1 && ((y < rows - 1 && grid[x + 1][y + 1] != 3) && (x > 0 && grid[x - 1][y - 1] != 3))) {
      rect(posX + 4 * quarterSize, posY-quarterSize, quarterSize, quarterSize);
  }

  // Kvadrat u dole-desnom uglu
  if (grid[x][y] == 4 && x < cols - 1 && y < rows - 1 && grid[x + 1][y] == 1 && grid[x][y + 1] == 1 && ((y > 0 && grid[x + 1][y - 1] != 3) && (x > 0 && grid[x - 1][y + 1] != 3))) {
      rect(posX + 4 * quarterSize, posY + 4 * quarterSize, quarterSize, quarterSize);
  }

  // Kvadrat u dole-levom uglu
  if (grid[x][y] == 4 && x > 0 && y < rows - 1 && grid[x - 1][y] == 1 && grid[x][y + 1] == 1 && ((y > 0 && grid[x - 1][y - 1] != 3) && (x < cols - 1 && grid[x + 1][y + 1] != 3))) {
      rect(posX-quarterSize, posY + 4 * quarterSize, quarterSize, quarterSize);
  }

  // Kvadrat u gore-levom uglu
  if (grid[x][y] == 4 && x > 0 && y > 0 && grid[x - 1][y] == 1 && grid[x][y - 1] == 1 && ((x < cols - 1 && grid[x + 1][y - 1] != 3) && (y < rows - 1 && grid[x - 1][y + 1] != 3))) {
      rect(posX-quarterSize, posY-quarterSize, quarterSize, quarterSize);
  }
}



function drawYellowSquare(x, y, state) {
  if (state === 3 || state === 4) {
    let upLeft = (y > 0 && x > 0 && grid[x][y - 1] === 1 && grid[x - 1][y - 1] === 1 && grid[x - 1][y] === 1);
    let upRight = (y > 0 && x < cols - 1 && grid[x][y - 1] === 1 && grid[x + 1][y - 1] === 1 && grid[x + 1][y] === 1);
    let downLeft = (y < rows - 1 && x > 0 && grid[x][y + 1] === 1 && grid[x - 1][y + 1] === 1 && grid[x - 1][y] === 1);
    let downRight = (y < rows - 1 && x < cols - 1 && grid[x][y + 1] === 1 && grid[x + 1][y + 1] === 1 && grid[x + 1][y] === 1);

    let squareSize = cellSize / 4; // Dimenzije kvadrata su četvrtina dimenzije ćelije

    fill('yellow'); // Boja kvadrata je žuta
    noStroke(); // Kvadrat nema obrub

    // Crtanje kvadrata u svakom uglu ako su uslovi zadovoljeni
    if (upLeft) {
      rect(x * cellSize, y * cellSize, squareSize, squareSize);

    }
    if (upRight) {
      rect(x * cellSize + cellSize - squareSize, y * cellSize, squareSize, squareSize);

    }
    if (downLeft) {
      rect(x * cellSize, y * cellSize + cellSize - squareSize, squareSize, squareSize);

    }
    if (downRight) {
      rect(x * cellSize + cellSize - squareSize, y * cellSize + cellSize - squareSize, squareSize, squareSize);

    }
  }
}

function countYellowSquare(x, y, state) {
  if (state === 3 || state === 4) {
    let upLeft = (y > 0 && x > 0 && grid[x][y - 1] === 1 && grid[x - 1][y - 1] === 1 && grid[x - 1][y] === 1);
    let upRight = (y > 0 && x < cols - 1 && grid[x][y - 1] === 1 && grid[x + 1][y - 1] === 1 && grid[x + 1][y] === 1);
    let downLeft = (y < rows - 1 && x > 0 && grid[x][y + 1] === 1 && grid[x - 1][y + 1] === 1 && grid[x - 1][y] === 1);
    let downRight = (y < rows - 1 && x < cols - 1 && grid[x][y + 1] === 1 && grid[x + 1][y + 1] === 1 && grid[x + 1][y] === 1);



    // Crtanje kvadrata u svakom uglu ako su uslovi zadovoljeni
    if (upLeft) {

      yellowSquaresCount += 1;
    }
    if (upRight) {

      yellowSquaresCount += 1;
    }
    if (downLeft) {

      yellowSquaresCount += 1;
    }
    if (downRight) {

      yellowSquaresCount += 1;
    }
  }
}



function convertPixelsToSquareMeters(pixels) {
  const pixelsPerMeter = 5.6 / cellSize; // Odnos piksela i metara
  return pixels * (pixelsPerMeter ** 2); // Konverzija u kvadratne metre
}
function displayText(txt, x, y) {
  fill(0); // Crna boja za tekst
  textSize(12); // Veličina teksta
  noStroke();
  text(txt, x, y);
}
let br_U;
let totalSquareMeters;
let povrsina_TA;
// Prilagođena funkcija za izračunavanje i pripremu podataka za ispis
function calculateAndDisplayAreas() {
  // Izračunavanje broja roze i sivih piksela
  let pinkPixels = calculatePinkPixelsArea();
  let grayPixels = calculateGrayPixelsArea();
  let totalPixels = pinkPixels + grayPixels; // Sabiranje broja piksela

  // Konverzija u kvadratne metre i zaokruživanje na ceo broj
  let pinkSquareMeters = Math.round(convertPixelsToSquareMeters(pinkPixels));
  let graySquareMeters = Math.round(convertPixelsToSquareMeters(grayPixels));
  totalSquareMeters = Math.round(convertPixelsToSquareMeters(totalPixels));

  let br_U_min = Math.round((totalSquareMeters - 400) / 4.5);
  let br_U_max = Math.round((totalSquareMeters - 350) / 4.1);
  br_U = br_U_min;

  let tatalCoridorReal=graySquareMeters

  // Proračun površina
  let povrsina_NA = Math.round(240 + (br_U * 2.9));
  let povrsina_NAm = Math.round(275 + (br_U * 3.1));
  let povrsina_BT = Math.round(br_U * 2);
  let povrsina_BTm = Math.round(30 + (br_U * 2.2));
  let povrsina_HDPE = Math.round(100 + (br_U * 0.3));
  let povrsina_HDPEm = Math.round(125 + (br_U * 0.35));
  let povrsina_LRA = Math.round(10 + (br_U * 0.1));
  let povrsina_LRAm = Math.round(30 + (br_U * 0.2));
  let povrsina_SA = Math.round(30 + (br_U * 0.2));
  let povrsina_SAm = Math.round(50 + (br_U * 0.3));
  let povrsina_ST = Math.round(20 + (br_U * 0.15));
  let povrsina_STm = Math.round(40 + (br_U * 0.25));
  let povrsina_F = Math.round(80 + (br_U * 0.15));
  let povrsina_NNA = Math.round(110 + (br_U * 1.2));
  let povrsina_T = Math.round(((br_U / 100) * 15) + 20);
  let povrsina_KF = Math.round(15 + (br_U * 0.06) + 5 + (br_U * 0.25));
  let povrsina_KFm = Math.round(30 + (br_U * 0.08));
  let povrsina_C_REC = Math.round(povrsina_NA * 0.20);
  let povrsina_P = Math.round(povrsina_NA * 0.015);
  let povrsina_Pm = Math.round(povrsina_NAm * 0.035);
  let povrsina_W = Math.round(povrsina_NA * 0.06);
  let povrsina_Wm = Math.round(povrsina_NAm * 0.06);
  // let povrsina_C = Math.round(totalSquareMeters * 0.2); // Ovo možda treba prilagoditi
  let povrsina_C = tatalCoridorReal;
  let povrsina_SNA = Math.round(povrsina_BT + povrsina_HDPE + povrsina_LRA + povrsina_SA + povrsina_ST + povrsina_F);
  let povrsina_SNAm = Math.round(povrsina_BTm + povrsina_HDPEm + povrsina_LRAm + povrsina_SAm + povrsina_STm);
  // let povrsina_SNNA = Math.round(povrsina_T + povrsina_KF + povrsina_P + povrsina_W + povrsina_C);
  let povrsina_SNNA = Math.round(povrsina_T + povrsina_KF + povrsina_P + povrsina_W + graySquareMeters);
  let povrsina_SNNAm = Math.round(povrsina_T + povrsina_KFm + povrsina_Pm + povrsina_Wm + povrsina_C);
  let povrsina_Non_circulation_min = Math.round(povrsina_BT + povrsina_HDPE + povrsina_LRA + povrsina_SA + povrsina_ST + povrsina_F + povrsina_T + povrsina_KF + povrsina_P + povrsina_W);
  povrsina_TA = Math.round(povrsina_SNA + povrsina_SNNA);
  let povrsina_TAm = Math.round(povrsina_SNAm + povrsina_SNNAm);
  let povrsina_DTA = Math.round(totalSquareMeters - povrsina_TA);
  let povrsina_DTAm = Math.round(totalSquareMeters - povrsina_TAm);



  let texts = [
    `GROSS AREA: ${totalSquareMeters} m²`,
    ``,
    `NUMBER OF PUPIL PLACES (N):`,
    ``,
    `Min: ${br_U_min} (GROSS AREA - 400) / 4.5)`,
    `Max: ${br_U_max} (GROSS AREA- 350) / 4.1 )`,
    `ADOPTED N: ${br_U}`, 
    ``, 
    `NET AREA: ${povrsina_NA} m² (240 + 2.9N)`,
    `BASIC TEACHING AREA: ${povrsina_BT} m² (2N)`,
    `HALLS, DINING, AND PE: ${povrsina_HDPE} m² (100 + 0.3N)`,
    `LEARNING RESOURCE AREAS: ${povrsina_LRA} m² (10 + 0.1N)`,
    `STAFF AND ADMINISTRATION: ${povrsina_SA} m² (30 + 0.2N)`,
    `STORAGE: ${povrsina_ST} m² (20 + 0.15N)`,
    `FLOAT: ${povrsina_F} m² (80 + 0.15N)`,
    `MIN NONE-NET AREA: ${povrsina_NNA} m² (110 + 1.2N)`,
    `TOILETS AND PERSONAL CARE: ${povrsina_T} m² (100 pupils/15m² + 20 teachers/10m²)`,
    `KITCHEN FACILITIES: ${povrsina_KF} m² (15 + 0.06N)+(5 + 0.25N)`,
    `PLANT: ${povrsina_P} m² (1.5% NA)`,
    `CIRCULATION: ${povrsina_C} m² (min 20% NA = ${povrsina_C_REC} m²)`,
    `INTERNAL WALLS: ${povrsina_W} m² (6% NA)`,
    ``,
    `SUM NET AREA: ${povrsina_SNA} m²`,
    `SUM NONE-NET AREA: ${povrsina_SNNA} m²`,
    ``,
    `TOTAL AREA REQUIRED: ${povrsina_TA} m²`,
    ``,
    `DIFFERENCE: ${ povrsina_DTA} m² (GROSS AREA - TOTAL AREA REQUIRED:)`,
    // Možete dodati više redova po potrebi...
];

  // Izračunavanje početne x pozicije za tekst
  let textStartX = cols * cellSize + 2 * cellSize;
  // Postavljanje početne y pozicije
  let textStartY = 20;
  // Definisanje proreda između linija teksta
  let lineSpacing = 20;

  // Prolazak kroz niz tekstova i ispisivanje svakog sa automatskim proredom
  for (let i = 0; i < texts.length; i++) {
    displayText(texts[i], textStartX, textStartY + i * lineSpacing);
  }
}

function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}




function drawGrid() {
  noStroke();
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellSize;
      let y = j * cellSize;
      let state = grid[i][j];
      let hasDrawnHorizontalRectState3 = false;
      let hasDrawnVerticalRectState3 = false;
      // Crtanje osnovnih ćelija na osnovu njihovog stanja
      if (grid[i][j] == 0) {
        // strokeWeight(0.5);
        // stroke(210);
        fill(color_parcela); // Bijela boja za stanje 0
      } else if (grid[i][j] == 1) {
        noStroke();
        fill(color_koridor); // Siva boja za stanje 1
      } else if (grid[i][j] == 2) {
        // strokeWeight(0.5);
        // stroke(210);
        fill(255); // Svijetlo siva boja za stanje 2
      } else if (grid[i][j] == 3) {
        // stroke(255, 102, 204);
        fill(color_ucionice); // Roze boja za stanje 3
      } else if (grid[i][j] == 4) {
      // stroke(255, 102, 204);
      fill(color_parcela); // Roze boja za stanje 3
    }
      rect(x, y, cellSize, cellSize); // Crtanje ćelije



      // Crtanje osnovnih ćelija i dodatnih elemenata za stanje 1
      if (state === 1) {
        hasDrawn = drawPinkRectangles(i, j); // Provera i crtanje rozih pravougaonika i ažuriranje statusa
        drawPinkSquares(i, j);
        drawWhiteRectangles(i, j, hasDrawn.horizontal, hasDrawn.vertical);


      }



    }
  }
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = i * cellSize;
      let y = j * cellSize;
      let state = grid[i][j];


      drawGreenSquares(i, j);
      // Provera za crtanje žutih kvadrata
      if (showYellowSquares) {
        drawYellowSquare(i, j, state);

      }
      countYellowSquare(i, j, state);


    }
  }
  // Crtanje mreže (linija mreže) na kraju ako je to omogućeno
  if (showGrid) {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = i * cellSize;
        let y = j * cellSize;
        strokeWeight(0.1);
        stroke(80);
        noFill();
        rect(x, y, cellSize, cellSize); // Crtanje ćelije
      }
    }
  }


  calculateAndDisplayAreas();
  drawBorder();
  
  fill(0); // Crna boja teksta
  textSize(16); // Veličina teksta
  // text(resetCounter, 5, rows * cellSize + cellSize - 5); // Prikazivanje brojača
  text(resetCounter-1, 5, rows * cellSize + cellSize - 5); // Prikazivanje brojača

}

function calculatePinkPixelsArea() {
  loadPixels();
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i+1];
    let b = pixels[i+2];
    // Pretpostavljene RGB vrednosti za roze
    if (r == 255 && g == 102 && b == 204) {
      count++;
    }
  }

  return count; // Vraća broj roze piksela
}
function calculateGrayPixelsArea() {
  loadPixels();
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i+1];
    let b = pixels[i+2];
    // Provera da li je piksel sive boje
    if (r == 200 && g == 200 && b == 200) {
      count++;
    }
  }
  return count; // Vraća broj sivih piksela
}



function saveCanvasImage() {
  saveCanvas('myCanvas_' + nf(imageCounter, 3, 0), 'png'); // Dodavanje brojača u ime datoteke
  imageCounter++; // Povećanje brojača nakon svakog snimanja
}


// function autoSaveImages() {
//   let csvContent = "No#,NUMBER OF PUPIL PLACES (N),GROSS AREA,Potrebna povrsina,broj uglova\n"; // Zaglavlje CSV fajla
//   let resetCounter=0;

//   let autoSaveIndex = 1; // Pretpostavljam da je ovo inicijalizovano negde
//   const saveImage = (i) => {

//     resetGrid(); // Pretpostavka je da ovo ažurira potrebne promenljive
//     resetCounter++;
//     // Dodajemo red u CSV za trenutnu konfiguraciju
//     csvContent += `${resetCounter},${br_U},${totalSquareMeters},${povrsina_TA},${yellowSquaresCount}\n`;

//     saveCanvas('myCanvas_' + nf(autoSaveIndex, 4, 0), 'png'); // Snimanje slike
//     autoSaveIndex++; // Povećanje indeksa za auto snimanje


//     if (i < 99) {
//       setTimeout(() => saveImage(i + 1), 100); // Pauza od 100ms pre snimanja sledeće slike
//     } else {
//       // Kreiranje i preuzimanje CSV-a nakon snimanja svih slika
//       let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//       let url = URL.createObjectURL(blob);
//       var link = document.createElement("a");
//       link.href = url;
//       link.download = "my_data.csv";
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     }
//   };

//   saveImage(0); // Početak snimanja slika
// }
function autoSaveImages() {
  let csvContent = "No#,NUMBER OF PUPIL PLACES (N),GROSS AREA,Potrebna povrsina,broj uglova\n"; // Zaglavlje CSV fajla
  let resetCounter = 0;
  let validSaves = 0; // Prati koliko je validnih slika snimljeno
  let autoSaveIndex = 1; // Početni indeks za automatsko snimanje

  const saveImage = (i) => {
    if (validSaves >= 100) {
      // Ako je 100 validnih slika već snimljeno, prekida se snimanje i prelazi na generisanje CSV-a
      generateAndDownloadCSV();
      return; // Prekida dalje izvršenje
    }

    resetGrid(); // Resetuje grid i ažurira potrebne promenljive
    calculateAndDisplayAreas(); // Potencijalno ažurira br_U i druge promenljive

    if (br_U >= 120) {
      resetCounter++;
      validSaves++; // Povećava se broj validnih snimanja
      // Dodajemo red u CSV za trenutnu konfiguraciju
      csvContent += `${resetCounter},${br_U},${totalSquareMeters},${povrsina_TA},${yellowSquaresCount}\n`;

      saveCanvas('myCanvas_' + nf(autoSaveIndex, 4, 0), 'png'); // Snimanje slike
      autoSaveIndex++; // Povećanje indeksa za auto snimanje
    }

    setTimeout(() => saveImage(i + 1), 100); // Nastavlja sa sljedećom iteracijom
  };

  const generateAndDownloadCSV = () => {
    // Kreiranje i preuzimanje CSV-a nakon snimanja 100 validnih slika
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "my_data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  saveImage(0); // Početak snimanja slika
}






