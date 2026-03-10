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

    const missionDomain = await mountWithRoute(App, "/missions/demo/log-entries");
    expect(missionDomain.text()).toContain("Mission Workspace");
    expect(missionDomain.text()).toContain("Mission UID");
    expect(missionDomain.text()).toContain("Logs & Changes");
  });

  it("renders comms routes", async () => {
    const topics = await mountWithRoute(App, "/comms/topics");
    expect(topics.text()).toContain("TOPIC REGISTRY");
    expect(topics.text()).toContain("Selected Branch");

    const chat = await mountWithRoute(App, "/comms/chat");
    expect(chat.text()).toContain("CHAT");
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
