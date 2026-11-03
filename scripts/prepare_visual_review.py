import datetime,hashlib,json,pathlib,shutil,subprocess
root=pathlib.Path.cwd(); run=root/'artifacts/f6'/('visual-review-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S'));run.mkdir(parents=True)
items=[]
for engine in ['chromium','firefox','webkit']:
 for section in ['states','patterns']:
  candidates=list((root/'artifacts/f6/acceptance-results').rglob(f'f4-{section}-{engine}-win32-candidate.png'))
  reference=root/f'tests/strict/f4.strict.spec.ts-snapshots/f4-{section}-{engine}-darwin.png'
  if len(candidates)!=1 or not reference.is_file():raise SystemExit(f'Missing/ambiguous review input {engine}/{section}')
  candidate=candidates[0];name=f'{section}-{engine}'
  shutil.copy2(candidate,run/f'{name}-candidate.png');shutil.copy2(reference,run/f'{name}-darwin-reference.png')
  items.append({'engine':engine,'section':section,'candidate':f'{name}-candidate.png','reference':f'{name}-darwin-reference.png','candidate_sha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'reference_sha256':hashlib.sha256(reference.read_bytes()).hexdigest(),'status':'PENDING HUMAN REVIEW; cross-platform reference is not a Windows baseline'})
meta={'source_head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'scope':'current working tree; unapproved review material','status':'PENDING','baseline_modified':False,'items':items}
(run/'review.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
html=['<!doctype html><meta charset="utf-8"><title>F6 visual review - UNAPPROVED</title><h1>UNAPPROVED review material</h1><p>Windows candidates beside historical Darwin references. Platform/font differences require review. No baseline has been accepted. Verify source, states, contrast and layout against DESIGN.md; record approval separately.</p>']
for item in items:html.append(f'<h2>{item["engine"]} / {item["section"]}</h2><div style="display:flex;align-items:start;gap:16px"><figure style="width:48%;margin:0">Windows candidate<img style="width:100%" src="{item["candidate"]}"></figure><figure style="width:48%;margin:0">Darwin historical reference<img style="width:100%" src="{item["reference"]}"></figure></div>')
(run/'index.html').write_text('\n'.join(html),encoding='utf-8')
(root/'artifacts/f6/visual-review-latest.json').write_text(json.dumps({'directory':str(run),'status':'PENDING'},indent=2),encoding='utf-8')
print(json.dumps({'review_directory':str(run),'candidates':len(items),'status':'PENDING'}))
