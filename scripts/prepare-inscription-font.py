"""Convert the pinned OFL Cinzel outlines for real recessed letter geometry."""
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from pathlib import Path
import json,shutil
font=TTFont('node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff');gs=font.getGlyphSet()
class OutlinePen(BasePen):
 def __init__(self):super().__init__(gs);self.out=[];self.start=None
 def _moveTo(self,p):self.start=p;self.out+=['m',*p]
 def _lineTo(self,p):self.out+=['l',*p]
 def _curveToOne(self,a,b,c):self.out+=['b',*c,*a,*b]
 def _qCurveToOne(self,a,b):self.out+=['q',*b,*a]
 def _closePath(self):self.out+=['l',*self.start]
 def _endPath(self):pass
glyphs={}
for code,name in font.getBestCmap().items():
 if code>126:continue
 pen=OutlinePen();gs[name].draw(pen);glyphs[chr(code)]={'ha':font['hmtx'].metrics[name][0],'x_min':0,'x_max':font['hmtx'].metrics[name][0],'o':' '.join(str(v) for v in pen.out)}
result={'glyphs':glyphs,'familyName':'Cinzel','ascender':font['hhea'].ascent,'descender':font['hhea'].descent,'underlinePosition':-100,'underlineThickness':50,'boundingBox':{'yMin':font['head'].yMin,'yMax':font['head'].yMax,'xMin':font['head'].xMin,'xMax':font['head'].xMax},'resolution':font['head'].unitsPerEm,'original_font_information':{'license':'SIL Open Font License 1.1','source':'@fontsource/cinzel 5.3.0','author':'Natanael Gama'}}
Path('public/world/fonts/cinzel-inscription.json').write_text(json.dumps(result,separators=(',',':')))
shutil.copy2('node_modules/@fontsource/cinzel/LICENSE','public/world/fonts/Cinzel-OFL.txt')
print('Converted',len(glyphs),'glyphs')
