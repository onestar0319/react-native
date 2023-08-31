import"../shell/shell.js";import*as e from"../../core/common/common.js";import*as t from"../../core/root/root.js";import*as i from"../../ui/legacy/legacy.js";import*as o from"../../core/i18n/i18n.js";import*as n from"../../models/issues_manager/issues_manager.js";import*as a from"../main/main.js";const r={toggleDeviceToolbar:"Toggle device toolbar",captureScreenshot:"Capture screenshot",captureFullSizeScreenshot:"Capture full size screenshot",captureNodeScreenshot:"Capture node screenshot",showMediaQueries:"Show media queries",device:"device",hideMediaQueries:"Hide media queries",showRulers:"Show rulers in the Device Mode toolbar",hideRulers:"Hide rulers in the Device Mode toolbar",showDeviceFrame:"Show device frame",hideDeviceFrame:"Hide device frame"},s=o.i18n.registerUIStrings("panels/emulation/emulation-meta.ts",r),l=o.i18n.getLazilyComputedLocalizedString.bind(void 0,s);let c;async function g(){return c||(c=await import("../../panels/emulation/emulation.js")),c}i.ActionRegistration.registerActionExtension({category:i.ActionRegistration.ActionCategory.MOBILE,actionId:"emulation.toggle-device-mode",toggleable:!0,loadActionDelegate:async()=>(await g()).DeviceModeWrapper.ActionDelegate.instance(),condition:t.Runtime.ConditionName.CAN_DOCK,title:l(r.toggleDeviceToolbar),iconClass:"devices",bindings:[{platform:"windows,linux",shortcut:"Shift+Ctrl+M"},{platform:"mac",shortcut:"Shift+Meta+M"}]}),i.ActionRegistration.registerActionExtension({actionId:"emulation.capture-screenshot",category:i.ActionRegistration.ActionCategory.SCREENSHOT,loadActionDelegate:async()=>(await g()).DeviceModeWrapper.ActionDelegate.instance(),condition:t.Runtime.ConditionName.CAN_DOCK,title:l(r.captureScreenshot)}),i.ActionRegistration.registerActionExtension({actionId:"emulation.capture-full-height-screenshot",category:i.ActionRegistration.ActionCategory.SCREENSHOT,loadActionDelegate:async()=>(await g()).DeviceModeWrapper.ActionDelegate.instance(),condition:t.Runtime.ConditionName.CAN_DOCK,title:l(r.captureFullSizeScreenshot)}),i.ActionRegistration.registerActionExtension({actionId:"emulation.capture-node-screenshot",category:i.ActionRegistration.ActionCategory.SCREENSHOT,loadActionDelegate:async()=>(await g()).DeviceModeWrapper.ActionDelegate.instance(),condition:t.Runtime.ConditionName.CAN_DOCK,title:l(r.captureNodeScreenshot)}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.MOBILE,settingName:"showMediaQueryInspector",settingType:e.Settings.SettingType.BOOLEAN,defaultValue:!1,options:[{value:!0,title:l(r.showMediaQueries)},{value:!1,title:l(r.hideMediaQueries)}],tags:[l(r.device)]}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.MOBILE,settingName:"emulation.showRulers",settingType:e.Settings.SettingType.BOOLEAN,defaultValue:!1,options:[{value:!0,title:l(r.showRulers)},{value:!1,title:l(r.hideRulers)}],tags:[l(r.device)]}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.MOBILE,settingName:"emulation.showDeviceOutline",settingType:e.Settings.SettingType.BOOLEAN,defaultValue:!1,options:[{value:!0,title:l(r.showDeviceFrame)},{value:!1,title:l(r.hideDeviceFrame)}],tags:[l(r.device)]}),i.Toolbar.registerToolbarItem({actionId:"emulation.toggle-device-mode",condition:t.Runtime.ConditionName.CAN_DOCK,location:i.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_LEFT,order:1,showLabel:void 0,loadItem:void 0,separator:void 0}),e.AppProvider.registerAppProvider({loadAppProvider:async()=>(await g()).AdvancedApp.AdvancedAppProvider.instance(),condition:t.Runtime.ConditionName.CAN_DOCK,order:0}),i.ContextMenu.registerItem({location:i.ContextMenu.ItemLocation.DEVICE_MODE_MENU_SAVE,order:12,actionId:"emulation.capture-screenshot"}),i.ContextMenu.registerItem({location:i.ContextMenu.ItemLocation.DEVICE_MODE_MENU_SAVE,order:13,actionId:"emulation.capture-full-height-screenshot"});const d={sensors:"Sensors",geolocation:"geolocation",timezones:"timezones",locale:"locale",locales:"locales",accelerometer:"accelerometer",deviceOrientation:"device orientation",locations:"Locations",touch:"Touch",devicebased:"Device-based",forceEnabled:"Force enabled",emulateIdleDetectorState:"Emulate Idle Detector state",noIdleEmulation:"No idle emulation",userActiveScreenUnlocked:"User active, screen unlocked",userActiveScreenLocked:"User active, screen locked",userIdleScreenUnlocked:"User idle, screen unlocked",userIdleScreenLocked:"User idle, screen locked",showSensors:"Show Sensors",showLocations:"Show Locations"},m=o.i18n.registerUIStrings("panels/sensors/sensors-meta.ts",d),u=o.i18n.getLazilyComputedLocalizedString.bind(void 0,m);let p;async function S(){return p||(p=await import("../../panels/sensors/sensors.js")),p}i.ViewManager.registerViewExtension({location:"drawer-view",commandPrompt:u(d.showSensors),title:u(d.sensors),id:"sensors",persistence:"closeable",order:100,loadView:async()=>(await S()).SensorsView.SensorsView.instance(),tags:[u(d.geolocation),u(d.timezones),u(d.locale),u(d.locales),u(d.accelerometer),u(d.deviceOrientation)]}),i.ViewManager.registerViewExtension({location:"settings-view",id:"emulation-locations",commandPrompt:u(d.showLocations),title:u(d.locations),order:40,loadView:async()=>(await S()).LocationsSettingsTab.LocationsSettingsTab.instance(),settings:["emulation.locations"]}),e.Settings.registerSettingExtension({storageType:e.Settings.SettingStorageType.Synced,settingName:"emulation.locations",settingType:e.Settings.SettingType.ARRAY,defaultValue:[{title:"Berlin",lat:52.520007,long:13.404954,timezoneId:"Europe/Berlin",locale:"de-DE"},{title:"London",lat:51.507351,long:-.127758,timezoneId:"Europe/London",locale:"en-GB"},{title:"Moscow",lat:55.755826,long:37.6173,timezoneId:"Europe/Moscow",locale:"ru-RU"},{title:"Mountain View",lat:37.386052,long:-122.083851,timezoneId:"America/Los_Angeles",locale:"en-US"},{title:"Mumbai",lat:19.075984,long:72.877656,timezoneId:"Asia/Kolkata",locale:"mr-IN"},{title:"San Francisco",lat:37.774929,long:-122.419416,timezoneId:"America/Los_Angeles",locale:"en-US"},{title:"Shanghai",lat:31.230416,long:121.473701,timezoneId:"Asia/Shanghai",locale:"zh-Hans-CN"},{title:"São Paulo",lat:-23.55052,long:-46.633309,timezoneId:"America/Sao_Paulo",locale:"pt-BR"},{title:"Tokyo",lat:35.689487,long:139.691706,timezoneId:"Asia/Tokyo",locale:"ja-JP"}]}),e.Settings.registerSettingExtension({title:u(d.touch),reloadRequired:!0,settingName:"emulation.touch",settingType:e.Settings.SettingType.ENUM,defaultValue:"none",options:[{value:"none",title:u(d.devicebased),text:u(d.devicebased)},{value:"force",title:u(d.forceEnabled),text:u(d.forceEnabled)}]}),e.Settings.registerSettingExtension({title:u(d.emulateIdleDetectorState),settingName:"emulation.idleDetection",settingType:e.Settings.SettingType.ENUM,defaultValue:"none",options:[{value:"none",title:u(d.noIdleEmulation),text:u(d.noIdleEmulation)},{value:'{"isUserActive":true,"isScreenUnlocked":true}',title:u(d.userActiveScreenUnlocked),text:u(d.userActiveScreenUnlocked)},{value:'{"isUserActive":true,"isScreenUnlocked":false}',title:u(d.userActiveScreenLocked),text:u(d.userActiveScreenLocked)},{value:'{"isUserActive":false,"isScreenUnlocked":true}',title:u(d.userIdleScreenUnlocked),text:u(d.userIdleScreenUnlocked)},{value:'{"isUserActive":false,"isScreenUnlocked":false}',title:u(d.userIdleScreenLocked),text:u(d.userIdleScreenLocked)}]});const A={developerResources:"Developer Resources",showDeveloperResources:"Show Developer Resources"},w=o.i18n.registerUIStrings("panels/developer_resources/developer_resources-meta.ts",A),y=o.i18n.getLazilyComputedLocalizedString.bind(void 0,w);let h;i.ViewManager.registerViewExtension({location:"drawer-view",id:"resource-loading-pane",title:y(A.developerResources),commandPrompt:y(A.showDeveloperResources),order:100,persistence:"closeable",experiment:t.Runtime.ExperimentName.DEVELOPER_RESOURCES_VIEW,loadView:async()=>new((await async function(){return h||(h=await import("../../panels/developer_resources/developer_resources.js")),h}()).DeveloperResourcesView.DeveloperResourcesView)});const R={rendering:"Rendering",showRendering:"Show Rendering",paint:"paint",layout:"layout",fps:"fps",cssMediaType:"CSS media type",cssMediaFeature:"CSS media feature",visionDeficiency:"vision deficiency",colorVisionDeficiency:"color vision deficiency",reloadPage:"Reload page",hardReloadPage:"Hard reload page",forceAdBlocking:"Force ad blocking on this site",blockAds:"Block ads on this site",showAds:"Show ads on this site, if allowed",autoOpenDevTools:"Auto-open DevTools for popups",doNotAutoOpen:"Do not auto-open DevTools for popups",disablePaused:"Disable paused state overlay",toggleCssPrefersColorSchemeMedia:"Toggle CSS media feature prefers-color-scheme"},E=o.i18n.registerUIStrings("entrypoints/inspector_main/inspector_main-meta.ts",R),T=o.i18n.getLazilyComputedLocalizedString.bind(void 0,E);let f;async function v(){return f||(f=await import("../inspector_main/inspector_main.js")),f}i.ViewManager.registerViewExtension({location:"drawer-view",id:"rendering",title:T(R.rendering),commandPrompt:T(R.showRendering),persistence:"closeable",order:50,loadView:async()=>(await v()).RenderingOptions.RenderingOptionsView.instance(),tags:[T(R.paint),T(R.layout),T(R.fps),T(R.cssMediaType),T(R.cssMediaFeature),T(R.visionDeficiency),T(R.colorVisionDeficiency)]}),i.ActionRegistration.registerActionExtension({category:i.ActionRegistration.ActionCategory.NAVIGATION,actionId:"inspector_main.reload",loadActionDelegate:async()=>(await v()).InspectorMain.ReloadActionDelegate.instance(),iconClass:"refresh",title:T(R.reloadPage),bindings:[{platform:"windows,linux",shortcut:"Ctrl+R"},{platform:"windows,linux",shortcut:"F5"},{platform:"mac",shortcut:"Meta+R"}]}),i.ActionRegistration.registerActionExtension({category:i.ActionRegistration.ActionCategory.NAVIGATION,actionId:"inspector_main.hard-reload",loadActionDelegate:async()=>(await v()).InspectorMain.ReloadActionDelegate.instance(),title:T(R.hardReloadPage),bindings:[{platform:"windows,linux",shortcut:"Shift+Ctrl+R"},{platform:"windows,linux",shortcut:"Shift+F5"},{platform:"windows,linux",shortcut:"Ctrl+F5"},{platform:"windows,linux",shortcut:"Ctrl+Shift+F5"},{platform:"mac",shortcut:"Shift+Meta+R"}]}),i.ActionRegistration.registerActionExtension({actionId:"rendering.toggle-prefers-color-scheme",category:i.ActionRegistration.ActionCategory.RENDERING,title:T(R.toggleCssPrefersColorSchemeMedia),loadActionDelegate:async()=>(await v()).RenderingOptions.ReloadActionDelegate.instance()}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.NETWORK,title:T(R.forceAdBlocking),settingName:"network.adBlockingEnabled",settingType:e.Settings.SettingType.BOOLEAN,storageType:e.Settings.SettingStorageType.Session,defaultValue:!1,options:[{value:!0,title:T(R.blockAds)},{value:!1,title:T(R.showAds)}]}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.GLOBAL,storageType:e.Settings.SettingStorageType.Synced,title:T(R.autoOpenDevTools),settingName:"autoAttachToCreatedPages",settingType:e.Settings.SettingType.BOOLEAN,order:2,defaultValue:!1,options:[{value:!0,title:T(R.autoOpenDevTools)},{value:!1,title:T(R.doNotAutoOpen)}]}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.APPEARANCE,storageType:e.Settings.SettingStorageType.Synced,title:T(R.disablePaused),settingName:"disablePausedStateOverlay",settingType:e.Settings.SettingType.BOOLEAN,defaultValue:!1}),i.Toolbar.registerToolbarItem({loadItem:async()=>(await v()).InspectorMain.NodeIndicator.instance(),order:2,location:i.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_LEFT,showLabel:void 0,condition:void 0,separator:void 0,actionId:void 0}),i.Toolbar.registerToolbarItem({loadItem:async()=>(await v()).OutermostTargetSelector.OutermostTargetSelector.instance(),order:98,location:i.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_RIGHT,showLabel:void 0,condition:void 0,separator:void 0,actionId:void 0,experiment:t.Runtime.ExperimentName.OUTERMOST_TARGET_SELECTOR});const I={issues:"Issues",showIssues:"Show Issues",cspViolations:"CSP Violations",showCspViolations:"Show CSP Violations"},C=o.i18n.registerUIStrings("panels/issues/issues-meta.ts",I),P=o.i18n.getLazilyComputedLocalizedString.bind(void 0,C);let x;async function N(){return x||(x=await import("../../panels/issues/issues.js")),x}i.ViewManager.registerViewExtension({location:"drawer-view",id:"issues-pane",title:P(I.issues),commandPrompt:P(I.showIssues),order:100,persistence:"closeable",loadView:async()=>(await N()).IssuesPane.IssuesPane.instance()}),i.ViewManager.registerViewExtension({location:"drawer-view",id:"csp-violations-pane",title:P(I.cspViolations),commandPrompt:P(I.showCspViolations),order:100,persistence:"closeable",loadView:async()=>(await N()).CSPViolationsView.CSPViolationsView.instance(),experiment:t.Runtime.ExperimentName.CSP_VIOLATIONS_VIEW}),e.Revealer.registerRevealer({contextTypes:()=>[n.Issue.Issue],destination:e.Revealer.RevealerDestination.ISSUES_VIEW,loadRevealer:async()=>(await N()).IssueRevealer.IssueRevealer.instance()});const D={throttling:"Throttling",showThrottling:"Show Throttling",goOffline:"Go offline",device:"device",throttlingTag:"throttling",enableSlowGThrottling:"Enable slow `3G` throttling",enableFastGThrottling:"Enable fast `3G` throttling",goOnline:"Go online"},M=o.i18n.registerUIStrings("panels/mobile_throttling/mobile_throttling-meta.ts",D),b=o.i18n.getLazilyComputedLocalizedString.bind(void 0,M);let O;async function L(){return O||(O=await import("../../panels/mobile_throttling/mobile_throttling.js")),O}i.ViewManager.registerViewExtension({location:"settings-view",id:"throttling-conditions",title:b(D.throttling),commandPrompt:b(D.showThrottling),order:35,loadView:async()=>(await L()).ThrottlingSettingsTab.ThrottlingSettingsTab.instance(),settings:["customNetworkConditions"]}),i.ActionRegistration.registerActionExtension({actionId:"network-conditions.network-offline",category:i.ActionRegistration.ActionCategory.NETWORK,title:b(D.goOffline),loadActionDelegate:async()=>(await L()).ThrottlingManager.ActionDelegate.instance(),tags:[b(D.device),b(D.throttlingTag)]}),i.ActionRegistration.registerActionExtension({actionId:"network-conditions.network-low-end-mobile",category:i.ActionRegistration.ActionCategory.NETWORK,title:b(D.enableSlowGThrottling),loadActionDelegate:async()=>(await L()).ThrottlingManager.ActionDelegate.instance(),tags:[b(D.device),b(D.throttlingTag)]}),i.ActionRegistration.registerActionExtension({actionId:"network-conditions.network-mid-tier-mobile",category:i.ActionRegistration.ActionCategory.NETWORK,title:b(D.enableFastGThrottling),loadActionDelegate:async()=>(await L()).ThrottlingManager.ActionDelegate.instance(),tags:[b(D.device),b(D.throttlingTag)]}),i.ActionRegistration.registerActionExtension({actionId:"network-conditions.network-online",category:i.ActionRegistration.ActionCategory.NETWORK,title:b(D.goOnline),loadActionDelegate:async()=>(await L()).ThrottlingManager.ActionDelegate.instance(),tags:[b(D.device),b(D.throttlingTag)]}),e.Settings.registerSettingExtension({storageType:e.Settings.SettingStorageType.Synced,settingName:"customNetworkConditions",settingType:e.Settings.SettingType.ARRAY,defaultValue:[]});const V={performance:"Performance",showPerformance:"Show Performance",javascriptProfiler:"JavaScript Profiler",showJavascriptProfiler:"Show JavaScript Profiler",record:"Record",stop:"Stop",startProfilingAndReloadPage:"Start profiling and reload page",saveProfile:"Save profile…",loadProfile:"Load profile…",previousFrame:"Previous frame",nextFrame:"Next frame",showRecentTimelineSessions:"Show recent timeline sessions",previousRecording:"Previous recording",nextRecording:"Next recording",hideChromeFrameInLayersView:"Hide `chrome` frame in Layers view",startStopRecording:"Start/stop recording"},_=o.i18n.registerUIStrings("panels/timeline/timeline-meta.ts",V),k=o.i18n.getLazilyComputedLocalizedString.bind(void 0,_);let U,F;async function z(){return U||(U=await import("../../panels/timeline/timeline.js")),U}async function B(){return F||(F=await import("../../panels/profiler/profiler.js")),F}function j(e){return void 0===U?[]:e(U)}i.ViewManager.registerViewExtension({location:"panel",id:"timeline",title:k(V.performance),commandPrompt:k(V.showPerformance),order:50,loadView:async()=>(await z()).TimelinePanel.TimelinePanel.instance()}),i.ViewManager.registerViewExtension({location:"panel",id:"js_profiler",title:k(V.javascriptProfiler),commandPrompt:k(V.showJavascriptProfiler),persistence:"closeable",order:65,experiment:t.Runtime.ExperimentName.JS_PROFILER_TEMP_ENABLE,loadView:async()=>(await B()).ProfilesPanel.JSProfilerPanel.instance()}),i.ActionRegistration.registerActionExtension({actionId:"timeline.toggle-recording",category:i.ActionRegistration.ActionCategory.PERFORMANCE,iconClass:"record-start",toggleable:!0,toggledIconClass:"record-stop",toggleWithRedColor:!0,contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),options:[{value:!0,title:k(V.record)},{value:!1,title:k(V.stop)}],bindings:[{platform:"windows,linux",shortcut:"Ctrl+E"},{platform:"mac",shortcut:"Meta+E"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.record-reload",iconClass:"refresh",contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:k(V.startProfilingAndReloadPage),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),bindings:[{platform:"windows,linux",shortcut:"Ctrl+Shift+E"},{platform:"mac",shortcut:"Meta+Shift+E"}]}),i.ActionRegistration.registerActionExtension({category:i.ActionRegistration.ActionCategory.PERFORMANCE,actionId:"timeline.save-to-file",contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),title:k(V.saveProfile),bindings:[{platform:"windows,linux",shortcut:"Ctrl+S"},{platform:"mac",shortcut:"Meta+S"}]}),i.ActionRegistration.registerActionExtension({category:i.ActionRegistration.ActionCategory.PERFORMANCE,actionId:"timeline.load-from-file",contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),title:k(V.loadProfile),bindings:[{platform:"windows,linux",shortcut:"Ctrl+O"},{platform:"mac",shortcut:"Meta+O"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.jump-to-previous-frame",category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:k(V.previousFrame),contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),bindings:[{shortcut:"["}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.jump-to-next-frame",category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:k(V.nextFrame),contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),bindings:[{shortcut:"]"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.show-history",loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),category:i.ActionRegistration.ActionCategory.PERFORMANCE,title:k(V.showRecentTimelineSessions),contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),bindings:[{platform:"windows,linux",shortcut:"Ctrl+H"},{platform:"mac",shortcut:"Meta+Y"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.previous-recording",category:i.ActionRegistration.ActionCategory.PERFORMANCE,loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),title:k(V.previousRecording),contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),bindings:[{platform:"windows,linux",shortcut:"Alt+Left"},{platform:"mac",shortcut:"Meta+Left"}]}),i.ActionRegistration.registerActionExtension({actionId:"timeline.next-recording",category:i.ActionRegistration.ActionCategory.PERFORMANCE,loadActionDelegate:async()=>(await z()).TimelinePanel.ActionDelegate.instance(),title:k(V.nextRecording),contextTypes:()=>j((e=>[e.TimelinePanel.TimelinePanel])),bindings:[{platform:"windows,linux",shortcut:"Alt+Right"},{platform:"mac",shortcut:"Meta+Right"}]}),i.ActionRegistration.registerActionExtension({actionId:"profiler.js-toggle-recording",category:i.ActionRegistration.ActionCategory.JAVASCRIPT_PROFILER,title:k(V.startStopRecording),iconClass:"record-start",toggleable:!0,toggledIconClass:"record-stop",toggleWithRedColor:!0,contextTypes:()=>void 0===F?[]:(e=>[e.ProfilesPanel.JSProfilerPanel])(F),loadActionDelegate:async()=>(await B()).ProfilesPanel.JSProfilerPanel.instance(),bindings:[{platform:"windows,linux",shortcut:"Ctrl+E"},{platform:"mac",shortcut:"Meta+E"}]}),e.Settings.registerSettingExtension({category:e.Settings.SettingCategory.PERFORMANCE,storageType:e.Settings.SettingStorageType.Synced,title:k(V.hideChromeFrameInLayersView),settingName:"frameViewerHideChromeWindow",settingType:e.Settings.SettingType.BOOLEAN,defaultValue:!1}),e.Linkifier.registerLinkifier({contextTypes:()=>j((e=>[e.CLSLinkifier.CLSRect])),loadLinkifier:async()=>(await z()).CLSLinkifier.Linkifier.instance()}),i.ContextMenu.registerItem({location:i.ContextMenu.ItemLocation.TIMELINE_MENU_OPEN,actionId:"timeline.load-from-file",order:10}),i.ContextMenu.registerItem({location:i.ContextMenu.ItemLocation.TIMELINE_MENU_OPEN,actionId:"timeline.save-to-file",order:15});const W={rnWelcome:"⚛️ Welcome",showRnWelcome:"Show React Native Welcome panel"},G=o.i18n.registerUIStrings("panels/rn_welcome/rn_welcome-meta.ts",W),H=o.i18n.getLazilyComputedLocalizedString.bind(void 0,G);let K;i.ViewManager.registerViewExtension({location:"panel",id:"rn-welcome",title:H(W.rnWelcome),commandPrompt:H(W.showRnWelcome),order:-10,persistence:"permanent",loadView:async()=>(await async function(){return K||(K=await import("../../panels/rn_welcome/rn_welcome.js")),K}()).RNWelcome.RNWelcomeImpl.instance(),experiment:t.Runtime.ExperimentName.REACT_NATIVE_SPECIFIC_UI}),t.Runtime.experiments.register(t.Runtime.ExperimentName.REACT_NATIVE_SPECIFIC_UI,"Show React Native-specific UI",!1),t.Runtime.experiments.enableExperimentsByDefault([t.Runtime.ExperimentName.REACT_NATIVE_SPECIFIC_UI]),self.runtime=t.Runtime.Runtime.instance({forceNew:!0}),new a.MainImpl.MainImpl;
