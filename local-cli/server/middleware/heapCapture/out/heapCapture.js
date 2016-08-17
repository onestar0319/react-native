/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';
/*eslint no-console-disallow: "off"*/
/*global React ReactDOM Table stringInterner stackRegistry aggrow preLoadedCapture:true*/

function getTypeName(ref){
if(ref.type==='Function'&&!!ref.value){
return'Function '+ref.value.name;
}
return ref.type;
}

function idGetProp(refs,id,prop){
var ref=refs[id];
if(ref&&ref.edges){
var edges=ref.edges;
for(var edgeId in edges){
if(edges[edgeId]===prop){
return edgeId;
}
}
}
return undefined;
}

function idPropForEach(refs,id,callback){
var ref=refs[id];
if(ref&&ref.edges){
var edges=ref.edges;
for(var edgeId in edges){
callback(edges[edgeId],edgeId);
}
}
}

function getInternalInstanceName(refs,id){
var elementId=idGetProp(refs,id,'_currentElement');
var typeId=idGetProp(refs,elementId,'type');
var typeRef=refs[typeId];
if(typeRef){
if(typeRef.type==='string'){// element.type is string
if(typeRef.value){
return typeRef.value;
}
}else if(typeRef.type==='Function'){// element.type is function
var displayNameId=idGetProp(refs,typeId,'displayName');
if(displayNameId){
var displayNameRef=refs[displayNameId];
if(displayNameRef&&displayNameRef.value){
return displayNameRef.value;// element.type.displayName
}
}
var nameId=idGetProp(refs,typeId,'name');
if(nameId){
var nameRef=refs[nameId];
if(nameRef&&nameRef.value){
return nameRef.value;// element.type.name
}
}
if(typeRef.value&&typeRef.value.name){
return typeRef.value.name;// element.type symbolicated function name
}
}
}
return'#unknown';
}

function registerReactComponentTreeImpl(refs,registry,parents,inEdgeNames,trees,id){
if(parents[id]===undefined){
// not a component
}else if(parents[id]===null){
trees[id]=registry.insert(registry.root,getInternalInstanceName(refs,id));
}else{
var parent=parents[id];
var inEdgeName=inEdgeNames[id];
var parentTree=trees[parent];
if(parentTree===undefined){
parentTree=registerReactComponentTreeImpl(
refs,
registry,
parents,
inEdgeNames,
trees,
parent);
}
trees[id]=registry.insert(parentTree,inEdgeName);
}
return trees[id];
}

// TODO: make it easier to query the heap graph, it's super annoying to deal with edges directly
function registerReactComponentTree(refs,registry){
// build list of parents for react interal instances, so we can connect a tree
var parents={};
var inEdgeNames={};var _loop=function _loop(
id){
idPropForEach(refs,id,function(name,propId){
if(propId!=='0x0'){
if(name==='_renderedChildren'){
if(parents[id]===undefined){
// mark that we are a react component, even if we don't have a parent
parents[id]=null;
}
idPropForEach(refs,propId,function(childName,childPropId){
if(childName.startsWith('.')){
parents[childPropId]=id;
inEdgeNames[childPropId]=childName+': '+
getInternalInstanceName(refs,childPropId);
}
});
}else if(name==='_renderedComponent'){
if(parents[id]===undefined){
parents[id]=null;
}
parents[propId]=id;
inEdgeNames[propId]=getInternalInstanceName(refs,propId);
}
}
});};for(var id in refs){_loop(id);
}
// build tree of react internal instances (since that's what has the structure)
var trees={};
for(var _id in refs){
registerReactComponentTreeImpl(refs,registry,parents,inEdgeNames,trees,_id);
}
// hook in components by looking at their _reactInternalInstance fields
for(var _id2 in refs){
var internalInstance=idGetProp(refs,_id2,'_reactInternalInstance');
if(internalInstance&&trees[internalInstance]){
trees[_id2]=trees[internalInstance];
}
}
return trees;
}

function registerPathToRoot(roots,refs,registry,reactComponentTree){
var visited={};
var breadth=[];
for(var i=0;i<roots.length;i++){
var id=roots[i];
if(visited[id]===undefined){
var ref=refs[id];
visited[id]=registry.insert(registry.root,getTypeName(ref));
breadth.push(id);
}
}

while(breadth.length>0){
var nextBreadth=[];var _loop2=function _loop2(
_i){
var id=breadth[_i];
var ref=refs[id];
var node=visited[id];
// TODO: make edges map id -> name, (empty for none) seems that would be better

var edges=Object.getOwnPropertyNames(ref.edges);
edges.sort(function putUnknownLast(a,b){
var aName=ref.edges[a];
var bName=ref.edges[b];
if(aName===null&&bName!==null){
return 1;
}else if(aName!==null&&bName===null){
return-1;
}else if(aName===null&&bName===null){
return 0;
}else{
return a.localeCompare(b);
}
});

for(var j=0;j<edges.length;j++){
var edgeId=edges[j];
var edgeName='';
if(ref.edges[edgeId]){
edgeName=ref.edges[edgeId]+': ';
}
if(visited[edgeId]===undefined){
var edgeRef=refs[edgeId];
if(edgeRef===undefined){
// TODO: figure out why we have edges that point to things not JSCell
//console.log('registerPathToRoot unable to follow edge from ' + id + ' to ' + edgeId);
}else{
visited[edgeId]=registry.insert(node,edgeName+getTypeName(edgeRef));
nextBreadth.push(edgeId);
if(reactComponentTree[edgeId]===undefined){
reactComponentTree[edgeId]=reactComponentTree[id];
}
}
}
}};for(var _i=0;_i<breadth.length;_i++){_loop2(_i);
}
breadth=nextBreadth;
}
return visited;
}

function captureRegistry(){
var strings=stringInterner();
var stacks=stackRegistry(strings);
var data=new Int32Array(0);

var idField=0;
var typeField=1;
var sizeField=2;
var traceField=3;
var pathField=4;
var reactField=5;
var numFields=6;

return{
strings:strings,
stacks:stacks,
data:data,
register:function registerCapture(captureId,capture){
// NB: capture.refs is potentially VERY large, so we try to avoid making
// copies, even of iteration is a bit more annoying.
var rowCount=0;
for(var id in capture.refs){// eslint-disable-line no-unused-vars
rowCount++;
}
for(var _id3 in capture.markedBlocks){// eslint-disable-line no-unused-vars
rowCount++;
}
console.log(
'increasing row data from '+(this.data.length*4).toString()+'B to '+
(this.data.length*4+rowCount*numFields*4).toString()+'B');

var newData=new Int32Array(this.data.length+rowCount*numFields);
newData.set(data);
var dataOffset=this.data.length;
this.data=null;

var reactComponentTreeMap=registerReactComponentTree(capture.refs,this.stacks);
var rootPathMap=registerPathToRoot(
capture.roots,
capture.refs,
this.stacks,
reactComponentTreeMap);

var internedCaptureId=this.strings.intern(captureId);
for(var _id4 in capture.refs){
var ref=capture.refs[_id4];
newData[dataOffset+idField]=parseInt(_id4,16);
newData[dataOffset+typeField]=this.strings.intern(getTypeName(ref));
newData[dataOffset+sizeField]=ref.size;
newData[dataOffset+traceField]=internedCaptureId;
var pathNode=rootPathMap[_id4];
if(pathNode===undefined){
throw'did not find path for ref!';
}
newData[dataOffset+pathField]=pathNode.id;
var reactTree=reactComponentTreeMap[_id4];
if(reactTree===undefined){
newData[dataOffset+reactField]=
this.stacks.insert(this.stacks.root,'<not-under-tree>').id;
}else{
newData[dataOffset+reactField]=reactTree.id;
}
dataOffset+=numFields;
}
for(var _id5 in capture.markedBlocks){
var block=capture.markedBlocks[_id5];
newData[dataOffset+idField]=parseInt(_id5,16);
newData[dataOffset+typeField]=this.strings.intern('Marked Block Overhead');
newData[dataOffset+sizeField]=block.capacity-block.size;
newData[dataOffset+traceField]=internedCaptureId;
newData[dataOffset+pathField]=this.stacks.root;
newData[dataOffset+reactField]=this.stacks.root;
dataOffset+=numFields;
}
this.data=newData;
},
getAggrow:function getAggrow(){
var agStrings=this.strings;
var agStacks=this.stacks.flatten();
var agData=this.data;
var agNumRows=agData.length/numFields;
var ag=new aggrow(agStrings,agStacks,agNumRows);

var idExpander=ag.addFieldExpander('Id',
function getId(row){
var id=agData[row*numFields+idField];
if(id<0){
id+=0x100000000;// data is int32, id is uint32
}
return'0x'+id.toString(16);
},
function compareAddress(rowA,rowB){
return agData[rowA*numFields+idField]-agData[rowB*numFields+idField];
});

var typeExpander=ag.addFieldExpander('Type',
function getSize(row){return agStrings.get(agData[row*numFields+typeField]);},
function compareSize(rowA,rowB){
return agData[rowA*numFields+typeField]-agData[rowB*numFields+typeField];
});

ag.addFieldExpander('Size',
function getSize(row){return agData[row*numFields+sizeField].toString();},
function compareSize(rowA,rowB){
return agData[rowA*numFields+sizeField]-agData[rowB*numFields+sizeField];
});

var traceExpander=ag.addFieldExpander('Trace',
function getSize(row){return agStrings.get(agData[row*numFields+traceField]);},
function compareSize(rowA,rowB){
return agData[rowA*numFields+traceField]-agData[rowB*numFields+traceField];
});

var pathExpander=ag.addCalleeStackExpander('Path',
function getStack(row){return agStacks.get(agData[row*numFields+pathField]);});

var reactExpander=ag.addCalleeStackExpander('React Tree',
function getStack(row){return agStacks.get(agData[row*numFields+reactField]);});

var sizeAggregator=ag.addAggregator('Size',
function aggregateSize(indices){
var size=0;
for(var i=0;i<indices.length;i++){
var row=indices[i];
size+=agData[row*numFields+sizeField];
}
return size;
},
function formatSize(value){return value.toString();},
function sortSize(a,b){return b-a;});

var countAggregator=ag.addAggregator('Count',
function aggregateCount(indices){
return indices.length;
},
function formatCount(value){return value.toString();},
function sortCount(a,b){return b-a;});

ag.setActiveExpanders([pathExpander,reactExpander,typeExpander,idExpander,traceExpander]);
ag.setActiveAggregators([sizeAggregator,countAggregator]);
return ag;
}};

}

if(preLoadedCapture){
var r=new captureRegistry();
r.register('trace',preLoadedCapture);
preLoadedCapture=undefined;// let GG clean up the capture
ReactDOM.render(React.createElement(Table,{aggrow:r.getAggrow()}),document.body);
}// @generated
