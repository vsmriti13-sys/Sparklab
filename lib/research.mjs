import {decode} from 'he';
export function plainText(value){return decode(String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).trim();}
export async function discover(query){
 if(typeof query!=='string'||query.trim().length<3||query.length>500)throw new Error('Enter a focused research topic (3–500 characters).');
 const url=new URL('https://api.crossref.org/works');url.searchParams.set('query',query.trim());url.searchParams.set('rows','10');url.searchParams.set('select','DOI,title,published,author,abstract,container-title,type,URL');
 const r=await fetch(url,{headers:{'User-Agent':'SparkLab/0.2 educational-research-studio'},signal:AbortSignal.timeout(30000),cache:'no-store'});
 if(!r.ok)throw new Error(`Crossref search failed (${r.status}); no substitute sources were generated.`);
 const data=await r.json();const seen=new Set();
 const sources=(data.message?.items||[]).filter(x=>x.DOI&&x.title?.[0]&&!seen.has(x.DOI)&&seen.add(x.DOI)).map((x,i)=>({id:`S${i+1}`,doi:x.DOI,title:plainText(x.title[0]),url:`https://doi.org/${encodeURIComponent(x.DOI)}`,year:x.published?.['date-parts']?.[0]?.[0]||null,authors:(x.author||[]).slice(0,6).map(a=>[a.given,a.family].filter(Boolean).join(' ')).join(', '),journal:plainText(x['container-title']?.[0]),type:x.type||'publication',abstract:plainText(x.abstract).slice(0,9000),retrievedAt:new Date().toISOString(),verification:x.abstract?'Bibliographic record and abstract retrieved from Crossref. Full text not read.':'Bibliographic record retrieved from Crossref. No abstract or full text read.'}));
 if(!sources.length)throw new Error('No scholarly records found. Refine your query.');return sources;
}
