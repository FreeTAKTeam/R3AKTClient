import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs", ".json", ".vue"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
  },
});
