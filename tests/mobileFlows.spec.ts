import { expect, test, type Page } from "@playwright/test";

import { prepareDeterministicPage } from "./support/p4VisualHarness";

async function openNavigationDrawer(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Open navigation" }).first().click();
  await expect(page.getByRole("complementary", { name: "Navigation" })).toBeVisible();
}

async function expectDrawerClosed(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: "Close navigation" })).toHaveCount(0);
}

test.describe("mobile interaction flows", () => {
  test.beforeEach(async ({ page }) => {
    await prepareDeterministicPage(page);
  });

  test("navigation drawer switches between primary routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-screen")).toBeVisible();

    await openNavigationDrawer(page);
    await page.getByLabel("Navigation").getByRole("link", { name: "Missions" }).click();
    await expect(page).toHaveURL(/\/missions$/);
    await expect(page.getByTestId("missions-screen")).toBeVisible();
    await expectDrawerClosed(page);

    await openNavigationDrawer(page);
    await page.getByLabel("Navigation").getByRole("link", { name: "Webmap" }).click();
    await expect(page).toHaveURL(/\/webmap$/);
    await expect(page.getByTestId("webmap-screen")).toBeVisible();
    await expectDrawerClosed(page);

    await openNavigationDrawer(page);
    await page.getByLabel("Navigation").getByRole("link", { name: "Configure" }).click();
    await expect(page).toHaveURL(/\/ops\/settings$/);
    await expect(page.getByTestId("settings-screen")).toBeVisible();
  });

  test("dashboard parity panels execute mock-backed session and telemetry requests", async ({ page }) => {
    await page.goto("/dashboard");

    const sessionPanel = page.getByTestId("session-parity-panel");
    await expect(sessionPanel).toBeVisible();

    await sessionPanel.getByRole("button", { name: "App Info" }).click();
    await expect(sessionPanel.getByText("getAppInfo completed.")).toBeVisible();
    await expect(sessionPanel).toContainText("mocked");
    await expect(sessionPanel.getByText('"type": "getAppInfo"', { exact: false })).toBeVisible();

    const telemetryPanel = page.getByTestId("telemetry-drilldown-panel");
    await expect(telemetryPanel).toBeVisible();

    await telemetryPanel.getByRole("button", { name: "Request" }).click();
    await expect(telemetryPanel.getByText("Telemetry Snapshot")).toBeVisible();
    await expect(telemetryPanel).toContainText("mocked");
    await expect(telemetryPanel.getByText('"type": "TelemetryRequest"', { exact: false })).toBeVisible();
  });

  test("chat sends a mock-backed outbound message", async ({ page }) => {
    await page.goto("/comms/chat");
    await expect(page.getByTestId("comms-chat-screen")).toBeVisible();

    await page.getByPlaceholder("Encrypted message").fill("Playwright E2E relay");
    await page.getByRole("button", { name: "send" }).click();

    await expect(page.getByText("Playwright E2E relay", { exact: true })).toBeVisible();
    await expect(page.getByText("Operative 01")).toBeVisible();
  });

  test("files panel retrieves a mock-backed record and exposes preview actions", async ({ page }) => {
    await page.goto("/comms/files");
    await expect(page.getByTestId("comms-files-screen")).toBeVisible();

    await page.getByText("Field Manual Packet").click();

    await expect(page.getByText("Selected file")).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await expect(page.getByText("Topic Association")).toBeVisible();
  });

  test("checklist detail toggles task status and applies row styling", async ({ page }) => {
    await page.goto("/checklists/reconnaissance");
    await expect(page.getByTestId("checklist-detail-screen")).toBeVisible();

    await page.getByText("Mission Briefing").click();
    await expect(page.getByText("Task completed locally.").first()).toBeVisible();

    const styleInputs = page.getByPlaceholder("highlight / blocked / custom");
    await styleInputs.first().fill("highlight");
    await page.getByRole("button", { name: "Apply Style" }).first().click();

    await expect(page.getByText("Row style updated to highlight.").first()).toBeVisible();
    await expect(page.getByText("highlight").first()).toBeVisible();
  });

  test("mission workspace assigns parent and RDE role from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/mission");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    await expect(page.locator('option[value="relay-watch"]')).toHaveCount(1);
    await page.getByLabel("Parent Mission").selectOption("relay-watch");
    await page.getByRole("button", { name: "Apply Parent" }).click();
    await expect(page.getByText("Parent mission set to relay-watch.")).toBeVisible();

    await page.getByLabel("RDE Role").fill("overwatch");
    await page.getByRole("button", { name: "Assign RDE" }).click();
    await expect(page.getByText("RDE role updated to overwatch.")).toBeVisible();
    await expect(page.getByText("overwatch").first()).toBeVisible();
  });
});
