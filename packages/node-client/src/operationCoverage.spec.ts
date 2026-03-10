import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const coveragePath = path.resolve(
  currentDir,
  "../../../docs/R3AKTClient/generated/client-operation-coverage.json",
);

describe("operation coverage artifact", () => {
  it("reports full 115-command southbound parity", () => {
    const report = JSON.parse(fs.readFileSync(coveragePath, "utf8")) as {
      expected_operation_count: number;
      passed: boolean;
      missing_in_ts: string[];
      missing_in_rust: string[];
      extra_in_ts: string[];
      extra_in_rust: string[];
      http_shaped_public_operations: string[];
    };

    expect(report.expected_operation_count).toBe(115);
    expect(report.passed).toBe(true);
    expect(report.missing_in_ts).toHaveLength(0);
    expect(report.missing_in_rust).toHaveLength(0);
    expect(report.extra_in_ts).toHaveLength(0);
    expect(report.extra_in_rust).toHaveLength(0);
    expect(report.http_shaped_public_operations).toHaveLength(0);
  });
});
