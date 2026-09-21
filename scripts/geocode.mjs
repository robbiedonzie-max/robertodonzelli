// Geocoding automatico dei luoghi: per ogni voce di places/data/places.json
// senza lat/lng ma con un "where", interroga Nominatim (OpenStreetMap) e scrive
// le coordinate. Eseguito dalla GitHub Action geocode.yml a ogni salvataggio;
// utilizzabile anche a mano:  node scripts/geocode.mjs
//
// Test di una singola query:  node scripts/geocode.mjs --test "Duomo, Milano"

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'places', 'data', 'places.json');
const USER_AGENT = 'robertodonzelli-places/1.0 (https://www.robertodonzelli.it/places)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const results = await res.json();
  if (!results.length) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon), label: results[0].display_name };
}

// --test "query"
const testIdx = process.argv.indexOf('--test');
if (testIdx !== -1) {
  const hit = await geocode(process.argv[testIdx + 1]);
  console.log(hit ? `${hit.lat}, ${hit.lng} — ${hit.label}` : 'nessun risultato');
  process.exit(0);
}

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const luoghi = Array.isArray(data.luoghi) ? data.luoghi : [];
let updated = 0;

for (const luogo of luoghi) {
  const hasCoords = luogo.lat != null && luogo.lng != null && !Number.isNaN(Number(luogo.lat)) && !Number.isNaN(Number(luogo.lng));
  if (hasCoords) continue;
  const where = (luogo.where || '').trim();
  if (!where) { console.log('∅ voce senza località, salto'); continue; }

  let hit = await geocode(where);
  await sleep(1100); // Nominatim: max 1 richiesta/secondo
  // secondo tentativo: solo l'ultima parte (spesso è la città/zona)
  if (!hit && where.includes(',')) {
    const tail = where.split(',').slice(1).join(',').trim();
    if (tail) { hit = await geocode(tail); await sleep(1100); }
  }
  if (!hit) { console.log(`✗ "${where}" non trovata`); continue; }

  luogo.lat = hit.lat;
  luogo.lng = hit.lng;
  console.log(`✓ "${where}" → ${hit.lat}, ${hit.lng}`);
  updated += 1;
}

if (updated) writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`${updated} luoghi geocodificati`);
