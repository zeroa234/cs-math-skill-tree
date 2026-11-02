import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readLearningPaths} from './learning-paths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skills=JSON.parse(fs.readFileSync(path.join(root,'output/skilltree.json'),'utf8')).skills;
const records=readLearningPaths(path.join(root,'data/curation/learning-paths'),new Map(skills.map(s=>[s.id,s])));
const missing=skills.filter(s=>!records.has(s.id)).map(s=>s.id);
const stats={skills:skills.length,audited:records.size,completeChinese:0,completeEnglish:0,freeChinese:0,freeEnglish:0,coreTopics:0,fallbackTopics:0,paidTopics:0,accessPendingTopics:0};
const problems=[];
for(const [id,record] of records){
 stats.coreTopics+=record.topics.filter(t=>t.stage==='core').length;
 for(const [lang,key] of [['zh','completeChinese'],['en','completeEnglish']]){
  if(record.routes[lang].status==='complete')stats[key]++;
  if(record.routes[lang].freeCovered===record.routes[lang].total)stats[lang==='zh'?'freeChinese':'freeEnglish']++;
  stats.paidTopics+=record.routes[lang].paidTopics.length;
  stats.accessPendingTopics+=record.routes[lang].accessPendingTopics.length;
  for(const gap of record.routes[lang].gaps){
   stats.fallbackTopics++;
   if(!record.crossLanguageFallbacks.some(f=>f.lang_missing===lang && f.topic===gap))problems.push(`${id} ${lang}: ${gap} remains unresolved without a researched fallback`);
  }
 }
}
console.log(JSON.stringify({stats,missing,problems},null,2));
if(process.argv.includes('--require-all') && (missing.length||problems.length))process.exitCode=1;
