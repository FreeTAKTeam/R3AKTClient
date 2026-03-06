/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { defineAsyncComponent, computed } from "vue";
import { useRouter } from "vue-router";
import { resolveDesignInteractionPath } from "../appNavigation";
import { useDesignShell } from "../composables/useDesignShell";
import { defaultStitchScreen, stitchScreensBySlug } from "../stitchScreens";
const props = defineProps();
const router = useRouter();
const { closeDrawer, openDrawer } = useDesignShell();
const screenModules = import.meta.glob("../screens/*.vue");
const screen = computed(() => stitchScreensBySlug[props.screenSlug] ?? defaultStitchScreen);
const screenComponent = computed(() => {
    const componentPath = `../screens/${screen.value.componentFileName}`;
    const moduleLoader = screenModules[componentPath];
    return moduleLoader
        ? defineAsyncComponent(async () => {
            const module = await moduleLoader();
            return module.default;
        })
        : null;
});
function normalizeText(value) {
    return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}
async function navigateTo(path) {
    if (router.currentRoute.value.path !== path) {
        await router.push(path);
    }
    closeDrawer();
}
function handleSurfaceClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }
    const button = target.closest("button");
    if (button) {
        const icon = normalizeText(button.querySelector(".material-symbols-outlined")?.textContent);
        if (icon === "menu") {
            event.preventDefault();
            openDrawer();
            return;
        }
        if (icon === "logout") {
            event.preventDefault();
            closeDrawer();
            return;
        }
    }
    if (target.closest("input, label")) {
        return;
    }
    const interactiveElement = target.closest('a[href="#"], .cursor-pointer');
    if (!interactiveElement) {
        return;
    }
    const destination = resolveDesignInteractionPath(interactiveElement.textContent ?? "");
    if (!destination) {
        return;
    }
    event.preventDefault();
    void navigateTo(destination);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ onClick: (__VLS_ctx.handleSurfaceClick) },
    ...{ class: "screen-page" },
});
if (__VLS_ctx.screenComponent) {
    const __VLS_0 = ((__VLS_ctx.screenComponent));
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
    const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
/** @type {__VLS_StyleScopedClasses['screen-page']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            screenComponent: screenComponent,
            handleSurfaceClick: handleSurfaceClick,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
