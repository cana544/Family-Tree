(function(root){
  function branch(data, focus, depth=5, cousins=true){
    const levels=new Map(),costs=new Map(),ancestors=new Map();
    if(!data.people[focus]) return levels;
    depth=Math.max(1,Math.min(20,Number(depth)||5));
    const families=Object.values(data.families);
    ancestors.set(focus,0);
    const queue=[focus];
    for(const id of queue){
      const distance=ancestors.get(id);
      if(distance>=depth)continue;
      for(const family of families)if(family.children.includes(id))for(const parent of family.partners){
        if(data.people[parent]&&!ancestors.has(parent)){ancestors.set(parent,distance+1);queue.push(parent);}
      }
    }
    for(const [id,distance] of ancestors){levels.set(id,distance===0?0:-distance);costs.set(id,distance);}
    function descend(id,level,cost,path){
      if(cost>depth||!data.people[id])return;
      if(!levels.has(id))levels.set(id,level);
      costs.set(id,Math.min(costs.get(id)??Infinity,cost));
      if(cost>=depth)return;
      for(const family of families)if(family.partners.includes(id))for(const child of family.children){
        if(!path.has(child))descend(child,level+1,cost+1,new Set([...path,child]));
      }
    }
    descend(focus,0,0,new Set([focus]));
    // Parents provide siblings; grandparents provide aunts/uncles and optional cousins.
    // Older generations contribute direct ancestors only, as observed in the reference.
    for(const [id,distance] of ancestors)if(distance>0&&distance<=2){
      for(const family of families)if(family.partners.includes(id))for(const child of family.children){
        if(distance===2&&!cousins){
          if(data.people[child]&&!levels.has(child)){levels.set(child,1-distance);costs.set(child,depth);}
        }else descend(child,1-distance,distance,new Set([id,child]));
      }
    }
    // Terminal collateral relatives remain single cards until the range is expanded.
    for(const [id,cost] of [...costs])if(id===focus||cost<depth){
      for(const family of families)if(family.partners.includes(id))for(const partner of family.partners){
        if(data.people[partner]&&!levels.has(partner))levels.set(partner,levels.get(id));
      }
    }
    return levels;
  }
  function layout(data,levels,focus){
    const W=154,H=72,PARTNER_GAP=24,SIBLING_GAP=40,ROW=132,PITCH=W+SIBLING_GAP;
    const empty={positions:new Map(),width:1,height:1,cardWidth:W,cardHeight:H};
    if(!levels.size)return empty;
    focus=focus||levels.keys().next().value;
    const families=Object.values(data.families),groups=[],membership=new Map(),positions=new Map();
    for(const [id,level] of levels){
      if(membership.has(id))continue;
      const g={ids:[],level};
      function collect(pid){if(membership.has(pid)||levels.get(pid)!==level)return;membership.set(pid,g);g.ids.push(pid);for(const f of families)if(f.partners.includes(pid))f.partners.forEach(collect);}
      collect(id);
      if(g.ids.length===2){const f=families.find(f=>f.partners.length===2&&f.partners.every(pid=>g.ids.includes(pid)));if(f)g.ids=[...f.partners];}
      g.ownWidth=g.ids.length*(W+PARTNER_GAP)-PARTNER_GAP;
      g.slotWidth=g.ids.length*PITCH-SIBLING_GAP;groups.push(g);
    }
    const ancestorIds=new Set([focus]);
    for(const id of ancestorIds)for(const f of families)if(f.children.includes(id))for(const pid of f.partners)if(levels.has(pid))ancestorIds.add(pid);
    const fg=membership.get(focus);
    const parentFamily=families.find(f=>f.children.includes(focus)&&f.partners.some(id=>membership.get(id)?.level===fg.level-1));
    const central=parentFamily?membership.get(parentFamily.partners.find(id=>membership.has(id))):fg;
    const claimed=new Set();
    function descendantTree(g){
      claimed.add(g);const children=[];
      for(const f of families)if(f.partners.some(id=>membership.get(id)===g))for(const id of f.children){
        const child=membership.get(id);if(child&&child.level===g.level+1&&!claimed.has(child)){const node=descendantTree(child);node.via=id;children.push(node);}
      }
      const childWidth=children.reduce((sum,c)=>sum+c.width,0)+Math.max(0,children.length-1)*SIBLING_GAP;
      let left=0;const ports=[];
      for(const child of children){
        child.left=left;
        // Attach ancestry to the recorded child's card, not the centre of their partnership.
        ports.push(left+child.cx-child.g.ownWidth/2+child.g.ids.indexOf(child.via)*(W+PARTNER_GAP)+W/2);
        left+=child.width+SIBLING_GAP;
      }
      let cx=ports.length?(Math.min(...ports)+Math.max(...ports))/2:g.slotWidth/2;
      const min=Math.min(0,cx-g.ownWidth/2),max=Math.max(children.length?childWidth:g.slotWidth,cx+g.ownWidth/2);
      const width=Math.max(g.slotWidth,max-min),shift=-min+(width-(max-min))/2;
      cx+=shift;for(const child of children)child.left+=shift;
      return {g,children,width,cx};
    }
    function putGroup(g,cx,target){const left=cx-g.ownWidth/2;g.ids.forEach((id,i)=>target.set(id,{x:left+i*(W+PARTNER_GAP),y:g.level*ROW}));}
    function putTree(node,cx,target){
      putGroup(node.g,cx,target);
      const left=cx-node.cx;
      for(const child of node.children)putTree(child,left+child.left+child.cx,target);
    }
    putTree(descendantTree(central),0,positions);
    // A pedigree above the central sibling family. Each ancestral line reserves its own slot.
    function pedigree(g,path){
      const parents=[],seen=new Set();
      for(const id of g.ids)if(ancestorIds.has(id))for(const f of families)if(f.children.includes(id)){
        const pg=f.partners.map(id=>membership.get(id)).find(p=>p&&p.level===g.level-1);
        if(pg&&!path.has(pg)&&!seen.has(pg)){seen.add(pg);parents.push(pedigree(pg,new Set([...path,pg])));}
      }
      return {g,parents,width:g.ids.length*267};
    }
    function putPedigree(node,cx){
      if(!node.g.ids.some(id=>positions.has(id)))putGroup(node.g,cx,positions);
      claimed.add(node.g);let left=cx-node.parents.reduce((sum,n)=>sum+n.width,0)/2;
      for(const parent of node.parents){putPedigree(parent,left+parent.width/2);left+=parent.width;}
    }
    putPedigree(pedigree(central,new Set([central])),0);
    function contours(map){const result=new Map();for(const p of map.values()){const r=result.get(p.y)||{left:Infinity,right:-Infinity};r.left=Math.min(r.left,p.x);r.right=Math.max(r.right,p.x+W);result.set(p.y,r);}return result;}
    function pack(g,side){
      if(claimed.has(g))return;
      const local=new Map();putTree(descendantTree(g),0,local);
      const used=contours(positions),next=contours(local);let dx=side<0?Infinity:-Infinity;
      for(const [y,r]of next)if(used.has(y)){const other=used.get(y);dx=side<0?Math.min(dx,other.left-SIBLING_GAP-r.right):Math.max(dx,other.right+SIBLING_GAP-r.left);}
      if(!Number.isFinite(dx))dx=0;
      for(const [id,p]of local)positions.set(id,{x:p.x+dx,y:p.y});
    }
    // The paternal collaterals fan left; maternal collaterals fan right. This keeps the pedigree clear.
    central.ids.forEach((person,index)=>{
      if(!ancestorIds.has(person))return;
      const side=central.ids.length===1?1:index===0?-1:1;
      for(const f of families)if(f.children.includes(person)){
        let siblings=[...new Set(f.children.map(id=>membership.get(id)).filter(g=>g&&g!==central))];
        if(side<0)siblings.reverse();for(const sibling of siblings)pack(sibling,side);
      }
    });
    for(const g of groups)if(!claimed.has(g))pack(g,1);
    // Defensive handling of repeated ancestry: retain one record and guarantee separate card rectangles.
    const rows=new Map();
    for(const g of groups){const cards=g.ids.map(id=>positions.get(id)).filter(Boolean);if(!cards.length)continue;const y=cards[0].y;if(!rows.has(y))rows.set(y,[]);rows.get(y).push({g,left:Math.min(...cards.map(p=>p.x)),right:Math.max(...cards.map(p=>p.x+W))});}
    for(const row of rows.values()){
      row.sort((a,b)=>a.left-b.left);let edge=-Infinity;
      for(const block of row){const dx=Math.max(0,edge-block.left);if(dx)for(const id of block.g.ids)positions.get(id).x+=dx;edge=block.right+dx+SIBLING_GAP;}
    }
    const minX=Math.min(...[...positions.values()].map(p=>p.x)),minY=Math.min(...[...positions.values()].map(p=>p.y));
    for(const p of positions.values()){p.x=p.x-minX+40;p.y=p.y-minY+40;}
    return {positions,width:Math.max(...[...positions.values()].map(p=>p.x+W))+40,height:Math.max(...[...positions.values()].map(p=>p.y+H))+40,cardWidth:W,cardHeight:H};
  }
  function connections(data,result){
    const {positions,cardWidth:W=154,cardHeight:H=72}=result,routes=[];
    for(const f of Object.values(data.families)){
      const parents=f.partners.filter(id=>positions.has(id)),pp=parents.map(id=>positions.get(id));if(!pp.length)continue;
      const route={family:f.id,children:[],segments:[],paths:[]};
      const segment=(kind,x1,y1,x2,y2)=>{if(x1!==x2||y1!==y2)route.segments.push({kind,x1,y1,x2,y2});};
      const y=Math.max(...pp.map(p=>p.y))+H/2;
      if(pp.length===2&&pp[0].y===pp[1].y){const left=pp[0].x<pp[1].x?pp[0]:pp[1],right=left===pp[0]?pp[1]:pp[0];segment('partner',left.x+W,y,right.x,y);route.paths.push(`M${left.x+W},${y}H${right.x}`);}
      const x=pp.reduce((sum,p)=>sum+p.x+W/2,0)/pp.length,startY=pp.length===1?y+H/2:y;
      const children=f.children.filter(id=>positions.has(id)&&positions.get(id).y>y+H/2);route.children=children;
      if(children.length){
        const targetY=Math.min(...children.map(id=>positions.get(id).y)),busY=targetY-30;
        const xs=children.map(id=>positions.get(id).x+W/2),left=Math.min(...xs),right=Math.max(...xs);
        segment('stem',x,startY,x,busY);
        if(children.length===1){
          const cx=xs[0],r=Math.min(14,Math.abs(cx-x)/2),sign=cx>=x?1:-1;
          if(r){segment('single',x,busY,cx,busY);route.paths.push(`M${x},${startY}V${busY-r}Q${x},${busY} ${x+sign*r},${busY}H${cx-sign*r}Q${cx},${busY} ${cx},${busY+r}V${targetY}`);}
          else route.paths.push(`M${cx},${startY}V${targetY}`);
          segment('drop',cx,busY,cx,targetY);
        }else{
          const r=Math.min(14,(right-left)/2);route.paths.push(`M${x},${startY}V${busY}`);
          segment('bus',Math.min(left,x),busY,Math.max(right,x),busY);
          // One shared bus, rounded only at the two outer children; no duplicated horizontal strokes.
          route.paths.push(`M${left},${targetY}V${busY+r}Q${left},${busY} ${left+r},${busY}H${right-r}Q${right},${busY} ${right},${busY+r}V${targetY}`);
          if(x<left)route.paths.push(`M${x},${busY}H${left+r}`);else if(x>right)route.paths.push(`M${right-r},${busY}H${x}`);
          for(let i=0;i<children.length;i++){const cx=xs[i],cy=positions.get(children[i]).y;segment('drop',cx,busY,cx,cy);if(cx!==left&&cx!==right)route.paths.push(`M${cx},${busY}V${cy}`);}
        }
      }
      routes.push(route);
    }
    return routes;
  }
  function search(data,query){
    const q=query.trim().toLocaleLowerCase();
    return Object.values(data.people).filter(p=>p.name.toLocaleLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
  }
  const api={branch,search,layout,connections};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.FamilyGraph=api;
})(typeof window!=='undefined'?window:globalThis);

