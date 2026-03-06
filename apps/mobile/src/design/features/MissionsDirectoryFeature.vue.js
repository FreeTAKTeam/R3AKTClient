/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { useDesignMissionsData } from "../composables/useDesignMissionsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";
const props = withDefaults(defineProps(), {
    variant: "directory",
});
const { broadcastMissionUpdate, createMission, editMission, missionDirectory, refreshMission, selectMission, selectedMission, statCards, } = useDesignMissionsData();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    variant: "directory",
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof PrototypeScreenFrame, typeof PrototypeScreenFrame, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PrototypeScreenFrame, new PrototypeScreenFrame({
    rootClass: "antialiased overflow-x-hidden",
}));
const __VLS_1 = __VLS_0({
    rootClass: "antialiased overflow-x-hidden",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
/** @type {[typeof PrototypeTopHeader, typeof PrototypeTopHeader, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(PrototypeTopHeader, new PrototypeTopHeader({
    title: "MISSIONS",
    headerClass: (__VLS_ctx.variant === 'workspace' ? 'bg-background-light dark:bg-background-dark border-slate-200 dark:border-primary/20' : ''),
    menuButtonClass: (__VLS_ctx.variant === 'workspace'
        ? 'flex size-10 shrink-0 items-center justify-center text-slate-900 transition-colors dark:text-slate-100'
        : 'p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10'),
}));
const __VLS_5 = __VLS_4({
    title: "MISSIONS",
    headerClass: (__VLS_ctx.variant === 'workspace' ? 'bg-background-light dark:bg-background-dark border-slate-200 dark:border-primary/20' : ''),
    menuButtonClass: (__VLS_ctx.variant === 'workspace'
        ? 'flex size-10 shrink-0 items-center justify-center text-slate-900 transition-colors dark:text-slate-100'
        : 'p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10'),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
{
    const { right: __VLS_thisSlot } = __VLS_6.slots;
    if (__VLS_ctx.variant === 'workspace') {
        /** @type {[typeof PrototypeLivePill, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({
            dot: true,
            label: "LIVE",
            tone: "danger",
        }));
        const __VLS_8 = __VLS_7({
            dot: true,
            label: "LIVE",
            tone: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    }
    else {
        /** @type {[typeof PrototypeLivePill, ]} */ ;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({
            dot: true,
            label: "ONLINE",
            tone: "primary",
        }));
        const __VLS_11 = __VLS_10({
            dot: true,
            label: "ONLINE",
            tone: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
        /** @type {[typeof PrototypeLivePill, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({
            label: "LIVE",
            tone: "success",
        }));
        const __VLS_14 = __VLS_13({
            label: "LIVE",
            tone: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
}
var __VLS_6;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "flex-1 overflow-y-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-2 gap-3 p-4" },
});
for (const [stat] of __VLS_getVForSourceType((__VLS_ctx.statCards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (stat.label),
        ...{ class: "flex flex-col gap-1 rounded-xl border border-slate-300 bg-slate-200/50 p-4 dark:border-primary/20 dark:bg-primary/10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-primary/70" },
    });
    (stat.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-2xl font-bold leading-tight tabular-nums text-slate-900 dark:text-white" },
    });
    (stat.value);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-2 flex items-center justify-between px-4 py-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.createMission) },
    ...{ class: "flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold leading-normal tracking-wide text-background-dark shadow-lg shadow-primary/20" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "material-symbols-outlined !text-lg" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-3 px-4 py-4" },
});
if (__VLS_ctx.selectedMission) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute right-0 top-0 p-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col gap-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-base font-bold text-slate-900 dark:text-white" },
    });
    (__VLS_ctx.selectedMission.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-slate-500 dark:text-slate-400" },
    });
    (__VLS_ctx.selectedMission.missionId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4 space-y-4 border-t border-primary/20 pt-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs font-medium uppercase text-slate-500 dark:text-slate-400" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rounded bg-slate-200 px-2 py-1 text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200" },
    });
    (__VLS_ctx.selectedMission.status);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-3 gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.refreshMission) },
        ...{ class: "flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined !text-lg text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.broadcastMissionUpdate) },
        ...{ class: "flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined !text-lg text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.editMission) },
        ...{ class: "flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined !text-lg text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3 border-l border-primary/30 pl-2" },
    });
    for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.selectedMission.timeline))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (entry.id),
            ...{ class: "relative text-[11px]" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "absolute -left-[13px] top-1.5 size-1.5 rounded-full" },
            ...{ class: (entry.tone === 'primary' ? 'bg-primary' : 'bg-slate-400') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-slate-800 dark:text-slate-200" },
        });
        (entry.value);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-[9px] text-slate-500 dark:text-slate-500" },
        });
        (entry.time);
    }
}
for (const [mission] of __VLS_getVForSourceType((__VLS_ctx.missionDirectory.filter((item) => item.id !== __VLS_ctx.selectedMission?.id)))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectMission(mission.id);
            } },
        key: (mission.id),
        ...{ class: "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-70 dark:border-primary/10 dark:bg-primary/5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col gap-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-sm font-bold text-slate-900 dark:text-white" },
    });
    (mission.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-[10px] text-slate-500 dark:text-slate-400" },
    });
    (mission.missionId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-slate-400" },
    });
}
if (__VLS_ctx.missionDirectory.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-4 pb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-300 dark:border-primary/20 dark:bg-slate-800" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ class: "h-full w-full object-cover opacity-50 mix-blend-overlay" },
    alt: "Digital satellite map view with mission markers",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWumfadGQODXy80R3B_uWm_rOv57FdBwRs2bHpFKqbDuf9rk_Ph0UNRazu7kJoCyUOp5Hj_lxWi7Nx26cyKm3yFtCGci0UNipBoZpgNmR3ywYc0HOL6DurSxEcxqrXnn41Rz1RuLXjr1cTxluOVZIohtEhraoj-LRfbhcT6c7BM-6WoamZ9hmyG7T-KIkZHyz8iyj0CGn59HRb2hh1avQ74sXAD868NeQbADJPNqJr48FzeBMbXOwusu3nvxGPof1hqRgSV5mwag",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute inset-0 flex items-center justify-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-[10px] font-bold uppercase tracking-widest text-primary/50" },
});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-200/50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-primary/70']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['tabular-nums']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-9']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-normal']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-background-dark']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['!text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['!text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['!text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['!text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-600']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border-l']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-left-[13px]']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['size-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-32']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-300']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['mix-blend-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/50']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PrototypeLivePill: PrototypeLivePill,
            PrototypeScreenFrame: PrototypeScreenFrame,
            PrototypeTopHeader: PrototypeTopHeader,
            broadcastMissionUpdate: broadcastMissionUpdate,
            createMission: createMission,
            editMission: editMission,
            missionDirectory: missionDirectory,
            refreshMission: refreshMission,
            selectMission: selectMission,
            selectedMission: selectedMission,
            statCards: statCards,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
