import { createPinia } from "pinia";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import App from "./App.vue";
import { createAppRouter } from "./router";

async function mountWithRoute(component: Component, path: string) {
  const pinia = createPinia();
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  const wrapper = mount(component, {
    global: {
      plugins: [pinia, router],
    },
  });
  await flushPromises();
  return wrapper;
}

describe("live shell wiring", () => {
  it("renders the live home route inside the mobile shell", async () => {
    const wrapper = await mountWithRoute(App, "/dashboard");
    expect(wrapper.text()).toContain("Community Hub");
    expect(wrapper.text()).toContain("DASHBOARD");
    expect(wrapper.text()).toContain("Backend Control");
    expect(wrapper.text()).toContain("Event Feed");
    expect(wrapper.text()).toContain("Session Controls");
    expect(wrapper.text()).toContain("Telemetry Drill-Down");
  });

  it("renders mission routes inside the live shell", async () => {
    const missions = await mountWithRoute(App, "/missions");
    expect(missions.text()).toContain("MISSIONS");
    expect(missions.text()).toContain("Mission Directory");

    const missionSummary = await mountWithRoute(App, "/missions/demo/mission");
    expect(missionSummary.text()).toContain("Mission Workspace");
    expect(missionSummary.text()).toContain("Parent Mission");
    expect(missionSummary.text()).toContain("RDE Role");

    const missionZones = await mountWithRoute(App, "/missions/demo/zones");
    expect(missionZones.text()).toContain("Linked Zones");
    expect(missionZones.text()).toContain("Attach Existing Zone");
    expect(missionZones.text()).toContain("Available Zones");

    const missionTeams = await mountWithRoute(App, "/missions/demo/teams");
    expect(missionTeams.text()).toContain("Linked Teams");
    expect(missionTeams.text()).toContain("Attach Existing Team");
    expect(missionTeams.text()).toContain("Available Teams");
    expect(missionTeams.text()).toContain("Member Editor");
    expect(missionTeams.text()).toContain("Save Member");
    expect(missionTeams.text()).toContain("Member Client Link");
    expect(missionTeams.text()).toContain("Link Client");
    expect(missionTeams.text()).toContain("Skill Catalog");
    expect(missionTeams.text()).toContain("Skill Editor");
    expect(missionTeams.text()).toContain("Member Skill Editor");
    expect(missionTeams.text()).toContain("Save Skill");

    const missionAssets = await mountWithRoute(App, "/missions/demo/assets");
    expect(missionAssets.text()).toContain("Assets");
    expect(missionAssets.text()).toContain("Asset Editor");
    expect(missionAssets.text()).toContain("Save Asset");
    expect(missionAssets.text()).toContain("Assignments");
    expect(missionAssets.text()).toContain("Assignment Editor");
    expect(missionAssets.text()).toContain("Link Asset");
    expect(missionAssets.text()).toContain("Replace Asset Set");

    const missionDomain = await mountWithRoute(App, "/missions/demo/log-entries");
    expect(missionDomain.text()).toContain("Mission Workspace");
    expect(missionDomain.text()).toContain("Mission UID");
    expect(missionDomain.text()).toContain("Logs & Changes");
    expect(missionDomain.text()).toContain("Change Editor");
    expect(missionDomain.text()).toContain("Save Change");
  }, 15000);

  it("renders comms routes", async () => {
    const topics = await mountWithRoute(App, "/comms/topics");
    expect(topics.text()).toContain("TOPIC REGISTRY");
    expect(topics.text()).toContain("Selected Branch");

    const chat = await mountWithRoute(App, "/comms/chat");
    expect(chat.text()).toContain("CHAT");

    const files = await mountWithRoute(App, "/comms/files");
    expect(files.text()).toContain("FILE REGISTRY");
    expect(files.text()).toContain("Active Channel");
    expect(files.text()).toContain("Refresh");
  });

  it("renders checklist detail routes inside the live shell", async () => {
    const checklistDetail = await mountWithRoute(App, "/checklists/reconnaissance");
    expect(checklistDetail.text()).toContain("Verification Sub-tasks");
    expect(checklistDetail.text()).toContain("Recent Activity");
    expect(checklistDetail.text()).toContain("Row Style");
    expect(checklistDetail.text()).toContain("Task Skill Requirements");
    expect(checklistDetail.text()).toContain("Save Requirement");
  });

  it("renders map and ops settings routes", async () => {
    const webmap = await mountWithRoute(App, "/webmap");
    expect(webmap.text()).toContain("WEBMAP");

    const settings = await mountWithRoute(App, "/ops/settings");
    expect(settings.text()).toContain("Settings");
    expect(settings.text()).toContain("Application Hub");
    expect(settings.text()).toContain("Hub Session Parity");
    expect(settings.text()).toContain("Telemetry Drill-Down");
  });

  it("renders ops routing surfaces", async () => {
    const peers = await mountWithRoute(App, "/ops/connect");
    expect(peers.text()).toContain("Peers & Discovery");

    const about = await mountWithRoute(App, "/ops/about");
    expect(about.text()).toContain("About R3AKTMobile");
  });
});
