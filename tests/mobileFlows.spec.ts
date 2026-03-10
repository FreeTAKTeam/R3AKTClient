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
});
