/**
 * Universal JS Benchmark for Serialization Libraries (using tinybench)
 * =================================================================
 * This script benchmarks the performance and payload size of various
 * MessagePack libraries against the native JSON implementation.
 *
 * It is designed to be runnable on Node.js, Deno, and Bun.
 *
 * --- How to Run ---
 *
 * Node.js:
 * node benchmark.mjs
 *
 * Deno:
 * deno run --allow-net --allow-read benchmark.mjs
 *
 * Bun:
 * bun run benchmark.mjs
 *
 */

import assert from "node:assert";
import { Bench, hrtimeNow } from "tinybench";

// --- Library Imports ---
// The following imports use specifiers compatible with Node, Deno, and Bun.

import { decode as stdDecode, encode as stdEncode } from "@std/msgpack";

import {
  decode as msgpackDecode,
  encode as msgpackEncode,
} from "@msgpack/msgpack";

import { pack, unpack } from "msgpackr";

// --- Test Data ---

const sampleData = {
  string: "Hello, this is a benchmark for various serialization libraries! 🦖",
  number: Math.PI * 1000,
  integer: -1234567,
  boolean: true,
  nil: null,
  array: [1, "two", true, null, { nested: true, value: 100 }],
  object: {
    a: 1,
    b: "2",
    c: { d: 4, e: 5 },
  },
  date: Date.now(),
  binary: new Uint8Array(Array.from({ length: 128 }, (_, i) => i)),
};

// --- Benchmark Configuration ---

const benchmarkTargets = [
  {
    name: "JSON (baseline)",
    data: sampleData,
    encode: (data) => JSON.stringify(data),
    decode: (encoded) => JSON.parse(encoded),
  },
  {
    name: "@std/msgpack",
    data: sampleData,
    encode: (data) => stdEncode(data),
    decode: (encoded) => stdDecode(encoded),
  },
  {
    name: "@msgpack/msgpack",
    data: sampleData,
    encode: (data) => msgpackEncode(data),
    decode: (encoded) => msgpackDecode(encoded),
  },
  {
    name: "msgpackr",
    data: sampleData,
    encode: (data) => pack(data),
    decode: (encoded) => unpack(encoded),
  },
];

// --- Main Execution ---

async function main() {
  // 1. Payload Size and Verification
  console.log("--- Payload Size and Verification ---");
  for (const lib of benchmarkTargets) {
    try {
      const encoded = lib.encode(lib.data);
      const decoded = lib.decode(encoded);

      assert.ok(decoded, `${lib.name} failed to decode.`);
      assert.strictEqual(
        decoded.string,
        lib.data.string,
        `${lib.name} data mismatch`
      );

      console.log(
        `[${lib.name.padEnd(18)}] Size: ${encoded.length
          .toString()
          .padStart(5)} bytes ✅`
      );
      // Store encoded data for the decode benchmark
      lib.encoded = encoded;
    } catch (error) {
      console.log(`[${lib.name.padEnd(18)}] SKIPPED due to error ❌`);
      console.error(`Error with library ${lib.name}:`, error.message);
      lib.skip = true;
    }
  }
  console.log("-------------------------------------\n");

  // 2. Performance Benchmarks with tinybench
  const bench = new Bench({ now: hrtimeNow });
  const runnableTargets = benchmarkTargets.filter((lib) => !lib.skip);

  for (const lib of runnableTargets) {
    bench.add(`${lib.name} - Encode`, () => {
      lib.encode(lib.data);
    });
    bench.add(`${lib.name} - Decode`, () => {
      lib.decode(lib.encoded);
    });
  }

  await bench.run();

  console.log("--- Benchmark Results ---");
  console.table(bench.table());
}

main().catch(console.error);
