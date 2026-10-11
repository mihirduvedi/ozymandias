import {useRef} from 'react';
import {DesertStage} from './DesertStage';
export function Home({motion=true}:{motion?:boolean}){
 const position=useRef(4.3);
 return <main id="main" className="collection-opening" tabIndex={-1}>
  <DesertStage dark={false} motion={motion} position={position}/>
  <div className="opening-title"><p>Percy Bysshe Shelley</p><h1>Ozymandias</h1><p>1818</p></div>
  <nav className="opening-poems" aria-label="Enter Ozymandias">
   <a href="#/ozymandias"><div><strong>Ozymandias</strong><span>Percy Bysshe Shelley, 1818</span></div></a>
  </nav>
  <span className="opening-note">A reading in words and landscape</span>
 </main>;
}
