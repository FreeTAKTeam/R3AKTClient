import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const generatedOpsPath = path.join(
  repoRoot,
  "docs",
  "R3AKTClient",
  "generated",
  "client-operations.json",
);
const localCatalogPath = path.join(
  repoRoot,
  "API",
  "ReticulumCommunityHub-SouthboundCommands.json",
);
const tsCatalogPath = path.join(
  repoRoot,
  "packages",
  "node-client",
  "src",
  "generated",
  "clientOperations.ts",
);
const rustCatalogPath = path.join(
  repoRoot,
  "crates",
  "reticulum_mobile",
  "src",
  "generated",
  "client_operations.rs",
);
const supportedCommandsDocPath = path.join(
  repoRoot,
  "..",
  "Reticulum-Telemetry-Hub",
  "docs",
  "supportedCommands.md",
);

const generated = JSON.parse(fs.readFileSync(generatedOpsPath, "utf8"));
const localCatalog = JSON.parse(fs.readFileSync(localCatalogPath, "utf8"));
const expectedOps = new Set(generated.operations.map((entry) => entry.operation));
const localOps = new Set(localCatalog.operations.map((entry) => entry.operation));

function extractConstStrings(fileContent, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `${escapedName}[^\\[]*\\[(.*?)\\](?:\\s+as\\s+const)?;`,
    "s",
  ).exec(fileContent);
  if (!match) {
    throw new Error(`Unable to find ${name}.`);
  }
  return [...match[1].matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map((entry) =>
    JSON.parse(entry[0]),
  );
}

function extractQuotedDocOperations(fileContent) {
  const lines = fileContent.split(/\r?\n/);
  const operations = [];
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      inTable = false;
      continue;
    }
    if (/^\|\s*---/.test(trimmed)) {
      inTable = true;
      continue;
    }
    if (!inTable) {
      continue;
    }
    const cells = trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3) {
      continue;
    }
    const match = /`([^`]+)`/.exec(cells[0]);
    if (match) {
      operations.push(match[1]);
    }
  }
  return operations;
}

function diff(left, right) {
  return [...left].filter((value) => !right.has(value)).sort((a, b) => a.localeCompare(b));
}

const tsOps = new Set(extractConstStrings(fs.readFileSync(tsCatalogPath, "utf8"), "CLIENT_OPERATION_KEYS"));
const rustOps = new Set(
  extractConstStrings(fs.readFileSync(rustCatalogPath, "utf8"), "pub const CLIENT_OPERATION_KEYS: &[&str] ="),
);

let docOps = null;
let missingInCatalogVsDoc = [];
let extraInCatalogVsDoc = [];
if (fs.existsSync(supportedCommandsDocPath)) {
  docOps = new Set(extractQuotedDocOperations(fs.readFileSync(supportedCommandsDocPath, "utf8")));
  missingInCatalogVsDoc = diff(docOps, localOps);
  extraInCatalogVsDoc = diff(localOps, docOps);
}

const missingInTs = diff(expectedOps, tsOps);
const missingInRust = diff(expectedOps, rustOps);
const extraInTs = diff(tsOps, expectedOps);
const extraInRust = diff(rustOps, expectedOps);
const missingInGeneratedVsLocal = diff(localOps, expectedOps);
const extraInGeneratedVsLocal = diff(expectedOps, localOps);
const httpShapedPublicOperations = [...expectedOps]
  .filter((value) => /^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(value))
  .sort((a, b) => a.localeCompare(b));

const passed =
  expectedOps.size === 115 &&
  localOps.size === 115 &&
  missingInTs.length === 0 &&
  missingInRust.length === 0 &&
  extraInTs.length === 0 &&
  extraInRust.length === 0 &&
  missingInGeneratedVsLocal.length === 0 &&
  extraInGeneratedVsLocal.length === 0 &&
  httpShapedPublicOperations.length === 0 &&
  (docOps === null
    || (missingInCatalogVsDoc.length === 0 && extraInCatalogVsDoc.length === 0));

const report = {
  generated_at: new Date().toISOString(),
  expected_operation_count: expectedOps.size,
  local_catalog_operation_count: localOps.size,
  ts_operation_count: tsOps.size,
  rust_operation_count: rustOps.size,
  supported_commands_doc_present: docOps !== null,
  supported_commands_doc_operation_count: docOps?.size ?? null,
  passed,
  missing_in_generated_vs_local: missingInGeneratedVsLocal,
  extra_in_generated_vs_local: extraInGeneratedVsLocal,
  missing_in_ts: missingInTs,
  missing_in_rust: missingInRust,
  extra_in_ts: extraInTs,
  extra_in_rust: extraInRust,
  missing_in_catalog_vs_supported_commands_doc: missingInCatalogVsDoc,
  extra_in_catalog_vs_supported_commands_doc: extraInCatalogVsDoc,
  http_shaped_public_operations: httpShapedPublicOperations,
};

const reportPath = path.join(
  repoRoot,
  "docs",
  "R3AKTClient",
  "generated",
  "client-operation-coverage.json",
);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (!passed) {
  console.error("Client operation coverage check failed.");
  process.exit(1);
}

console.log("Client operation coverage check passed.");
