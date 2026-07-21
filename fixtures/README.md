# R3AKT Compatibility Fixtures

This directory contains REM-first and RCH-compatibility fixtures used to shape
the shared Rust crates before code extraction.

Fixture rules:

- every fixture must be listed in `manifest.json`
- every manifest entry must include source repository and source file
  provenance
- REM fixtures have priority when shaping shared APIs
- RCH-only behavior is represented as contracts and compatibility coverage
- product adapters, HTTP, WebSocket, SQLite migration, TAK, mobile runtime, and
  native bridge behavior stay out

MessagePack fixtures use `.msgpack.hex` when raw bytes already exist as
source-backed golden data. Compact REM field trees that are not checked in as
raw bytes upstream are represented as decoded field-tree fixtures until P3/P4
crate extraction can own the encoder.
