// Archive only explicitly reviewed node IDs; this never edits prerequisites or skill scope.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {assessLearningPath} from './learning-paths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),archive=args.includes('--archive');
const ids=args.filter(a=>!a.startsWith('--'));
const inputDirectory=args.includes('--reviewed')?'temp/research/bilingual-coverage/review':'temp/research/bilingual-coverage';
if(!ids.length)throw Error('Specify reviewed skill IDs; add --archive after reading the evidence.');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const data=read(path.join(root,'output/skilltree.json'));const byId=new Map(data.skills.map(s=>[s.id,s]));
const reviewPath=path.join(root,'data/curation/learning-resources.json'),review=read(reviewPath);
const destination=path.join(root,'data/curation/learning-paths');
const prepared=[];
const resource=s=>Object.fromEntries(['title','url','tier','lang','free','covers','access','role'].map(k=>[k,s[k]]));
for(const id of ids){
 const skill=byId.get(id);if(!skill)throw Error('Unknown skill '+id);
 const candidate=read(path.join(root,inputDirectory,id+'.json'));
 if(candidate.name && candidate.name!==skill.name)throw Error('Candidate has a stale skill name: '+id);
 if(candidate.description && candidate.description!==skill.desc)throw Error('Candidate has a stale description: '+id);
 const record={...candidate,name:skill.name,description:skill.desc};
 const result=assessLearningPath(record,skill);
 if(result.problems.length)throw Error(id+': '+result.problems.join('; '));
 for(const lang of ['zh','en'])for(const gap of result.routes[lang].gaps)if(!(record.cross_language_fallbacks||[]).some(f=>f.lang_missing===lang&&f.topic===gap))throw Error(`${id}: unresolved ${lang} topic: ${gap}`);
 for(const lang of ['zh','en'])if(record.sources.filter(s=>s.role==='primary'&&s.lang===lang).length>1)throw Error(`${id}: choose one ${lang} primary resource`);
 prepared.push({id,record,result});
}
for(const {id,record,result} of prepared){
 console.log(`${id}: zh ${result.routes.zh.covered}/${result.routes.zh.total}; en ${result.routes.en.covered}/${result.routes.en.total}; ${record.sources.length} sources`);
 if(!archive)continue;
 const en=record.sources.find(s=>s.lang==='en'&&s.role==='primary');
 const zh=record.sources.find(s=>s.lang==='zh'&&s.role==='primary');
 if(en)review.english[id]={...resource(en),review:'逐知识点核查与独立英文路线见 learning-paths/'+id+'.json。'};
 if(zh){
  const key='path-'+id.toLowerCase().replaceAll('.','-');review.chineseCatalog[key]=resource(zh);review.chinese[id]={source:key,covers:zh.covers};delete review.chineseGaps[id];
 }else{
  delete review.chinese[id];review.chineseGaps[id]='本轮未找到可组成独立中文路线的教学，逐知识点缺口与查找记录见双语路线。';
 }
 const primaryURLs=new Set([en?.url,zh?.url].filter(Boolean));
 const seen=new Set(primaryURLs);
 review.supplementary??={};review.supplementary[id]=record.sources.filter(s=>{
  const key=s.url+'|'+s.lang;if(primaryURLs.has(s.url)||seen.has(key))return false;seen.add(key);return true;
 }).map(resource);
 fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,id+'.json'),JSON.stringify(record,null,1)+'\n');
}
if(archive)fs.writeFileSync(reviewPath,JSON.stringify(review,null,2)+'\n');
console.log(archive?'Archived reviewed learning paths':'Validation only; no formal data changed');
