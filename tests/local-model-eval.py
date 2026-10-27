"""Run real Ollama inference; never substitutes regex/mock results for accuracy."""
import json, pathlib, sys, time, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'model-service'))
from understanding import MODEL, parse, compile_result
if '--wait' in sys.argv:
 started=time.monotonic()
 while True:
  with urllib.request.urlopen('http://127.0.0.1:11434/api/tags',timeout=5) as r:tags=json.load(r)
  if any(m['name']==MODEL for m in tags.get('models',[])):break
  if time.monotonic()-started>3600:raise SystemExit('Model download not ready after one hour; no inference test performed.')
  time.sleep(30)
cases=json.loads((ROOT/'tests/fixtures/business-intent-cases.json').read_text())['cases'];report=[]
for c in cases:
 start=time.monotonic()
 try:
  raw=parse(c['text'],c['context']);result=compile_result(c['text'],raw,c['context']);observed={**raw,**{k:result['slots'].get(k) for k in ['period','network','scope','personId']}}
  # Configuration requests can be understood but must not be answered using sales totals.
  expected=c['expected'];
  if expected.get('intent')=='clarify':observed['intent']=result['intent']
  for key in ['network','scope']:
   if expected.get(key)=='unknown':observed[key]=raw[key]
  diff={k:{'expected':v,'actual':observed.get(k)} for k,v in expected.items() if observed.get(k)!=v}
  expected_final=c.get('expectedFinalIntent',expected['intent'])
  if result['intent']!=expected_final:diff['finalIntent']={'expected':expected_final,'actual':result['intent']}
  if not expected.get('models') and 'unknown' not in raw['models'] and raw['models'] and expected['intent'] not in ['models','clarify']:
   diff['unrequestedModels']={'expected':[],'actual':raw['models']}
  record={'id':c['id'],'text':c['text'],'expected':expected,'parsed':raw,'result':result,'differences':diff,'seconds':round(time.monotonic()-start,3),'passed':not diff}
 except Exception as error:record={'id':c['id'],'text':c['text'],'error':str(error),'passed':False}
 report.append(record);print(c['id'], 'PASS' if record['passed'] else 'FAIL',record.get('differences',record.get('error')),flush=True)
 pathlib.Path('/private/tmp/dikeni-real-model-eval.json').write_text(json.dumps({'model':MODEL,'tested':len(report),'passed':sum(r['passed'] for r in report),'cases':report},ensure_ascii=False,indent=2))
print(f"Real model evaluation: {sum(r['passed'] for r in report)}/{len(report)}",flush=True)
sys.exit(0 if all(r['passed'] for r in report) else 1)
