class e extends Event{static eventName="renderqueueempty";constructor(){super(e.eventName)}}class r extends Event{static eventName="newframe";constructor(){super(r.eventName)}}let t;const n="Unnamed read",s="Unnamed write",o="Unnamed scroll";globalThis.__getRenderCoordinatorPendingFrames=function(){return i.pendingFramesCount()};class i extends EventTarget{static instance({forceNew:e=!1}={}){return t&&!e||(t=new i),t}static pendingFramesCount(){if(!t)throw new Error("No render coordinator instance found.");return t.pendingFramesCount()}observe=!1;recordStorageLimit=100;observeOnlyNamed=!0;#e=[];#r=[];#t=0;pendingFramesCount(){return this.#r.length}done(e){return 0!==this.#r.length||e?.waitForWork?new Promise((e=>this.addEventListener("renderqueueempty",(()=>e()),{once:!0}))):(this.#n("[Queue empty]"),Promise.resolve())}async read(e,r){if("string"==typeof e){if(!r)throw new Error("Read called with label but no callback");return this.#s(r,"read",e)}return this.#s(e,"read",n)}async write(e,r){if("string"==typeof e){if(!r)throw new Error("Write called with label but no callback");return this.#s(r,"write",e)}return this.#s(e,"write",s)}takeRecords(){const e=[...this.#e];return this.#e.length=0,e}async scroll(e,r){if("string"==typeof e){if(!r)throw new Error("Scroll called with label but no callback");return this.#s(r,"read",e)}return this.#s(e,"read",o)}#s(e,r,t){const i=![n,s,o].includes(t);t=`${"read"===r?"[Read]":"[Write]"}: ${t}`,0===this.#r.length&&this.#r.push({readers:[],writers:[]});const a=this.#r[0];if(!a)throw new Error("No frame available");let l=null;switch(r){case"read":l=a.readers;break;case"write":l=a.writers;break;default:throw new Error(`Unknown action: ${r}`)}let d=i?l.find((e=>e.label===t)):null;if(!d){const e={label:t};e.promise=new Promise(((r,t)=>{e.trigger=r,e.cancel=t})).then((()=>e.handler())),d=e,l.push(d)}return d.handler=e,this.#o(),d.promise}#o(){0!==this.#t||(this.#t=requestAnimationFrame((async()=>{if(!(this.#r.length>0))return this.dispatchEvent(new e),window.dispatchEvent(new e),this.#n("[Queue empty]"),void(this.#t=0);this.dispatchEvent(new r),this.#n("[New frame]");const t=this.#r.shift();if(t){for(const e of t.readers)this.#n(e.label),e.trigger();try{await Promise.race([Promise.all(t.readers.map((e=>e.promise))),new Promise(((e,r)=>{window.setTimeout((()=>r(new Error("Readers took over 1500ms. Possible deadlock?"))),1500)}))])}catch(e){this.#i(t.readers,e)}for(const e of t.writers)this.#n(e.label),e.trigger();try{await Promise.race([Promise.all(t.writers.map((e=>e.promise))),new Promise(((e,r)=>{window.setTimeout((()=>r(new Error("Writers took over 1500ms. Possible deadlock?"))),1500)}))])}catch(e){this.#i(t.writers,e)}this.#t=0,this.#o()}})))}#i(e,r){for(const t of e)t.cancel(r)}cancelPending(){const e=new Error;for(const r of this.#r)this.#i(r.readers,e),this.#i(r.writers,e)}#n(e){if(!this.observe||!e)return;if(!(e.endsWith(n)||e.endsWith(s)||e.endsWith(o))||!this.observeOnlyNamed)for(this.#e.push({time:performance.now(),value:e});this.#e.length>this.recordStorageLimit;)this.#e.shift()}}var a=Object.freeze({__proto__:null,RenderCoordinatorQueueEmptyEvent:e,RenderCoordinatorNewFrameEvent:r,RenderCoordinator:i});export{a as RenderCoordinator};
