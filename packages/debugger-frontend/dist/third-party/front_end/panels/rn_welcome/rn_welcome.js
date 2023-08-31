import*as e from"../../ui/legacy/legacy.js";import*as t from"../../core/i18n/i18n.js";import*as n from"../../ui/lit-html/lit-html.js";const i=new CSSStyleSheet;i.replaceSync('.rn-welcome-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:16px;text-align:center;background-color:var(--color-background-elevation-0)}.rn-welcome-header{display:flex;align-items:center;margin-bottom:16px}.rn-welcome-icon{width:30px;height:30px;border-radius:4px;margin-right:12px}.rn-welcome-title{font-size:20px;color:var(--color-text-primary)}.rn-welcome-tagline{margin-bottom:24px;font-size:1rem;line-height:1.3;color:var(--color-text-secondary)}.rn-welcome-links{display:flex;align-items:center}.rn-welcome-links > .devtools-link{position:relative;margin:0 16px;font-size:14px}.rn-welcome-links > .devtools-link:not(:last-child)::after{content:"";position:absolute;right:-16px;height:16px;border-right:1px solid var(--color-details-hairline)}\n/*# sourceURL=rnWelcome.css */\n');const o={debuggerBrandName:"React Native JS Inspector",welcomeMessage:"Welcome to debugging in React Native",docsLabel:"Debugging docs",whatsNewLabel:"What's new"},{render:r,html:l}=n,s=t.i18n.registerUIStrings("panels/rn_welcome/RNWelcome.ts",o),c=t.i18n.getLocalizedString.bind(void 0,s);let a;class d extends e.Widget.VBox{static instance(e={forceNew:null}){const{forceNew:t}=e;return a&&!t||(a=new d),a}constructor(){super(!0,!0)}wasShown(){super.wasShown(),this.registerCSSFiles([i]),this.render(),e.InspectorView.InspectorView.instance().showDrawer(!0)}render(){const e=new URL("../../Images/react_native/welcomeIcon.png",import.meta.url).toString();r(l` <div class="rn-welcome-panel"> <div class="rn-welcome-header"> <img class="rn-welcome-icon" src="${e}" role="presentation"> <div class="rn-welcome-title"> ${c(o.debuggerBrandName)} </div> </div> <div class="rn-welcome-tagline"> ${c(o.welcomeMessage)} </div> <div class="rn-welcome-links"> <x-link class="devtools-link" href="https://reactnative.dev/docs/next/debugging"> ${c(o.docsLabel)} </x-link> <x-link class="devtools-link" href="https://reactnative.dev/blog/tags/debugging"> ${c(o.whatsNewLabel)} </x-link> </div> </div> `,this.contentElement,{host:this})}}var g=Object.freeze({__proto__:null,RNWelcomeImpl:d});export{g as RNWelcome};
