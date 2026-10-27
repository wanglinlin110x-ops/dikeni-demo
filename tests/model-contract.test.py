import sys, pathlib, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'model-service'))
from understanding import compile_result, validate, extract_evidence, normalize_evidence
BASE=dict(intent='rank',period='2026年10月',network=None,scope=None,personName=None,metric='delivered_vehicles',models=[],profileField=None,reason='none')
class Contract(unittest.TestCase):
 def test_raw_and_rank(self):
  r=compile_result('这月谁交得最多呀',BASE,{})
  self.assertEqual(r['original'],'这月谁交得最多呀');self.assertEqual(r['context']['network'],'wangchao-national');self.assertEqual(r['context']['scope'],'全国门店');self.assertNotIn('42',r['query'])
 def test_named_person_defaults(self):
  r=compile_result('王小迪主要卖啥车',{**BASE,'intent':'distribution','period':None,'personName':'王小迪'},{})
  self.assertEqual(r['intent'],'distribution');self.assertEqual(r['context']['personId'],'national-wang');self.assertEqual(r['context']['period'],'2026年10月')
 def test_followup(self):
  r=compile_result('她主销啥车',{**BASE,'intent':'distribution','period':None},{'personId':'national-wang','network':'wangchao-national','period':'2026年10月','scope':'全国门店'})
  self.assertEqual(r['context']['personId'],'national-wang');self.assertEqual(r['intent'],'distribution')
 def test_unknown_and_unsupported(self):
  for patch in [{'metric':'orders'},{'metric':'configuration','intent':'models'},{'period':'unsupported'},{'personName':'unknown'},{'scope':'unknown'},{'network':'unknown'},{'models':['unknown']}]:
   self.assertEqual(compile_result('原话',{**BASE,**patch},{})['intent'],'clarify')
 def test_schema_rejects_invented_fields(self):
  for patch in [{'intent':'execute'},{'personName':'新姓名'},{'models':['不存在车型']},{'metric':'orders OR 1=1'},{'sales':999}]:
   with self.assertRaises(ValueError):validate({**BASE,**patch})
 def test_pronoun_without_context(self):
  self.assertEqual(compile_result('她卖啥车',{**BASE,'intent':'distribution'},{})['intent'],'clarify')
 def test_unresolved_person_in_rank(self):
  self.assertEqual(compile_result('他交了最多的是谁',BASE,{})['intent'],'clarify')
 def test_literal_entity_contract(self):
  for text in ['她主要卖啥车','这位销冠的主销车型是什么','具体卖的都是哪些车']:
   d=normalize_evidence(text,'distribution',extract_evidence(text))
   self.assertEqual(d['models'],[]);self.assertIsNone(d['personName'])
  for text,model in [('她元优皮交了多少','元 UP'),('她主销的是元普拉斯吗','元 PLUS')]:
   self.assertEqual(normalize_evidence(text,'sales',extract_evidence(text))['models'],[model])
 def test_explicit_conditions_and_negation(self):
  d=normalize_evidence('上月王朝网华南销冠是谁','rank',extract_evidence('上月王朝网华南销冠是谁'))
  self.assertEqual((d['period'],d['network'],d['scope']),('2026年9月','wangchao','华南战区'))
  for text,metric in [('不是交付量，我要看订单数','orders'),('不是订单，我要看交付量','delivered_vehicles')]:
   self.assertEqual(normalize_evidence(text,'sales',extract_evidence(text))['metric'],metric)
  for text,field in [('销售顾问张伟本月交付多少','personName'),('深圳福田王朝新店本月销冠是谁','scope'),('海洋网本月销冠是谁','network')]:
   self.assertEqual(normalize_evidence(text,'rank',extract_evidence(text))[field],'unknown')
 def test_current_home_context_is_retained(self):
  r=compile_result('她交得最多的是哪款车',{**BASE,'intent':'distribution','period':None},{'homeScenario':{'key':'currentChampion','person':'zhou'},'lastIntent':'home-currentChampion'})
  self.assertEqual(r['intent'],'distribution');self.assertEqual(r['context']['personId'],'home-zhou');self.assertEqual(r['context']['period'],'2026年10月')
  self.assertEqual(r['conditions']['scope'],None)
 def test_rank_clears_old_person(self):
  r=compile_result('这个月销冠',{**BASE,'network':'wangchao','scope':'华南战区'},{'personId':'dynasty-li','network':'wangchao','period':'2026年9月','scope':'华南战区'})
  self.assertNotIn('personId',r['context']);self.assertEqual(r['context']['network'],'wangchao')
if __name__=='__main__':unittest.main()
