const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {branch,layout,connections}=require('../src/graph.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/family.js'),'utf8'),ctx);const data=ctx.window.FAMILY_DATA;
const centre=(p,id)=>p.get(id).x+77;
test('Dhiren and Shaveena centre over their children, excluding Daryl\'s partner',()=>{
 const r=layout(data,branch(data,'I500003',5,true),'I500003'),p=r.positions;
 const parentMid=(centre(p,'I500050')+centre(p,'I500018'))/2;
 const childMid=(centre(p,'I500052')+centre(p,'I500051'))/2;
 assert.ok(Math.abs(parentMid-childMid)<.001);
 const route=connections(data,r).find(r=>r.family==='F500018');
 const bus=route.segments.find(s=>s.kind==='bus');
 assert.ok(Math.abs(parentMid-(bus.x1+bus.x2)/2)<.001);
});
test('Suren and Shobhna connect straight down to Sean, excluding his partner',()=>{
 const r=layout(data,branch(data,'I500003',5,true),'I500003'),p=r.positions;
 assert.ok(Math.abs((centre(p,'I500056')+centre(p,'I500014'))/2-centre(p,'I500057'))<.001);
 const route=connections(data,r).find(r=>r.family==='F500020');
 assert.equal(route.segments.filter(s=>s.kind==='single').length,0);
});
test('each two-child family is centred exactly below its partnership',()=>{
 const p=layout(data,branch(data,'I500008',5,true),'I500008').positions;
 for(const [a,b,c,d] of [['I500105','I500024','I500104','I500106'],['I500003','I500008','I500010','I500011']]){
  assert.ok(Math.abs((centre(p,a)+centre(p,b))/2-(centre(p,c)+centre(p,d))/2)<.001);
  assert.equal(p.get(c).y,p.get(d).y);
 }
});
test('Romila sibling couples form equally spaced family groups',()=>{
 const p=layout(data,branch(data,'I500008',5,true),'I500008').positions;
 const xs=[['I500105','I500024'],['I500003','I500008'],['I500023','I500121']].map(([a,b])=>(centre(p,a)+centre(p,b))/2);
 assert.ok(Math.abs((xs[1]-xs[0])-(xs[2]-xs[1]))<.001);
});
test('paternal and maternal collateral families flank the central pedigree',()=>{
 const p=layout(data,branch(data,'I500008',5,true),'I500008').positions;
 assert.ok(p.get('I500271').x<p.get('I500021').x);
 assert.ok(p.get('I500294').x<p.get('I500021').x);
 assert.ok(p.get('I500250').x>p.get('I500022').x);
});
test('sibling connections have a single shared bus and never cut through cards',()=>{
 const r=layout(data,branch(data,'I500003',5,true),'I500003'),routes=connections(data,r);
 assert.ok(routes.length>0);
 for(const route of routes){
  assert.equal(route.segments.filter(s=>s.kind==='bus').length,route.children.length>1?1:0);
  for(const s of route.segments)for(const [id,p]of r.positions){
   const left=p.x+.01,right=p.x+r.cardWidth-.01,top=p.y+.01,bottom=p.y+r.cardHeight-.01;
   const hits=s.x1===s.x2?s.x1>left&&s.x1<right&&Math.max(s.y1,s.y2)>top&&Math.min(s.y1,s.y2)<bottom:s.y1===s.y2&&s.y1>top&&s.y1<bottom&&Math.max(s.x1,s.x2)>left&&Math.min(s.x1,s.x2)<right;
   assert.ok(!hits,`${route.family}: ${s.kind} crosses ${data.people[id].name}`);
  }
 }
});
