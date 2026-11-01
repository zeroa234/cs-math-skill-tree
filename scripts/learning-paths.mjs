// Validate the independent language routes against the actual skill description.
// This verifies the audit's structure; a human still has to read the cited teaching material.
import fs from 'node:fs';
import path from 'node:path';
export const topicItems = desc => desc.split(/[、，,；;。]/).map(x => x.trim()).filter(Boolean);
const http = s => { try { return ['http:','https:'].includes(new URL(s).protocol); } catch { return false; } };
const present = s => typeof s === 'string' && s.trim().length > 0;
export const REUPLOAD_LABEL = '第三方转载，授权未核';
const REUPLOAD_HINT = /第三方(转载|上传|搬运)|转载|搬运|非(学校|大学|官方)(官方)?(账号|发布)?|个人账号|学生(整理|上传)|非官方/;
export function assessLearningPath(record, skill) {
  const problems = [];
  const bad = message => problems.push(message);
  if (record.id !== skill.id) bad('skill ID does not match');
  if (record.name !== skill.name || record.description !== skill.desc) bad('skill name/description is stale');
  const sources = new Map();
  for (const s of record.sources || []) {
    if (!present(s.key) || sources.has(s.key)) bad('missing or duplicate source key');
    sources.set(s.key,s);
    if (!['zh','en'].includes(s.lang)) bad(`${s.key}: language is unverified`);
    if (!['website','material','book','video'].includes(s.tier)) bad(`${s.key}: unknown resource type`);
    if (!http(s.url) || !present(s.title) || !present(s.covers) || !present(s.access)) bad(`${s.key}: missing learning/access details`);
    if (![true,false,null].includes(s.free)) bad(`${s.key}: access classification missing`);
    if (!['primary','supplement','reference','alternative'].includes(s.role)) bad(`${s.key}: unknown teaching role`);
    if (!http(s.evidence?.url) || !present(s.evidence?.location) || !present(s.evidence?.finding)) bad(`${s.key}: missing content evidence`);
    // Official version first: a third-party re-upload counts only when the official channels were checked.
    if (s.reupload === true) {
      if (!String(s.access).includes(REUPLOAD_LABEL)) bad(`${s.key}: re-upload must be labelled for readers`);
      if (!present(s.official_search)) bad(`${s.key}: re-upload lacks an official-version check`);
    } else if (s.reupload !== false && REUPLOAD_HINT.test([s.publisher, s.access, s.title].join(' '))) bad(`${s.key}: possible third-party re-upload is not classified`);
  }
  // Notes in the description (out-of-tree prerequisites, scope boundaries, relations) are not topics to teach.
  const expected = topicItems(skill.desc).filter(t => !(skill.descNotes || []).includes(t));
  const topics = record.topics || [];
  const seen = new Set();
  for (const t of topics) {
    if (!expected.includes(t.topic)) bad(`topic is not in current description: ${t.topic}`);
    if (seen.has(t.topic)) bad(`duplicate topic: ${t.topic}`);
    seen.add(t.topic);
    if (!['core','extension'].includes(t.stage)) bad(`${t.topic}: missing scope classification`);
    if (t.stage === 'extension' && !present(t.note)) bad(`${t.topic}: optional scope needs a reason`);
    for (const lang of ['zh','en']) for (const ref of t[lang] || []) {
      const s=sources.get(ref.source);
      if (!s || s.lang!==lang) bad(`${t.topic}: ${lang} topic refers to missing/wrong-language source ${ref.source}`);
      if (!present(ref.section) || !['covered','partial'].includes(ref.extent)) bad(`${t.topic}: missing chapter or coverage extent`);
    }
  }
  for (const topic of expected) if (!seen.has(topic)) bad(`description topic was omitted: ${topic}`);
  const core = topics.filter(t=>t.stage==='core');
  if (!core.length) bad('no core topics');
  const routes = {};
  for (const lang of ['zh','en']) {
    const route=record.routes?.[lang];
    if (!route || !['complete','partial','gap'].includes(route.status)) bad(`${lang}: missing route status`);
    const stepKeys=new Set((route?.steps || []).map(s=>s.source));
    for (const step of route?.steps || []) {
      if (sources.get(step.source)?.lang!==lang) bad(`${lang}: route uses a missing/wrong-language source`);
      if (!present(step.read)) bad(`${lang}: route step lacks reading instructions`);
    }
    const uncovered=core.filter(t=>!(t[lang]||[]).some(ref=>ref.extent==='covered' && sources.get(ref.source)?.lang===lang && sources.get(ref.source)?.role!=='reference' && stepKeys.has(ref.source))).map(t=>t.topic);
    const covered=core.length-uncovered.length;
    const status=!uncovered.length?'complete':covered?'partial':'gap';
    if (route?.status==='complete' && status!=='complete') bad(`${lang}: claims complete but lacks teaching coverage for ${uncovered.join(' / ')}`);
    if (status==='complete' && !(record.sources||[]).some(s=>s.lang===lang && s.role==='primary' && stepKeys.has(s.key))) bad(`${lang}: complete route has no primary teaching material`);
    const declared=route?.gaps || [];
    for (const topic of uncovered) if (!declared.includes(topic)) bad(`${lang}: unreported gap ${topic}`);
    routes[lang]={status,covered,total:core.length,gaps:uncovered,steps:route?.steps||[]};
  }
  for (const f of record.cross_language_fallbacks || []) {
    const lang=f.lang_missing;
    if (!['zh','en'].includes(lang) || !routes[lang]?.gaps.includes(f.topic)) bad('fallback is not an uncovered core topic');
    const s=sources.get(f.source);
    if (!s || s.lang===lang) bad('fallback is not in the other language');
    const topic=topics.find(t=>t.topic===f.topic);
    if (!topic?.[s?.lang]?.some(ref=>ref.source===f.source && ref.extent==='covered')) bad('fallback source does not teach that topic in its own language');
    for (const channel of ['text','video','paid']) if (!(record.searches||[]).some(q=>q.lang===lang && q.channel===channel && present(q.query_or_url) && present(q.result))) bad(`${lang}: fallback lacks ${channel} search record`);
    if (!present(f.reason)) bad('fallback lacks an explanation');
    if (!present(f.confirmed_by)) bad('fallback was not confirmed by a round that had web search');
  }
  return {problems,routes};
}
export function readLearningPaths(directory, skills) {
  const records=new Map();
  if (!fs.existsSync(directory)) return records;
  for (const filename of fs.readdirSync(directory).filter(f=>f.endsWith('.json'))) {
    const record=JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8').replace(/^\uFEFF/,''));
    const skill=skills.get(record.id);
    if (!skill) throw Error(`Unknown learning-path skill ${record.id}`);
    const assessed=assessLearningPath(record,skill);
    if (assessed.problems.length) throw Error(`Learning path ${record.id}: ${assessed.problems.join('; ')}`);
    records.set(record.id,{checkedAt:record.checkedAt,sources:record.sources.map(({evidence,...s})=>s),topics:record.topics,routes:assessed.routes,crossLanguageFallbacks:record.cross_language_fallbacks||[]});
  }
  return records;
}
