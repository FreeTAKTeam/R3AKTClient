import { createPinia } from "pinia";
import type { Component } from "vue";
import { mount } from "@vue/test-utils";
import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "./router";
import MissionDomainStackView from "./views/missions/MissionDomainStackView.vue";
import CommsTabView from "./views/tabs/CommsTabView.vue";
import HomeTabView from "./views/tabs/HomeTabView.vue";
import MapTabView from "./views/tabs/MapTabView.vue";
import MissionsTabView from "./views/tabs/MissionsTabView.vue";

async function mountWithRoute(component: Component, path: string) {
  const pinia = createPinia();
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();

  return mount(component, {
    global: {
      plugins: [pinia, router],
    },
  });
}

describe("view to store wiring", () => {
  it("renders discovery + telemetry shells on home", async () => {
    const wrapper = await mountWithRoute(HomeTabView, "/home");
    expect(wrapper.text()).toContain("Discovery and Session");
    expect(wrapper.text()).toContain("Telemetry");
    expect(wrapper.findAll("select option").length).toBeGreaterThan(0);
  });

  it("renders mission core shell on missions tab", async () => {
    const wrapper = await mountWithRoute(MissionsTabView, "/missions");
    expect(wrapper.text()).toContain("Mission Core");
    expect(wrapper.findAll("select option").length).toBeGreaterThan(0);
  });

  it("renders comms shell families by section route", async () => {
    const chat = await mountWithRoute(CommsTabView, "/comms/chat");
    expect(chat.text()).toContain("Comms Chat");

    const topics = await mountWithRoute(CommsTabView, "/comms/topics");
    expect(topics.text()).toContain("Comms Topics");

    const files = await mountWithRoute(CommsTabView, "/comms/files");
    expect(files.text()).toContain("Comms Files and Media");
  });

  it("renders map shell", async () => {
    const wrapper = await mountWithRoute(MapTabView, "/map");
    expect(wrapper.text()).toContain("Map, Markers, and Zones");
    expect(wrapper.findAll("select option").length).toBeGreaterThan(0);
  });

  it("maps mission-domain shells to family stores", async () => {
    const checklists = mount(MissionDomainStackView, {
      props: {
        missionUid: "mission-1",
        domainKind: "checklists",
      },
      global: {
        plugins: [createPinia()],
      },
    });
    expect(checklists.text()).toContain("Mission Checklists");

    const teams = mount(MissionDomainStackView, {
      props: {
        missionUid: "mission-1",
        domainKind: "teams",
      },
      global: {
        plugins: [createPinia()],
      },
    });
    expect(teams.text()).toContain("Mission Teams");

    const assets = mount(MissionDomainStackView, {
      props: {
        missionUid: "mission-1",
        domainKind: "assets",
      },
      global: {
        plugins: [createPinia()],
      },
    });
    expect(assets.text()).toContain("Assets");

    const zones = mount(MissionDomainStackView, {
      props: {
        missionUid: "mission-1",
        domainKind: "zones",
      },
      global: {
        plugins: [createPinia()],
      },
    });
    expect(zones.text()).toContain("Mission Zones");
  });
});
