import*as e from"../../core/i18n/i18n.js";import*as t from"../../core/root/root.js";import*as i from"../../ui/legacy/legacy.js";const o={profiler:"Profiler",showProfiler:"Show Profiler",performance:"Performance",showPerformance:"Show Performance",startStopRecording:"Start/stop recording",showRecentTimelineSessions:"Show recent timeline sessions",record:"Record",stop:"Stop",startProfilingAndReloadPage:"Start profiling and reload page"},n=e.i18n.registerUIStrings("panels/js_profiler/js_profiler-meta.ts",o),r=e.i18n.getLazilyComputedLocalizedString.bind(void 0,n);let a,l;async function s(){return l||(l=await import("../profiler/profiler.js")),l}async function c(){return a||(a=await import("../timeline/timeline.js")),a}function g(e){return void 0===a?[]:e(a)}i.ViewManager.registerViewExtension({location:"panel",id:"js_profiler",title:r(o.profiler),commandPrompt:r(o.showProfiler),order:65,persistence:"permanent",experiment:t.Runtime.ExperimentName.JS_PROFILER_TEMP_ENABLE,loadView:async()=>(await s()).ProfilesPanel.JSProfilerPanel.instance()}),i.ActionRegistration.registerActionExtension({actionId:"profiler.js-toggle-recording",category:i.ActionRegistration.ActionCategory.JAVASCRIPT_PROFILER,title:r(o.startStopRecording),iconClass:"record-start",toggleable:!0,toggledIconClass:"record-stop",toggleWithRedColor:!0,contextTypes(){return e=e=>[e.ProfilesPanel.JSProfilerPanel],void 0===l?[]:e(l);var e},loadActionDelegate:async()=>(await s()).ProfilesPanel.JSProfilerPanel.instance(),bindings:[{platform:"windows,linux",shortcut:"Ctrl+E"},{platform:"mac",shortcut:"Meta+E"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.show-history",loadActionDelegate:async()=>(await c()).TimelinePanel.ActionDelegate.instance(),category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:r(o.showRecentTimelineSessions),contextTypes:()=>g((e=>[e.TimelinePanel.TimelinePanel])),bindings:[{platform:"windows,linux",shortcut:"Ctrl+H"},{platform:"mac",shortcut:"Meta+Y"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.toggle-recording",category:i.ActionRegistration.ActionCategory.PERFORMANCE,iconClass:"record-start",toggleable:!0,toggledIconClass:"record-stop",toggleWithRedColor:!0,contextTypes:()=>g((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await c()).TimelinePanel.ActionDelegate.instance(),options:[{value:!0,title:r(o.record)},{value:!1,title:r(o.stop)}],bindings:[{platform:"windows,linux",shortcut:"Ctrl+E"},{platform:"mac",shortcut:"Meta+E"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.record-reload",iconClass:"refresh",contextTypes:()=>g((e=>[e.TimelinePanel.TimelinePanel])),category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:r(o.startProfilingAndReloadPage),loadActionDelegate:async()=>(await c()).TimelinePanel.ActionDelegate.instance(),bindings:[{platform:"windows,linux",shortcut:"Ctrl+Shift+E"},{platform:"mac",shortcut:"Meta+Shift+E"}]});
