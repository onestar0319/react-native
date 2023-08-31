import*as t from"../platform/platform.js";Node.prototype.traverseNextTextNode=function(t){let e=this.traverseNextNode(t);if(!e)return null;const o={STYLE:1,SCRIPT:1,"#document-fragment":1};for(;e&&(e.nodeType!==Node.TEXT_NODE||o[e.parentNode?e.parentNode.nodeName:""]);)e=e.traverseNextNode(t);return e},Element.prototype.positionAt=function(t,e,o){let n={x:0,y:0};o&&(n=o.boxInWindow(this.ownerDocument.defaultView)),"number"==typeof t?this.style.setProperty("left",n.x+t+"px"):this.style.removeProperty("left"),"number"==typeof e?this.style.setProperty("top",n.y+e+"px"):this.style.removeProperty("top"),"number"==typeof t||"number"==typeof e?this.style.setProperty("position","absolute"):this.style.removeProperty("position")},Node.prototype.enclosingNodeOrSelfWithClass=function(t,e){return this.enclosingNodeOrSelfWithClassList([t],e)},Node.prototype.enclosingNodeOrSelfWithClassList=function(t,e){for(let o=this;o&&o!==e&&o!==this.ownerDocument;o=o.parentNodeOrShadowHost())if(o.nodeType===Node.ELEMENT_NODE){let e=!0;for(let n=0;n<t.length&&e;++n)o.classList.contains(t[n])||(e=!1);if(e)return o}return null},Node.prototype.parentElementOrShadowHost=function(){if(this.nodeType===Node.DOCUMENT_FRAGMENT_NODE&&this.host)return this.host;const t=this.parentNode;return t?t.nodeType===Node.ELEMENT_NODE?t:t.nodeType===Node.DOCUMENT_FRAGMENT_NODE?t.host:null:null},Node.prototype.parentNodeOrShadowHost=function(){return this.parentNode?this.parentNode:this.nodeType===Node.DOCUMENT_FRAGMENT_NODE&&this.host?this.host:null},Node.prototype.getComponentSelection=function(){let t=this.parentNode;for(;t&&t.nodeType!==Node.DOCUMENT_FRAGMENT_NODE;)t=t.parentNode;return t instanceof ShadowRoot?t.getSelection():this.window().getSelection()},Node.prototype.hasSelection=function(){if(this instanceof Element){const t=this.querySelectorAll("slot");for(const e of t)if(Array.prototype.some.call(e.assignedNodes(),(t=>t.hasSelection())))return!0}const t=this.getComponentSelection();return"Range"===t.type&&(t.containsNode(this,!0)||t.anchorNode.isSelfOrDescendant(this)||t.focusNode.isSelfOrDescendant(this))},Node.prototype.window=function(){return this.ownerDocument.defaultView},Element.prototype.removeChildren=function(){this.firstChild&&(this.textContent="")},self.createElement=function(t,e){return document.createElement(t,{is:e})},self.createTextNode=function(t){return document.createTextNode(t)},self.createDocumentFragment=function(){return document.createDocumentFragment()},Element.prototype.createChild=function(t,e,o){const n=document.createElement(t,{is:o});return e&&(n.className=e),this.appendChild(n),n},DocumentFragment.prototype.createChild=Element.prototype.createChild,self.AnchorBox=class{constructor(t,e,o,n){this.x=t||0,this.y=e||0,this.width=o||0,this.height=n||0}contains(t,e){return t>=this.x&&t<=this.x+this.width&&e>=this.y&&e<=this.y+this.height}relativeTo(t){return new AnchorBox(this.x-t.x,this.y-t.y,this.width,this.height)}relativeToElement(t){return this.relativeTo(t.boxInWindow(t.ownerDocument.defaultView))}equals(t){return Boolean(t)&&this.x===t.x&&this.y===t.y&&this.width===t.width&&this.height===t.height}},Element.prototype.boxInWindow=function(t){t=t||this.ownerDocument.defaultView;const e=new AnchorBox;let o=this,n=this.ownerDocument.defaultView;for(;n&&o&&(e.x+=o.getBoundingClientRect().left,e.y+=o.getBoundingClientRect().top,n!==t);)o=n.frameElement,n=n.parent;return e.width=Math.min(this.offsetWidth,t.innerWidth-e.x),e.height=Math.min(this.offsetHeight,t.innerHeight-e.y),e},Event.prototype.consume=function(t){this.stopImmediatePropagation(),t&&this.preventDefault(),this.handled=!0},Node.prototype.deepTextContent=function(){return this.childTextNodes().map((function(t){return t.textContent})).join("")},Node.prototype.childTextNodes=function(){let t=this.traverseNextTextNode(this);const e=[],o={STYLE:1,SCRIPT:1,"#document-fragment":1};for(;t;)o[t.parentNode?t.parentNode.nodeName:""]||e.push(t),t=t.traverseNextTextNode(this);return e},Node.prototype.isAncestor=function(t){if(!t)return!1;let e=t.parentNodeOrShadowHost();for(;e;){if(this===e)return!0;e=e.parentNodeOrShadowHost()}return!1},Node.prototype.isDescendant=function(t){return Boolean(t)&&t.isAncestor(this)},Node.prototype.isSelfOrAncestor=function(t){return Boolean(t)&&(t===this||this.isAncestor(t))},Node.prototype.isSelfOrDescendant=function(t){return Boolean(t)&&(t===this||this.isDescendant(t))},Node.prototype.traverseNextNode=function(t,e=!1){if(!e&&this.shadowRoot)return this.shadowRoot;const o=this instanceof HTMLSlotElement?this.assignedNodes():[];if(o.length)return o[0];if(this.firstChild)return this.firstChild;let n=this;for(;n;){if(t&&n===t)return null;const e=r(n);if(e)return e;n=n.assignedSlot||n.parentNodeOrShadowHost()}function r(t){if(!t.assignedSlot)return t.nextSibling;const e=t.assignedSlot.assignedNodes(),o=Array.prototype.indexOf.call(e,t);return o+1<e.length?e[o+1]:null}return null},Node.prototype.traversePreviousNode=function(t){if(t&&this===t)return null;let e=this.previousSibling;for(;e&&e.lastChild;)e=e.lastChild;return e||this.parentNodeOrShadowHost()},Node.prototype.setTextContentTruncatedIfNeeded=function(e,o){return"string"==typeof e&&e.length>1e4?(this.textContent="string"==typeof o?o:t.StringUtilities.trimMiddle(e,1e4),!0):(this.textContent=e,!1)},Element.prototype.hasFocus=function(){const t=this.getComponentRoot();return Boolean(t)&&this.isSelfOrAncestor(t.activeElement)},Node.prototype.getComponentRoot=function(){let t=this;for(;t&&t.nodeType!==Node.DOCUMENT_FRAGMENT_NODE&&t.nodeType!==Node.DOCUMENT_NODE;)t=t.parentNode;return t},self.onInvokeElement=function(e,o){e.addEventListener("keydown",(e=>{t.KeyboardUtilities.isEnterOrSpaceKey(e)&&o(e)})),e.addEventListener("click",(t=>o(t)))},function(){const t=DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle=function(e,o){return 1===arguments.length&&(o=!this.contains(e)),t.call(this,e,Boolean(o))}}();const e=Element.prototype.appendChild,o=Element.prototype.insertBefore,n=Element.prototype.removeChild,r=Element.prototype.removeChildren;Element.prototype.appendChild=function(t){if(t.__widget&&t.parentElement!==this)throw new Error("Attempt to add widget via regular DOM operation.");return e.call(this,t)},Element.prototype.insertBefore=function(t,e){if(t.__widget&&t.parentElement!==this)throw new Error("Attempt to add widget via regular DOM operation.");return o.call(this,t,e)},Element.prototype.removeChild=function(t){if(t.__widgetCounter||t.__widget)throw new Error("Attempt to remove element containing widget via regular DOM operation");return n.call(this,t)},Element.prototype.removeChildren=function(){if(this.__widgetCounter)throw new Error("Attempt to remove element containing widget via regular DOM operation");r.call(this)};var i=Object.freeze({__proto__:null,originalAppendChild:e,originalInsertBefore:o,originalRemoveChild:n,originalRemoveChildren:r});export{i as DOMExtension};
