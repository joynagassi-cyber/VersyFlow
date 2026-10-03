#!/usr/bin/env node
/**
 * Agnes AI image generator for VersyFlow (document assets).
 * Usage: node scripts/agnes-image.mjs "<prompt>" [out.png]
 * Reads AGNES_API_KEY from .env.local (or env).
 * Model: agnes-image-2.5-flash — Endpoint: https://apihub.agnes-ai.com/v1/images/generations
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

function loadEnv(file) {
  const vars = {};
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no env file */
  }
  return vars;
}

const root = path.resolve(new URL("..", import.meta.url).pathname);
const env = loadEnv(path.join(root, ".env.local"));
const apiKey = process.env.AGNES_API_KEY || env.AGNES_API_KEY;
if (!apiKey) {
  console.error(
    "AGNES_API_KEY manquant. Ajoute la clé dans .env.local :\n" +
      "AGNES_API_KEY=ta_cles_agnes\n" +
      "puis relance la commande.",
  );
  process.exit(1);
}

const [prompt, outArg] = process.argv.slice(2);
if (!prompt) {
  console.error('usage: node scripts/agnes-image.mjs "<prompt>" [out.png]');
  process.exit(2);
}
const out = outArg || path.join(root, "docs", "assets", "report", "ai", "image.png");
mkdirSync(path.dirname(out), { recursive: true });

const res = await fetch("https://apihub.agnes-ai.com/v1/images/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "agnes-image-2.5-flash",
  /* prompt, n: 1, size: "1024x1024" */
    prompt,
    n: 1,
  }),
});
if (!res.ok) {
  const body = await res.text();
  console.error("Agnes API erreur", res.status, body.slice(0, 300));
  process.exit(3);
}
const data = await res.json();
const item = data.data?.[0];
if (item?.url) {
  const img = await (await fetch(item.url)).arrayBuffer();
  writeFileSync(out, Buffer.from(img));
  console.log("image enregistrée :", out);
} else if (item?.b64_json) {
  writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log("image enregistrée :", out);
} else {
  console.error("réponse inattendue:", JSON.stringify(data).slice(0, 300));
  process.exit(4);
}
