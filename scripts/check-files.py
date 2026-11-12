"""Open and inspect actual downloaded materials. Requires python-pptx, python-docx, PyMuPDF.
Usage: python scripts/check-files.py /path/to/live-output
This does not replace opening/rendering Office files in an office application.
"""
from pathlib import Path
import json, sys
from pptx import Presentation
from docx import Document
import fitz
root=Path(sys.argv[1])
pack=json.loads((root/'generated-pack.json').read_text())
slides=Presentation(root/'sparklab-participant-slides.pptx')
slide_text='\n'.join(shape.text for slide in slides.slides for shape in slide.shapes if shape.has_text_frame)
worksheet=Document(root/'sparklab-participant-worksheet.docx')
wtext='\n'.join(p.text for p in worksheet.paragraphs)
facilitator=Document(root/'sparklab-facilitator-guide.docx')
ftext='\n'.join(p.text for p in facilitator.paragraphs)
pdf=fitz.open(root/'sparklab-participant-worksheet.pdf')
ptext='\n'.join(page.get_text() for page in pdf)
assert len(slides.slides)>=7
for section in pack['design']['worksheet']:
 assert section['title'] in wtext and section['title'] in ptext
 for prompt in section['prompts']:
  assert prompt in wtext
for f in pack['design']['facilitator']:
 assert f['lookFor'] in ftext
 assert f['lookFor'] not in wtext and f['lookFor'] not in slide_text
for source in pack['sources']:
 assert source['url'] in ftext
for page in pdf:
 for block in page.get_text('dict')['blocks']:
  if block.get('type')==0:
   assert block['bbox'][0]>=40 and block['bbox'][2]<page.rect.width-35
print(json.dumps({'pptx_slides':len(slides.slides),'worksheet_docx_paragraphs':len(worksheet.paragraphs),'worksheet_pdf_pages':len(pdf),'facilitator_docx_paragraphs':len(facilitator.paragraphs),'private_response_separation':'passed'},indent=2))
