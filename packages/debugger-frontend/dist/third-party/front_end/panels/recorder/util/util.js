import*as t from"../../../core/platform/platform.js";import*as e from"../../../core/common/common.js";var r=Object.freeze({__proto__:null,SharedObject:class{#t=new e.Mutex.Mutex;#e=0;#r;#a;#s;constructor(t,e){this.#a=t,this.#s=e}async acquire(){return await this.#t.run((async()=>{0===this.#e&&(this.#r=await this.#a()),++this.#e})),[this.#r,this.#i.bind(this,{released:!1})]}async run(t){const[e,r]=await this.acquire();try{return await t(e)}finally{await r()}}async#i(t){if(t.released)throw new Error("Attempted to release object multiple times.");try{t.released=!0,await this.#t.run((async()=>{1===this.#e&&(await this.#s(this.#r),this.#r=void 0),--this.#e}))}catch(e){throw t.released=!1,e}}}});let a;try{a=!1}catch{a=!0}const s="devtools_recorder";class i{static#c;static async get(){return this.#c||(this.#c=(await fetch(new URL("../injected/injected.generated.js",import.meta.url))).text()),this.#c}}export{s as DEVTOOLS_RECORDER_WORLD_NAME,i as InjectedScript,r as SharedObject,a as isDebugBuild};
