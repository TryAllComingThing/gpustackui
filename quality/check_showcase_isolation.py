from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1];dist=root/'dist'
if not dist.is_dir(): print('BLOCKED: run production build first');sys.exit(2)
violations=[]
for f in dist.rglob('*'):
 if f.is_file() and f.suffix in ('.js','.css','.html','.json'):
  content=f.read_text(encoding='utf-8',errors='replace')
  for marker in ('Theme & Component Showcase','M2 模拟交互','GPUStack · M2','GPU-A100-01'):
   if marker in content: violations.append(f'{f}: {marker}')
if violations:print('\n'.join(violations));sys.exit(1)
print('PASS: no known showcase-only markers in dist; review imports separately')
