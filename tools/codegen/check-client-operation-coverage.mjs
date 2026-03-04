import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const generatedOpsPath = path.join(repoRoot, "docs", "R3AKTClient", "generated", "client-operations.json");
const tsCatalogPath = path.join(repoRoot, "packages", "node-client", "src", "generated", "clientOperations.ts");
const rustCatalogPath = path.join(repoRoot, "crates", "reticulum_mobile", "src", "generated", "client_operations.rs");

const generated = JSON.parse(fs.readFileSync(generatedOpsPath, "utf8"));
const expectedOps = new Set(generated.operations.map((entry) => entry.operation));

function extractQuotedStrings(fileContent) {
  const matches = fileContent.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g) ?? [];
  return matches.map((entry) => JSON.parse(entry));
}

const tsOps = new Set(
  extractQuotedStrings(fs.readFileSync(tsCatalogPath, "utf8")).filter((value) => /^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(value)),
);
const rustOps = new Set(
  extractQuotedStrings(fs.readFileSync(rustCatalogPath, "utf8")).filter((value) => /^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(value)),
);

function diff(left, right) {
  return [...left].filter((value) => !right.has(value)).sort((a, b) => a.localeCompare(b));
}

const missingInTs = diff(expectedOps, tsOps);
const missingInRust = diff(expectedOps, rustOps);
const extraInTs = diff(tsOps, expectedOps);
const extraInRust = diff(rustOps, expectedOps);

const passed =
  missingInTs.length === 0 &&
  missingInRust.length === 0 &&
  extraInTs.length === 0 &&
  extraInRust.length === 0;

const report = {
  generated_at: new Date().toISOString(),
  expected_operation_count: expectedOps.size,
  ts_operation_count: tsOps.size,
  rust_operation_count: rustOps.size,
  passed,
  missing_in_ts: missingInTs,
  missing_in_rust: missingInRust,
  extra_in_ts: extraInTs,
  extra_in_rust: extraInRust,
};

const reportPath = path.join(repoRoot, "docs", "R3AKTClient", "generated", "client-operation-coverage.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (!passed) {
  console.error("Client operation coverage check failed.");
  process.exit(1);
}

console.log("Client operation coverage check passed.");
