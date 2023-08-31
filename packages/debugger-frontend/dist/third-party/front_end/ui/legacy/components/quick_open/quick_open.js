import*as e from"../../../../core/common/common.js";import*as t from"../../../../core/host/host.js";import*as i from"../../../../core/i18n/i18n.js";import*as r from"../../../../core/platform/platform.js";import*as s from"../../../../third_party/diff/diff.js";import*as o from"../../legacy.js";import*as n from"../../../../models/text_utils/text_utils.js";import*as l from"../../../components/text_prompt/text_prompt.js";import*as a from"../../../components/icon_button/icon_button.js";const d=new CSSStyleSheet;d.replaceSync('.filtered-list-widget{display:flex;flex-direction:column;flex:auto;border:1px solid transparent;--override-filtered-list-widget-highlight-text-background-color:rgb(255 255 255/25%)}.-theme-with-dark-background .filtered-list-widget,\n:host-context(.-theme-with-dark-background) .filtered-list-widget{--override-filtered-list-widget-highlight-text-background-color:rgb(255 255 255/75%)}.hbox{flex:0 0 40px;align-items:center}.filtered-list-widget-hint{color:var(--color-text-disabled);padding:12px}devtools-text-prompt{flex-grow:1;font-size:14px;font-family:".SFNSDisplay-Regular","Helvetica Neue","Lucida Grande",sans-serif;line-height:16px;padding:12px}.filtered-list-widget-progress{flex:none;background:rgb(0 0 0/20%);height:1px}.filtered-list-widget-progress-bar{background-color:var(--color-primary-variant);height:2px;width:100%;transform:scaleX(0);transform-origin:top left;opacity:100%;transition:none}.filtered-widget-progress-fade{opacity:0%;transition:opacity 500ms}.filtered-list-widget .vbox > div.container{flex:auto;overflow-x:hidden;overflow-y:auto}.filtered-list-widget-item-wrapper{color:var(--color-text-primary);display:flex;border-bottom:1px solid var(--color-details-hairline-light);font-family:".SFNSDisplay-Regular","Helvetica Neue","Lucida Grande",sans-serif;padding-left:8px;padding-right:8px}.filtered-list-widget-item-wrapper devtools-icon{align-self:center;flex:none;padding-right:8px}.filtered-list-widget-item-wrapper.selected{background-color:var(--color-primary-old)}.filtered-list-widget-item{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:center;font-size:12px;flex:auto}.filtered-list-widget-item.is-ignore-listed{opacity:50%}.filtered-list-widget-item.two-rows span.highlight{color:var(--color-primary-old)}.filtered-list-widget-item.one-row span.highlight{font-weight:bold}.filtered-list-widget-item .filtered-list-widget-title{flex:initial;overflow:hidden;text-overflow:ellipsis}.filtered-list-widget-item .filtered-list-widget-subtitle{flex:none;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-secondary);display:flex;white-space:pre}.filtered-list-widget-item .filtered-list-widget-subtitle .first-part{flex-shrink:1000;overflow:hidden;text-overflow:ellipsis}.filtered-list-widget-item-wrapper .tag{padding:0 12px;border-radius:4px;line-height:24px;height:24px;align-self:center;flex-shrink:0}.filtered-list-widget-item-wrapper .deprecated-tag{font-size:11px;color:var(--color-text-secondary)}.filtered-list-widget-item-wrapper.selected .deprecated-tag{color:var(--color-background)}.-theme-with-dark-background .filtered-list-widget-item-wrapper.selected .deprecated-tag,\n:host-context(.-theme-with-dark-background) .filtered-list-widget-item-wrapper.selected .deprecated-tag{color:var(--color-background);opacity:80%}.filtered-list-widget-item-wrapper.selected .filtered-list-widget-item span.highlight{color:var(--color-background);background-color:var(--override-filtered-list-widget-highlight-text-background-color)}.filtered-list-widget-item-wrapper.selected .filtered-list-widget-title,\n.filtered-list-widget-item-wrapper.selected .filtered-list-widget-subtitle,\n.filtered-list-widget-item-wrapper.selected .tag{color:var(--color-background)}.filtered-list-widget-item-wrapper.selected devtools-icon{--icon-color:var(--icon-force-white)}.filtered-list-widget-item.one-row{height:36px;line-height:20px;padding-top:8px;padding-bottom:8px;display:flex}.filtered-list-widget-item.one-row .filtered-list-widget-title{padding-right:8px}.filtered-list-widget-item.two-rows{height:45px;padding-top:8px;padding-bottom:8px}.filtered-list-widget-item.two-rows .filtered-list-widget-title{font-weight:bold}.not-found-text{height:34px;line-height:34px;padding-left:8px;font-style:italic;color:var(--color-text-disabled);background:var(--color-background-elevation-0)}.quickpick-description{flex:none;overflow:hidden;text-overflow:ellipsis;color:var(--color-text-disabled);padding-left:15px}@media (forced-colors: active){.filtered-list-widget{forced-color-adjust:none;border-color:ButtonText}.filtered-list-widget-item-wrapper .filtered-list-widget-title,\n  .filtered-list-widget-item-wrapper .filtered-list-widget-subtitle,\n  .quickpick-description{color:ButtonText}.filtered-list-widget-item-wrapper.selected{background-color:Highlight}.filtered-list-widget-item-wrapper.selected .filtered-list-widget-item .filtered-list-widget-title,\n  .filtered-list-widget-item-wrapper.selected .filtered-list-widget-item .filtered-list-widget-subtitle{color:HighlightText}devtools-text-prompt{border-color:ButtonText}}\n/*# sourceURL=filteredListWidget.css */\n');const c={quickOpenPrompt:"Quick open prompt",quickOpen:"Quick open",noResultsFound:"No results found"},h=i.i18n.registerUIStrings("ui/legacy/components/quick_open/FilteredListWidget.ts",c),m=i.i18n.getLocalizedString.bind(void 0,h);class g extends(e.ObjectWrapper.eventMixin(o.Widget.VBox)){promptHistory;scoringTimer;filterTimer;loadTimeout;refreshListWithCurrentResult;dialog;query="";inputBoxElement;hintElement;bottomElementsContainer;progressElement;progressBarElement;items;list;itemElementsContainer;notFoundElement;prefix="";provider;queryChangedCallback;constructor(e,t,i){super(!0),this.promptHistory=t||[],this.scoringTimer=0,this.filterTimer=0,this.loadTimeout=0,this.contentElement.classList.add("filtered-list-widget");const r=this.onKeyDown.bind(this);this.contentElement.addEventListener("keydown",r,!0),o.ARIAUtils.markAsCombobox(this.contentElement);const s=this.contentElement.createChild("div","hbox");this.inputBoxElement=new l.TextPrompt.TextPrompt,this.inputBoxElement.data={ariaLabel:m(c.quickOpenPrompt),prefix:"",suggestion:""},this.inputBoxElement.addEventListener(l.TextPrompt.PromptInputEvent.eventName,this.onInput.bind(this),!1),s.appendChild(this.inputBoxElement),this.hintElement=s.createChild("span","filtered-list-widget-hint"),this.bottomElementsContainer=this.contentElement.createChild("div","vbox"),this.progressElement=this.bottomElementsContainer.createChild("div","filtered-list-widget-progress"),this.progressBarElement=this.progressElement.createChild("div","filtered-list-widget-progress-bar"),this.items=new o.ListModel.ListModel,this.list=new o.ListControl.ListControl(this.items,this,o.ListControl.ListMode.EqualHeightItems),this.itemElementsContainer=this.list.element,this.itemElementsContainer.classList.add("container"),this.bottomElementsContainer.appendChild(this.itemElementsContainer),this.itemElementsContainer.addEventListener("click",this.onClick.bind(this),!1),this.itemElementsContainer.addEventListener("mousemove",this.onMouseMove.bind(this),!1),o.ARIAUtils.markAsListBox(this.itemElementsContainer),o.ARIAUtils.setControls(this.inputBoxElement,this.itemElementsContainer),o.ARIAUtils.setAutocomplete(this.inputBoxElement,o.ARIAUtils.AutocompleteInteractionModel.list),this.notFoundElement=this.bottomElementsContainer.createChild("div","not-found-text"),this.notFoundElement.classList.add("hidden"),this.setDefaultFocusedElement(this.inputBoxElement),this.provider=e,this.queryChangedCallback=i}static highlightRanges(e,t,i){if(!t)return!1;function r(e,t){const i=s.Diff.DiffWrapper.charDiff(t,e);let r=0;const o=[];for(let e=0;e<i.length;++e){const t=i[e];if(t[0]===s.Diff.Operation.Equal)o.push(new n.TextRange.SourceRange(r,t[1].length));else if(t[0]!==s.Diff.Operation.Insert)return null;r+=t[1].length}return o}if(null===e.textContent)return!1;const l=e.textContent;let a=r(l,t);return a&&!i||(a=r(l.toUpperCase(),t.toUpperCase())),!!a&&(o.UIUtils.highlightRangesWithStyleClass(e,a,"highlight"),!0)}setCommandPrefix(e){this.inputBoxElement.setPrefix(e)}setCommandSuggestion(e){this.inputBoxElement.setSuggestion(e)}setHintElement(e){this.hintElement.textContent=e}setPromptTitle(e){o.ARIAUtils.setLabel(this.inputBoxElement,e)}showAsDialog(e){e||(e=m(c.quickOpen)),this.dialog=new o.Dialog.Dialog,o.ARIAUtils.setLabel(this.dialog.contentElement,e),this.dialog.setMaxContentSize(new o.Geometry.Size(504,340)),this.dialog.setSizeBehavior("SetExactWidthMaxHeight"),this.dialog.setContentPosition(null,22),this.dialog.contentElement.style.setProperty("border-radius","4px"),this.show(this.dialog.contentElement),o.ARIAUtils.setExpanded(this.contentElement,!0),this.dialog.once("hidden").then((()=>{this.dispatchEventToListeners("hidden")})),this.dialog.show()}setPrefix(e){this.prefix=e}setProvider(e){e!==this.provider&&(this.provider&&this.provider.detach(),this.clearTimers(),this.provider=e,this.isShowing()&&this.attachProvider())}setQuerySelectedRange(e,t){this.inputBoxElement.setSelectedRange(e,t)}attachProvider(){this.items.replaceAll([]),this.list.invalidateItemHeight(),this.provider&&(this.provider.setRefreshCallback(this.itemsLoaded.bind(this,this.provider)),this.provider.attach()),this.itemsLoaded(this.provider)}cleanValue(){return this.query.substring(this.prefix.length).trim()}wasShown(){this.registerCSSFiles([d]),this.attachProvider()}willHide(){this.provider&&this.provider.detach(),this.clearTimers(),o.ARIAUtils.setExpanded(this.contentElement,!1)}clearTimers(){clearTimeout(this.filterTimer),clearTimeout(this.scoringTimer),clearTimeout(this.loadTimeout),this.filterTimer=0,this.scoringTimer=0,this.loadTimeout=0,this.refreshListWithCurrentResult=void 0}onEnter(e){if(!this.provider)return;e.preventDefault();const t=this.provider.itemCount()?this.list.selectedItem():null;this.selectItem(t),this.dialog&&this.dialog.hide()}itemsLoaded(e){this.loadTimeout||e!==this.provider||(this.loadTimeout=window.setTimeout(this.updateAfterItemsLoaded.bind(this),0))}updateAfterItemsLoaded(){this.loadTimeout=0,this.filterItems()}createElementForItem(e){const t=document.createElement("div");t.className="filtered-list-widget-item-wrapper";const i=t.createChild("div"),r=this.provider&&this.provider.renderAsTwoRows();i.className="filtered-list-widget-item "+(r?"two-rows":"one-row");const s=i.createChild("div","filtered-list-widget-title"),n=i.createChild("div","filtered-list-widget-subtitle");return n.textContent="​",this.provider&&this.provider.renderItem(e,this.cleanValue(),s,n),o.ARIAUtils.markAsOption(i),t}heightForItem(e){return 0}isItemSelectable(e){return!0}selectedItemChanged(e,t,i,r){i&&i.classList.remove("selected"),r&&r.classList.add("selected"),o.ARIAUtils.setActiveDescendant(this.inputBoxElement,r)}onClick(e){const t=this.list.itemForNode(e.target);null!==t&&(e.consume(!0),this.selectItem(t),this.dialog&&this.dialog.hide())}onMouseMove(e){const t=this.list.itemForNode(e.target);null!==t&&this.list.selectItem(t)}setQuery(e){this.query=e,this.inputBoxElement.focus(),this.inputBoxElement.setText(e),this.queryChanged(),this.scheduleFilter()}tabKeyPressed(){const e=this.query;let t;for(let i=this.promptHistory.length-1;i>=0;i--)if(this.promptHistory[i]!==e&&this.promptHistory[i].startsWith(e)){t=this.promptHistory[i];break}if(t){const i=this.inputBoxElement.getComponentSelection();return i&&""!==i.toString().trim()?(this.setQuery(t),!0):(this.inputBoxElement.focus(),this.inputBoxElement.setText(t),this.setQuerySelectedRange(e.length,t.length),!0)}return this.list.selectNextItem(!0,!1)}itemsFilteredForTest(){}filterItems(){if(this.filterTimer=0,this.scoringTimer&&(clearTimeout(this.scoringTimer),this.scoringTimer=0,this.refreshListWithCurrentResult&&this.refreshListWithCurrentResult()),!this.provider)return this.bottomElementsContainer.classList.toggle("hidden",!0),void this.itemsFilteredForTest();this.bottomElementsContainer.classList.toggle("hidden",!1),this.progressBarElement.style.transform="scaleX(0)",this.progressBarElement.classList.remove("filtered-widget-progress-fade","hidden");const e=this.provider.rewriteQuery(this.cleanValue()),t=e?r.StringUtilities.filterRegex(e):null,i=[],s=[],o=[],n=100;let l=0;const a=[],d=window.performance.now(),c=r.NumberUtilities.clamp(10,500,this.provider.itemCount()/10|0);function h(e,t){return t-e}(function m(g){if(!this.provider)return;this.scoringTimer=0;let p,u=0;for(p=g;p<this.provider.itemCount()&&u<c;++p){if(t&&!t.test(this.provider.itemKeyAt(p)))continue;const d=this.provider.itemScoreAt(p,e);if(e&&u++,d>l||s.length<n){const e=r.ArrayUtilities.upperBound(s,d,h);if(s.splice(e,0,d),o.splice(e,0,p),s.length>n){const e=o[o.length-1];e&&a.push(e),s.length=n,o.length=n}const t=s[s.length-1];t&&(l=t)}else i.push(p)}if(this.refreshListWithCurrentResult=this.refreshList.bind(this,o,a,i),p<this.provider.itemCount())return this.scoringTimer=window.setTimeout(m.bind(this,p),0),void(window.performance.now()-d>50&&(this.progressBarElement.style.transform="scaleX("+p/this.provider.itemCount()+")"));window.performance.now()-d>100?(this.progressBarElement.style.transform="scaleX(1)",this.progressBarElement.classList.add("filtered-widget-progress-fade")):this.progressBarElement.classList.add("hidden");this.refreshListWithCurrentResult()}).call(this,0)}refreshList(e,t,i){this.refreshListWithCurrentResult=void 0,i=[...e,...t,...i],this.updateNotFoundMessage(Boolean(i.length));const r=this.list.element.offsetHeight;this.items.replaceAll(i),i.length&&this.list.selectItem(i[0]),this.list.element.offsetHeight!==r&&this.list.viewportResized(),this.itemsFilteredForTest()}updateNotFoundMessage(e){this.list.element.classList.toggle("hidden",!e),this.notFoundElement.classList.toggle("hidden",e),!e&&this.provider&&(this.notFoundElement.textContent=this.provider.notFoundText(this.cleanValue()),o.ARIAUtils.alert(this.notFoundElement.textContent))}onInput(e){this.query=e.data,this.queryChanged(),this.scheduleFilter()}async queryChanged(){this.hintElement.classList.toggle("hidden",Boolean(this.query)),this.queryChangedCallback&&await this.queryChangedCallback(this.query),this.provider&&this.provider.queryChanged(this.cleanValue())}updateSelectedItemARIA(e,t){return!1}onKeyDown(e){let t=!1;switch(e.key){case r.KeyboardUtilities.ENTER_KEY:return void this.onEnter(e);case r.KeyboardUtilities.TAB_KEY:if(e.shiftKey){t=this.list.selectPreviousItem(!0,!1);break}t=this.tabKeyPressed();break;case"ArrowUp":t=this.list.selectPreviousItem(!0,!1);break;case"ArrowDown":t=this.list.selectNextItem(!0,!1);break;case"PageUp":t=this.list.selectItemPreviousPage(!1);break;case"PageDown":t=this.list.selectItemNextPage(!1)}t&&e.consume(!0)}scheduleFilter(){this.filterTimer||(this.filterTimer=window.setTimeout(this.filterItems.bind(this),0))}selectItem(e){this.promptHistory.push(this.query),this.promptHistory.length>100&&this.promptHistory.shift(),this.provider&&this.provider.selectItem(e,this.cleanValue())}}class p{refreshCallback;constructor(){}setRefreshCallback(e){this.refreshCallback=e}attach(){}itemCount(){return 0}itemKeyAt(e){return""}itemScoreAt(e,t){return 1}renderItem(e,t,i,r){}renderAsTwoRows(){return!1}selectItem(e,t){}refresh(){this.refreshCallback&&this.refreshCallback()}rewriteQuery(e){return e}queryChanged(e){}notFoundText(e){return m(c.noResultsFound)}detach(){}}const u=[];function f(e){u.push(e)}function w(){return u}var v=Object.freeze({__proto__:null,FilteredListWidget:g,Provider:p,registerProvider:f,getRegisteredProviders:w});const x={typeToSeeAvailableCommands:"Type ? to see available commands"},C=i.i18n.registerUIStrings("ui/legacy/components/quick_open/QuickOpen.ts",x),y=i.i18n.getLocalizedString.bind(void 0,C),b=[];class E{prefix;prefixes;providers;filteredListWidget;constructor(){this.prefix=null,this.prefixes=[],this.providers=new Map,this.filteredListWidget=null,w().forEach(this.addProvider.bind(this)),this.prefixes.sort(((e,t)=>t.length-e.length))}static show(e){const t=new this,i=new g(null,b,t.queryChanged.bind(t));t.filteredListWidget=i,i.setHintElement(y(x.typeToSeeAvailableCommands)),i.showAsDialog(),i.setQuery(e)}addProvider(e){const t=e.prefix;null!==t&&(this.prefixes.push(t),this.providers.set(t,{provider:e.provider,titlePrefix:e.titlePrefix,titleSuggestion:e.titleSuggestion}))}async queryChanged(e){const t=this.prefixes.find((t=>e.startsWith(t)));if("string"!=typeof t)return;if(!this.filteredListWidget)return;this.filteredListWidget.setPrefix(t);const i=this.providers.get(t)?.titlePrefix;this.filteredListWidget.setCommandPrefix(i?i():"");const r=e===t&&this.providers.get(t)?.titleSuggestion;if(this.filteredListWidget.setCommandSuggestion(r?r():""),this.prefix===t)return;this.prefix=t,this.filteredListWidget.setProvider(null);const s=this.providers.get(t)?.provider;if(!s)return;const o=await s();this.prefix===t&&this.filteredListWidget&&(this.filteredListWidget.setProvider(o),this.providerLoadedForTest(o))}providerLoadedForTest(e){}}let A;class k{static instance(e={forceNew:null}){const{forceNew:t}=e;return A&&!t||(A=new k),A}handleAction(e,t){return"quickOpen.show"===t&&(E.show(""),!0)}}var L=Object.freeze({__proto__:null,history:b,QuickOpenImpl:E,ShowActionDelegate:k});const R={oneOrMoreSettingsHaveChanged:"One or more settings have changed which requires a reload to take effect.",noCommandsFound:"No commands found",run:"Run",command:"Command",deprecated:"— deprecated"},I=i.i18n.registerUIStrings("ui/legacy/components/quick_open/CommandMenu.ts",R),S=i.i18n.getLocalizedString.bind(void 0,I);let T;class P{commandsInternal;constructor(){this.commandsInternal=[],this.loadCommands()}static instance(e={forceNew:null}){const{forceNew:t}=e;return T&&!t||(T=new P),T}static createCommand(e){const{category:i,keys:r,title:s,shortcut:o,executeHandler:n,availableHandler:l,userActionCode:a,deprecationWarning:d,isPanelOrDrawer:c}=e;let h=n;if(a){const e=a;h=()=>{t.userMetrics.actionTaken(e),n()}}return new H(i,s,r,o,h,l,d,c)}static createSettingCommand(t,i,r){const s=t.category();if(!s)throw new Error(`Creating '${i}' setting command failed. Setting has no category.`);const n=t.tags()||"",l=Boolean(t.reloadRequired());return P.createCommand({category:e.Settings.getLocalizedSettingsCategory(s),keys:n,title:i,shortcut:"",executeHandler:()=>{!t.deprecation?.disabled||t.deprecation?.experiment&&!t.deprecation.experiment.isEnabled()?(t.set(r),l&&o.InspectorView.InspectorView.instance().displayReloadRequiredWarning(S(R.oneOrMoreSettingsHaveChanged))):e.Revealer.reveal(t)},availableHandler:function(){return t.get()!==r},userActionCode:void 0,deprecationWarning:t.deprecation?.warning})}static createActionCommand(e){const{action:t,userActionCode:i}=e,r=t.category();if(!r)throw new Error(`Creating '${t.title()}' action command failed. Action has no category.`);let s;r===o.ActionRegistration.ActionCategory.DRAWER&&(s=F.DRAWER);const n=o.ShortcutRegistry.ShortcutRegistry.instance().shortcutTitleForAction(t.id())||"";return P.createCommand({category:o.ActionRegistration.getLocalizedActionCategory(r),keys:t.tags()||"",title:t.title(),shortcut:n,executeHandler:t.execute.bind(t),userActionCode:i,availableHandler:void 0,isPanelOrDrawer:s})}static createRevealViewCommand(e){const{title:i,tags:r,category:s,userActionCode:n,id:l}=e;if(!s)throw new Error(`Creating '${i}' reveal view command failed. Reveal view has no category.`);let a;s===o.ViewManager.ViewLocationCategory.PANEL?a=F.PANEL:s===o.ViewManager.ViewLocationCategory.DRAWER&&(a=F.DRAWER);return P.createCommand({category:o.ViewManager.getLocalizedViewLocationCategory(s),keys:r,title:i,shortcut:"",executeHandler:()=>("issues-pane"===l&&t.userMetrics.issuesPanelOpenedFrom(t.UserMetrics.IssueOpener.CommandMenu),o.ViewManager.ViewManager.instance().showView(l,!0)),userActionCode:n,availableHandler:void 0,isPanelOrDrawer:a})}loadCommands(){const t=new Map;for(const{category:e,name:i}of o.ViewManager.getRegisteredLocationResolvers())e&&i&&t.set(i,e);const i=o.ViewManager.getRegisteredViewExtensions();for(const e of i){const i=e.location(),r=i&&t.get(i);if(!r)continue;const s={title:e.commandPrompt(),tags:e.tags()||"",category:r,userActionCode:void 0,id:e.viewId()};this.commandsInternal.push(P.createRevealViewCommand(s))}const r=e.Settings.getRegisteredSettings();for(const t of r){const i=t.options;if(i&&t.category)for(const r of i){const i=e.Settings.Settings.instance().moduleSetting(t.settingName);this.commandsInternal.push(P.createSettingCommand(i,r.title(),r.value))}}}commands(){return this.commandsInternal}}var F;!function(e){e.PANEL="PANEL",e.DRAWER="DRAWER"}(F||(F={}));class W extends p{commands;constructor(e=[]){super(),this.commands=e}attach(){const e=P.instance().commands(),t=o.ActionRegistry.ActionRegistry.instance().availableActions();for(const e of t){if(!e.category())continue;const t={action:e,userActionCode:void 0};this.commands.push(P.createActionCommand(t))}for(const t of e)t.available()&&this.commands.push(t);this.commands=this.commands.sort((function(e,t){const i=r.StringUtilities.compare(e.category,t.category);return i||r.StringUtilities.compare(e.title,t.title)}))}detach(){this.commands=[]}itemCount(){return this.commands.length}itemKeyAt(e){return this.commands[e].key}itemScoreAt(e,t){const i=this.commands[e];let r=s.Diff.DiffWrapper.characterScore(t.toLowerCase(),i.title.toLowerCase());return i.isPanelOrDrawer===F.PANEL?r+=2:i.isPanelOrDrawer===F.DRAWER&&(r+=1),r}renderItem(e,t,i,s){const n=this.commands[e];i.removeChildren(),o.UIUtils.createTextChild(i,n.title),g.highlightRanges(i,t,!0),s.textContent=n.shortcut;const l=n.deprecationWarning;if(l){const e=i.parentElement?.createChild("span","deprecated-tag");e&&(e.textContent=S(R.deprecated),e.title=l)}const a=i.parentElement?.parentElement?.createChild("span","tag");if(!a)return;const d=r.StringUtilities.hashCode(n.category)%B.length;a.style.backgroundColor=B[d],a.style.color="var(--color-background)",a.textContent=n.category}selectItem(e,i){null!==e&&(this.commands[e].execute(),t.userMetrics.actionTaken(t.UserMetrics.Action.SelectCommandFromCommandMenu))}notFoundText(){return S(R.noCommandsFound)}}const B=["#F44336","#E91E63","#9C27B0","#673AB7","#3F51B5","#03A9F4","#00BCD4","#009688","#4CAF50","#8BC34A","#CDDC39","#FFC107","#FF9800","#FF5722","#795548","#9E9E9E","#607D8B"];class H{category;title;key;shortcut;deprecationWarning;isPanelOrDrawer;#e;#t;constructor(e,t,i,r,s,o,n,l){this.category=e,this.title=t,this.key=e+"\0"+t+"\0"+i,this.shortcut=r,this.#e=s,this.#t=o,this.deprecationWarning=n,this.isPanelOrDrawer=l}available(){return!this.#t||this.#t()}execute(){return this.#e()}}let D;class M{static instance(e={forceNew:null}){const{forceNew:t}=e;return D&&!t||(D=new M),D}handleAction(e,i){return t.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront(),E.show(">"),!0}}f({prefix:">",iconName:"chevron-right",iconWidth:"20px",provider:()=>Promise.resolve(new W),titlePrefix:()=>S(R.run),titleSuggestion:()=>S(R.command)});var N=Object.freeze({__proto__:null,CommandMenu:P,get PanelOrDrawer(){return F},CommandMenuProvider:W,MaterialPaletteColors:B,Command:H,ShowActionDelegate:M});class U extends p{providers;constructor(){super(),this.providers=[],w().forEach(this.addProvider.bind(this))}addProvider(e){e.titleSuggestion&&this.providers.push({prefix:e.prefix||"",iconName:e.iconName,iconWidth:e.iconWidth,title:e.titlePrefix()+" "+e.titleSuggestion()})}itemCount(){return this.providers.length}itemKeyAt(e){return this.providers[e].prefix}itemScoreAt(e,t){return-this.providers[e].prefix.length}renderItem(e,t,i,r){const s=this.providers[e],n=new a.Icon.Icon;n.data={iconName:s.iconName,color:"var(--icon-default)",width:s.iconWidth},i.parentElement?.parentElement?.insertBefore(n,i.parentElement),o.UIUtils.createTextChild(i,s.title)}selectItem(e,t){null!==e&&E.show(this.providers[e].prefix)}renderAsTwoRows(){return!1}}f({prefix:"?",iconName:"help",iconWidth:"20px",provider:()=>Promise.resolve(new U),titlePrefix:()=>"Help",titleSuggestion:void 0});var q=Object.freeze({__proto__:null,HelpQuickOpen:U});export{N as CommandMenu,v as FilteredListWidget,q as HelpQuickOpen,L as QuickOpen};
