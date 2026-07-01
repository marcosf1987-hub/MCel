/**
 * Tests rápidos del normalizador usado en map-to-taxonomy.
 * Ejecutar: node scripts/test-taxonomy-map.mjs
 */
import assert from "node:assert/strict";

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

assert.equal(normalize("Fídeos"), "fideos");
assert.equal(normalize("  Carnes, Fiambres  "), "carnes fiambres");
assert.ok(normalize("Sugary snacks").includes("snack"));

console.log("test-taxonomy-map: OK");
