/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { useDesignChecklistsData } from "../composables/useDesignChecklistsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";
const props = withDefaults(defineProps(), {
    variant: "clean",
});
const { checklists, loadedCount, progressFor, relativeLabel, selectedChecklist, selectedChecklistId, statusLabel, toggleTask, } = useDesignChecklistsData();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    variant: "clean",
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['custom-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-scrollbar']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof PrototypeScreenFrame, typeof PrototypeScreenFrame, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PrototypeScreenFrame, new PrototypeScreenFrame({
    rootClass: "antialiased overflow-hidden",
}));
const __VLS_1 = __VLS_0({
    rootClass: "antialiased overflow-hidden",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
if (__VLS_ctx.variant === 'v2') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "flex h-16 flex-none items-center justify-between border-b border-primary/10 bg-background-light p-4 pb-2 dark:bg-background-dark" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-3 items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-start" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: "p-1 -ml-1 text-slate-500 transition-colors hover:text-primary dark:text-slate-400" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-2xl" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-2xl text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end" },
    });
    /** @type {[typeof PrototypeLivePill, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({
        dot: true,
        label: "Live",
        rounded: "md",
        tone: "success",
    }));
    const __VLS_5 = __VLS_4({
        dot: true,
        label: "Live",
        rounded: "md",
        tone: "success",
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
}
else {
    /** @type {[typeof PrototypeTopHeader, typeof PrototypeTopHeader, ]} */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(PrototypeTopHeader, new PrototypeTopHeader({
        title: "CHECKLISTS",
    }));
    const __VLS_8 = __VLS_7({
        title: "CHECKLISTS",
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_9.slots.default;
    {
        const { right: __VLS_thisSlot } = __VLS_9.slots;
        /** @type {[typeof PrototypeLivePill, ]} */ ;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({
            label: "LIVE",
            tone: "success",
        }));
        const __VLS_11 = __VLS_10({
            label: "LIVE",
            tone: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    }
    var __VLS_9;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "space-y-4 pt-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xs font-bold uppercase tracking-[0.2em] text-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "font-mono text-[10px] text-slate-500" },
});
(__VLS_ctx.loadedCount);
for (const [checklist] of __VLS_getVForSourceType((__VLS_ctx.checklists))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedChecklistId = checklist.checklistId;
            } },
        key: (checklist.checklistId),
        ...{ class: "cyber-border relative w-full space-y-3 rounded-lg border border-primary/10 bg-primary/5 p-4 text-left" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute right-0 top-0 rounded-bl-lg p-1" },
        ...{ class: ((checklist.status ?? '').toLowerCase().includes('pending')
                ? 'border-l border-b border-yellow-500/30 bg-yellow-500/20'
                : 'bg-primary/20') },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "px-1 text-[10px] font-bold" },
        ...{ class: ((checklist.status ?? '').toLowerCase().includes('pending') ? 'text-yellow-500' : 'text-primary') },
    });
    ((checklist.status ?? "OFFLINE").toUpperCase());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-start justify-between pr-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100" },
    });
    (checklist.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "mt-1 text-xs text-slate-500 dark:text-slate-400" },
    });
    (checklist.description ?? "Checklist entry synchronized from the RCH store.");
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-1.5" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between font-mono text-[10px] text-primary/80" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.progressFor(checklist.checklistId));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "h-1.5 w-full overflow-hidden rounded-full bg-primary/10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-full bg-primary shadow-[0_0_8px_rgba(37,209,244,0.6)]" },
        ...{ style: ({ width: `${__VLS_ctx.progressFor(checklist.checklistId)}%` }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between border-t border-primary/10 pt-2 text-[10px] font-medium text-slate-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-xs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (checklist.taskCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-xs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.relativeLabel(checklist.updatedAt));
}
if (__VLS_ctx.selectedChecklist) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-8 space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xs font-bold uppercase tracking-[0.2em] text-primary" },
    });
    (__VLS_ctx.selectedChecklist.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    for (const [task] of __VLS_getVForSourceType((__VLS_ctx.selectedChecklist.tasks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedChecklist))
                        return;
                    __VLS_ctx.toggleTask(task.taskId);
                } },
            key: (task.taskId),
            ...{ class: "flex w-full items-center gap-4 rounded-xl border p-3 text-left" },
            ...{ class: (task.isComplete
                    ? 'border-primary/20 bg-primary/10'
                    : 'border-white/5 bg-slate-800/20 dark:bg-primary/5') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-shrink-0" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex size-6 items-center justify-center rounded" },
            ...{ class: (task.isComplete
                    ? 'bg-primary'
                    : 'border-2 border-primary/40') },
        });
        if (task.isComplete) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "material-symbols-outlined text-sm font-bold text-background-dark" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-start justify-between" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({
            ...{ class: "text-sm font-semibold text-slate-900 dark:text-slate-100" },
            ...{ class: (task.isComplete ? 'opacity-60' : '') },
        });
        (task.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase" },
            ...{ class: (task.isComplete
                    ? 'border-primary/30 text-primary'
                    : 'border-yellow-500/30 text-yellow-500') },
        });
        (__VLS_ctx.statusLabel(task.isComplete));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-[11px] text-slate-500 dark:text-slate-400" },
            ...{ class: (task.isComplete ? 'opacity-60' : '') },
        });
        (task.description ?? "Checklist task detail unavailable.");
    }
}
if (__VLS_ctx.checklists.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pointer-events-none absolute bottom-20 right-4 opacity-20" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-right font-mono text-[8px] uppercase text-primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-none']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background-light']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-background-dark']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-start']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['-ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['cyber-border']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-bl-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/80']} */ ;
/** @type {__VLS_StyleScopedClasses['h-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-[0_0_8px_rgba(37,209,244,0.6)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-[0.2em]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['size-6']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-background-dark']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[11px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-slate-500']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-slate-400']} */ ;
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
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-20']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[8px]']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PrototypeLivePill: PrototypeLivePill,
            PrototypeScreenFrame: PrototypeScreenFrame,
            PrototypeTopHeader: PrototypeTopHeader,
            checklists: checklists,
            loadedCount: loadedCount,
            progressFor: progressFor,
            relativeLabel: relativeLabel,
            selectedChecklist: selectedChecklist,
            selectedChecklistId: selectedChecklistId,
            statusLabel: statusLabel,
            toggleTask: toggleTask,
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
