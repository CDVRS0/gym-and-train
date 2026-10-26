const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname,'../hooks/useGymCloudSync.js'),'utf8').replace(/^import .*;\n/gm,'').replace('export function useGymCloudSync','function useGymCloudSync');
const baseline = () => ({history:[],sessions:[],settings:{weightUnit:'kg'},runLogs:[],bbLogs:[],drafts:{},water:{},loads:{}});
function harness({cloud=baseline(),local=baseline(),readError=null,read=async()=>{},write=async()=>null}={}) {
 let state=local,slots=[],index=0,effects=[],dirty=false,result,authCallback,reads=0,now=1;
 let remote=cloud?{state:cloud,updated_at:'2026-10-25T01:00:00.000Z'}:null;
 const writes=[],timers=new Map(),listeners={},documentListeners={};let timerId=0;
 const setState=next=>{state=typeof next==='function'?next(state):next;dirty=true;};
 const changed=(a,b)=>!a||a.length!==b.length||a.some((x,i)=>x!==b[i]);
 const context=vm.createContext({console,navigator:{onLine:true},document:{visibilityState:'visible',addEventListener:(name,cb)=>documentListeners[name]=cb,removeEventListener:name=>delete documentListeners[name]},Date,JSON,AbortSignal,
  window:{addEventListener:(name,cb)=>listeners[name]=cb,removeEventListener:name=>delete listeners[name]},
  setTimeout:cb=>{timers.set(++timerId,cb);return timerId;},clearTimeout:id=>timers.delete(id),
  useRef:initial=>{const i=index++;return slots[i]||=( {current:initial});},
  useState:initial=>{const i=index++;if(!slots[i])slots[i]={value:initial};return [slots[i].value,next=>{slots[i].value=typeof next==='function'?next(slots[i].value):next;dirty=true;}];},
  useCallback:(fn,deps)=>{const i=index++;if(!slots[i]||changed(slots[i].deps,deps))slots[i]={fn,deps};return slots[i].fn;},
  useEffect:(fn,deps)=>{const i=index++;if(!slots[i]||changed(slots[i].deps,deps)){const prev=slots[i];slots[i]={deps,cleanup:prev?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn();});}},
  supabase:{auth:{onAuthStateChange:cb=>{authCallback=cb;return {data:{subscription:{unsubscribe(){}}}};},getSession:async()=>({data:{session:{user:{id:'user-one'}}}})},
   from:table=>{
    assert.equal(table,'gym_app_state');let operation='read',payload,version,user;
    const finish=async()=>{
     assert.ok(user==='user-one'||user==='user-two');
     if(operation==='read'){reads++;await read(reads);return {data:remote,error:readError};}
     writes.push({user,payload,operation,version});const error=await write(payload,writes.length);
     if(error)return {data:null,error};
     if(operation==='insert'&&remote)return {data:null,error:{code:'23505',message:'Already exists'}};
     if(operation==='update'&&remote?.updated_at!==version)return {data:null,error:null};
     remote={state:payload.state,updated_at:new Date(Date.parse(payload.updated_at)+now++).toISOString()};return {data:{updated_at:remote.updated_at},error:null};
    };
    const chain={select(){return chain;},eq(key,value){if(key==='user_id')user=value;if(key==='updated_at')version=value;return chain;},abortSignal(){return chain;},update(value){operation='update';payload=value;return chain;},insert(value){operation='insert';payload=value;user=value.user_id;return chain;},maybeSingle:finish,single:finish};return chain;
   }
  }
 });
 vm.runInContext(source,context);
 function render(){index=0;effects=[];dirty=false;result=context.useGymCloudSync({state,setState,loaded:true,createEmptyState:baseline});for(const effect of effects)effect();}
 async function settle(){for(let i=0;i<10;i++){await new Promise(setImmediate);if(dirty)render();}}
 render();
 return {writes,get result(){return result;},get state(){return state;},get reads(){return reads;},get remote(){return remote;},setRemote(next){remote=next;},settle,async change(next){setState({...state,...next});render();await settle();},async timers(){const list=[...timers.values()];timers.clear();for(const cb of list)cb();await settle();},async online(){context.navigator.onLine=true;listeners.online?.();await settle();},async offline(){context.navigator.onLine=false;listeners.offline?.();await settle();},auth(event,user){authCallback(event,user?{user}:null);},async retry(){await result.retrySync();await settle();},beforeUnload:event=>listeners.beforeunload(event),async foreground(){documentListeners.visibilitychange?.();await settle();}};
}
test('cloud history always replaces device history without prompting or uploading the device snapshot',async()=>{
 const h=harness({cloud:{...baseline(),history:[{id:'cloud'}]},local:{...baseline(),history:[{id:'device-only'}]}});await h.settle();await h.timers();
 assert.equal(h.state.history[0].id,'cloud');assert.equal(h.result.cloudReady,true);assert.equal(h.result.syncStatus,'synced');assert.equal(h.writes.length,0);
});
test('failed read never authorizes writes or a device-data fallback',async()=>{
 const h=harness({readError:Error('offline'),local:{...baseline(),history:[{id:'local'}]}});await h.settle();await h.change({history:[{id:'new'}]});await h.timers();assert.equal(h.result.cloudReady,false);assert.equal(h.result.syncStatus,'error');assert.equal(h.writes.length,0);
});
test('each workout edit automatically saves using owner and expected cloud revision',async()=>{
 const h=harness();await h.settle();await h.change({history:[{id:'workout'}]});assert.equal(h.result.syncStatus,'loading');await h.timers();
 assert.equal(h.writes.length,1);assert.equal(h.writes[0].user,'user-one');assert.ok(h.writes[0].version);assert.equal(h.remote.state.history[0].id,'workout');assert.equal(h.result.syncStatus,'synced');
});
test('a new cloud account starts empty and inserts only its new edits',async()=>{
 const h=harness({cloud:null,local:{...baseline(),history:[{id:'device-only'}]}});await h.settle();assert.equal(h.state.history.length,0);await h.timers();assert.equal(h.writes.length,0);
 await h.change({history:[{id:'new'}]});await h.timers();assert.equal(h.writes[0].operation,'insert');assert.equal(h.remote.state.history[0].id,'new');
});
test('edits during a pending save are serialized and saved with the returned revision',async()=>{
 let release;const h=harness({write:async(_p,count)=>{if(count===1)await new Promise(resolve=>release=resolve);}});await h.settle();await h.change({history:[{id:'first'}]});await h.timers();
 await h.change({history:[{id:'latest'}]});await h.timers();assert.equal(h.writes.length,1);release();await h.settle();assert.equal(h.writes.length,2);assert.equal(h.remote.state.history[0].id,'latest');assert.equal(h.result.syncStatus,'synced');
});
test('failed saves stay visibly unsaved and retry without reading over the pending workout',async()=>{
 let fail=true;const h=harness({write:async()=>fail?Error('network'):null});await h.settle();await h.change({history:[{id:'pending'}]});await h.timers();assert.equal(h.result.syncStatus,'error');const reads=h.reads;fail=false;await h.retry();assert.equal(h.reads,reads);assert.equal(h.result.syncStatus,'synced');assert.equal(h.remote.state.history[0].id,'pending');
});
test('a newer cloud revision on another device is never silently overwritten',async()=>{
 const h=harness();await h.settle();h.setRemote({state:{...baseline(),history:[{id:'other-device'}]},updated_at:'2026-10-25T02:00:00.000Z'});await h.change({history:[{id:'unsaved'}]});await h.timers();
 assert.equal(h.result.syncStatus,'error');assert.match(h.result.errorMessage,/another device/);assert.equal(h.remote.state.history[0].id,'other-device');await h.retry();assert.equal(h.writes.length,1);
});
test('offline cannot report a save; reconnect retries pending changes',async()=>{
 const h=harness();await h.settle();await h.offline();await h.change({history:[{id:'pending'}]});await h.timers();assert.equal(h.writes.length,0);assert.equal(h.result.syncStatus,'offline');await h.online();assert.equal(h.remote.state.history[0].id,'pending');
});
test('token refresh does not reload history; sign-out clears account data and blocks uploads',async()=>{
 const h=harness({cloud:{...baseline(),history:[{id:'cloud'}]}});await h.settle();const reads=h.reads;h.auth('TOKEN_REFRESHED',{id:'user-one'});await h.timers();assert.equal(h.reads,reads);h.auth('SIGNED_OUT',null);await h.timers();assert.equal(h.result.cloudReady,false);assert.equal(h.state.history.length,0);assert.equal(h.result.syncStatus,'signed-out');await h.change({history:[{id:'late'}]});await h.timers();assert.equal(h.writes.length,0);
});
test('clean foreground refresh loads latest cloud history and dirty unload warns',async()=>{
 const h=harness();await h.settle();h.setRemote({state:{...baseline(),history:[{id:'remote'}]},updated_at:'2026-10-25T02:00:00.000Z'});await h.foreground();assert.equal(h.state.history[0].id,'remote');
 await h.change({history:[{id:'pending'}]});let prevented=false;const event={preventDefault(){prevented=true;}};h.beforeUnload(event);assert.equal(prevented,true);
});
test('cloud restores missing optional collections from defaults',async()=>{
 const h=harness({cloud:{history:[],sessions:[],settings:{weightUnit:'lb'}}});await h.settle();assert.equal(h.state.settings.weightUnit,'lb');assert.ok(Array.isArray(h.state.runLogs));
});

test('an edit made during a foreground cloud read is never discarded',async()=>{
 let release;const h=harness({read:async count=>{if(count===2)await new Promise(resolve=>release=resolve);}});await h.settle();await h.foreground();
 await h.change({history:[{id:'newly-entered'}]});h.setRemote({state:{...baseline(),history:[{id:'other-device'}]},updated_at:'2026-10-25T02:00:00.000Z'});release();await h.settle();
 assert.equal(h.state.history[0].id,'newly-entered');assert.equal(h.result.syncStatus,'error');assert.equal(h.remote.state.history[0].id,'other-device');
});
