import pptxgen from 'pptxgenjs';
import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,PageBreak,ExternalHyperlink,Footer,PageNumber} from 'docx';
import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {validateDesign,studioBrief} from './material-schema.mjs';
const ink='243F35',green='315C48',pale='EEF3E6',muted='536650';
async function fontBytes(bold=false){return readFile(path.join(process.cwd(),'assets','fonts',bold?'DejaVuSans-Bold.ttf':'DejaVuSans.ttf'));}
function wordWrap(text,width,measure){const lines=[];for(const paragraph of String(text).split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(measure(word)>width){if(line){lines.push(line);line='';}let chunk='';for(const ch of word){if(measure(chunk+ch)>width&&chunk){lines.push(chunk);chunk='';}chunk+=ch;}line=chunk;}else if(line&&measure(line+' '+word)>width){lines.push(line);line=word;}else line=line?line+' '+word:word;}lines.push(line);}return lines;}
function chunks(lines,count){const out=[];for(let i=0;i<lines.length;i+=count)out.push(lines.slice(i,i+count));return out;}
function p(text,opts={}){return new Paragraph({children:[new TextRun({text,...(opts.bold?{bold:true}:{})})],spacing:{after:160,line:310},...opts});}
function h(text,level=HeadingLevel.HEADING_1){return p(text,{heading:level,keepNext:true});}
function sourceParagraphs(sources){return sources.flatMap(s=>[p(`${s.id} · ${s.title} (${s.year||'n.d.'})`,{bold:true}),new Paragraph({children:[new ExternalHyperlink({link:s.url,children:[new TextRun({text:s.url,style:'Hyperlink'})]})],spacing:{after:100}}),p(s.verification)]);}
function docOptions(children,title){return {creator:'SparkLab',title,description:'AI-designed teaching materials. Human facilitator approval required.',styles:{default:{document:{run:{font:'DejaVu Sans',size:24,color:ink},paragraph:{spacing:{line:310}}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1000,bottom:1000,left:1000,right:1000}}},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:'SparkLab  ·  ',size:18,color:muted}),new TextRun({children:[PageNumber.CURRENT],size:18})]})]})},children}]};}
export async function worksheetDocx(pack){
 const {design:d,brief}=pack;const children=[h(d.title,HeadingLevel.TITLE),p(`${brief.kind==='lesson'?'Classroom lesson':'Teacher-training workshop'} · ${brief.ageGroup} · ${brief.duration} minutes`),p('Name / group: ____________________________________'),h('Your learning goals'),...d.objectives.map(x=>p('• '+x)),p('You may write, draw, or use an agreed spoken response. Ask for an alternative format or extra processing time when needed.')];
 for(const [i,s] of d.worksheet.entries()){
 children.push(new Paragraph({children:[new PageBreak()]}),h(`${i+1}. ${s.title}`),p(s.instruction));if(s.stimulus)children.push(p(s.stimulus));
 for(const [j,prompt] of s.prompts.entries()){children.push(p(`${j+1}. ${prompt}`,{bold:true,keepNext:true}));for(let n=0;n<s.responseLines;n++)children.push(p('________________________________________________________________',{spacing:{after:120,line:340}}));}
 }
 children.push(h('Reflect and transfer'),...d.reflection.map(x=>p('• '+x)),p('My next step: __________________________________________________'));
 return Packer.toBuffer(new Document(docOptions(children,d.title+' — participant worksheet')));
}
export async function facilitatorDocx(pack){
 const {design:d,brief,sources,review}=pack;
 const children=[h(d.title,HeadingLevel.TITLE),p('FACILITATOR ONLY — includes possible responses and assessment guidance',{bold:true}),p(`${brief.kind==='lesson'?'Classroom lesson':'Teacher-training workshop'} · ${brief.ageGroup} · ${brief.participants} participants · ${brief.duration} minutes`),p(d.overview),h('Learning objectives'),...d.objectives.map(x=>p('• '+x)),h('Preparation and materials'),...d.materials.map(x=>p('• '+x)),h('UDL and access choices'),...d.udl.map(x=>p('• '+x))];
 d.facilitator.forEach((f,i)=>{children.push(h(`Step ${i+1}: ${d.slides[i].title}`),p(`${d.slides[i].minutes} minutes. Corresponds to participant slides labelled STEP ${i+1}.`),p(f.guidance),h('Look for / possible responses',HeadingLevel.HEADING_2),p(f.lookFor),h('Adaptation and access',HeadingLevel.HEADING_2),p(f.adaptation));});
 children.push(h('Research-to-design rationale'));for(const e of d.evidence){const s=sources.find(s=>s.id===e.sourceId);children.push(p(`${e.sourceId} · ${s.title}`,{bold:true}),p(e.level));if(e.quote)children.push(p('Retrieved abstract excerpt: “'+e.quote+'”'));children.push(p('AI design interpretation: '+e.rationale));}
 children.push(h('Quality review'));if(review)for(const c of review.checks)children.push(p(`${c.criterion}: ${c.pass?'Pass':'Needs revision'} — ${c.note}`));else children.push(p('Not yet reviewed. Do not use without reviewing.'));
 children.push(h('References and evidence limits'),p('Source records and any included abstracts were retrieved from Crossref. Full-text findings were not independently verified. Activity design and interpretation are AI-generated. Review relevance, accuracy and access needs before delivery.'),...sourceParagraphs(sources));
 return Packer.toBuffer(new Document(docOptions(children,d.title+' — facilitator guide')));
}
export async function worksheetPdf(pack){
 const {design:d,brief}=pack;const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const regular=await pdf.embedFont(await fontBytes());const bold=await pdf.embedFont(await fontBytes(true));pdf.setTitle(d.title+' — participant worksheet');pdf.setAuthor('SparkLab');pdf.setLanguage('en');
 const width=595.28,height=841.89,margin=48;let page,y;
 function addPage(){page=pdf.addPage([width,height]);page.drawRectangle({x:0,y:height-15,width,height:15,color:rgb(.19,.36,.28)});y=height-55;page.drawText('SPARKLAB  /  PARTICIPANT WORKSHEET',{x:margin,y,font:bold,size:9,color:rgb(.25,.36,.23)});y-=30;}
 function ensure(space){if(y-space<55)addPage();}
 function write(text,size=12,isBold=false){const font=isBold?bold:regular;const lines=wordWrap(text,width-margin*2,t=>font.widthOfTextAtSize(t,size));for(const line of lines){ensure(size*1.55);page.drawText(line,{x:margin,y,font,size,color:rgb(.14,.23,.19)});y-=size*1.55;}y-=8;}
 addPage();write(d.title,23,true);write(`${brief.kind==='lesson'?'Classroom lesson':'Teacher-training workshop'} | ${brief.ageGroup} | ${brief.duration} minutes`,11);write('Name / group: ____________________________________');write('Your learning goals',16,true);for(const o of d.objectives)write('• '+o);write('Respond in writing, drawing, or an agreed spoken format. Ask for access support when needed.');
 for(const [i,s] of d.worksheet.entries()){
 addPage();write(`${i+1}. ${s.title}`,19,true);write(s.instruction);if(s.stimulus)write(s.stimulus);
 for(const [j,prompt] of s.prompts.entries()){
 const lines=wordWrap(`${j+1}. ${prompt}`,width-margin*2,t=>bold.widthOfTextAtSize(t,12));ensure(Math.min(500,lines.length*19+s.responseLines*24+20));write(`${j+1}. ${prompt}`,12,true);
 for(let n=0;n<s.responseLines;n++){ensure(24);page.drawLine({start:{x:margin,y:y-8},end:{x:width-margin,y:y-8},thickness:.5,color:rgb(.65,.7,.62)});y-=24;}y-=16;
 }
 }
 ensure(160);write('Reflect and transfer',17,true);for(const r of d.reflection)write('• '+r);write('My next step:');ensure(40);page.drawLine({start:{x:margin,y:y-18},end:{x:width-margin,y:y-18},thickness:.5,color:rgb(.65,.7,.62)});
 for(const [i,p] of pdf.getPages().entries())p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:width-80,y:25,font:regular,size:9,color:rgb(.3,.4,.28)});
 return Buffer.from(await pdf.save());
}
export async function slidesPptx(pack){
 const {design:d,brief}=pack;const pptx=new pptxgen();pptx.layout='LAYOUT_WIDE';pptx.author='SparkLab';pptx.subject='Participant instructions and tasks — answers in a separate facilitator guide';pptx.title=d.title;pptx.company='SparkLab';pptx.lang='en-GB';pptx.theme={headFontFace:'DejaVu Sans',bodyFontFace:'DejaVu Sans',lang:'en-GB'};
 // Measure using the same font embedded in the PDF, then paginate before writing.
 const metrics=await PDFDocument.create();metrics.registerFontkit(fontkit);const font=await metrics.embedFont(await fontBytes());const measure=(t,size)=>font.widthOfTextAtSize(t,size);
 function base(title,kicker){const s=pptx.addSlide();s.background={color:'FAFBF7'};s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.14,fill:{color:green},line:{color:green}});s.addText(kicker,{x:.7,y:.42,w:11.8,h:.3,fontSize:12,bold:true,color:green,margin:0});const lines=wordWrap(title,11.8*72,t=>measure(t,30));s.addText(lines.join('\n'),{x:.7,y:1,w:11.8,h:Math.max(1.1,lines.length*.5),fontSize:30,bold:true,color:ink,margin:0,breakLine:false});s.addText('SparkLab · Participant materials',{x:.7,y:7.08,w:9,h:.2,fontSize:10,color:muted,margin:0});return {s,bodyY:Math.max(2.3,1+lines.length*.5+.3)};}
 function contentSlides(title,kicker,paragraphs){
 const lines=paragraphs.flatMap(t=>[...wordWrap(t,11.7*72,t=>measure(t,22)),'']);const titleLines=wordWrap(title,11.8*72,t=>measure(t,30)).length;const bodyY=Math.max(2.3,1+titleLines*.5+.3);const pages=chunks(lines,Math.max(5,Math.min(12,Math.floor((6.75-bodyY)/.37))));
 pages.forEach((lines,i)=>{const {s,bodyY}=base(title,kicker+(pages.length>1?` · ${i+1}/${pages.length}`:''));s.addText(lines.join('\n'),{x:.8,y:bodyY,w:11.7,h:6.75-bodyY,fontSize:22,color:ink,margin:0,paraSpaceAfterPt:7,breakLine:false});});
 }
 contentSlides(d.title,`${brief.kind==='lesson'?'CLASSROOM LESSON':'TEACHER-TRAINING WORKSHOP'} · ${brief.duration} MINUTES`,['Today we will…',...d.objectives.map((x,i)=>`${i+1}. ${x}`)]);
 d.slides.forEach((s,i)=>{const kicker=`STEP ${i+1} · ${s.minutes} MINUTES`;if(s.stimulus){contentSlides(s.title,kicker,[s.instruction,s.stimulus]);contentSlides(s.title+' · Your task',kicker,s.tasks.map((t,j)=>`${j+1}. ${t}`));}else contentSlides(s.title,kicker,[s.instruction,...s.tasks.map((t,j)=>`${j+1}. ${t}`)]);});
 contentSlides('Reflect and transfer','YOUR NEXT STEP',d.reflection.map((t,i)=>`${i+1}. ${t}`));
 return Buffer.from(await pptx.write({outputType:'nodebuffer'}));
}
export const formats={slides:{mime:'application/vnd.openxmlformats-officedocument.presentationml.presentation',filename:'participant-slides.pptx',create:slidesPptx},worksheetDocx:{mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',filename:'participant-worksheet.docx',create:worksheetDocx},worksheetPdf:{mime:'application/pdf',filename:'participant-worksheet.pdf',create:worksheetPdf},facilitator:{mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',filename:'facilitator-guide.docx',create:facilitatorDocx}};
export async function exportMaterial(kind,pack){const format=formats[kind];if(!format)throw new Error('Unknown file format.');studioBrief(pack.brief);validateDesign(pack.design,pack.sources);return {bytes:await format.create(pack),...format};}
