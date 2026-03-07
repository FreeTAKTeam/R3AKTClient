import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type ShallowRef,
} from "vue";

export function useViewportChrome(
  headerRef: ShallowRef<HTMLElement | null>,
  footerRef: ShallowRef<HTMLElement | null>,
) {
  const headerHeight = shallowRef(0);
  const footerHeight = shallowRef(0);
  const chromeObserver = shallowRef<ResizeObserver | null>(null);

  function measure(): void {
    headerHeight.value = headerRef.value?.offsetHeight ?? 0;
    footerHeight.value = footerRef.value?.offsetHeight ?? 0;
  }

  function bindObserver(): void {
    chromeObserver.value?.disconnect();
    measure();

    if (typeof ResizeObserver === "undefined") {
      chromeObserver.value = null;
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    if (headerRef.value) {
      observer.observe(headerRef.value);
    }
    if (footerRef.value) {
      observer.observe(footerRef.value);
    }

    chromeObserver.value = observer;
  }

  onMounted(() => {
    bindObserver();
    window.addEventListener("resize", measure, { passive: true });
  });

  onBeforeUnmount(() => {
    chromeObserver.value?.disconnect();
    chromeObserver.value = null;
    window.removeEventListener("resize", measure);
  });

  watch(
    () => [headerRef.value, footerRef.value],
    () => {
      bindObserver();
    },
  );

  const contentStyle = computed(() => ({
    height: `calc(100dvh - ${headerHeight.value + footerHeight.value}px)`,
    maxHeight: `calc(100dvh - ${headerHeight.value + footerHeight.value}px)`,
  }));

  return {
    contentStyle,
    footerHeight,
    headerHeight,
  };
}
