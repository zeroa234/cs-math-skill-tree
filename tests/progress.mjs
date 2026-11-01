// Regression checks for skill repartitioning and old progress files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=path.join(root,'temp/progress-qa');
fs.mkdirSync(tmp,{recursive:true});process.env.TEMP=process.env.TMP=tmp;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const url=pathToFileURL(path.join(root,'src/web/index.html')).href;
async function check(saved,run){
 const ctx=await browser.newContext({acceptDownloads:true});
 await ctx.addInitScript(data=>localStorage.setItem('cs-math-skilltree/v1',JSON.stringify(data)),saved);
 const page=await ctx.newPage();await page.goto(url+'#map/D');
 await page.waitForSelector('.card[data-id="D.3.1"]');
 await page.waitForTimeout(100);
 await run(page);await ctx.close();
}
try{
 await check({version:1,learned:['D.3.1'],goal:['C.4.4'],introSeen:true},async p=>{
  assert.equal(await p.locator('.card[data-id="D.3.1"]').evaluate(e=>e.classList.contains('lit')),false,'Only a component cannot establish the expanded skill');
  const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('cs-math-skilltree/v1')));
  assert.equal(stored.version,2);assert.deepEqual(stored.goal,['D.2.2']);
  assert.deepEqual(stored.legacyProgress.learned,['D.3.1']);
  await p.click('#btn-menu');const got=p.waitForEvent('download');await p.click('#btn-export');
  const d=await got;await d.saveAs(path.join(tmp,'migrated.json'));
  const exported=JSON.parse(fs.readFileSync(path.join(tmp,'migrated.json'),'utf8'));
  assert.equal(exported.version,2);assert.deepEqual(exported.legacyProgress.learned,['D.3.1']);
 });
 await check({version:1,learned:['P.1.1','M.5.3','F.1.1','F.1.2','F.1.3'],introSeen:true},async p=>{
  assert.equal(await p.locator('.card[data-id="F.1.2"]').evaluate(e=>e.classList.contains('lit')),true,'All components preserve completed merged skill');
  assert.equal(await p.locator('.card[data-id="M.6.6"]').evaluate(e=>e.classList.contains('lit')),false,'New skill is not automatically complete');
 });
 await check({version:2,learned:['D.3.1'],introSeen:true},async p=>{
  assert.equal(await p.locator('.card[data-id="D.3.1"]').evaluate(e=>e.classList.contains('lit')),true,'New completion must not be migrated again');
  await p.setInputFiles('#file-import',{name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,learned:['F.1.2']}))});
  await p.waitForFunction(()=>document.querySelector('#toast').textContent.includes('已导入'));
  assert.equal(await p.locator('.card[data-id="F.1.2"]').evaluate(e=>e.classList.contains('lit')),false,'Import also respects merged skill boundaries');
 });
 console.log('PASS: partial/full legacy completion, goal remap, exported backup, new schema, legacy import');
}finally{await browser.close();}
