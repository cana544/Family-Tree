const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {branch,layout}=require('../src/graph.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../data/family.js'),'utf8'),context);
const data=context.window.FAMILY_DATA;
// Literal counts observed by clicking the live MyHeritage tree, 10 November 2026.
for(const [focus,depth,cousins,count] of [
 ['I500003',1,true,11],['I500003',2,true,41],['I500003',3,true,96],['I500003',5,true,116],['I500003',5,false,50],
 ['I500008',1,true,8],['I500008',2,true,34],['I500008',2,false,34],['I500008',5,true,44],['I500008',5,false,38],['I500021',3,true,28]
]) test(`${data.people[focus].name}, ${depth} generations, cousins ${cousins}: ${count} recorded people`,()=>assert.equal(branch(data,focus,depth,cousins).size,count));
test('one-generation Romila branch matches the eight observed individuals',()=>assert.deepEqual([...branch(data,'I500008',1,true).keys()].sort(),['I500003','I500008','I500010','I500011','I500021','I500022','I500023','I500024']));
test('one-generation collateral relatives have branch controls because their partners are hidden',()=>{
 const result=branch(data,'I500003',1,true);
 assert.ok(result.has('I500014')); // Shobhna, sister
 assert.ok(!result.has('I500056')); // Suren, her partner
 assert.ok(branch(data,'I500003',2,true).has('I500056'));
});
test('Anand siblings retain the recorded order and both grandparent couples stay near the parents',()=>{
 const r=layout(data,branch(data,'I500003',5,true),'I500003'),p=r.positions;
 const siblings=['I500014','I500013','I500018','I500019','I500003','I500020'];
 for(let i=1;i<siblings.length;i++)assert.ok(p.get(siblings[i]).x>p.get(siblings[i-1]).x);
 assert.ok(Math.abs(p.get('I500005').x-p.get('I500002').x)<850);
 assert.ok(Math.abs(p.get('I500007').x-p.get('I500001').x)<850);
});
test('every real person has a finite, non-overlapping layout with the focus included',()=>{
 for(const id of Object.keys(data.people)){
  const levels=branch(data,id,5,true),result=layout(data,levels,id);
  assert.equal(result.positions.size,levels.size);assert.ok(result.positions.has(id));
  const rows=new Map();
  for(const p of result.positions.values()){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));if(!rows.has(p.y))rows.set(p.y,[]);rows.get(p.y).push(p.x);}
  for(const xs of rows.values()){xs.sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=result.cardWidth-0.01);}
 }
});
