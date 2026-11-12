// The content contract is shared by generation, review, preview and every exporter.
function text(v,name,max=2000){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(`${name} must contain usable text (maximum ${max} characters).`);return v.trim();}
function list(v,name,min=1,max=12,limit=500){if(!Array.isArray(v)||v.length<min||v.length>max)throw new Error(`${name} needs ${min}–${max} items.`);return v.map(x=>text(x,name,limit));}
export function studioBrief(b){
 const out={topic:text(b?.topic,'Topic',500),objectives:text(b?.objectives,'Learning objectives',2000),ageGroup:text(b?.ageGroup,'Age group',200),context:text(b?.context,'Context',2000),kind:b?.kind,duration:Number(b?.duration),participants:Number(b?.participants),revision:typeof b?.revision==='string'?b.revision.slice(0,2000):'',accepted:Array.isArray(b?.accepted)?b.accepted.filter(x=>typeof x==='string').slice(-25).map(x=>x.slice(0,200)):[]};
 if(!['lesson','workshop'].includes(out.kind))throw new Error('Choose a classroom lesson or teacher-training workshop.');
 if(!Number.isInteger(out.duration)||out.duration<15||out.duration>180)throw new Error('Duration must be 15–180 minutes.');
 if(!Number.isInteger(out.participants)||out.participants<1||out.participants>100)throw new Error('Participant count must be 1–100.');
 return out;
}
export function validateDesign(d,sources){
 if(!d||typeof d!=='object')throw new Error('The AI returned no design.');
 const clean={title:text(d.title,'Title',150),overview:text(d.overview,'Overview',1200),objectives:list(d.objectives,'Objectives',2,5,250),udl:list(d.udl,'UDL supports',3,6,400),materials:list(d.materials,'Materials',1,12,250)};
 if(!Array.isArray(d.slides)||d.slides.length<5||d.slides.length>16)throw new Error('A design needs 5–16 participant slides.');
 clean.slides=d.slides.map(s=>{if(['answer','answers','answerKey','facilitatorNotes','solution'].some(k=>k in s))throw new Error('Participant slides must not include answers or facilitator notes.');return {title:text(s.title,'Slide title',90),instruction:text(s.instruction,'Slide instruction',350),stimulus:typeof s.stimulus==='string'?s.stimulus.slice(0,650):'',tasks:list(s.tasks,'Slide tasks',1,3,180),minutes:Number(s.minutes)};});
 if(clean.slides.some(s=>!Number.isInteger(s.minutes)||s.minutes<1||s.minutes>60))throw new Error('Each slide needs a realistic duration.');
 if(!Array.isArray(d.worksheet)||d.worksheet.length<2||d.worksheet.length>6)throw new Error('A worksheet needs 2–6 sections.');
 clean.worksheet=d.worksheet.map(s=>{if(['answer','answers','answerKey','solution'].some(k=>k in s))throw new Error('Worksheets must not include answers.');return {title:text(s.title,'Worksheet heading',100),instruction:text(s.instruction,'Worksheet instruction',500),stimulus:typeof s.stimulus==='string'?s.stimulus.slice(0,1400):'',prompts:list(s.prompts,'Worksheet prompts',1,4,350),responseLines:Math.max(3,Math.min(8,Number(s.responseLines)||4))};});
 if(!Array.isArray(d.facilitator)||d.facilitator.length!==clean.slides.length)throw new Error('Each slide needs separate facilitator guidance.');
 clean.facilitator=d.facilitator.map((f,i)=>({slide:i+1,guidance:text(f.guidance,'Facilitator guidance',1200),lookFor:text(f.lookFor,'Assessment / possible responses',1000),adaptation:text(f.adaptation,'Access and age adaptation',700)}));
 if(!Array.isArray(d.evidence)||!d.evidence.length||d.evidence.length>6)throw new Error('The design needs a research-to-design rationale.');
 clean.evidence=d.evidence.map(e=>{const source=sources.find(s=>s.id===e.sourceId);if(!source)throw new Error('The design cites a source you did not select.');const rationale=text(e.rationale,'Design rationale',700);const quote=typeof e.quote==='string'?e.quote.trim():'';if(quote&&(!source.abstract||!source.abstract.replace(/\s+/g,' ').includes(quote.replace(/\s+/g,' '))))throw new Error('A quoted finding does not match the retrieved abstract. Regenerate to avoid an unverified claim.');return {sourceId:e.sourceId,quote,rationale,level:quote?'Retrieved abstract excerpt; interpretation is AI-generated':'Metadata only; design hypothesis, not a verified finding'};});
 clean.reflection=list(d.reflection,'Reflection',2,5,300);
 return clean;
}
export function validateReview(r){
 if(!r||!Array.isArray(r.checks)||r.checks.length!==6)throw new Error('Quality review needs six checks.');
 const required=['pedagogy','udl','age','feasibility','evidence','answerSeparation'];
 const checks=required.map(key=>{const c=r.checks.find(c=>c.criterion===key);if(!c||typeof c.pass!=='boolean')throw new Error(`Missing quality check: ${key}`);return {criterion:key,pass:c.pass,note:text(c.note,'Review note',700)};});
 return {checks,ready:checks.every(c=>c.pass)};
}
export const designShape={title:'',overview:'',objectives:['measurable outcomes'],materials:['actual supplied or ordinary materials'],udl:['engagement choice','representation support','action / expression choice'],evidence:[{sourceId:'S1',quote:'exact substring of retrieved abstract, or empty if abstract unavailable',rationale:'Explain how this resource informed a specific task. Interpretations are suggestions, not verified findings.'}],slides:[{title:'',instruction:'Participant-facing instruction, no delivery notes or answers',stimulus:'Actual case, text, scenario or data needed to do the task; not a placeholder',tasks:['Concrete learner task'],minutes:5}],worksheet:[{title:'',instruction:'',stimulus:'Actual original task stimulus needed on paper',prompts:['Answerable prompt'],responseLines:4}],facilitator:[{guidance:'How to run corresponding slide',lookFor:'Expected answers or plausible responses and assessment criteria, kept private',adaptation:'Specific age and access adjustments'}],reflection:['Transfer / exit questions']};
