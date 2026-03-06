/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
import { RouterLink } from "vue-router";
const props = defineProps();
const emit = defineEmits();
const sectionLabel = computed(() => props.activeSection.label);
function isActiveItem(item) {
    return item.sectionKey === props.activeSection.key;
}
function isActiveView(view) {
    return props.activePath === view.path;
}
function handleSelection() {
    emit("close");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['nav-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-link']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-link']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "nav-surface" },
    ...{ class: ({ drawer: __VLS_ctx.drawer }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3 p-6 mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "material-symbols-outlined text-primary text-2xl" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-sm font-bold tracking-wider text-slate-100 uppercase" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-[10px] font-medium text-primary/80 uppercase tracking-widest" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-1 overflow-y-auto px-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "flex flex-col gap-1" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.topItems))) {
    const __VLS_0 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path ?? __VLS_ctx.activePath),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item) }) },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path ?? __VLS_ctx.activePath),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item) }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onClick: (__VLS_ctx.handleSelection)
    };
    __VLS_3.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-[22px]" },
    });
    (item.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm" },
        ...{ class: (__VLS_ctx.isActiveItem(item) ? 'font-semibold' : 'font-medium') },
    });
    (item.label);
    var __VLS_3;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "divider" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.middleItems))) {
    const __VLS_8 = ((item.disabled ? 'button' : __VLS_ctx.RouterLink));
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item), disabled: item.disabled }) },
        disabled: (item.disabled),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item), disabled: item.disabled }) },
        disabled: (item.disabled),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (...[$event]) => {
            !item.disabled && __VLS_ctx.handleSelection();
        }
    };
    __VLS_11.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-[22px]" },
    });
    (item.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm font-medium" },
    });
    (item.label);
    var __VLS_11;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "variant-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "variant-label" },
});
(__VLS_ctx.sectionLabel);
for (const [view] of __VLS_getVForSourceType((__VLS_ctx.currentViews))) {
    const __VLS_16 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        key: (view.key),
        to: (view.path),
        ...{ class: "variant-link" },
        ...{ class: ({ active: __VLS_ctx.isActiveView(view) }) },
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        key: (view.key),
        to: (view.path),
        ...{ class: "variant-link" },
        ...{ class: ({ active: __VLS_ctx.isActiveView(view) }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.handleSelection)
    };
    __VLS_19.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (view.variantLabel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "variant-arrow material-symbols-outlined" },
    });
    var __VLS_19;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "divider" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.utilityItems))) {
    const __VLS_24 = ((item.disabled ? 'button' : __VLS_ctx.RouterLink));
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item), disabled: item.disabled }) },
        disabled: (item.disabled),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        key: (item.key),
        to: (item.path),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.isActiveItem(item), disabled: item.disabled }) },
        disabled: (item.disabled),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (...[$event]) => {
            !item.disabled && __VLS_ctx.handleSelection();
        }
    };
    __VLS_27.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-[22px]" },
    });
    (item.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm font-medium" },
    });
    (item.label);
    var __VLS_27;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-auto border-t border-primary/10 p-4 bg-primary/5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "size-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ class: "h-full w-full object-cover" },
    alt: "Operator avatar",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo-Azs-3Pm4EWLtcKoMxpSuEg2H1ObYi1rF2NZwx5_OlBsimAEWuoDUpXPIPljAnrf8NwpGaZsI8UwDb7weRV_ARw1sIMqyJbriBKoUQadtwuQr8rqU0h-HQpY9Uud6HPy0usXuCsQvCx8eNgaaGSGb4YE00XCiQX6k5PHcUsFuMPoVAYc7omP8K02jRZ7OPZiCmIu4iiFfVm6b0YYXqQq3TC6vkvmGjINeI1q1P2w7SWimUfAxxfC33f6tuhnXQNPG1Jbn9gL7Q",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-xs font-bold text-slate-100" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-[10px] text-primary/70 uppercase" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
        } },
    ...{ class: "ml-auto text-slate-400 hover:text-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "material-symbols-outlined" },
});
/** @type {__VLS_StyleScopedClasses['nav-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/80']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[22px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['divider']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[22px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-label']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-link']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['divider']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[22px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['size-9']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/40']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/70']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterLink: RouterLink,
            sectionLabel: sectionLabel,
            isActiveItem: isActiveItem,
            isActiveView: isActiveView,
            handleSelection: handleSelection,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
