#!/usr/bin/env python3
"""Render a silent review derivative. Interactive canonical camera lives in content/film.ts.
No source image is overwritten; the movie is a composed camera treatment, not captured footage.
"""
import json, re, subprocess, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'Ozymandias_Silent_Film_Review.mp4'
work=root/'docs/film/render';work.mkdir(parents=True,exist_ok=True)
src=(root/'src/content/film.ts').read_text()
times=[int(x) for x in re.search(r'LINE_TIMES = \[(.*?)\]',src).group(1).split(',')]
cameras=[dict(zip(('t','x','y','z'),map(float,k))) for k in re.findall(r'\{t:([\d.]+),x:([\d.]+),y:([\d.]+),z:([\d.]+)\}',src)]
lines=json.loads((root/'src/content/ozymandias.json').read_text())
def curve(prop):
 result=str(cameras[-1][prop])
 for a,b in reversed(list(zip(cameras,cameras[1:]))):
  q=f'((on/24-{a["t"]})/{b["t"]-a["t"]})'
  value=f'({a[prop]}+({b[prop]-a[prop]})*{q}*{q}*(3-2*{q}))'
  result=f'if(lt(on/24,{b["t"]}),{value},{result})'
 return result
z=curve('z');x=f'max(0,min(iw-iw/zoom,iw*({curve("x")})-iw/zoom/2))';y=f'max(0,min(ih-ih/zoom,ih*({curve("y")})-ih/zoom/2))'
# Caption graphics are separate typeset vectors, rasterized with the bundled Sharp runtime.
# ffmpeg here does not include drawtext; use verified transparent overlays instead.
filters=[f"[0:v]zoompan=z='{z}':x='{x}':y='{y}':d=1:s=1920x800:fps=24,pad=1920:1080:0:0:color=0x0b0f10[base]"]
inputs=['opening']+[f'O{i+1:02}' for i in range(14)]
windows=[(0,8)]
groups=[([0],16),([1,2],32),([3,4],49),([5,6,7],72),([8,9,10],96),([11,12,13],130)]
for group,end in groups:
 for n,i in enumerate(group):windows.append((times[i],times[group[n+1]] if n+1<len(group) else end))
for n,(start,end) in enumerate(windows):
 previous='base' if n==0 else f'v{n-1}'
 filters.append(f"[{previous}][{n+1}:v]overlay=enable='gte(t,{start})*lt(t,{end})':shortest=1[v{n}]")
filter_path=work/'camera-and-captions.ffscript';filter_path.write_text(';\n'.join(filters))
args=['ffmpeg','-hide_banner','-loglevel','warning','-y','-threads','2','-loop','1','-framerate','24','-i',str(root/'public/art/ozymandias-location.webp')]
for name in inputs:args+=['-loop','1','-framerate','24','-i',str(work/f'{name}.png')]
args+=['-/filter_complex',str(filter_path),'-map',f'[v{len(windows)-1}]','-t','144','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
(work/'command.json').write_text(json.dumps(args,indent=2))
subprocess.run(args,check=True)
print(out)
