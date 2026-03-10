import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import { useProjectionStore } from "./stores/projectionStore";
import "./styles.css";

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
void useProjectionStore(pinia).init().catch(() => undefined);
app.mount("#app");
