import*as e from"../../core/common/common.js";import*as t from"../../core/sdk/sdk.js";import*as a from"../../ui/legacy/legacy.js";import*as i from"../../core/i18n/i18n.js";const o={application:"Application",showApplication:"Show Application",pwa:"pwa",clearSiteData:"Clear site data",clearSiteDataIncludingThirdparty:"Clear site data (including third-party cookies)",startRecordingEvents:"Start recording events",stopRecordingEvents:"Stop recording events"},r=i.i18n.registerUIStrings("panels/application/application-meta.ts",o),n=i.i18n.getLazilyComputedLocalizedString.bind(void 0,r);let c;async function s(){return c||(c=await import("./application.js")),c}a.ViewManager.registerViewExtension({location:"panel",id:"resources",title:n(o.application),commandPrompt:n(o.showApplication),order:70,loadView:async()=>(await s()).ResourcesPanel.ResourcesPanel.instance(),tags:[n(o.pwa)]}),a.ActionRegistration.registerActionExtension({category:a.ActionRegistration.ActionCategory.RESOURCES,actionId:"resources.clear",title:n(o.clearSiteData),loadActionDelegate:async()=>(await s()).StorageView.ActionDelegate.instance()}),a.ActionRegistration.registerActionExtension({category:a.ActionRegistration.ActionCategory.RESOURCES,actionId:"resources.clear-incl-third-party-cookies",title:n(o.clearSiteDataIncludingThirdparty),loadActionDelegate:async()=>(await s()).StorageView.ActionDelegate.instance()}),a.ActionRegistration.registerActionExtension({actionId:"background-service.toggle-recording",iconClass:"record-start",toggleable:!0,toggledIconClass:"record-stop",toggleWithRedColor:!0,contextTypes(){return e=e=>[e.BackgroundServiceView.BackgroundServiceView],void 0===c?[]:e(c);var e},loadActionDelegate:async()=>(await s()).BackgroundServiceView.ActionDelegate.instance(),category:a.ActionRegistration.ActionCategory.BACKGROUND_SERVICES,options:[{value:!0,title:n(o.startRecordingEvents)},{value:!1,title:n(o.stopRecordingEvents)}],bindings:[{platform:"windows,linux",shortcut:"Ctrl+E"},{platform:"mac",shortcut:"Meta+E"}]}),e.Revealer.registerRevealer({contextTypes:()=>[t.Resource.Resource],destination:e.Revealer.RevealerDestination.APPLICATION_PANEL,loadRevealer:async()=>(await s()).ResourcesPanel.ResourceRevealer.instance()}),e.Revealer.registerRevealer({contextTypes:()=>[t.ResourceTreeModel.ResourceTreeFrame],destination:e.Revealer.RevealerDestination.APPLICATION_PANEL,loadRevealer:async()=>(await s()).ResourcesPanel.FrameDetailsRevealer.instance()});
