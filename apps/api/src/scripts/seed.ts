import { seedGenome } from "../genome.js";

const result = seedGenome();
console.log(
  `[seed] ${result.items} items tagged (${
    result.tags
  } gene edges) — genome ready at http://127.0.0.1:8787/api/genome`,
);
