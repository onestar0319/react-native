import*as e from"../../core/common/common.js";import*as t from"../../core/i18n/i18n.js";import*as n from"../../core/platform/platform.js";import*as s from"../../core/sdk/sdk.js";import*as i from"../../models/persistence/persistence.js";import*as r from"../../ui/legacy/legacy.js";import*as o from"../../models/workspace/workspace.js";import*as p from"../../ui/legacy/components/quick_open/quick_open.js";const a={scriptSnippet:"Script snippet #{PH1}",linkedTo:"Linked to {PH1}"},c=t.i18n.registerUIStrings("panels/snippets/ScriptSnippetFileSystem.ts",a),l=t.i18n.getLocalizedString.bind(void 0,c);function d(t){return e.ParsedURL.ParsedURL.rawPathToEncodedPathString(t)}function u(t){return e.ParsedURL.ParsedURL.encodedPathToRawPathString(t)}class g extends i.PlatformFileSystem.PlatformFileSystem{lastSnippetIdentifierSetting;snippetsSetting;constructor(){super("snippet://","snippets"),this.lastSnippetIdentifierSetting=e.Settings.Settings.instance().createSetting("scriptSnippets_lastIdentifier",0),this.snippetsSetting=e.Settings.Settings.instance().createSetting("scriptSnippets",[])}initialFilePaths(){return this.snippetsSetting.get().map((e=>d(e.name)))}async createFile(e,t){const n=this.lastSnippetIdentifierSetting.get()+1;this.lastSnippetIdentifierSetting.set(n);const s=l(a.scriptSnippet,{PH1:n}),i=this.snippetsSetting.get();return i.push({name:s,content:""}),this.snippetsSetting.set(i),d(s)}async deleteFile(t){const n=u(e.ParsedURL.ParsedURL.substring(t,1)),s=this.snippetsSetting.get(),i=s.filter((e=>e.name!==n));return s.length!==i.length&&(this.snippetsSetting.set(i),!0)}async requestFileContent(t){const n=u(e.ParsedURL.ParsedURL.substring(t,1)),s=this.snippetsSetting.get().find((e=>e.name===n));return s?{content:s.content,isEncoded:!1}:{content:null,isEncoded:!1,error:`A snippet with name '${n}' was not found`}}async setFileContent(t,n,s){const i=u(e.ParsedURL.ParsedURL.substring(t,1)),r=this.snippetsSetting.get(),o=r.find((e=>e.name===i));return!!o&&(o.content=n,this.snippetsSetting.set(r),!0)}renameFile(t,n,s){const i=u(e.ParsedURL.ParsedURL.substring(t,1)),r=this.snippetsSetting.get(),o=r.find((e=>e.name===i));n=e.ParsedURL.ParsedURL.trim(n),o&&0!==n.length&&!r.find((e=>e.name===n))?(o.name=n,this.snippetsSetting.set(r),s(!0,n)):s(!1)}async searchInPath(e,t){const s=new RegExp(n.StringUtilities.escapeForRegExp(e),"i");return this.snippetsSetting.get().filter((e=>e.content.match(s))).map((e=>`snippet:///${d(e.name)}`))}mimeFromPath(e){return"text/javascript"}contentType(t){return e.ResourceType.resourceTypes.Script}tooltipForURL(t){return l(a.linkedTo,{PH1:u(e.ParsedURL.ParsedURL.sliceUrlToEncodedPathString(t,this.path().length))})}supportsAutomapping(){return!0}}async function m(t){if(!t.url().startsWith("snippet://"))return;const n=r.Context.Context.instance().flavor(s.RuntimeModel.ExecutionContext);if(!n)return;const i=n.runtimeModel,o=n.target().model(s.ConsoleModel.ConsoleModel);await t.requestContent(),t.commitWorkingCopy();const p=t.workingCopy();e.Console.Console.instance().show();const a=t.url(),c=await n.evaluate({expression:`${p}\n//# sourceURL=${a}`,objectGroup:"console",silent:!1,includeCommandLineAPI:!0,returnByValue:!1,generatePreview:!0,replMode:!0},!0,!0);if("exceptionDetails"in c&&c.exceptionDetails)return void o?.addMessage(s.ConsoleModel.ConsoleMessage.fromException(i,c.exceptionDetails,void 0,void 0,a));if(!("object"in c)||!c.object)return;const l=n.debuggerModel.scriptsForSourceURL(a);if(l.length<1)return;const d=l[l.length-1].scriptId,u={type:s.ConsoleModel.FrontendMessageType.Result,url:a,parameters:[c.object],executionContextId:n.id,scriptId:d};o?.addMessage(new s.ConsoleModel.ConsoleMessage(i,"javascript","info","",u))}function S(){const e=o.Workspace.WorkspaceImpl.instance().projectsForType(o.Workspace.projectTypes.FileSystem).find((e=>"snippets"===i.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(e)));if(!e)throw new Error("Unable to find workspace project for the snippets file system");return e}var h=Object.freeze({__proto__:null,SnippetFileSystem:g,evaluateScriptSnippet:m,isSnippetsUISourceCode:function(e){return e.url().startsWith("snippet://")},isSnippetsProject:function(e){return e.type()===o.Workspace.projectTypes.FileSystem&&"snippets"===i.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.fileSystemType(e)},findSnippetsProject:S});const f={noSnippetsFound:"No snippets found.",run:"Run",snippet:"Snippet"},y=t.i18n.registerUIStrings("panels/snippets/SnippetsQuickOpen.ts",f),P=t.i18n.getLocalizedString.bind(void 0,y),L=t.i18n.getLazilyComputedLocalizedString.bind(void 0,y);let F;class R extends p.FilteredListWidget.Provider{snippets;constructor(){super(),this.snippets=[]}static instance(e={forceNew:null}){const{forceNew:t}=e;return F&&!t||(F=new R),F}selectItem(e,t){null!==e&&m(this.snippets[e])}notFoundText(e){return P(f.noSnippetsFound)}attach(){this.snippets=[...S().uiSourceCodes()]}detach(){this.snippets=[]}itemScoreAt(e,t){return t.length/this.snippets[e].name().length}itemCount(){return this.snippets.length}itemKeyAt(e){return this.snippets[e].name()}renderItem(e,t,n,s){n.textContent=this.snippets[e].name(),n.classList.add("monospace"),p.FilteredListWidget.FilteredListWidget.highlightRanges(n,t,!0)}}p.FilteredListWidget.registerProvider({prefix:"!",iconName:"exclamation",iconWidth:"20px",provider:()=>Promise.resolve(R.instance()),titlePrefix:L(f.run),titleSuggestion:L(f.snippet)});var U=Object.freeze({__proto__:null,SnippetsQuickOpen:R});export{h as ScriptSnippetFileSystem,U as SnippetsQuickOpen};
