Of course. Here is the updated document with the performance tables sorted by speed (highest throughput first).

## Data Serialization Benchmark Results & Analysis

### Executive Summary

The benchmark results show a clear distinction between human-readable formats (JSON, YAML, TOML, XML) and binary formats (MessagePack, CBOR).

- **For Raw Performance and Compactness**: **`msgpackr`** is the definitive winner. It consistently offers the fastest encoding and decoding speeds, especially as payloads increase, while also keeping the payload size small. The official **`@msgpack/msgpack`** is also a strong performer.

- **For Balanced Performance and Ubiquity**: **JSON** serves as an excellent baseline. Its performance is highly competitive, and it benefits from universal support. For many standard use cases, its speed is more than sufficient.

- **For Human Readability**: **YAML** and **TOML** are poor choices for performance-critical applications. Their encoding and decoding processes are orders of magnitude slower than other formats. **XML**, as tested by `fast-xml-parser`, is also very slow, particularly in decoding. These formats are best suited for configuration files or scenarios where human interaction is the main priority.

- **Underperforming Binary Formats**: The standard library implementations of **`@std/msgpack`** and the **`cbor2`** library were notably slow in these tests, demonstrating that simply choosing a binary format does not guarantee performance.

---

### 💾 Payload Size Analysis

Binary formats are significantly more compact than their text-based counterparts.

- **Winner**: The **MessagePack** libraries (`@msgpack/msgpack` and `@std/msgpack`) are the undisputed leaders, creating the smallest payload in the `size: 100` test (12895 bytes). This represents a reduction of over 34% compared to JSON.
- **Runner-Up**: **`cbor2`** and **`msgpackr`** also produce very compact payloads.
- **Text Formats**: **JSON** is the most efficient of the text formats. **YAML**, **TOML**, and **XML** produce the largest payloads, making them less ideal for network transmission or storage-constrained environments.

| Format               | Size (100)  | % Smaller/Larger than JSON |
| :------------------- | :---------- | :------------------------- |
| **@msgpack/msgpack** | 12895 bytes | **-34.1%**                 |
| **cbor2**            | 13149 bytes | -32.8%                     |
| **msgpackr**         | 13697 bytes | -30.0%                     |
| **JSON**             | 19578 bytes | Baseline                   |
| **YAML**             | 22486 bytes | +14.9%                     |
| **@std/toml**        | 22846 bytes | +16.7%                     |
| **fast-xml-parser**  | 25509 bytes | +30.3%                     |

---

### 🚀 Performance: Encoding & Decoding Speed

Performance metrics reveal that the choice of library is as crucial as the choice of format.

#### Encoding (Object to Byte/String)

- **Small Payloads (size: 10)**: For smaller objects, **`msgpackr`** is the fastest encoder, with **`JSON`** being a very close second. Their throughput is significantly higher than all other libraries.
- **Large Payloads (size: 100)**: As the payload grows, **JSON** emerges as the fastest encoder, slightly edging out the high-performance MessagePack libraries `msgpackr` and `@msgpack/msgpack`.
- **Slow Outliers**: YAML, TOML, XML, and CBOR are extremely slow to encode, demonstrating that their structure comes at a significant computational cost.

#### Decoding (Byte/String to Object)

- **Top Performers**: **`msgpackr`** and **JSON** are the fastest decoders. For small payloads, they are neck-and-neck, while `msgpackr` shows a slight edge with larger payloads. The official **`@msgpack/msgpack`** is also a strong contender.
- **Slow Outliers**: The human-readable formats are once again the slowest. **`fast-xml-parser`**, in particular, has extremely slow decoding performance, making it unsuitable for read-heavy operations.

---

### 📈 Performance vs. Baseline (JSON)

A **positive percentage** indicates that the library is that much **faster** than the JSON baseline. A **negative percentage** means it is that much **slower**. The tables are sorted by throughput (ops/s) from fastest to slowest.

#### **`size: 10`**


| Task name                      | Throughput avg (ops/s) | % Faster/Slower than JSON |
| :----------------------------- | :--------------------- | :------------------------ |
| `msgpackr - Encode`            | 98429                  | +17.7%                    |
| **`JSON (baseline) - Encode`** | **83628**              | **Baseline**              |
| `@msgpack/msgpack - Encode`    | 54841                  | -34.4%                    |
| `fast-xml-parser - Encode`     | 19823                  | -76.3%                    |
| `@std/toml - Encode`           | 15708                  | -81.2%                    |
| `@std/msgpack - Encode`        | 6517                   | -92.2%                    |
| `@std/yaml - Encode`           | 6230                   | -92.5%                    |
| `cbor2 - Encode`               | 1565                   | -98.1%                    |
| `yaml - Encode`                | 1220                   | -98.5%                    |
|                                |                        |                           |
| `msgpackr - Decode`            | 67862                  | +4.3%                     |
| **`JSON (baseline) - Decode`** | **65082**              | **Baseline**              |
| `@msgpack/msgpack - Decode`    | 64081                  | -1.5%                     |
| `@std/msgpack - Decode`        | 23860                  | -63.3%                    |
| `cbor2 - Decode`               | 5813                   | -91.1%                    |
| `@std/yaml - Decode`           | 4343                   | -93.3%                    |
| `fast-xml-parser - Decode`     | 2727                   | -95.8%                    |
| `@std/toml - Decode`           | 2215                   | -96.6%                    |
| `yaml - Decode`                | 579                    | -99.1%                    |

#### **`size: 100`**

| Task name                      | Throughput avg (ops/s) | % Faster/Slower than JSON |
| :----------------------------- | :--------------------- | :------------------------ |
| **`JSON (baseline) - Encode`** | **7371**               | **Baseline**              |
| `msgpackr - Encode`            | 6963                   | -5.5%                     |
| `@msgpack/msgpack - Encode`    | 6612                   | -10.3%                    |
| `fast-xml-parser - Encode`     | 1727                   | -76.6%                    |
| `@std/toml - Encode`           | 1419                   | -80.7%                    |
| `@std/yaml - Encode`           | 661                    | -91.0%                    |
| `@std/msgpack - Encode`        | 629                    | -91.5%                    |
| `yaml - Encode`                | 149                    | -98.0%                    |
| `cbor2 - Encode`               | 137                    | -98.1%                    |
|                                |                        |                           |
| `msgpackr - Decode`            | 6823                   | +3.3%                     |
| **`JSON (baseline) - Decode`** | **6604**               | **Baseline**              |
| `@msgpack/msgpack - Decode`    | 4667                   | -29.3%                    |
| `@std/msgpack - Decode`        | 2406                   | -63.6%                    |
| `cbor2 - Decode`               | 604                    | -90.9%                    |
| `@std/yaml - Decode`           | 446                    | -93.2%                    |
| `fast-xml-parser - Decode`     | 303                    | -95.4%                    |
| `@std/toml - Decode`           | 215                    | -96.7%                    |
| `yaml - Decode`                | 60                     | -99.1%                    |

---

### 🔬 Library-Specific Reviews & Use Cases

This section provides a direct review of each library and format tested in the benchmark.

#### `JSON (baseline)`

- **Review**: Serves as the universal standard. Its performance is surprisingly robust, beating most other libraries in encoding larger objects and staying competitive in all other tests. It offers an excellent balance of speed, simplicity, and universal compatibility.
- **When to use**: The **default choice** for public-facing web APIs, configuration, and any scenario where developer accessibility and broad compatibility are more important than absolute peak performance.

#### `fast-xml-parser`

- **Review**: This library produces the largest payloads and suffers from exceptionally slow decoding speeds. Its primary function is to handle XML, a format often required for legacy systems or specific industry standards (e.g., SOAP).
- **When to use**: Only when you are **required to interface with a system that uses XML**. Avoid it for new projects or any performance-sensitive applications.

#### `YAML` & `@std/yaml`

- **Review**: Both YAML implementations are, by a large margin, the slowest in the benchmark for both encoding and decoding. Their payload size is also larger than JSON. Their primary feature is human readability.
- **When to use**: **Strictly for human-edited files**. Use it for complex configuration (e.g., Kubernetes manifests, CI/CD pipelines) where readability and comments are critical. **Avoid** these libraries completely for data interchange between services.

#### `@std/toml`

- **Review**: Like YAML, TOML's performance is not its strength; it is among the slowest options. It is designed to be a "minimal configuration file format that's easy to read due to obvious semantics."
- **When to use**: For **human-edited configuration files** where a simpler, flatter key-value structure is preferred over YAML's complexity. **Avoid** for any form of automated data exchange.

#### `cbor2`

- **Review**: While `cbor2` produces a compact payload, similar in size to MessagePack, its performance in these benchmarks was very poor. Encoding was particularly slow, lagging far behind all other formats, including the human-readable ones.
- **When to use**: When payload size is critical and you have a hard requirement for the CBOR standard (e.g., for certain IoT or WebAuthn applications). Be aware of the significant performance trade-offs, especially in encoding.

#### `@std/msgpack`

- **Review**: This standard library implementation of MessagePack is significantly under-optimized. While it produces a small payload, its encoding and decoding speeds are very slow, sometimes even lagging behind the baseline JSON.
- **When to use**: Only when you are in an environment where you are **required** to use the platform's built-in implementation and cannot import a more performant third-party package. Otherwise, it should be avoided.

#### `@msgpack/msgpack`

- **Review**: This is the official MessagePack implementation. It offers a great reduction in payload size compared to JSON and has respectable performance, though it is slightly slower than `msgpackr`.
- **When to use**: When you need a **stable, officially supported** MessagePack library and want a reliable improvement over JSON. It's a good, safe choice if you prioritize stability over cutting-edge speed.

#### `msgpackr`

- **Review**: A highly optimized, performance-focused MessagePack library. It was a top-tier performer in every test, with exceptional encoding and decoding speeds and a compact payload. It proves that the right library implementation can be transformative.
- **When to use**: This is the **go-to library for implementing MessagePack** in performance-critical applications. Use it for real-time communication, inter-service RPC calls, and anywhere you need a fast, schemaless binary format.
