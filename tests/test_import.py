import json, sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from import_gedcom import parse

class ImportTests(unittest.TestCase):
    def test_names_events_relationships_and_private_fields(self):
        data = parse('''0 @I1@ INDI
1 NAME A /Singh/
1 BIRT
2 DATE ABT 1900
2 PLAC Fiji
1 RESI
2 EMAIL secret@example.com
1 NOTE First line
2 CONT Second line
0 @I2@ INDI
1 NAME Child //
0 @F1@ FAM
1 HUSB @I1@
1 CHIL @I2@
0 TRLR''')
        self.assertEqual(data['people']['I1']['name'], 'A Singh')
        self.assertEqual(data['people']['I1']['birth'], {'date':'ABT 1900','place':'Fiji'})
        self.assertEqual(data['people']['I1']['notes'], ['First line\nSecond line'])
        self.assertEqual(data['families']['F1']['children'], ['I2'])
        self.assertNotIn('secret@example.com', str(data))

    def test_exported_dataset_integrity(self):
        exported = (Path(__file__).resolve().parents[1] / 'data' / 'family.js').read_text(encoding='utf-8-sig')
        data = json.loads(exported.removeprefix('window.FAMILY_DATA = ').rstrip(';\n'))
        self.assertEqual(len(data['people']),287)
        self.assertEqual(len(data['families']),83)
        self.assertEqual(data['people']['I500001']['name'],'Parma Nand')
        for family in data['families'].values():
            for pid in family['partners'] + family['children']:
                self.assertIn(pid, data['people'])

if __name__ == '__main__': unittest.main()
