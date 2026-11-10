const {test}=require('node:test');
const assert=require('node:assert/strict');
const {branch,search,layout}=require('../src/graph.js');
const data={people:Object.fromEntries(['a','b','c','d','e','z'].map(id=>[id,{id,name:id==='z'?'Romila Singh':id}])),families:{f:{id:'f',partners:['a','b'],children:['c']},g:{id:'g',partners:['a','d'],children:['e']}}};
test('includes both partnerships and each child without duplicates',()=>{
 const result=branch(data,'a',2);
 assert.deepEqual([...result.keys()].sort(),['a','b','c','d','e']);
 assert.equal(result.get('c'),1);
 assert.equal(result.get('d'),0);
});
test('finds disconnected people case insensitively',()=>assert.equal(search(data,'romila')[0].id,'z'));
test('cycles terminate and focus stays at generation zero',()=>{
 const cyclic=structuredClone(data); cyclic.families.h={id:'h',partners:['c'],children:['a']};
 assert.equal(branch(cyclic,'a',4).get('a'),0);
});
test('cousins option includes collateral descendants but not partner ancestry',()=>{
 const d={people:Object.fromEntries(['g','p','u','me','cousin','spouse','inlaw'].map(id=>[id,{id,name:id}])),families:{
  a:{partners:['g'],children:['p','u']},b:{partners:['p'],children:['me']},c:{partners:['u'],children:['cousin']},d:{partners:['me','spouse'],children:[]},e:{partners:['inlaw'],children:['spouse']}
 }};
 assert.ok(branch(d,'me',3,true).has('cousin'));
 assert.ok(!branch(d,'me',3,false).has('cousin'));
 assert.ok(!branch(d,'me',3,true).has('inlaw'));
});
test('layout keeps people separate and both children below their respective parents',()=>{
 const result=layout(data,branch(data,'a',2));
 assert.equal(result.positions.size,5);
 for(const [id,p] of result.positions){
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  for(const [other,q] of result.positions)if(id!==other&&p.y===q.y)assert.ok(Math.abs(p.x-q.x)>=160);
 }
 assert.ok(result.positions.get('c').y>result.positions.get('a').y);
 assert.ok(result.positions.get('e').y>result.positions.get('d').y);
});
