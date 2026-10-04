import { cp, readFile, writeFile } from "node:fs/promises";

const outputDirectory = new URL("../dist/", import.meta.url);
const presentationDirectory = new URL("../presentation/", import.meta.url);
const indexPath = new URL("index.html", outputDirectory);

await cp(presentationDirectory, new URL("presentation/", outputDirectory), { recursive: true });
await writeFile(new URL(".nojekyll", outputDirectory), "");

let html = await readFile(indexPath, "utf8");
html = html
  .replace('<html lang="en">', '<html lang="it">')
  .replaceAll('"/pictionary-party-game/', '"./')
  .replace(
    "</head>",
    `  <meta name="description" content="Gioco di disegno a squadre con tabellone, dado, parole e timer nello stesso dispositivo." />
    <meta property="og:title" content="Pictionary · Disegna, indovina, avanza" />
    <meta property="og:description" content="2–4 squadre, 60 caselle e cinque categorie da disegnare." />
    <meta name="theme-color" content="#003049" />
    <style>
      body { background: #003049; }
      @media (min-width: 720px) {
        #root { max-width: 620px; margin: 0 auto; box-shadow: 0 0 70px rgba(0,0,0,.32); }
      }
    </style>
  </head>`
  );

await writeFile(indexPath, html);
