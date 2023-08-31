import*as t from"../../../core/common/common.js";import*as e from"../../../core/i18n/i18n.js";import*as o from"../../../services/window_bounds/window_bounds.js";import*as n from"../../../third_party/codemirror.next/codemirror.next.js";import*as r from"../../legacy/legacy.js";import*as i from"../code_highlighter/code_highlighter.js";import*as s from"../icon_button/icon_button.js";import*as a from"../../../core/root/root.js";import*as c from"../../../core/sdk/sdk.js";import*as l from"../../../models/bindings/bindings.js";import*as d from"../../../models/javascript_metadata/javascript_metadata.js";import*as u from"../../../models/source_map_scopes/source_map_scopes.js";import*as m from"../../legacy/theme_support/theme_support.js";import*as p from"../../lit-html/lit-html.js";import*as h from"../helpers/helpers.js";class f{static#t=300;#e;#o=[];#n=1;#r=!1;constructor(t){this.#e=t,this.#o=this.#e.get()}clear(){this.#o=[],this.#e.set([]),this.#n=1}pushHistoryItem(t){this.#r&&(this.#o.pop(),this.#r=!1),this.#n=1,t!==this.#i()&&this.#o.push(t),this.#s()}#a(t){this.#r&&this.#o.pop(),this.#r=!0,this.#o.push(t)}previous(t){if(!(this.#n>this.#o.length))return 1===this.#n&&this.#a(t),++this.#n,this.#i()}next(){if(1!==this.#n)return--this.#n,this.#i()}matchingEntries(t,e=50){const o=new Set;for(let n=this.#o.length-1;n>=0&&o.size<e;--n){const e=this.#o[n];e.startsWith(t)&&o.add(e)}return o}#i(){return this.#o[this.#o.length-this.#n]}#s(){this.#e.set(this.#o.slice(-f.#t))}}var g=Object.freeze({__proto__:null,AutocompleteHistory:f});const b=n.EditorView.theme({"&.cm-editor":{color:"color: var(--color-text-primary)",cursor:"auto","&.cm-focused":{outline:"none"}},".cm-scroller":{lineHeight:"1.2em",fontFamily:"var(--source-code-font-family)",fontSize:"var(--source-code-font-size)"},".cm-panels":{backgroundColor:"var(--color-background-elevation-1)"},".cm-selectionMatch":{backgroundColor:"var(--color-selection-highlight)"},".cm-cursor":{borderLeft:"1px solid var(--color-background-inverted)"},"&.cm-readonly .cm-cursor":{display:"none"},".cm-cursor-secondary":{borderLeft:"1px solid var(--color-secondary-cursor)"},".cm-selectionBackground":{background:"var(--color-editor-selection)"},"&.cm-focused .cm-selectionBackground":{background:"var(--color-editor-selection)"},".cm-gutters":{borderRight:"1px solid var(--color-details-hairline)",whiteSpace:"nowrap",backgroundColor:"var(--color-background)"},".cm-gutters .cm-foldGutterElement":{cursor:"pointer",opacity:"0%",transition:"opacity 0.2s"},".cm-gutters .cm-foldGutterElement-folded, .cm-gutters:hover .cm-foldGutterElement":{opacity:"100%"},".cm-lineNumbers":{overflow:"visible",minWidth:"40px"},".cm-lineNumbers .cm-gutterElement":{color:"var(--color-line-number)",padding:"0 3px 0 9px"},".cm-foldPlaceholder":{background:"transparent",border:"none",color:"var(--color-text-secondary)"},".cm-matchingBracket, .cm-nonmatchingBracket":{background:"transparent",borderBottom:"none"},"&:focus-within .cm-matchingBracket":{color:"inherit",backgroundColor:"var(--color-matching-bracket-background)",borderBottom:"1px solid var(--color-matching-bracket-underline)"},"&:focus-within .cm-nonmatchingBracket":{backgroundColor:"var(--color-nonmatching-bracket-background)",borderBottom:"1px solid var(--color-nonmatching-bracket-underline)"},".cm-trailingWhitespace":{backgroundColor:"var(--color-trailing-whitespace)"},".cm-highlightedTab":{display:"inline-block",position:"relative","&:before":{content:'""',borderBottom:"1px solid var(--color-text-secondary)",position:"absolute",left:"5%",bottom:"50%",width:"90%",pointerEvents:"none"}},".cm-highlightedSpaces:before":{color:"var(--color-text-secondary)",content:"attr(data-display)",position:"absolute",pointerEvents:"none"},".cm-placeholder":{color:"var(--color-text-secondary)"},".cm-completionHint":{color:"var(--color-text-secondary)"},".cm-tooltip":{boxShadow:"var(--drop-shadow)",backgroundColor:"var(--color-background-elevation-1)"},".cm-argumentHints":{pointerEvents:"none",padding:"0 4px",whiteSpace:"nowrap",lineHeight:"20px",marginBottom:"4px",width:"fit-content"},".cm-tooltip.cm-tooltip-autocomplete > ul":{backgroundColor:"var(--color-background)",maxHeight:"25em",minWidth:"16em","& > li":{display:"flex",justifyContent:"space-between",border:"1px solid var(--color-background)"},"& > li.cm-secondaryCompletion":{display:"flex",backgroundColor:"var(--color-background-elevation-1)",borderColor:"var(--color-background-elevation-1)",justifyContent:"space-between","&::before":{content:'">"',fontWeight:"bold",color:"var(--color-primary-variant)",marginRight:"5px"}},"& > li:hover":{backgroundColor:"var(--item-hover-color)"},"& > li[aria-selected]":{backgroundColor:"var(--color-selected-option-background)",borderColor:"var(--color-selected-option-background)","&, &.cm-secondaryCompletion::before":{color:"var(--color-selected-option)"},"&::after":{content:'"tab"',color:"var(--color-button-primary-text)",border:"1px solid var(--color-selected-option-outline)",borderRadius:"2px",marginLeft:"5px",padding:"1px 3px",fontSize:"10px",lineHeight:"10px"}}},".cm-tooltip.cm-tooltip-autocomplete.cm-conservativeCompletion > ul > li[aria-selected]":{backgroundColor:"var(--color-background)",border:"1px dotted var(--color-text-primary)","&, &.cm-secondaryCompletion::before":{color:"var(--color-text-primary)"},"&::after":{border:"1px solid var(--color-button-secondary-border)",color:"var(--color-text-secondary)"}},".cm-completionMatchedText":{textDecoration:"none",fontWeight:"bold"},".cm-highlightedLine":{animation:"cm-fading-highlight 2s 0s"},"@keyframes cm-fading-highlight":{from:{backgroundColor:"var(--color-highlighted-line)"},to:{backgroundColor:"transparent"}}}),y={codeEditor:"Code editor",sSuggestionSOfS:"{PH1}, suggestion {PH2} of {PH3}"},v=e.i18n.registerUIStrings("ui/components/text_editor/config.ts",y),x=e.i18n.getLocalizedString.bind(void 0,v),S=[],w=n.Facet.define();class E{settingName;getExtension;compartment=new n.Compartment;constructor(t,e){this.settingName=t,this.getExtension=e}settingValue(){return t.Settings.Settings.instance().moduleSetting(this.settingName).get()}instance(){return[this.compartment.of(this.getExtension(this.settingValue())),w.of(this)]}sync(t,e){const o=this.compartment.get(t),n=this.getExtension(e);return o===n?null:this.compartment.reconfigure(n)}static bool(t,e,o=S){return new E(t,(t=>t?e:o))}static none=[]}const C=E.bool("textEditorTabMovesFocus",[],n.keymap.of([{key:"Tab",run:t=>!!t.state.doc.length&&n.indentMore(t),shift:t=>!!t.state.doc.length&&n.indentLess(t)}])),k=n.StateEffect.define(),M=n.StateField.define({create:()=>!0,update:(t,e)=>"active"!==n.completionStatus(e.state)||(n.selectedCompletionIndex(e.startState)??0)===(n.selectedCompletionIndex(e.state)??0)&&!e.effects.some((t=>t.is(k)))&&t});function T(t){return!t.state.field(M,!1)&&n.acceptCompletion(t)}function P(t){const e=t.state.selection.main.head,o=t.state.doc.lineAt(e);return!!(e-o.from>=o.length)&&n.acceptCompletion(t)}function D(t,e="option"){return o=>{if("active"!==n.completionStatus(o.state))return!1;if(o.state.field(M,!1))return o.dispatch({effects:k.of(null)}),L(o),!0;const r=n.moveCompletionSelection(t,e)(o);return L(o),r}}function j(){return t=>"active"===n.completionStatus(t.state)&&(n.moveCompletionSelection(!1)(t),L(t),!0)}function L(t){const e=x(y.sSuggestionSOfS,{PH1:n.selectedCompletion(t.state)?.label||"",PH2:(n.selectedCompletionIndex(t.state)||0)+1,PH3:n.currentCompletions(t.state).length});r.ARIAUtils.alert(e)}const O=new E("textEditorAutocompletion",(t=>[n.autocompletion({activateOnTyping:t,icons:!1,optionClass:t=>"secondary"===t.type?"cm-secondaryCompletion":"",tooltipClass:t=>t.field(M,!1)?"cm-conservativeCompletion":"",defaultKeymap:!1}),n.Prec.highest(n.keymap.of([{key:"End",run:P},{key:"ArrowRight",run:P},{key:"Ctrl-Space",run:n.startCompletion},{key:"Escape",run:n.closeCompletion},{key:"ArrowDown",run:D(!0)},{key:"ArrowUp",run:j()},{mac:"Ctrl-n",run:D(!0)},{mac:"Ctrl-p",run:j()},{key:"PageDown",run:n.moveCompletionSelection(!0,"page")},{key:"PageUp",run:n.moveCompletionSelection(!1,"page")},{key:"Enter",run:T}]))])),I=E.bool("textEditorBracketMatching",n.bracketMatching()),A=E.bool("textEditorCodeFolding",[n.foldGutter({markerDOM(t){const e=t?"triangle-down":"triangle-right",o=new s.Icon.Icon;return o.setAttribute("class",t?"cm-foldGutterElement":"cm-foldGutterElement cm-foldGutterElement-folded"),o.data={iconName:e,color:"var(--icon-fold-marker)",width:"14px",height:"14px"},o}}),n.keymap.of(n.foldKeymap)]);function N(e){const o=Object.create(null);let n=0;for(let t=e.iterLines(1,Math.min(e.lines+1,1e3));!t.next().done;){let e=/^\s*/.exec(t.value)[0];if(e.length!==t.value.length&&e.length&&"*"!==t.value[e.length]){if("\t"===e[0])e="\t";else if(/[^ ]/.test(e))continue;n++,o[e]=(o[e]||0)+1}}const r=.05*n;return Object.entries(o).reduce(((t,[e,o])=>o<r||t&&t.length<e.length?t:e),null)??t.Settings.Settings.instance().moduleSetting("textEditorIndent").get()}const B=n.Prec.highest(n.indentUnit.compute([],(t=>N(t.doc)))),_=E.bool("textEditorAutoDetectIndent",B);function H(t){return n.ViewPlugin.define((e=>({decorations:t.createDeco(e),update(e){this.decorations=t.updateDeco(e,this.decorations)}})),{decorations:t=>t.decorations})}const z=new Map;const R=H(new n.MatchDecorator({regexp:/\t| +/g,decoration:t=>function(t){const e=z.get(t);if(e)return e;const o=n.Decoration.mark({attributes:"\t"===t?{class:"cm-highlightedTab"}:{class:"cm-highlightedSpaces","data-display":"·".repeat(t.length)}});return z.set(t,o),o}(t[0]),boundary:/\S/})),W=H(new n.MatchDecorator({regexp:/\s+$/g,decoration:n.Decoration.mark({class:"cm-trailingWhitespace"}),boundary:/\S/})),F=new E("showWhitespacesInEditor",(t=>"all"===t?R:"trailing"===t?W:S)),$=E.bool("allowScrollPastEof",n.scrollPastEnd()),V=Object.create(null);const U=new E("textEditorIndent",(function(t){let e=V[t];return e||(e=V[t]=n.indentUnit.of(t)),e})),G=E.bool("domWordWrap",n.EditorView.lineWrapping);function K(t){return/\r\n/.test(t)&&!/(^|[^\r])\n/.test(t)?n.EditorState.lineSeparator.of("\r\n"):[]}const J=n.keymap.of([{key:"Tab",run:n.acceptCompletion},{key:"Ctrl-m",run:n.cursorMatchingBracket,shift:n.selectMatchingBracket},{key:"Mod-/",run:n.toggleComment},{key:"Mod-d",run:n.selectNextOccurrence},{key:"Alt-ArrowLeft",mac:"Ctrl-ArrowLeft",run:n.cursorSyntaxLeft,shift:n.selectSyntaxLeft},{key:"Alt-ArrowRight",mac:"Ctrl-ArrowRight",run:n.cursorSyntaxRight,shift:n.selectSyntaxRight},{key:"Ctrl-ArrowLeft",mac:"Alt-ArrowLeft",run:n.cursorSubwordBackward,shift:n.selectSubwordBackward},{key:"Ctrl-ArrowRight",mac:"Alt-ArrowRight",run:n.cursorSubwordForward,shift:n.selectSubwordForward},...n.standardKeymap,...n.historyKeymap]);function q(){const e=t.Settings.Settings.instance().moduleSetting("uiTheme").get();return"systemPreferred"===e?window.matchMedia("(prefers-color-scheme: dark)").matches:"dark"===e}const Q=n.EditorView.theme({},{dark:!0}),X=new n.Compartment;function Y(){return[b,q()?X.of(Q):X.of([])]}let Z=null;function tt(){return Z||(Z=o.WindowBoundsService.WindowBoundsServiceImpl.instance().getDevToolsBoundingElement()),Z.getBoundingClientRect()}function et(t){return[Y(),n.highlightSpecialChars(),n.highlightSelectionMatches(),n.history(),n.drawSelection(),n.EditorState.allowMultipleSelections.of(!0),n.indentOnInput(),n.syntaxHighlighting(i.CodeHighlighter.highlightStyle),J,n.EditorView.clickAddsSelectionRange.of((t=>t.altKey||t.ctrlKey)),C.instance(),I.instance(),U.instance(),n.Prec.lowest(n.EditorView.contentAttributes.of({"aria-label":x(y.codeEditor)})),t instanceof n.Text?[]:K(t),n.tooltips({parent:rt(),tooltipSpace:tt})]}const ot=[n.closeBrackets(),n.keymap.of(n.closeBracketsKeymap)];let nt=null;function rt(){if(!nt){const t=n.EditorState.create({extensions:[b,q()?Q:[],n.syntaxHighlighting(i.CodeHighlighter.highlightStyle),n.showTooltip.of({pos:0,create:()=>({dom:document.createElement("div")})})]}).facet(n.EditorView.styleModule),e=document.body.appendChild(document.createElement("div"));e.className="editor-tooltip-host",nt=e.attachShadow({mode:"open"}),n.StyleModule.mount(nt,t)}return nt}class it extends n.WidgetType{text;constructor(t){super(),this.text=t}eq(t){return this.text===t.text}toDOM(){const t=document.createElement("span");return t.className="cm-completionHint",t.textContent=this.text,t}}const st=n.ViewPlugin.fromClass(class{decorations=n.Decoration.none;currentHint=null;update(t){const e=this.currentHint=this.topCompletion(t.state);!e||t.state.field(M,!1)?this.decorations=n.Decoration.none:this.decorations=n.Decoration.set([n.Decoration.widget({widget:new it(e),side:1}).range(t.state.selection.main.head)])}topCompletion(t){const e=n.selectedCompletion(t);if(!e)return null;let{label:o,apply:r}=e;if("string"==typeof r&&(o=r,r=void 0),r||o.length>100||o.indexOf("\n")>-1||"secondary"===e.type)return null;const i=t.selection.main.head,s=t.doc.lineAt(i);if(i!==s.to)return null;const a=("'"===o[0]?/'(\\.|[^'\\])*$/:'"'===o[0]?/"(\\.|[^"\\])*$/:/#?[\w$]+$/).exec(s.text);return a&&!o.startsWith(a[0])?null:o.slice(a?a[0].length:0)}},{decorations:t=>t.decorations});var at=Object.freeze({__proto__:null,dynamicSetting:w,DynamicSetting:E,tabMovesFocus:C,conservativeCompletion:M,autocompletion:O,bracketMatching:I,codeFolding:A,guessIndent:N,autoDetectIndent:_,showWhitespace:F,allowScrollPastEof:$,indentUnit:U,domWordWrap:G,dummyDarkTheme:Q,themeSelection:X,theme:Y,baseConfiguration:et,closeBrackets:ot,showCompletionHint:st,contentIncludingHint:function(t){const e=t.plugin(st);let o=t.state.doc.toString();if(e&&e.currentHint){const{head:n}=t.state.selection.main;o=o.slice(0,n)+e.currentHint+o.slice(n)}return o}});const ct=n.StateEffect.define();class lt{completions;seen;constructor(t=[],e=new Set){this.completions=t,this.seen=e}add(t){this.seen.has(t.label)||(this.seen.add(t.label),this.completions.push(t))}copy(){return new lt(this.completions.slice(),new Set(this.seen))}}const dt=["async","await","break","case","catch","class","const","continue","debugger","default","delete","do","else","export","extends","false","finally","for","function","if","import","in","instanceof","let","new","null","of","return","static","super","switch","this","throw","true","try","typeof","var","void","while","with","yield"],ut=["clear","copy","debug","dir","dirxml","getEventListeners","inspect","keys","monitor","monitorEvents","profile","profileEnd","queryObjects","table","undebug","unmonitor","unmonitorEvents","values"],mt=["$","$$","$x","$0","$_"],pt=new lt;for(const t of dt)pt.add({label:t,type:"keyword"});for(const t of ut)pt.add({label:t,type:"function"});for(const t of mt)pt.add({label:t,type:"variable"});const ht=new Set(["TemplateString","LineComment","BlockComment","TypeDefinition","VariableDefinition","PropertyDefinition","TypeName"]);function ft(t,e,o){let n=t.resolveInner(e,-1);const r=n.parent;if(ht.has(n.name))return null;if("PropertyName"===n.name||"PrivatePropertyName"===n.name)return"MemberExpression"!==r?.name?null:{type:1,from:n.from,relatedNode:r};if("VariableName"===n.name||!n.firstChild&&n.to-n.from<20&&!/[^a-z]/.test(o.sliceString(n.from,n.to)))return{type:0,from:n.from};if("String"===n.name){const t=n.parent;return"MemberExpression"===t?.name&&"["===t.childBefore(n.from)?.name?{type:2,from:n.from,relatedNode:t}:null}if(n=n.enterUnfinishedNodesBefore(e),n.to===e&&"MemberExpression"===n.parent?.name&&(n=n.parent),"MemberExpression"===n.name){const t=n.childBefore(Math.min(e,n.to));if("["===t?.name)return{type:2,relatedNode:n};if("."===t?.name||"?."===t?.name)return{type:1,relatedNode:n}}if("("===n.name&&"ArgList"===r?.name&&"CallExpression"===r?.parent?.name){const t=r?.parent?.firstChild;if("MemberExpression"===t?.name){const e=t?.lastChild;if(e&&"get"===o.sliceString(e.from,e.to)){const e=t?.firstChild;return{type:3,relatedNode:e||void 0}}}}return{type:0}}async function gt(t){const e=ft(n.syntaxTree(t.state),t.pos,t.state.doc);if(!e||void 0===e.from&&!t.explicit&&0===e.type)return null;const o=xt()?.debuggerModel.selectedCallFrame()?.script;if(o&&l.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().pluginManager?.hasPluginForScript(o))return null;let r,i;if(0===e.type){const[t,e]=await Promise.all([Mt(),Tt()]);if(t.completions.length){r=t;for(const t of e.completions)r.add(t)}else r=e}else if(1===e.type||2===e.type){const o=e.relatedNode.getChild("Expression");if(2===e.type&&(i=void 0===e.from?"'":t.state.sliceDoc(e.from,e.from+1)),!o)return null;r=await async function(t,e,o=!1){const n=Ct.instance();if(!e){const e=n.get(t);if(e)return e}const r=xt();if(!r)return new lt;const i=kt(t,r,e,o);e||n.set(t,i);return i}(t.state.sliceDoc(o.from,o.to),i,"]"===t.state.sliceDoc(t.pos,t.pos+1))}else{if(3!==e.type)return null;{const o=e.relatedNode;if(!o)return null;r=await async function(t){const e=new lt,o=xt();if(!o)return e;const n=await St(o,`[...Map.prototype.keys.call(${t})]`,"completion");if(!n)return e;const r=c.RemoteObject.RemoteArray.objectAsArray(n),i=r.length();for(let t=0;t<i;t++)e.add({label:`"${(await r.at(t)).value}")`,type:"constant",boost:-1*t});return e}(t.state.sliceDoc(o.from,o.to))}}return{from:e.from??t.pos,options:r.completions,validFor:i?"'"===i?yt:vt:bt}}const bt=/^#?(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*$/u,yt=/^\'(\\.|[^\\'\n])*'?$/,vt=/^"(\\.|[^\\"\n])*"?$/;function xt(){return r.Context.Context.instance().flavor(c.RuntimeModel.ExecutionContext)}async function St(t,e,o){const n=await t.evaluate({expression:e,objectGroup:o,includeCommandLineAPI:!0,silent:!0,returnByValue:!1,generatePreview:!1,throwOnSideEffect:!0,timeout:500},!1,!1);return"error"in n||n.exceptionDetails||!n.object?null:n.object}const wt=new Map([["string","String"],["symbol","Symbol"],["number","Number"],["boolean","Boolean"],["bigint","BigInt"]]);let Et=null;class Ct{#c=new Map;constructor(){const t=()=>this.#c.clear();c.TargetManager.TargetManager.instance().addModelListener(c.ConsoleModel.ConsoleModel,c.ConsoleModel.Events.CommandEvaluated,t),r.Context.Context.instance().addFlavorChangeListener(c.RuntimeModel.ExecutionContext,t),c.TargetManager.TargetManager.instance().addModelListener(c.DebuggerModel.DebuggerModel,c.DebuggerModel.Events.DebuggerResumed,t),c.TargetManager.TargetManager.instance().addModelListener(c.DebuggerModel.DebuggerModel,c.DebuggerModel.Events.DebuggerPaused,t)}get(t){return this.#c.get(t)}set(t,e){this.#c.set(t,e),window.setTimeout((()=>{this.#c.get(t)===e&&this.#c.delete(t)}),3e4)}static instance(){return Et||(Et=new Ct),Et}}async function kt(t,e,o,n=!1){const r=new lt;if(!e)return r;let i=await St(e,t,"completion");if(!i)return r;for(;"object"===i.type&&"proxy"===i.subtype;){const t=(await i.getOwnProperties(!1)).internalProperties?.find((t=>"[[Target]]"===t.name))?.value;if(!t)break;i=t}const s=wt.get(i.type);s&&(i=await St(e,s+".prototype","completion"));const a="globalThis"===t?"function":"method",c="globalThis"===t?"variable":"property";if(i&&("object"===i.type||"function"===i.type)){const e=await i.getAllProperties(!1,!1,!0),s="function"===i.type;for(const i of e.properties||[])if(!i.symbol&&(!s||"arguments"!==i.name&&"caller"!==i.name)&&(!i.private||"this"===t)&&(o||bt.test(i.name))){const t=o?o+i.name.replaceAll("\\","\\\\").replaceAll(o,"\\"+o)+o:i.name,e=o&&!n?`${t}]`:void 0,s=2*Number(i.isOwn)+1*Number(i.enumerable),l="function"===i.value?.type?a:c;r.add({apply:e,label:t,type:l,boost:s})}}return e.runtimeModel.releaseObjectGroup("completion"),r}async function Mt(){const t=new lt,e=xt()?.debuggerModel.selectedCallFrame();if(!e)return t;const o=await Promise.all(e.scopeChain().map((t=>(t=>a.Runtime.experiments.isEnabled("evaluateExpressionsWithSourceMaps")?u.NamesResolver.resolveScopeInObject(t):t.object())(t).getAllProperties(!1,!1))));for(const e of o)for(const o of e.properties||[])t.add({label:o.name,type:"function"===o.value?.type?"function":"variable"});return t}async function Tt(){const t=Ct.instance(),e=t.get("");if(e)return e;const o=xt();if(!o)return pt;const n=pt.copy(),r=kt("globalThis",o).then((t=>o.globalLexicalScopeNames().then((e=>{for(const e of t.completions)n.add(e);for(const t of e||[])n.add({label:t,type:"variable"});return n}))));return t.set("",r),r}async function Pt(t,e){const o=n.syntaxTree(t).resolveInner(e).enterUnfinishedNodesBefore(e);if("ArgList"!==o.name)return null;const r=o.parent?.getChild("Expression");if(!r)return null;const i=await async function(t,e){const o=xt();if(!o)return null;const n=e.sliceString(t.from,t.to),r=await St(o,n,"argumentsHint");if(!r||"function"!==r.type)return null;return jt(r,(async()=>{const n=t.firstChild;return n&&"MemberExpression"===t.name?St(o,e.sliceString(n.from,n.to),"argumentsHint"):null}),n).finally((()=>o.runtimeModel.releaseObjectGroup("argumentsHint")))}(r,t.doc);if(!i)return null;let s=0;for(let t=e;;){const e=o.childBefore(t);if(!e)break;e.type.is("Expression")&&s++,t=e.from}return()=>function(t,e){const o=document.createElement("div");o.className="cm-argumentHints";for(const n of t){const t=document.createElement("span");for(let o=0;o<n.length;o++){if(o===e||o<e&&n[o].startsWith("...")){t.appendChild(document.createElement("b")).appendChild(document.createTextNode(n[o]))}else t.appendChild(document.createTextNode(n[o]));o<n.length-1&&t.appendChild(document.createTextNode(", "))}const r=o.appendChild(document.createElement("div"));r.className="source-code",r.appendChild(document.createTextNode("ƒ(")),r.appendChild(t),r.appendChild(document.createTextNode(")"))}return{dom:o}}(i,s)}function Dt(t){function e(e){for(;"ParamList"!==e.name&&e.nextSibling(););const o=[];if("ParamList"===e.name&&e.firstChild()){let n="";do{switch(e.name){case"ArrayPattern":o.push(n+"arr"),n="";break;case"ObjectPattern":o.push(n+"obj"),n="";break;case"VariableDefinition":o.push(n+t.slice(e.from,e.to)),n="";break;case"Spread":n="..."}}while(e.nextSibling())}return o}try{try{const{parser:o}=n.javascript.javascriptLanguage.configure({strict:!0,top:"SingleClassItem"}),r=o.parse(t).cursor();if(r.firstChild()&&"MethodDeclaration"===r.name&&r.firstChild())return e(r);throw new Error("SingleClassItem rule is expected to have exactly one MethodDeclaration child")}catch{const{parser:o}=n.javascript.javascriptLanguage.configure({strict:!0,top:"SingleExpression"}),r=o.parse(t).cursor();if(!r.firstChild())throw new Error("SingleExpression rule is expected to have children");switch(r.name){case"ArrowFunction":case"FunctionExpression":if(!r.firstChild())throw new Error(`${r.name} rule is expected to have children`);return e(r);case"ClassExpression":if(!r.firstChild())throw new Error(`${r.name} rule is expected to have children`);for(;r.nextSibling()&&"ClassBody"!==r.name;);if("ClassBody"===r.name&&r.firstChild())do{if("MethodDeclaration"===r.name&&r.firstChild()){if("PropertyDefinition"===r.name&&"constructor"===t.slice(r.from,r.to))return e(r);r.parent()}}while(r.nextSibling());return[]}throw new Error("Unexpected expression")}}catch(e){throw new Error(`Failed to parse for arguments list: ${t}`,{cause:e})}}async function jt(t,e,o){const n=t.description;if(!n)return null;if(!n.endsWith("{ [native code] }"))return[Dt(n)];if("function () { [native code] }"===n){const e=await async function(t){const{internalProperties:e}=await t.getOwnProperties(!1);if(!e)return null;const o=e.find((t=>"[[TargetFunction]]"===t.name))?.value,n=e.find((t=>"[[BoundArgs]]"===t.name))?.value,r=e.find((t=>"[[BoundThis]]"===t.name))?.value;if(!r||!o||!n)return null;const i=await jt(o,(()=>Promise.resolve(r))),s=c.RemoteObject.RemoteObject.arrayLength(n);if(!i)return null;return i.map((t=>{const e=t.findIndex((t=>t.startsWith("...")));return e>-1&&e<s?t.slice(e):t.slice(s)}))}(t);if(e)return e}const r=d.JavaScriptMetadata.JavaScriptMetadataImpl.instance(),i=/^function ([^(]*)\(/.exec(n),s=i&&i[1]||o;if(!s)return null;const a=r.signaturesForNativeFunction(s);if(a)return a;const l=await e();if(!l)return null;const u=l.className;if(u){const t=r.signaturesForInstanceMethod(s,u);if(t)return t}if(l.description&&"function"===l.type&&l.description.endsWith("{ [native code] }")){const t=/^function ([^(]*)\(/.exec(l.description);if(t){const e=t[1],o=r.signaturesForStaticMethod(s,e);if(o)return o}}for(const t of await async function(t){if("number"===t.type)return["Number","Object"];if("string"===t.type)return["String","Object"];if("symbol"===t.type)return["Symbol","Object"];if("bigint"===t.type)return["BigInt","Object"];if("boolean"===t.type)return["Boolean","Object"];if("undefined"===t.type||"null"===t.subtype)return[];return await t.callFunctionJSON((function(){const t=[];for(let e=this;e;e=Object.getPrototypeOf(e))"object"==typeof e&&e.constructor&&e.constructor.name&&(t[t.length]=e.constructor.name);return t}),[])}(l)){const e=r.signaturesForInstanceMethod(s,t);if(e)return e}return null}var Lt=Object.freeze({__proto__:null,completion:function(){return n.javascript.javascriptLanguage.data.of({autocomplete:gt})},completeInContext:async function(t,e,o=!1){const r=n.EditorState.create({doc:t+e,selection:{anchor:t.length},extensions:n.javascript.javascriptLanguage}),i=await gt(new n.CompletionContext(r,r.doc.length,o));return i?i.options.filter((t=>t.label.startsWith(e))).map((t=>({text:t.label,priority:100+(t.boost||0),isSecondary:"secondary"===t.type}))):[]},getQueryType:ft,javascriptCompletionSource:gt,isExpressionComplete:async function(t){const e=r.Context.Context.instance().flavor(c.RuntimeModel.ExecutionContext);if(!e)return!0;const o=await e.runtimeModel.compileScript(t,"",!1,e.id);if(!o||!o.exceptionDetails||!o.exceptionDetails.exception)return!0;const n=o.exceptionDetails.exception.description;return!!n&&(!n.startsWith("SyntaxError: Unexpected end of input")&&!n.startsWith("SyntaxError: Unterminated template literal"))},argumentHints:function(){return function(t){const e=n.StateEffect.define();return[n.StateField.define({create:()=>null,update(t,o){if(o.selection&&(t=null),t&&!o.changes.empty){const e=o.changes.mapPos(t.pos,-1,n.MapMode.TrackDel);t=null===e?null:{pos:e,create:t.create,above:!0}}for(const n of o.effects)n.is(e)?t={pos:o.state.selection.main.from,create:n.value,above:!0}:n.is(ct)&&(t=null);return t},provide:t=>n.showTooltip.from(t)}),n.ViewPlugin.fromClass(class{pending=-1;updateID=0;update(t){this.updateID++,t.transactions.some((t=>t.selection))&&t.state.selection.main.empty&&this.#l(t.view)}#l(t){this.pending>-1&&clearTimeout(this.pending),this.pending=window.setTimeout((()=>this.#d(t)),50)}#d(o){this.pending=-1;const{main:n}=o.state.selection;if(n.empty){const{updateID:r}=this;t(o.state,n.from).then((t=>{this.updateID!==r?this.pending<0&&this.#l(o):t?o.dispatch({effects:e.of(t)}):o.dispatch({effects:ct.of(null)})}))}}})]}(Pt)},closeArgumentsHintsTooltip:function(t,e){return null!==t.state.field(e)&&(t.dispatch({effects:ct.of(null)}),!0)},argumentsList:Dt});function Ot(t,{lineNumber:e,columnNumber:o}){const n=t.line(Math.max(1,Math.min(t.lines,e+1)));return Math.max(n.from,Math.min(n.to,n.from+o))}function It(t,e){e=Math.max(0,Math.min(e,t.length));const o=t.lineAt(e);return{lineNumber:o.number-1,columnNumber:e-o.from}}var At=Object.freeze({__proto__:null,toOffset:Ot,toLineColumn:It});class Nt extends HTMLElement{static litTagName=p.literal`devtools-text-editor`;#u=this.attachShadow({mode:"open"});#m=void 0;#p=E.none;#h=[];#f;#g={left:0,top:0,changed:!1};#b=-1;#y=()=>{this.#b<0&&(this.#b=window.setTimeout((()=>{this.#b=-1,this.#m&&n.repositionTooltips(this.#m)}),50))};#v=new ResizeObserver(this.#y);constructor(t){super(),this.#f=t,this.#u.adoptedStyleSheets=[i.Style.default]}#x(){return this.#m=new n.EditorView({state:this.state,parent:this.#u,root:this.#u,dispatch:(t,e)=>{e.update([t]),t.reconfigured&&this.#S()}}),this.#w(this.#m),this.#m.scrollDOM.addEventListener("scroll",(t=>{this.#m&&(this.#E(this.#m,{scrollLeft:t.target.scrollLeft,scrollTop:t.target.scrollTop}),this.scrollEventHandledToSaveScrollPositionForTest())})),this.#S(),this.#C(),m.ThemeSupport.instance().addEventListener(m.ThemeChangeEvent.eventName,(()=>{const t="dark"===m.ThemeSupport.instance().themeName()?Q:[];this.editor.dispatch({effects:X.reconfigure(t)})})),this.#m}get editor(){return this.#m||this.#x()}dispatch(t){return this.editor.dispatch(t)}get state(){return this.#m?this.#m.state:(this.#f||(this.#f=n.EditorState.create({extensions:et("")})),this.#f)}set state(t){this.#f!==t&&(this.#f=t,this.#m&&(this.#m.setState(t),this.#S()))}#w(t){this.#g.changed&&t.dispatch({effects:n.EditorView.scrollIntoView(0,{x:"start",xMargin:-this.#g.left,y:"start",yMargin:-this.#g.top})})}#E(t,{scrollLeft:e,scrollTop:o}){const n=t.contentDOM.getBoundingClientRect(),r=t.coordsAtPos(0)??{top:n.top,left:n.left,bottom:n.bottom,right:n.right};this.#g.left=e+(n.left-r.left),this.#g.top=o+(n.top-r.top),this.#g.changed=!0}scrollEventHandledToSaveScrollPositionForTest(){}connectedCallback(){this.#m?this.#w(this.#m):this.#x()}disconnectedCallback(){this.#m&&(this.#m.dispatch({effects:Bt.of(null)}),this.#f=this.#m.state,this.#v.disconnect(),window.removeEventListener("resize",this.#y),this.#m.destroy(),this.#m=void 0,this.#S())}focus(){this.#m&&this.#m.focus()}#S(){const e=this.#m?this.#m.state.facet(w):E.none;if(e===this.#p)return;this.#p=e;for(const[t,e]of this.#h)t.removeChangeListener(e);this.#h=[];const o=t.Settings.Settings.instance();for(const t of e){const e=({data:e})=>{const o=t.sync(this.state,e);o&&this.#m&&this.#m.dispatch({effects:o})},n=o.moduleSetting(t.settingName);n.addChangeListener(e),this.#h.push([n,e])}}#C(){const t=o.WindowBoundsService.WindowBoundsServiceImpl.instance().getDevToolsBoundingElement();t&&this.#v.observe(t),window.addEventListener("resize",this.#y)}revealPosition(t,e=!0){const o=this.#m;if(!o)return;const r=o.state.doc.lineAt(t.main.head),i=[];e&&(o.state.field(Ht,!1)?o.dispatch({effects:Bt.of(null)}):o.dispatch({effects:n.StateEffect.appendConfig.of(Ht)}),i.push(_t.of(r.from)));const s=o.scrollDOM.getBoundingClientRect(),a=o.coordsAtPos(t.main.head);(!a||a.top<s.top||a.bottom>s.bottom)&&i.push(n.EditorView.scrollIntoView(t.main,{y:"center"})),o.dispatch({selection:t,effects:i,userEvent:"select.reveal"})}createSelection(t,e){const{doc:o}=this.state,r=Ot(o,t);return n.EditorSelection.single(e?Ot(o,e):r,r)}toLineColumn(t){return It(this.state.doc,t)}toOffset(t){return Ot(this.state.doc,t)}}h.CustomElements.defineComponent("devtools-text-editor",Nt);const Bt=n.StateEffect.define(),_t=n.StateEffect.define(),Ht=n.StateField.define({create:()=>n.Decoration.none,update(t,e){!e.changes.empty&&t.size&&(t=t.map(e.changes));for(const o of e.effects)o.is(Bt)?t=n.Decoration.none:o.is(_t)&&(t=n.Decoration.set([n.Decoration.line({attributes:{class:"cm-highlightedLine"}}).range(o.value)]));return t},provide:t=>n.EditorView.decorations.from(t,(t=>t))});var zt=Object.freeze({__proto__:null,TextEditor:Nt});var Rt=Object.freeze({__proto__:null,TextEditorHistory:class{#k;#M;constructor(t,e){this.#k=t,this.#M=e}moveHistory(t,e=!1){const{editor:o}=this.#k,{main:r}=o.state.selection,i=-1===t;if(!e){if(!r.empty)return!1;const t=o.coordsAtPos(r.head),e=o.coordsAtPos(i?0:o.state.doc.length);if(t&&e&&(i?t.top>e.top+5:t.bottom<e.bottom-5))return!1}const s=o.state.doc.toString(),a=this.#M,c=i?a.previous(s):a.next();if(void 0===c)return!1;const l=c.length;if(o.dispatch({changes:{from:0,to:o.state.doc.length,insert:c},selection:n.EditorSelection.cursor(l),scrollIntoView:!0}),i){const t=c.search(/\n|$/);o.dispatch({selection:n.EditorSelection.cursor(t)})}return!0}historyCompletions(t){const{explicit:e,pos:o,state:n}=t,r=n.doc.toString();if(!(o===r.length)||!r.length&&!e)return null;const i=this.#M.matchingEntries(r);if(!i.size)return null;const s=[...i].map((t=>({label:t,type:"secondary",boost:-1e5})));return{from:0,to:r.length,options:s}}}});export{g as AutocompleteHistory,at as Config,Lt as JavaScript,At as Position,zt as TextEditor,Rt as TextEditorHistory};
