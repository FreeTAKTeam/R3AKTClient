import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";

import { defaultDesignView, designViews } from "./design/appNavigation";
import { stitchScreensBySlug } from "./design/stitchScreens";

const defaultRoutePath = defaultDesignView.path;

const slugRedirects = Object.fromEntries(
  designViews.map((view) => [view.screenSlug, view.path]),
) as Record<string, string>;

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: defaultRoutePath,
  },
  ...designViews.map((view) => ({
    path: view.path,
    name: view.key,
    component: () => import("./design/views/StitchScreenPage.vue"),
    props: {
      screenSlug: view.screenSlug,
    },
    meta: {
      sectionKey: view.sectionKey,
      title: view.title,
    },
  })),
  {
    path: "/design/:slug",
    name: "design-screen",
    redirect: (to) => {
      const slug = typeof to.params.slug === "string" ? to.params.slug : "";
      return stitchScreensBySlug[slug] ? slugRedirects[slug] ?? defaultRoutePath : defaultRoutePath;
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: defaultRoutePath,
  },
];

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
  });
}

export const router = createAppRouter();
