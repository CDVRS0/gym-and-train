const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../hooks/useGymCloudSync.js'), 'utf8')
 .replace(/^import .*;\n/gm, '').replace('export function useGymCloudSync', 'function useGymCloudSync');
const baseline = () => ({ history:[],sessions:[],settings:{weightUnit:'kg'},runLogs:[],bbLogs:[],drafts:{},water:{},loads:{} });
function harness({ cloud = baseline(), readError = null, write = async () => ({error:null}) } = {}) {
 let state = baseline(), slots=[], index=0, effects=[], dirty=false, result, authCallback;
 const writes=[], timers=new Map(), listeners={}; let timerId=0, reads=0;
 const changed = (a,b) => !a || a.length !== b.length || a.some((x,i) => x !== b[i]);
 const context = vm.createContext({
  console:{error(){}}, navigator:{onLine:true}, Date, JSON,
  localStorage:{setItem(){}},
  window:{addEventListener:(name,cb)=>listeners[name]=cb,removeEventListener:(name)=>delete listeners[name]},
  setTimeout:(cb)=>{timers.set(++timerId,cb);return timerId;}, clearTimeout:(id)=>timers.delete(id),
  useRef:(initial)=> {const i=index++; return slots[i] ||= {current:initial};},
  useState:(initial)=> {const i=index++; if(!slots[i]) slots[i]={value:initial}; return [slots[i].value,(next)=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;dirty=true;}];},
  useCallback:(fn,deps)=> {const i=index++; if(!slots[i] || changed(slots[i].deps,deps)) slots[i]={fn,deps};return slots[i].fn;},
  useEffect:(fn,deps)=> {const i=index++;if(!slots[i] || changed(slots[i].deps,deps)){const previous=slots[i];slots[i]={deps,cleanup:previous?.cleanup};effects.push(()=>{slots[i].cleanup?.(); slots[i].cleanup=fn();});}},
  supabase:{
   auth:{onAuthStateChange:(cb)=>{authCallback=cb;return {data:{subscription:{unsubscribe(){}}}};},getSession:async()=>({data:{session:{user:{id:'user-one'}}}})},
   from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{reads++;return {data:cloud?{state:cloud}:null,error:readError};}})}),upsert:async(payload)=>{writes.push(payload);return await write(payload);}}),
  },
 });
 vm.runInContext(source,context);
 function render(){index=0;effects=[];dirty=false;result=context.useGymCloudSync({state,setState:(s)=>{state=s;dirty=true;},loaded:true});for(const effect of effects) effect();}
 async function settle(){for(let i=0;i<10;i++){await new Promise(setImmediate);if(dirty)render();}}
 render();
 return {writes, get result(){return result;},get reads(){return reads;}, async settle(){await settle();}, async change(next){state={...state,...next};render();await settle();}, async timers(){const list=[...timers.values()];timers.clear();for(const cb of list)cb();await settle();}, async online(){listeners.online?.();await settle();}, auth(event,user){authCallback(event,{user});}, async resolve(choice){await result.resolveConflict(choice);await settle();}};
}
test('failed recovery cannot upload local defaults', async()=>{
 const h=harness({readError:new Error('offline')});await h.settle();assert.equal(h.result.syncStatus,'error');
 await h.change({history:[{id:'new'}]});await h.timers();assert.equal(h.writes.length,0);
});
test('local-only state requires explicit first upload',async()=>{
 const h=harness({cloud:null});await h.settle();assert.equal(h.result.syncStatus,'needs-decision');await h.timers();assert.equal(h.writes.length,0);
 await h.resolve('local');assert.equal(h.writes.length,1);
});
test('conflict resolution saves latest edits made while choosing',async()=>{
 const h=harness({cloud:{...baseline(),history:[{id:'cloud'}]}});await h.settle();
 await h.change({history:[{id:'latest-local'}]});await h.resolve('local');assert.equal(h.writes[0].state.history[0].id,'latest-local');
});
test('cloud recovery normalizes absent optional collections',async()=>{
 const h=harness({cloud:{history:[],sessions:[],settings:{weightUnit:'lb'}}});await h.settle();await h.resolve('cloud');assert.equal(h.result.conflict,null);assert.equal(h.result.syncStatus,'synced');
});
test('edits during an in-flight save are serialized and eventually saved',async()=>{
 let release;let calls=0;const h=harness({write:async()=>{calls++;if(calls===1)await new Promise(resolve=>release=resolve);return {error:null};}});
 await h.settle();await h.change({history:[{id:'first'}]});await h.timers();assert.equal(h.writes.length,1);
 await h.change({history:[{id:'latest'}]});await h.timers();assert.equal(h.writes.length,1);
 release();await h.settle();assert.equal(h.writes.length,2);assert.equal(h.writes[1].state.history[0].id,'latest');assert.equal(h.result.syncStatus,'synced');
});
test('token refresh does not restart recovery',async()=>{
 const h=harness();await h.settle();const reads=h.reads;h.auth('TOKEN_REFRESHED',{id:'user-one'});await h.timers();assert.equal(h.reads,reads);
});
test('sign-out prevents queued uploads',async()=>{
 const h=harness();await h.settle();h.auth('SIGNED_OUT',null);await h.timers();await h.change({history:[{id:'local-only'}]});await h.timers();assert.equal(h.writes.length,0);assert.equal(h.result.syncStatus,'offline');
});
