import { ref } from "vue";

const isNavigationDrawerOpen = ref(false);

export function useNavigationDrawer() {
  function openNavigationDrawer(): void {
    isNavigationDrawerOpen.value = true;
  }

  function closeNavigationDrawer(): void {
    isNavigationDrawerOpen.value = false;
  }

  function toggleNavigationDrawer(): void {
    isNavigationDrawerOpen.value = !isNavigationDrawerOpen.value;
  }

  return {
    isNavigationDrawerOpen,
    openNavigationDrawer,
    closeNavigationDrawer,
    toggleNavigationDrawer,
  };
}
