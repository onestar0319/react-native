import*as e from"../../core/common/common.js";import*as s from"../../third_party/wasmparser/wasmparser.js";var t=Object.freeze({__proto__:null,dissambleWASM:function(t,o){try{const r=e.Base64.decode(t.content);let n=new s.WasmParser.BinaryReader;n.setData(r,0,r.byteLength);const a=new s.WasmDis.DevToolsNameGenerator;a.read(n);const f=new Uint8Array(r);n=new s.WasmParser.BinaryReader;const i=new s.WasmDis.WasmDisassembler;i.addOffsets=!0,i.exportMetadata=a.getExportMetadata(),i.nameResolver=a.getNameResolver();const m=[],c=[],l=[];let p=131072,d=new Uint8Array(p),h=0,g=0;for(let e=0;e<f.length;){p>f.length-e&&(p=f.length-e);const s=h+p;if(d.byteLength<s){const e=new Uint8Array(s);e.set(d),d=e}for(;h<s;)d[h++]=f[e++];n.setData(d.buffer,0,s,e===f.length);const t=i.disassembleChunk(n,g),r=i.getResult();for(const e of r.lines)m.push(e);for(const e of r.offsets)c.push(e);for(const e of r.functionBodyOffsets)l.push(e);if(t)break;if(0===n.position){h=s;continue}const a=n.data.subarray(n.position,n.length);h=a.length,d.set(a),g+=n.position;o({event:"progress",params:{percentage:Math.floor(g/f.length*100)}})}o({event:"progress",params:{percentage:100}}),o({method:"disassemble",result:{lines:m,offsets:c,functionBodyOffsets:l}})}catch(e){o({method:"disassemble",error:e})}}});export{t as WasmParserWorker};
