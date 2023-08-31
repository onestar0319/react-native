import*as e from"../../core/platform/platform.js";import*as t from"../../core/common/common.js";import*as s from"../../core/i18n/i18n.js";import*as n from"../../models/text_utils/text_utils.js";import*as r from"../../ui/legacy/components/utils/utils.js";import*as i from"../../ui/legacy/legacy.js";import*as a from"../../core/host/host.js";class h{queryInternal;ignoreCaseInternal;isRegexInternal;fileQueries;queriesInternal;fileRegexQueries;constructor(e,t,s){this.queryInternal=e,this.ignoreCaseInternal=t,this.isRegexInternal=s,this.parse()}static fromPlainObject(e){return new h(e.query,e.ignoreCase,e.isRegex)}query(){return this.queryInternal}ignoreCase(){return this.ignoreCaseInternal}isRegex(){return this.isRegexInternal}toPlainObject(){return{query:this.query(),ignoreCase:this.ignoreCase(),isRegex:this.isRegex()}}parse(){const e=/(\s*(?!-?f(ile)?:)[^\\ ]|\\.)+/,t=e.source+"(\\s+"+e.source+")*",s=["(\\s*"+o.source+"\\s*)","("+/"([^\\"]|\\.)+"/.source+")","("+t+")"].join("|"),n=new RegExp(s,"g"),r=this.queryInternal.match(n)||[];this.fileQueries=[],this.queriesInternal=[];for(let e=0;e<r.length;++e){const t=r[e];if(!t)continue;const s=this.parseFileQuery(t);if(s)this.fileQueries.push(s),this.fileRegexQueries=this.fileRegexQueries||[],this.fileRegexQueries.push({regex:new RegExp(s.text,this.ignoreCase()?"i":""),isNegative:s.isNegative});else if(this.isRegexInternal)this.queriesInternal.push(t);else if(t.startsWith('"')){if(!t.endsWith('"'))continue;this.queriesInternal.push(this.parseQuotedQuery(t))}else this.queriesInternal.push(this.parseUnquotedQuery(t))}}filePathMatchesFileQuery(e){if(!this.fileRegexQueries)return!0;for(let t=0;t<this.fileRegexQueries.length;++t)if(Boolean(e.match(this.fileRegexQueries[t].regex))===this.fileRegexQueries[t].isNegative)return!1;return!0}queries(){return this.queriesInternal||[]}parseUnquotedQuery(e){return e.replace(/\\(.)/g,"$1")}parseQuotedQuery(e){return e.substring(1,e.length-1).replace(/\\(.)/g,"$1")}parseFileQuery(t){const s=t.match(o);if(!s)return null;const n=Boolean(s[1]);t=s[3];let r="";for(let s=0;s<t.length;++s){const n=t[s];if("*"===n)r+=".*";else if("\\"===n){++s;" "===t[s]&&(r+=" ")}else-1!==e.StringUtilities.regexSpecialCharacters().indexOf(t.charAt(s))&&(r+="\\"),r+=t.charAt(s)}return new c(r,n)}}const o=/(-)?f(ile)?:((?:[^\\ ]|\\.)+)/;class c{text;isNegative;constructor(e,t){this.text=e,this.isNegative=t}}var l=Object.freeze({__proto__:null,SearchConfig:h,FilePatternRegex:o,QueryTerm:c});const u=new CSSStyleSheet;u.replaceSync(":host{padding:0;margin:0;overflow-y:auto}.tree-outline{padding:0}.tree-outline ol{padding:0}.tree-outline li{height:16px}li.search-result{cursor:pointer;font-size:12px;margin-top:8px;padding:2px 0 2px 4px;word-wrap:normal;white-space:pre}li.search-result:hover{background-color:var(--item-hover-color)}li.search-result .search-result-file-name{color:var(--color-text-primary);flex:1 1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}li.search-result .search-result-matches-count{color:var(--color-text-secondary);margin:0 8px}li.search-result.expanded .search-result-matches-count{display:none}li.show-more-matches{color:var(--color-text-primary);cursor:pointer;margin:8px 0 0 -4px}li.show-more-matches:hover{text-decoration:underline}li.search-match{margin:2px 0;word-wrap:normal;white-space:pre}li.search-match::before{display:none}li.search-match .search-match-line-number{color:var(--color-text-secondary);text-align:right;vertical-align:top;word-break:normal;padding:2px 4px 2px 6px;margin-right:5px}li.search-match:hover{background-color:var(--item-hover-color)}.tree-outline .devtools-link{text-decoration:none;display:block;flex:auto}li.search-match .search-match-content{color:var(--color-text-primary)}ol.children.expanded{padding-bottom:4px}.search-match-link{overflow:hidden;text-overflow:ellipsis;margin-left:9px}.search-result-qualifier{color:var(--color-text-secondary)}.search-result-dash{color:var(--color-background-elevation-2);margin:0 4px}\n/*# sourceURL=searchResultsPane.css */\n");const d={matchesCountS:"Matches Count {PH1}",lineS:"Line {PH1}",showDMore:"Show {PH1} more"},g=s.i18n.registerUIStrings("panels/search/SearchResultsPane.ts",d),p=s.i18n.getLocalizedString.bind(void 0,g);class m extends i.Widget.VBox{searchConfig;searchResults;treeElements;treeOutline;matchesExpandedCount;constructor(e){super(!0),this.searchConfig=e,this.searchResults=[],this.treeElements=[],this.treeOutline=new i.TreeOutline.TreeOutlineInShadow,this.treeOutline.hideOverflow(),this.contentElement.appendChild(this.treeOutline.element),this.matchesExpandedCount=0}addSearchResult(e){this.searchResults.push(e),this.addTreeElement(e)}showAllMatches(){this.treeElements.forEach((e=>{e.expand(),e.showAllMatches()}))}collapseAllResults(){this.treeElements.forEach((e=>{e.collapse()}))}addTreeElement(e){const t=new x(this.searchConfig,e);this.treeOutline.appendChild(t),this.treeOutline.selectedTreeElement||t.select(!0,!0),this.matchesExpandedCount<f&&t.expand(),this.matchesExpandedCount+=e.matchesCount(),this.treeElements.push(t)}wasShown(){super.wasShown(),this.treeOutline.registerCSSFiles([u])}}const f=200;class x extends i.TreeOutline.TreeElement{searchConfig;searchResult;initialized;toggleOnClick;constructor(e,t){super("",!0),this.searchConfig=e,this.searchResult=t,this.initialized=!1,this.toggleOnClick=!0}onexpand(){this.initialized||(this.updateMatchesUI(),this.initialized=!0)}showAllMatches(){this.removeChildren(),this.appendSearchMatches(0,this.searchResult.matchesCount())}updateMatchesUI(){this.removeChildren();const e=Math.min(this.searchResult.matchesCount(),20);e<this.searchResult.matchesCount()?(this.appendSearchMatches(0,e-1),this.appendShowMoreMatchesElement(e-1)):this.appendSearchMatches(0,e)}onattach(){this.updateSearchMatches()}updateSearchMatches(){this.listItemElement.classList.add("search-result");const e=s(this.searchResult.label(),"search-result-file-name");e.appendChild(s("—","search-result-dash")),e.appendChild(s(this.searchResult.description(),"search-result-qualifier")),this.tooltip=this.searchResult.description(),this.listItemElement.appendChild(e);const t=document.createElement("span");function s(e,t){const s=document.createElement("span");return s.className=t,s.textContent=e,s}t.className="search-result-matches-count",t.textContent=`${this.searchResult.matchesCount()}`,i.ARIAUtils.setLabel(t,p(d.matchesCountS,{PH1:this.searchResult.matchesCount()})),this.listItemElement.appendChild(t),this.expanded&&this.updateMatchesUI()}appendSearchMatches(s,n){const a=this.searchResult,h=this.searchConfig.queries(),o=[];for(let t=0;t<h.length;++t)o.push(e.StringUtilities.createSearchRegex(h[t],!this.searchConfig.ignoreCase(),this.searchConfig.isRegex()));for(let e=s;e<n;++e){const s=a.matchLineContent(e).trim();let n=[];for(let e=0;e<o.length;++e)n=n.concat(this.regexMatchRanges(s,o[e]));const h=r.Linkifier.Linkifier.linkifyRevealable(a.matchRevealable(e),"");h.classList.add("search-match-link");const c=document.createElement("span");c.classList.add("search-match-line-number");const l=a.matchLabel(e);c.textContent=l,"number"!=typeof l||isNaN(l)?i.ARIAUtils.setLabel(c,l):i.ARIAUtils.setLabel(c,p(d.lineS,{PH1:l})),h.appendChild(c);const u=this.createContentSpan(s,n);h.appendChild(u);const g=new i.TreeOutline.TreeElement;this.appendChild(g),g.listItemElement.className="search-match",g.listItemElement.appendChild(h),g.listItemElement.addEventListener("keydown",(s=>{"Enter"===s.key&&(s.consume(!0),t.Revealer.reveal(a.matchRevealable(e)))})),g.tooltip=s}}appendShowMoreMatchesElement(e){const t=this.searchResult.matchesCount()-e,s=p(d.showDMore,{PH1:t}),n=new i.TreeOutline.TreeElement(s);this.appendChild(n),n.listItemElement.classList.add("show-more-matches"),n.onselect=this.showMoreMatchesElementSelected.bind(this,n,e)}createContentSpan(e,t){let s=0;t.length>0&&t[0].offset>20&&(s=15),e=e.substring(s,1e3+s),s&&(t=t.map((e=>new n.TextRange.SourceRange(e.offset-s+1,e.length))),e="…"+e);const r=document.createElement("span");return r.className="search-match-content",r.textContent=e,i.ARIAUtils.setLabel(r,`${e} line`),i.UIUtils.highlightRangesWithStyleClass(r,t,"highlighted-search-result"),r}regexMatchRanges(e,t){let s;t.lastIndex=0;const r=[];for(;t.lastIndex<e.length&&(s=t.exec(e));)r.push(new n.TextRange.SourceRange(s.index,s[0].length));return r}showMoreMatchesElementSelected(e,t){return this.removeChild(e),this.appendSearchMatches(t,this.searchResult.matchesCount()),!1}}var C=Object.freeze({__proto__:null,SearchResultsPane:m,matchesExpandedByDefault:f,matchesShownAtOnce:20,SearchResultsTreeElement:x});const S=new CSSStyleSheet;S.replaceSync(".search-drawer-header{align-items:center;flex-shrink:0;overflow:hidden}.search-toolbar{background-color:var(--color-background-elevation-1);border-bottom:1px solid var(--color-details-hairline)}.search-toolbar-summary{background-color:var(--color-background-elevation-1);border-top:1px solid var(--color-details-hairline);padding-left:5px;flex:0 0 19px;display:flex;padding-right:5px}.search-toolbar-summary .search-message{padding-top:2px;padding-left:1ex;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.search-view .search-results{overflow-y:auto;display:flex;flex:auto}.search-view .search-results > div{flex:auto}\n/*# sourceURL=searchView.css */\n");const R={search:"Search",searchQuery:"Search Query",matchCase:"Match Case",useRegularExpression:"Use Regular Expression",refresh:"Refresh",clear:"Clear",indexing:"Indexing…",searching:"Searching…",indexingInterrupted:"Indexing interrupted.",foundMatchingLineInFile:"Found 1 matching line in 1 file.",foundDMatchingLinesInFile:"Found {PH1} matching lines in 1 file.",foundDMatchingLinesInDFiles:"Found {PH1} matching lines in {PH2} files.",noMatchesFound:"No matches found.",searchFinished:"Search finished.",searchInterrupted:"Search interrupted."},w=s.i18n.registerUIStrings("panels/search/SearchView.ts",R),I=s.i18n.getLocalizedString.bind(void 0,w);class E extends i.Widget.VBox{focusOnShow;isIndexing;searchId;searchMatchesCount;searchResultsCount;nonEmptySearchResultsCount;searchingView;notFoundView;searchConfig;pendingSearchConfig;searchResultsPane;progressIndicator;visiblePane;searchPanelElement;searchResultsElement;search;matchCaseButton;regexButton;searchMessageElement;searchProgressPlaceholderElement;searchResultsMessageElement;advancedSearchConfig;searchScope;constructor(e){super(!0),this.setMinimumSize(0,40),this.focusOnShow=!1,this.isIndexing=!1,this.searchId=1,this.searchMatchesCount=0,this.searchResultsCount=0,this.nonEmptySearchResultsCount=0,this.searchingView=null,this.notFoundView=null,this.searchConfig=null,this.pendingSearchConfig=null,this.searchResultsPane=null,this.progressIndicator=null,this.visiblePane=null,this.contentElement.classList.add("search-view"),this.contentElement.addEventListener("keydown",(e=>{this.onKeyDownOnPanel(e)})),this.searchPanelElement=this.contentElement.createChild("div","search-drawer-header"),this.searchResultsElement=this.contentElement.createChild("div"),this.searchResultsElement.className="search-results";const s=document.createElement("div");s.style.flex="auto",s.style.justifyContent="start",s.style.maxWidth="300px",s.style.overflow="revert",this.search=i.HistoryInput.HistoryInput.create(),this.search.addEventListener("keydown",(e=>{this.onKeyDown(e)})),s.appendChild(this.search),this.search.placeholder=I(R.search),this.search.setAttribute("type","text"),this.search.setAttribute("results","0"),this.search.setAttribute("size","42"),i.ARIAUtils.setLabel(this.search,I(R.searchQuery));const n=new i.Toolbar.ToolbarItem(s),r=new i.Toolbar.Toolbar("search-toolbar",this.searchPanelElement);this.matchCaseButton=E.appendToolbarToggle(r,"Aa",I(R.matchCase)),this.regexButton=E.appendToolbarToggle(r,".*",I(R.useRegularExpression)),r.appendToolbarItem(n);const a=new i.Toolbar.ToolbarButton(I(R.refresh),"refresh"),o=new i.Toolbar.ToolbarButton(I(R.clear),"clear");r.appendToolbarItem(a),r.appendToolbarItem(o),a.addEventListener(i.Toolbar.ToolbarButton.Events.Click,(()=>this.onAction())),o.addEventListener(i.Toolbar.ToolbarButton.Events.Click,(()=>{this.resetSearch(),this.onSearchInputClear()}));const c=this.contentElement.createChild("div","search-toolbar-summary");this.searchMessageElement=c.createChild("div","search-message"),this.searchProgressPlaceholderElement=c.createChild("div","flex-centered"),this.searchResultsMessageElement=c.createChild("div","search-message"),this.advancedSearchConfig=t.Settings.Settings.instance().createLocalSetting(e+"SearchConfig",new h("",!0,!1).toPlainObject()),this.load(),this.searchScope=null}static appendToolbarToggle(e,t,s){const n=new i.Toolbar.ToolbarToggle(s);return n.setText(t),n.addEventListener(i.Toolbar.ToolbarButton.Events.Click,(()=>n.setToggled(!n.toggled()))),e.appendToolbarItem(n),n}buildSearchConfig(){return new h(this.search.value,!this.matchCaseButton.toggled(),this.regexButton.toggled())}async toggle(e,t){e&&(this.search.value=e),this.isShowing()?this.focus():this.focusOnShow=!0,this.initScope(),t?this.onAction():this.startIndexing()}createScope(){throw new Error("Not implemented")}initScope(){this.searchScope=this.createScope()}wasShown(){this.focusOnShow&&(this.focus(),this.focusOnShow=!1),this.registerCSSFiles([S])}onIndexingFinished(){if(!this.progressIndicator)return;const e=!this.progressIndicator.isCanceled();if(this.progressIndicator.done(),this.progressIndicator=null,this.isIndexing=!1,this.indexingFinished(e),e||(this.pendingSearchConfig=null),!this.pendingSearchConfig)return;const t=this.pendingSearchConfig;this.pendingSearchConfig=null,this.innerStartSearch(t)}startIndexing(){this.isIndexing=!0,this.progressIndicator&&this.progressIndicator.done(),this.progressIndicator=new i.ProgressIndicator.ProgressIndicator,this.searchMessageElement.textContent=I(R.indexing),this.progressIndicator.show(this.searchProgressPlaceholderElement),this.searchScope&&this.searchScope.performIndexing(new t.Progress.ProgressProxy(this.progressIndicator,this.onIndexingFinished.bind(this)))}onSearchInputClear(){this.search.value="",this.save(),this.focus()}onSearchResult(e,t){e===this.searchId&&this.progressIndicator&&(this.progressIndicator&&this.progressIndicator.isCanceled()?this.onIndexingFinished():(this.addSearchResult(t),t.matchesCount()&&(this.searchResultsPane||(this.searchResultsPane=new m(this.searchConfig),this.showPane(this.searchResultsPane)),this.searchResultsPane.addSearchResult(t))))}onSearchFinished(e,t){e===this.searchId&&this.progressIndicator&&(this.searchResultsPane||this.nothingFound(),this.searchFinished(t),this.searchConfig=null,i.ARIAUtils.alert(this.searchMessageElement.textContent+" "+this.searchResultsMessageElement.textContent))}async startSearch(e){this.resetSearch(),++this.searchId,this.initScope(),this.isIndexing||this.startIndexing(),this.pendingSearchConfig=e}innerStartSearch(e){this.searchConfig=e,this.progressIndicator&&this.progressIndicator.done(),this.progressIndicator=new i.ProgressIndicator.ProgressIndicator,this.searchStarted(this.progressIndicator),this.searchScope&&this.searchScope.performSearch(e,this.progressIndicator,this.onSearchResult.bind(this,this.searchId),this.onSearchFinished.bind(this,this.searchId))}resetSearch(){this.stopSearch(),this.showPane(null),this.searchResultsPane=null,this.clearSearchMessage()}clearSearchMessage(){this.searchMessageElement.textContent="",this.searchResultsMessageElement.textContent=""}stopSearch(){this.progressIndicator&&!this.isIndexing&&this.progressIndicator.cancel(),this.searchScope&&this.searchScope.stopSearch(),this.searchConfig=null}searchStarted(e){this.resetCounters(),this.searchingView||(this.searchingView=new i.EmptyWidget.EmptyWidget(I(R.searching))),this.showPane(this.searchingView),this.searchMessageElement.textContent=I(R.searching),e.show(this.searchProgressPlaceholderElement),this.updateSearchResultsMessage()}indexingFinished(e){this.searchMessageElement.textContent=e?"":I(R.indexingInterrupted)}updateSearchResultsMessage(){this.searchMatchesCount&&this.searchResultsCount?1===this.searchMatchesCount&&1===this.nonEmptySearchResultsCount?this.searchResultsMessageElement.textContent=I(R.foundMatchingLineInFile):this.searchMatchesCount>1&&1===this.nonEmptySearchResultsCount?this.searchResultsMessageElement.textContent=I(R.foundDMatchingLinesInFile,{PH1:this.searchMatchesCount}):this.searchResultsMessageElement.textContent=I(R.foundDMatchingLinesInDFiles,{PH1:this.searchMatchesCount,PH2:this.nonEmptySearchResultsCount}):this.searchResultsMessageElement.textContent=""}showPane(e){this.visiblePane&&this.visiblePane.detach(),e&&e.show(this.searchResultsElement),this.visiblePane=e}resetCounters(){this.searchMatchesCount=0,this.searchResultsCount=0,this.nonEmptySearchResultsCount=0}nothingFound(){this.notFoundView||(this.notFoundView=new i.EmptyWidget.EmptyWidget(I(R.noMatchesFound))),this.showPane(this.notFoundView),this.searchResultsMessageElement.textContent=I(R.noMatchesFound)}addSearchResult(e){const t=e.matchesCount();this.searchMatchesCount+=t,this.searchResultsCount++,t&&this.nonEmptySearchResultsCount++,this.updateSearchResultsMessage()}searchFinished(e){this.searchMessageElement.textContent=I(e?R.searchFinished:R.searchInterrupted)}focus(){this.search.focus(),this.search.select()}willHide(){this.stopSearch()}onKeyDown(e){if(this.save(),e.keyCode===i.KeyboardShortcut.Keys.Enter.code)this.onAction()}onKeyDownOnPanel(e){const t=a.Platform.isMac(),s=t&&e.metaKey&&!e.ctrlKey&&e.altKey&&"BracketRight"===e.code,n=!t&&e.ctrlKey&&!e.metaKey&&e.shiftKey&&"BracketRight"===e.code,r=t&&e.metaKey&&!e.ctrlKey&&e.altKey&&"BracketLeft"===e.code,i=!t&&e.ctrlKey&&!e.metaKey&&e.shiftKey&&"BracketLeft"===e.code;s||n?this.searchResultsPane?.showAllMatches():(r||i)&&this.searchResultsPane?.collapseAllResults()}save(){this.advancedSearchConfig.set(this.buildSearchConfig().toPlainObject())}load(){const e=h.fromPlainObject(this.advancedSearchConfig.get());this.search.value=e.query(),this.matchCaseButton.setToggled(!e.ignoreCase()),this.regexButton.setToggled(e.isRegex())}onAction(){const e=this.buildSearchConfig();e.query()&&e.query().length&&this.startSearch(e)}}var y=Object.freeze({__proto__:null,SearchView:E});export{l as SearchConfig,C as SearchResultsPane,y as SearchView};
