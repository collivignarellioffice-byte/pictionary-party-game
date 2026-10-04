const board = document.querySelector("#mini-board");
const isLocalFile = window.location.protocol === "file:";
const isBuiltPresentation = window.location.pathname.includes("/dist/presentation/");
const gameHref = isLocalFile
  ? isBuiltPresentation ? "../index.html" : "../dist/index.html"
  : "../";

document.querySelectorAll("[data-game-link]").forEach((link) => {
  link.setAttribute("href", gameHref);
});

const pawnPositions = new Map([
  [17, "indigo"],
  [22, "yellow"],
  [24, "red"],
  [31, "black"],
]);

if (board) {
  for (let position = 1; position <= 60; position += 1) {
    const cell = document.createElement("span");
    cell.className = `mini-cell${position === 17 ? " active" : ""}`;
    cell.textContent = String(position);
    const pawnColor = pawnPositions.get(position);
    if (pawnColor) {
      const pawn = document.createElement("i");
      pawn.className = `mini-pawn ${pawnColor}`;
      cell.appendChild(pawn);
    }
    board.appendChild(cell);
  }
}
