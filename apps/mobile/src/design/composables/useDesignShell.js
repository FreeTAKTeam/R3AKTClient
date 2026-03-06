import { inject, provide, readonly, shallowRef, } from "vue";
const designShellKey = Symbol("design-shell");
export function provideDesignShell() {
    const isDrawerOpen = shallowRef(false);
    const openDrawer = () => {
        isDrawerOpen.value = true;
    };
    const closeDrawer = () => {
        isDrawerOpen.value = false;
    };
    const toggleDrawer = () => {
        isDrawerOpen.value = !isDrawerOpen.value;
    };
    const context = {
        isDrawerOpen: readonly(isDrawerOpen),
        openDrawer,
        closeDrawer,
        toggleDrawer,
    };
    provide(designShellKey, context);
    return context;
}
export function useDesignShell() {
    const context = inject(designShellKey);
    if (!context) {
        throw new Error("Design shell context is not available.");
    }
    return context;
}
