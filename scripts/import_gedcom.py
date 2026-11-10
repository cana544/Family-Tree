"""Import supported genealogy fields. Never execute text from a GEDCOM."""
import json, re, sys
from pathlib import Path

def parse(text):
    roots, stack = [], []
    for line in text.splitlines():
        match = re.match(r'^(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s+(.*))?$', line)
        if not match: continue
        level, pointer, tag, value = match.groups()
        node = {'id': (pointer or '').strip('@'), 'tag':tag, 'value':value or '', 'children':[]}
        while stack and stack[-1][0] >= int(level): stack.pop()
        (stack[-1][1]['children'] if stack else roots).append(node)
        stack.append((int(level), node))
    def fields(node, tag): return [c for c in node['children'] if c['tag']==tag]
    def value(node, tag): return next((c['value'] for c in fields(node,tag)), '')
    def event(node, tag):
        e = next(iter(fields(node,tag)), None)
        return {'date':value(e,'DATE'), 'place':value(e,'PLAC')} if e else {'date':'','place':''}
    people, families = {}, {}
    for node in roots:
        if node['tag']=='INDI':
            notes=[]
            for n in fields(node,'NOTE'):
                notes.append(n['value'] + ''.join(('\n' if c['tag']=='CONT' else '')+c['value'] for c in n['children'] if c['tag'] in ('CONT','CONC')))
            people[node['id']]={'id':node['id'], 'name':re.sub(r'\s+',' ',value(node,'NAME').replace('/',' ')).strip() or 'Name not recorded', 'sex':value(node,'SEX'), 'birth':event(node,'BIRT'), 'death':event(node,'DEAT'), 'deceased':bool(fields(node,'DEAT')), 'notes':notes, 'photos':[value(n,'FILE') for n in fields(node,'OBJE') if value(n,'FILE').startswith('https://')]}
        elif node['tag']=='FAM':
            families[node['id']]={'id':node['id'], 'partners':[c['value'].strip('@') for c in node['children'] if c['tag'] in ('HUSB','WIFE')], 'children':[c['value'].strip('@') for c in fields(node,'CHIL')], 'marriage':event(node,'MARR')}
    return {'people':people,'families':families}

if __name__=='__main__':
    data=parse(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
    # Remote media references are used only by an optional local download step.
    for person in data['people'].values(): person['photos']=[]
    dest=Path(__file__).resolve().parents[1]/'data'/'family.js'
    dest.write_text('window.FAMILY_DATA = '+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8')
    print(f"Imported {len(data['people'])} people and {len(data['families'])} families")
