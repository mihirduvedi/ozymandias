const fs=require('fs'),path=require('path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'docs/film/render');
const lines=JSON.parse(fs.readFileSync(path.join(root,'src/content/ozymandias.json')));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const groups=[[0],[1,2],[3,4],[5,6,7],[8,9,10],[11,12,13]];
async function save(name,text){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><g fill="#fffbed" font-family="Georgia,Times New Roman,serif">${text}</g></svg>`;fs.writeFileSync(path.join(dest,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(dest,name+'.png'))}
(async()=>{await save('opening','<text x="960" y="411" text-anchor="middle" font-size="86">Ozymandias</text><text x="960" y="481" text-anchor="middle" font-size="24">Percy Bysshe Shelley</text>');for(const g of groups){for(let n=0;n<g.length;n++){await save('O'+String(g[n]+1).padStart(2,'0'),g.slice(0,n+1).map((i,r)=>`<text x="115" y="${891+r*49}" font-size="34">${esc(lines[i])}</text>`).join(''))}}})();
