from pathlib import Path
import re,base64,json
root=Path(__file__).resolve().parents[1];dist=root/'dist'
html=(dist/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+(dist/'style.css').read_text()+'</style>')
js='\n'.join((dist/name).read_text() for name in ['timer.mjs','prompts.mjs','library-assets.mjs','library.mjs','audio.mjs','menu.mjs','encouragement.mjs','cycles.mjs','app.mjs'])
js=re.sub(r'^import .+;\n','',js,flags=re.M).replace('export class ','class ').replace('export const ','const ').replace('export function ','function ')
for asset in (dist/'assets/audio').glob('*.wav'):
 js=js.replace(json.dumps('assets/audio/'+asset.name),json.dumps('data:audio/wav;base64,'+base64.b64encode(asset.read_bytes()).decode()))
html=html.replace('<script type="module" src="app.mjs"></script>','<script type="module">'+js+'</script>')
(root/'index.html').write_text(html, encoding='utf-8')
print('Built index.html with embedded audio.')
