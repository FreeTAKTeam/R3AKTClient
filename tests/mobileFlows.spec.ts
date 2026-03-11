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
    await Promise.all([
      page.waitForURL(/\/missions$/),
      page.getByLabel("Navigation").getByRole("link", { name: "Missions" }).first().click(),
    ]);
    await expect(page.getByTestId("missions-screen")).toBeVisible();
    await expectDrawerClosed(page);

    await openNavigationDrawer(page);
    await Promise.all([
      page.waitForURL(/\/webmap$/),
      page.getByLabel("Navigation").getByRole("link", { name: "Webmap" }).first().click(),
    ]);
    await expect(page.getByTestId("webmap-screen")).toBeVisible();
    await expectDrawerClosed(page);

    await openNavigationDrawer(page);
    await Promise.all([
      page.waitForURL(/\/ops\/settings$/),
      page.getByLabel("Navigation").getByRole("link", { name: "Configure" }).first().click(),
    ]);
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

  test("mission workspace links and unlinks an existing zone from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/zones");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    await expect(page.locator('option[value="staging-free"]')).toHaveCount(1);
    await page.getByLabel("Available Zones").selectOption("staging-free");
    await page.getByRole("button", { name: "Link Zone" }).click();

    await expect(page.getByText("Zone linked to mission: staging-free.")).toBeVisible();
    await expect(page.getByText("Staging Free").first()).toBeVisible();

    const stagingZoneRow = page.locator("li").filter({ hasText: "Staging Free" }).first();
    await stagingZoneRow.getByRole("button", { name: "Unlink" }).click();

    await expect(page.getByText("Zone unlinked from mission: staging-free.")).toBeVisible();
    await expect(page.locator('option[value="staging-free"]')).toHaveCount(1);
  });

  test("mission workspace links, unlinks, and deletes teams from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/teams");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    await expect(page.locator('option[value="team-reserve"]')).toHaveCount(1);
    await page.getByLabel("Available Teams").selectOption("team-reserve");
    await page.getByRole("button", { name: "Link Team" }).click();

    await expect(page.getByText("Team linked to mission: team-reserve.")).toBeVisible();
    const linkedReserveRow = page.locator("li").filter({ hasText: "Reserve Surge" }).first();
    await expect(linkedReserveRow).toBeVisible();

    const linkedHarborRow = page.locator("li").filter({ hasText: "Harbor Intercept" }).first();
    await linkedHarborRow.getByRole("button", { name: "Unlink", exact: true }).click();
    await expect(page.getByText("Team unlinked from mission: team-harbor.")).toBeVisible();
    await expect(page.locator('option[value="team-harbor"]')).toHaveCount(1);

    await linkedReserveRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Team deleted: team-reserve.")).toBeVisible();
    await expect(page.locator('option[value="team-reserve"]')).toHaveCount(0);
  });

  test("mission workspace creates, edits, and deletes team members from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/teams");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    const memberEditor = page.locator("article").filter({ hasText: "Member Editor" }).first();
    await memberEditor.getByRole("combobox").selectOption("team-harbor");
    await memberEditor.getByPlaceholder("Delta / Echo / Sierra").fill("Foxtrot");
    await memberEditor.getByPlaceholder("lead / operator / medic").fill("medic");
    await memberEditor.getByRole("button", { name: "Save Member" }).click();

    await expect(page.getByText("Team member created.")).toBeVisible();
    const linkedTeamsCard = page.locator("article").filter({ hasText: "Linked Teams" }).first();
    const foxtrotRow = linkedTeamsCard.locator("li").filter({ hasText: /^Foxtrot/ }).first();
    await expect(foxtrotRow).toBeVisible();

    await foxtrotRow.getByRole("button", { name: "Edit" }).click();
    await memberEditor.getByPlaceholder("lead / operator / medic").fill("lead medic");
    await memberEditor.getByRole("button", { name: "Update Member" }).click();

    await expect(page.getByText(/Team member updated:/)).toBeVisible();
    await expect(page.getByText("lead medic").first()).toBeVisible();

    await foxtrotRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/Team member deleted:/)).toBeVisible();
    await expect(page.locator("li").filter({ hasText: "Foxtrot" })).toHaveCount(0);
  });

  test("mission workspace records and updates member skills from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/teams");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    const skillEditor = page.locator("article").filter({ hasText: "Member Skill Editor" }).first();
    await skillEditor.getByRole("combobox").first().selectOption("member-delta");
    await skillEditor.getByRole("combobox").nth(1).selectOption("skill-relay");
    await skillEditor.getByPlaceholder("basic / advanced / expert").fill("advanced");
    await skillEditor.getByRole("button", { name: "Save Skill" }).click();

    await expect(page.getByText("Member skill recorded.")).toBeVisible();
    const linkedTeamsCard = page.locator("article").filter({ hasText: "Linked Teams" }).first();
    const deltaRow = linkedTeamsCard.locator("li").filter({ hasText: /^Delta/ }).first();
    await expect(deltaRow.getByText("Relay Ops")).toBeVisible();
    const relaySkillRow = deltaRow.locator("li").filter({ hasText: /^Relay Ops/ }).first();
    await expect(relaySkillRow.getByText("advanced", { exact: true })).toBeVisible();

    await relaySkillRow.getByRole("button", { name: "Edit" }).click();
    await skillEditor.getByPlaceholder("basic / advanced / expert").fill("expert");
    await skillEditor.getByRole("button", { name: "Update Skill" }).click();

    await expect(page.getByText(/Member skill updated:/)).toBeVisible();
    await expect(page.getByText("expert").first()).toBeVisible();
  });

  test("mission workspace links and unlinks member client identities from the approved route", async ({ page }) => {
    await page.goto("/missions/demo/teams");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    const linkedTeamsCard = page.locator("article").filter({ hasText: "Linked Teams" }).first();
    const echoRow = linkedTeamsCard.locator("li").filter({ hasText: /^Echo/ }).first();
    await expect(echoRow.getByText("c1a5-echo")).toBeVisible();

    await echoRow.getByRole("button", { name: "Unlink Client" }).click();
    await expect(page.getByText("Client identity unlinked from member: member-echo.")).toBeVisible();
    await expect(echoRow.getByText("No client identity link")).toBeVisible();

    const clientEditor = page.locator("article").filter({ hasText: "Member Client Link" }).first();
    await clientEditor.getByRole("combobox").selectOption("member-echo");
    await clientEditor.getByPlaceholder("c1a5-delta / 9f3c-client").fill("c1a5-echo-restored");
    await clientEditor.getByRole("button", { name: "Link Client" }).click();

    await expect(page.getByText("Client identity linked to member: member-echo.")).toBeVisible();
    await expect(echoRow.getByText("c1a5-echo-restored")).toBeVisible();
  });

  test("mission workspace edits a mission change from the approved log route", async ({ page }) => {
    await page.goto("/missions/demo/log-entries");
    await expect(page.getByTestId("mission-domain-screen")).toBeVisible();

    const existingChange = page.getByText("Ingress window shifted by 15 minutes due to harbor traffic.").first();
    await expect(existingChange).toBeVisible();

    const existingChangeRow = page.locator("li").filter({
      hasText: "Ingress window shifted by 15 minutes due to harbor traffic.",
    }).first();
    await existingChangeRow.getByRole("button", { name: "Edit" }).click();

    await page.getByPlaceholder("Describe the mission change for operators.").fill(
      "Ingress window shifted by 10 minutes due to cleared harbor traffic.",
    );
    await page.getByRole("button", { name: "Update Change" }).click();

    await expect(page.getByText("Mission change updated: change-ops-window.")).toBeVisible();
    await expect(
      page.getByText("Ingress window shifted by 10 minutes due to cleared harbor traffic.").first(),
    ).toBeVisible();
  });
});
