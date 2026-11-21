// Lantern Thief — The Moon Pearl Heist, a top-down stealth game for make.fun.
// This entrypoint hands the game in: it copies the static game/ folder and the
// screenshots/ folder into the output directory and writes dossier.json there
// with the vendored make.fun library. The game itself is plain HTML + ES
// modules on a 2D canvas, no libraries and no network requests, so it runs
// offline straight from game/index.html.
//
// Locally: `node serve.ts` plays it at http://localhost:8080, and
// `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` builds the dossier.
// Nothing time-based or random is written to the output, so two runs of this
// program produce byte-identical dossiers.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyInto(sourceName, targetName) {
  const from = join(repoDir, sourceName);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, targetName), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyInto('game', 'game');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyInto('screenshots', 'screenshots');

// The scorer's caps: only the text cap shapes the dossier bytes; the rest make
// this program refuse anything the scorer would refuse anyway.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
