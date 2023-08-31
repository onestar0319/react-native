import*as e from"../../../core/common/common.js";import*as s from"../../../core/i18n/i18n.js";import*as i from"../../../models/issues_manager/issues_manager.js";import*as t from"../helpers/helpers.js";import*as o from"../../lit-html/lit-html.js";import*as n from"../icon_button/icon_button.js";import*as r from"../render_coordinator/render_coordinator.js";const a=new CSSStyleSheet;a.replaceSync(":host{white-space:normal;display:inline-block}\n/*# sourceURL=issueCounter.css */\n");const l={pageErrors:"{issueCount, plural, =1 {# page error} other {# page errors}}",breakingChanges:"{issueCount, plural, =1 {# breaking change} other {# breaking changes}}",possibleImprovements:"{issueCount, plural, =1 {# possible improvement} other {# possible improvements}}"},u=s.i18n.registerUIStrings("ui/components/issue_counter/IssueCounter.ts",l),c=s.i18n.getLocalizedString.bind(void 0,u);function h(e){switch(e){case i.Issue.IssueKind.PageError:return{iconName:"issue-cross-filled",color:"var(--icon-error)",width:"20px",height:"20px"};case i.Issue.IssueKind.BreakingChange:return{iconName:"issue-exclamation-filled",color:"var(--icon-warning)",width:"20px",height:"20px"};case i.Issue.IssueKind.Improvement:return{iconName:"issue-text-filled",color:"var(--icon-info)",width:"20px",height:"20px"}}}function d({iconName:e,color:s,width:i,height:t},o){return o?{iconName:e,iconColor:s,iconWidth:o,iconHeight:o}:{iconName:e,iconColor:s,iconWidth:i,iconHeight:t}}const m=new Intl.ListFormat(navigator.language,{type:"unit",style:"short"});class p extends HTMLElement{static litTagName=o.literal`issue-counter`;#e=this.attachShadow({mode:"open"});#s=void 0;#i=void 0;#t="";#o;#n=[0,0,0];#r="OmitEmpty";#a=void 0;#l=void 0;#u;#c=!1;scheduleUpdate(){this.#o?this.#o.schedule((async()=>this.#h())):this.#h()}connectedCallback(){this.#e.adoptedStyleSheets=[a]}set data(s){this.#s=s.clickHandler,this.#t=s.leadingText??"",this.#i=s.tooltipCallback,this.#r=s.displayMode??"OmitEmpty",this.#l=s.accessibleName,this.#u=s.throttlerTimeout,this.#c=Boolean(s.compact),this.#a!==s.issuesManager&&(this.#a?.removeEventListener("IssuesCountUpdated",this.scheduleUpdate,this),this.#a=s.issuesManager,this.#a.addEventListener("IssuesCountUpdated",this.scheduleUpdate,this)),0!==s.throttlerTimeout?this.#o=new e.Throttler.Throttler(s.throttlerTimeout??100):this.#o=void 0,this.scheduleUpdate()}get data(){return{clickHandler:this.#s,leadingText:this.#t,tooltipCallback:this.#i,displayMode:this.#r,accessibleName:this.#l,throttlerTimeout:this.#u,compact:this.#c,issuesManager:this.#a}}#h(){if(!this.#a)return;this.#n=[this.#a.numberOfIssues(i.Issue.IssueKind.PageError),this.#a.numberOfIssues(i.Issue.IssueKind.BreakingChange),this.#a.numberOfIssues(i.Issue.IssueKind.Improvement)];const e=[i.Issue.IssueKind.PageError,i.Issue.IssueKind.BreakingChange,i.Issue.IssueKind.Improvement][this.#n.findIndex((e=>e>0))??2],s=(s,i)=>{switch(this.#r){case"OmitEmpty":return i>0?`${i}`:void 0;case"ShowAlways":return`${i}`;case"OnlyMostImportant":return s===e?`${i}`:void 0}},t="2ex",n={groups:[{...d(h(i.Issue.IssueKind.PageError),t),text:s(i.Issue.IssueKind.PageError,this.#n[0])},{...d(h(i.Issue.IssueKind.BreakingChange),t),text:s(i.Issue.IssueKind.BreakingChange,this.#n[1])},{...d(h(i.Issue.IssueKind.Improvement),t),text:s(i.Issue.IssueKind.Improvement,this.#n[2])}],clickHandler:this.#s,leadingText:this.#t,accessibleName:this.#l,compact:this.#c};o.render(o.html` <icon-button .data="${n}" .accessibleName="${this.#l}"></icon-button> `,this.#e,{host:this}),this.#i?.()}}t.CustomElements.defineComponent("issue-counter",p);var I=Object.freeze({__proto__:null,getIssueKindIconData:h,getIssueCountsEnumeration:function(e,s=!0){const t=[e.numberOfIssues(i.Issue.IssueKind.PageError),e.numberOfIssues(i.Issue.IssueKind.BreakingChange),e.numberOfIssues(i.Issue.IssueKind.Improvement)],o=[c(l.pageErrors,{issueCount:t[0]}),c(l.breakingChanges,{issueCount:t[1]}),c(l.possibleImprovements,{issueCount:t[2]})];return m.format(o.filter(((e,i)=>!s||t[i]>0)))},IssueCounter:p});const g=new CSSStyleSheet;g.replaceSync(":host{display:inline-block;white-space:nowrap;color:inherit;font-size:inherit;font-family:inherit}devtools-icon{vertical-align:middle}.link{cursor:pointer}.link span{color:var(--color-link)}\n/*# sourceURL=issueLinkIcon.css */\n");const v={clickToShowIssue:"Click to show issue in the issues tab",clickToShowIssueWithTitle:"Click to open the issue tab and show issue: {title}",issueUnavailable:"Issue unavailable at this time"},k=s.i18n.registerUIStrings("ui/components/issue_counter/IssueLinkIcon.ts",v),C=s.i18n.getLocalizedString.bind(void 0,k),b=r.RenderCoordinator.RenderCoordinator.instance();class T extends HTMLElement{static litTagName=o.literal`devtools-issue-link-icon`;#e=this.attachShadow({mode:"open"});#d;#m=null;#p=Promise.resolve(void 0);#I;#g;#v;#k=e.Revealer.reveal;#C=Promise.resolve(void 0);set data(e){if(this.#d=e.issue,this.#I=e.issueId,!this.#d&&!this.#I)throw new Error("Either `issue` or `issueId` must be provided");this.#g=e.issueResolver,this.#v=e.additionalOnClickAction,e.revealOverride&&(this.#k=e.revealOverride),!this.#d&&this.#I?(this.#C=this.#b(this.#I),this.#p=this.#C.then((()=>this.#T()))):this.#p=this.#T(),this.#h()}async#T(){const e=this.#d?.getDescription();if(!e)return;const s=await i.MarkdownIssueDescription.getIssueTitleFromMarkdownDescription(e);s&&(this.#m=s)}connectedCallback(){this.#e.adoptedStyleSheets=[g]}#b(e){if(!this.#g)throw new Error("An `IssueResolver` must be provided if an `issueId` is provided.");return this.#g.waitFor(e).then((e=>{this.#d=e})).catch((()=>{this.#d=null}))}get data(){return{issue:this.#d,issueId:this.#I,issueResolver:this.#g,additionalOnClickAction:this.#v,revealOverride:this.#k!==e.Revealer.reveal?this.#k:void 0}}iconData(){return this.#d?{...h(this.#d.getKind()),width:"16px",height:"16px"}:{iconName:"issue-questionmark-filled",color:"var(--icon-default)",width:"16px",height:"16px"}}handleClick(e){0===e.button&&(this.#d&&this.#k(this.#d),this.#v?.())}#w(){return this.#m?C(v.clickToShowIssueWithTitle,{title:this.#m}):this.#d?C(v.clickToShowIssue):C(v.issueUnavailable)}#h(){return b.write((()=>{o.render(o.html` ${o.Directives.until(this.#p.then((()=>this.#f())),this.#C.then((()=>this.#f())),this.#f())} `,this.#e,{host:this})}))}#f(){return o.html` <span class="${o.Directives.classMap({link:Boolean(this.#d)})}" tabindex="0" @click="${this.handleClick}"> <${n.Icon.Icon.litTagName} .data="${this.iconData()}" title="${this.#w()}"></${n.Icon.Icon.litTagName}> </span>`}}t.CustomElements.defineComponent("devtools-issue-link-icon",T);var w=Object.freeze({__proto__:null,extractShortPath:e=>(/[^/]+$/.exec(e)||/[^/]+\/$/.exec(e)||[""])[0],IssueLinkIcon:T});export{I as IssueCounter,w as IssueLinkIcon};
