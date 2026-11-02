import assert from 'node:assert/strict';
import test from 'node:test';
import {assessLearningPath} from '../scripts/learning-paths.mjs';
const skill={id:'P.1.1',name:'程序设计基础',desc:'变量、调试。'};
const source=(key,lang)=>({key,lang,title:'教程',url:'https://example.org/'+key,tier:'material',free:true,role:'primary',covers:'变量和调试',access:'公开正文',evidence:{url:'https://example.org/'+key,location:'第1、2章',finding:'有分步示例及习题'}});
const ref=source=>[{source,section:'第1、2章',extent:'covered'}];
function audit(){return {id:skill.id,name:skill.name,description:skill.desc,sources:[source('zh1','zh'),source('en1','en')],topics:['变量','调试'].map(topic=>({topic,stage:'core',zh:ref('zh1'),en:ref('en1')})),routes:{zh:{status:'complete',steps:[{source:'zh1',read:'读第1、2章'}],gaps:[]},en:{status:'complete',steps:[{source:'en1',read:'Read chapters 1–2'}],gaps:[]}},searches:[],cross_language_fallbacks:[]};}
test('independent complete routes retain chapter-level coverage',()=>{
 const result=assessLearningPath(audit(),skill);assert.deepEqual(result.problems,[]);assert.equal(result.routes.zh.covered,2);assert.equal(result.routes.en.status,'complete');
});
test('coverage, free teaching and uncertain access are counted separately',()=>{
 const record=audit();record.sources[0].free=false;
 let route=assessLearningPath(record,skill).routes.zh;
 assert.equal(route.status,'complete');assert.equal(route.freeCovered,0);assert.deepEqual(route.paidTopics,['变量','调试']);
 record.sources[0].free=null;route=assessLearningPath(record,skill).routes.zh;
 assert.equal(route.freeCovered,0);assert.deepEqual(route.paidTopics,[]);assert.deepEqual(route.accessPendingTopics,['变量','调试']);
});
test('reference-only material cannot establish a novice teaching route',()=>{
 const record=audit();record.sources[0].role='reference';const result=assessLearningPath(record,skill);assert(result.problems.some(s=>s.includes('claims complete')));assert.equal(result.routes.zh.status,'gap');
});
test('English coverage cannot silently satisfy the Chinese route',()=>{
 const record=audit();record.topics[1].zh=ref('en1');assert(assessLearningPath(record,skill).problems.some(s=>s.includes('wrong-language')));
});
test('omitting a hard topic or stale description is rejected',()=>{
 const record=audit();record.topics.pop();record.description='变量。';const p=assessLearningPath(record,skill).problems;assert(p.some(s=>s.includes('stale')));assert(p.some(s=>s.includes('omitted')));
});
test('a cross-language fallback requires real text, video and paid search records',()=>{
 const record=audit();record.topics[1].zh=[];record.routes.zh={status:'partial',steps:[{source:'zh1',read:'读变量章节'}],gaps:['调试']};record.cross_language_fallbacks=[{lang_missing:'zh',topic:'调试',source:'en1',reason:'本轮未找到合适中文教学'}];
 assert.equal(assessLearningPath(record,skill).problems.filter(s=>s.includes('search record')).length,3);
 record.searches=['text','video','paid'].map(channel=>({lang:'zh',channel,query_or_url:'实际候选查询',result:'明确说明为何不覆盖调试'}));
 assert(assessLearningPath(record,skill).problems.some(s=>s.includes('confirmed')),'a fallback from a round without web search must not pass');
 record.cross_language_fallbacks[0].confirmed_by='review/pi-additions/P.1.1.json';assert.deepEqual(assessLearningPath(record,skill).problems,[]);
});
test('a third-party re-upload counts only after the official version was checked',()=>{
 const record=audit();record.sources[0].publisher='个人账号转载的大学课程录像';
 assert(assessLearningPath(record,skill).problems.some(s=>s.includes('not classified')),'undeclared re-upload');
 record.sources[0].reupload=true;let p=assessLearningPath(record,skill).problems;
 assert(p.some(s=>s.includes('labelled')));assert(p.some(s=>s.includes('official-version')));
 record.sources[0].access='第三方转载，授权未核。'+record.sources[0].access;record.sources[0].official_search='学校课程中心与中国大学MOOC均无该课免费录像';
 assert.deepEqual(assessLearningPath(record,skill).problems,[]);
 record.sources[0].reupload=false;record.sources[0].access='公开正文';assert.deepEqual(assessLearningPath(record,skill).problems,[],'explicitly official sources pass');
});
