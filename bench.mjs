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

import * as YAML from "yaml";
import * as stdMsgpack from "@std/msgpack";
import * as stdToml from "@std/toml";
import * as stdYaml from "@std/yaml";
import * as msgpack from "@msgpack/msgpack";
import * as msgpackr from "msgpackr";
import protobuf from "protobufjs";

// --- Test Data ---

const createSampleData = (size) => {
  const sampleData = {
    string:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    number: Math.PI * 1000 * Math.random(),
    integer: Math.floor(Math.random() * -1000000),
    boolean: true,
    array: [],
    object: {},
    date: Date.now(),
  };

  for (let i = 0; i < size; i++) {
    sampleData.array.push({
      id: i,
      name: `item-${i}`,
      value: Math.random(),
      nested: {
        a: i * 2,
        b: `nested-${i}`,
      },
    });
    sampleData.object[`key-${i}`] = {
      id: i,
      name: `item-${i}`,
      value: Math.random(),
      nested: {
        a: i * 2,
        b: `nested-${i}`,
      },
    };
  }

  return sampleData;
};

const sampleData10 = createSampleData(10);
const sampleData100 = createSampleData(100);

// --- Protobuf.js Specific Setup ---
// Protobuf requires a schema and the data structure is more rigid.
// We adapt the sample data to fit the schema.

const protoSchema = `
syntax = "proto3";

message Sample {
  string string = 1;
  double number = 2;
  sint32 integer = 3;
  bool boolean = 4;

  message ArrayItem {
    int32 id = 1;
    string name = 2;
    double value = 3;
    message Nested {
      int32 a = 1;
      string b = 2;
    }
    Nested nested = 4;
  }

  repeated ArrayItem array = 5;

  map<string, ArrayItem> object = 6;
  int64 date = 7;
}
`;

const root = protobuf.parse(protoSchema).root;
const Sample = root.lookupType("Sample");

// --- Benchmark Configuration ---

const benchmarkTargets = [
  {
    name: "JSON (baseline)",
    encode: (data) => JSON.stringify(data),
    decode: (encoded) => JSON.parse(encoded),
  },
  {
    name: "YAML",
    encode: (data) => YAML.stringify(data),
    decode: (encoded) => YAML.parse(encoded),
  },
  {
    name: "@std/msgpack",
    encode: (data) => stdMsgpack.encode(data),
    decode: (encoded) => stdMsgpack.decode(encoded),
  },
  {
    name: "@std/toml",
    encode: (data) => stdToml.stringify(data),
    decode: (encoded) => stdToml.parse(encoded),
  },
  {
    name: "@std/yaml",
    encode: (data) => stdYaml.stringify(data),
    decode: (encoded) => stdYaml.parse(encoded),
  },
  {
    name: "@msgpack/msgpack",
    encode: (data) => msgpack.encode(data),
    decode: (encoded) => msgpack.decode(encoded),
  },
  {
    name: "msgpackr",
    encode: (data) => msgpackr.pack(data),
    decode: (encoded) => msgpackr.unpack(encoded),
  },
  {
    name: "protobufjs",
    encode: (data) => {
      const message = Sample.create(data);
      return Sample.encode(message).finish();
    },
    decode: (encoded) => {
      return Sample.decode(encoded);
    },
  },
];

// --- Main Execution ---

async function main() {
  const dataSizes = [10, 100];

  for (const size of dataSizes) {
    const sampleData = size === 10 ? sampleData10 : sampleData100;
    console.log(`--- Payload Size and Verification (size: ${size}) ---`);
    for (const lib of benchmarkTargets) {
      try {
        const encoded = lib.encode(sampleData);
        const decoded = lib.decode(encoded);

        assert.ok(decoded, `${lib.name} failed to decode.`);
        assert.strictEqual(
          decoded.string,
          sampleData.string,
          `${lib.name} data mismatch`
        );

        console.log(
          `[${lib.name.padEnd(18)}] Size: ${(encoded.length || encoded.byteLength)
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
      bench.add(`${lib.name} - Encode (size: ${size})`, () => {
        lib.encode(sampleData);
      });
      bench.add(`${lib.name} - Decode (size: ${size})`, () => {
        lib.decode(lib.encoded);
      });
    }

    await bench.run();

    console.log(`--- Benchmark Results (size: ${size}) ---`);
    console.table(bench.table());
  }
}

main().catch(console.error);
