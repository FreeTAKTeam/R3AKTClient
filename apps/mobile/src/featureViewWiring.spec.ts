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

describe("design shell wiring", () => {
  it("renders dashboard route inside the design shell", async () => {
    const wrapper = await mountWithRoute(App, "/dashboard");
    expect(wrapper.text()).toContain("Home");
    expect(wrapper.text()).toContain("Overview");
    expect(wrapper.text()).toContain("Pulse");
  });

  it("renders mission and checklist design routes", async () => {
    const missions = await mountWithRoute(App, "/missions");
    expect(missions.text()).toContain("Missions");
    expect(missions.text()).toContain("Workspace");

    const checklists = await mountWithRoute(App, "/checklists");
    expect(checklists.text()).toContain("Checklists");
    expect(checklists.text()).toContain("Board");
  });

  it("renders comms-adjacent design routes", async () => {
    const topics = await mountWithRoute(App, "/topics");
    expect(topics.text()).toContain("Topics");
    expect(topics.text()).toContain("Registry");

    const chat = await mountWithRoute(App, "/chat");
    expect(chat.text()).toContain("Secure Chat");
  });

  it("renders map and settings routes", async () => {
    const webmap = await mountWithRoute(App, "/webmap");
    expect(webmap.text()).toContain("Webmap");
    expect(webmap.text()).toContain("Tactical");

    const settings = await mountWithRoute(App, "/settings");
    expect(settings.text()).toContain("Configure");
  });

  it("renders task detail route", async () => {
    const wrapper = await mountWithRoute(App, "/checklists/task-detail");
    expect(wrapper.text()).toContain("Task Detail");
  });
});
