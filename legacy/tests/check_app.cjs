/**
 * Dependency-free smoke tests for the standalone DexBinder HTML prototype.
 * Usage: node legacy/tests/check_app.cjs
 * These tests simulate DOM controls without a full rendering engine.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert.match(html,/<html lang="en">/);
assert.match(html,/All Rarities/);
assert.doesNotMatch(html,/>Todas las rarezas</);
const jsMatch=html.match(/<script>([\s\S]*)<\/script>/);
assert.ok(jsMatch,'Embedded JavaScript must exist');

const storage=new Map([
  // These are legacy Spanish version IDs; ownership MUST survive the new English UI.
  ['pokemon-pitch-black-master-194-visual-v1',JSON.stringify({'1|Normal':1,'4|Especial':1})],
]);
const map={};
const downloads=[];
function el(id){return {
  id,innerHTML:'',textContent:'',value:['rarity','status'].includes(id)?'all':'',checked:false,
  style:{},disabled:false,src:'',alt:'',className:'',dataset:{},children:[],
  classList:{add(){},remove(){},toggle(){}},handlers:{},
  addEventListener(evt,fn){this.handlers[evt]=fn;},
  appendChild(child){this.children.push(child);return child;},
  remove(){},setAttribute(){},click(){},showModal(){},close(){},
  getBoundingClientRect(){return {top:100};}
};}
const views=['album','list'].map(v=>{const x=el('view-'+v);x.dataset.view=v;return x;});
const sections=['all','base','secret'].map(v=>{const x=el('section-'+v);x.dataset.section=v;return x;});
const document={
  getElementById(id){return map[id]||(map[id]=el(id));},
  createElement(tag){return el(tag);},
  body:el('body'),
  querySelectorAll(selector){if(selector.includes('[data-view]'))return views;if(selector.includes('[data-section]'))return sections;return [];},
};
const context=vm.createContext({
  document,
  localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},
  Blob:class Blob{constructor(parts,settings){this.parts=parts;this.settings=settings;downloads.push(this)}},
  URL:{createObjectURL(){return 'blob://fake'},revokeObjectURL(){}},
  window:{scrollTo(){},scrollY:0,open(){}},
  console,
  setTimeout(){return 1},clearTimeout(){},confirm(){return true},alert(msg){throw Error(msg)},
});
vm.runInContext(jsMatch[1],context,{filename:'index.html'});
const evalJs=code=>vm.runInContext(code,context);
const cards=evalJs('SET');
assert.equal(cards.length,120);
assert.equal(cards.reduce((s,c)=>s+c.variants.length,0),194);
assert.equal(map.sOwned.textContent,2,'Legacy backup ownership loaded');
assert.equal(map.sMissing.textContent,192);
assert.equal((map.gallery.innerHTML.match(/<article/g)||[]).length,9,'9-card binder view');
assert.match(map.gallery.innerHTML,/Regular/,'English label on regular card');
assert.doesNotMatch(map.gallery.innerHTML,/>Especial<|>Normal<|Común|Poco común/);

// Actual checkbox event and persistence.
const checkbox={dataset:{num:'1',variant:'Reverse Holo'},checked:true};
map.gallery.handlers.change({target:{closest(){return checkbox}}});
assert.equal(map.sOwned.textContent,3);
assert.equal(JSON.parse(storage.get('pokemon-pitch-black-master-194-visual-v1'))['1|Reverse Holo'],1);

// List and secret filters.
evalJs("preferences.view='list';preferences.section='secret';render(true)");
assert.equal((map.gallery.innerHTML.match(/<article/g)||[]).length,24,'24-card list view');
assert.match(map.gallery.innerHTML,/085\/084/);
assert.doesNotMatch(map.gallery.innerHTML,/001\/084/);

// English CSV export contains useful content, preserves 120 card rows.
map.csvBtn.handlers.click();
let csv=downloads.at(-1).parts.join('');
assert.match(csv,/"Card Number","Card Name","Rarity","Regular","Holo","Reverse Holo","Special","Owned","Missing"/);
assert.ok(csv.includes('"Yes"'));
assert.ok(csv.includes('"No"'));
assert.equal(csv.split('\r\n').length,121);

// JSON backup compatible with existing V1/V2 and intentionally preserves legacy internal IDs.
map.backupBtn.handlers.click();
const backup=JSON.parse(downloads.at(-1).parts.join(''));
assert.equal(backup.set,'me5');
assert.equal(backup.version,2);
assert.equal(backup.owned['1|Normal'],1);
assert.equal(backup.owned['4|Especial'],1);

// The UI remains fully English, despite legacy storage IDs.
assert.match(html,/Saved in this browser/);
assert.match(html,/Clear Collection/);
assert.match(html,/Missing Cards/);
assert.match(html,/Secret Rares/);
// Import a legacy backup and discard invalid / unknown ownership keys.
(async()=>{
  const backupData={set:'me5',version:2,owned:{'2|Normal':1,'4|Especial':1,'999|Especial':1}};
  const evt={target:{files:[{text:async()=>JSON.stringify(backupData)}],value:'chosen-file.json'}};
  await map.restoreInput.handlers.change(evt);
  const restored=JSON.parse(storage.get('pokemon-pitch-black-master-194-visual-v1'));
  assert.deepEqual(Object.keys(restored).sort(),['2|Normal','4|Especial'].sort());
  assert.equal(map.sOwned.textContent,2);
  assert.equal(evt.target.value,'');
  console.log('PASS: 120 cards, 194 variants, legacy saved marks/import, English UI, 9-card binder, 24-card list, filters, progress, CSV, JSON backup');
})().catch(e=>{console.error(e);process.exitCode=1;});
