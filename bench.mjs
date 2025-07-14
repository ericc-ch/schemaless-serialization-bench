import assert from "node:assert";
import { Bench, hrtimeNow } from "tinybench";

import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as YAML from "yaml";
import * as stdYaml from "@std/yaml";
import * as stdToml from "@std/toml";

import { encode as cbor2Encode, decode as cbor2Decode } from "cbor2";
import * as msgpackr from "msgpackr";
import * as msgpack from "@msgpack/msgpack";
import * as stdMsgpack from "@std/msgpack";
import * as BSON from "bson";
import * as ion from "ion-js";

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

const xmlBuilder = new XMLBuilder();
const xmlParser = new XMLParser();

// --- Benchmark Configuration ---

const benchmarkTargets = [
  // --- Text-Based Formats ---
  {
    name: "JSON (baseline)",
    encode: (data) => JSON.stringify(data),
    decode: (encoded) => JSON.parse(encoded),
  },
  {
    name: "fast-xml-parser",
    encode: (data) => xmlBuilder.build({ root: data }),
    decode: (encoded) => xmlParser.parse(encoded).root,
  },
  {
    name: "yaml",
    encode: (data) => YAML.stringify(data),
    decode: (encoded) => YAML.parse(encoded),
  },
  {
    name: "@std/yaml",
    encode: (data) => stdYaml.stringify(data),
    decode: (encoded) => stdYaml.parse(encoded),
  },
  {
    name: "@std/toml",
    encode: (data) => stdToml.stringify(data),
    decode: (encoded) => stdToml.parse(encoded),
  },
  {
    name: "ion-text",
    encode: (data) => ion.dumpText(data),
    decode: (encoded) => ion.load(encoded),
  },
  // --- Binary Formats ---
  {
    name: "cbor2",
    encode: (data) => cbor2Encode(data),
    decode: (encoded) => cbor2Decode(encoded),
  },
  {
    name: "msgpackr",
    encode: (data) => msgpackr.pack(data),
    decode: (encoded) => msgpackr.unpack(encoded),
  },
  {
    name: "@msgpack/msgpack",
    encode: (data) => msgpack.encode(data),
    decode: (encoded) => msgpack.decode(encoded),
  },
  {
    name: "@std/msgpack",
    encode: (data) => stdMsgpack.encode(data),
    decode: (encoded) => stdMsgpack.decode(encoded),
  },
  {
    name: "bson",
    encode: (data) => BSON.serialize(data),
    decode: (encoded) => BSON.deserialize(encoded),
  },
  {
    name: "ion-binary",
    encode: (data) => ion.dumpBinary(data),
    decode: (encoded) => ion.load(encoded),
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

        // Custom assertion for XML as it might have type differences
        if (lib.name === "fast-xml-parser") {
          assert.ok(decoded, `${lib.name} failed to decode.`);
          assert.strictEqual(
            decoded.string,
            sampleData.string,
            `${lib.name} data mismatch on string`
          );
          // XML parsing may convert numbers, so we compare them loosely
          assert.ok(
            Math.abs(decoded.number - sampleData.number) < 1e-9,
            `${lib.name} data mismatch on number`
          );
        } else if (lib.name === "ion-text" || lib.name === "ion-binary") {
          // Ion decodes to object wrappers, requiring conversion before strict assertion.
          assert.ok(decoded, `${lib.name} failed to decode.`);
          assert.strictEqual(
            decoded.string.toString(), // Convert String object to primitive
            sampleData.string,
            `${lib.name} data mismatch on string`
          );
          assert.strictEqual(
            decoded.array[0].name.toString(), // Convert String object to primitive
            sampleData.array[0].name,
            `${lib.name} data mismatch on array content`
          );
        } else {
          // For other formats, a deep strict equal should work
          assert.deepStrictEqual(
            decoded,
            sampleData,
            `${lib.name} data mismatch`
          );
        }

        console.log(
          `[${lib.name.padEnd(18)}] Size: ${(
            encoded.length || encoded.byteLength
          )
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
    const bench = new Bench({ time: 200, iterations: 100, now: hrtimeNow });
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
