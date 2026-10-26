const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../lib/gym-auth.js'), 'utf8').replaceAll('export async function', 'async function');
const { passwordSignIn, setAccountPassword, sendAccountLink } = vm.runInNewContext(source + '; ({passwordSignIn,setAccountPassword,sendAccountLink})');
test('password login sends trimmed email and exact password without creating an account', async () => {
  let sent;
  const client = { auth: { signInWithPassword: async args => { sent=args;return {data:{user:{id:'existing'}}}; } } };
  const result = await passwordSignIn(client, ' account@example.com ', ' spaces stay ');
  assert.equal(sent.email,'account@example.com');assert.equal(sent.password,' spaces stay ');assert.equal(result.user.id,'existing');
  await assert.rejects(passwordSignIn(client,'account@example.com',''),/Enter your email and password/);
});
test('password sign-in failures are reported rather than treated as success', async () => {
  await assert.rejects(passwordSignIn({auth:{signInWithPassword:async()=>({error:Error('Invalid login credentials')})}},'a@example.com','bad'),/Invalid login/);
});
test('setting a password updates the authenticated existing user, without any workout access', async () => {
  let updated;
  await setAccountPassword({auth:{getUser:async()=>({data:{user:{id:'same-owner'}}}),updateUser:async args=>{updated=args;return {};}}},'long password','long password');
  assert.deepEqual(Object.keys(updated),['password']);assert.equal(updated.password,'long password');
});
test('invalid password confirmation and missing authentication cannot update an account', async () => {
  let called=false;
  const client={auth:{getUser:async()=>({data:{user:null}}),updateUser:async()=>{called=true;}}};
  await assert.rejects(setAccountPassword(client,'short','short'),/at least 8/);
  await assert.rejects(setAccountPassword(client,'long password','different'),/do not match/);
  await assert.rejects(setAccountPassword(client,'long password','long password'),/Sign in/);
  assert.equal(called,false);
});
test('Supabase password policy and reauthentication errors remain visible', async () => {
  await assert.rejects(setAccountPassword({auth:{getUser:async()=>({data:{user:{id:'owner'}}}),updateUser:async()=>({error:Error('Reauthentication required')})}},'long password','long password'),/Reauthentication/);
});
test('setup link targets this app and never creates a new user', async () => {
  let sent;
  await sendAccountLink({auth:{signInWithOtp:async args=>{sent=args;return {};}}},' existing@example.com ','https://gym.example');
  assert.equal(sent.email,'existing@example.com');assert.equal(sent.options.shouldCreateUser,false);assert.equal(sent.options.emailRedirectTo,'https://gym.example');
});
test('client explicitly persists and refreshes sessions without changing the existing storage key', () => {
  const code=fs.readFileSync(path.join(__dirname,'../lib/supabase.js'),'utf8').replace(/^import .*;\n/gm,'').replace('export const supabase','const supabase');let options;
  vm.runInNewContext(code,{process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'public'}},createClient:(_url,_key,config)=>{options=config;}});
  assert.equal(options.auth.persistSession,true);assert.equal(options.auth.autoRefreshToken,true);assert.equal(options.auth.detectSessionInUrl,true);assert.equal(options.auth.storageKey,undefined);
});
test('real Supabase SDK restores the same account after client recreation and refreshes expired tokens', async () => {
  const {createClient}=require('@supabase/supabase-js');const saved=new Map();let refreshes=0;
  const user={id:'existing-owner',email:'existing@example.com'};
  const token=exp=>['e30',Buffer.from(JSON.stringify({sub:user.id,exp})).toString('base64url'),'test'].join('.');
  const session=()=>({access_token:token(Math.floor(Date.now()/1000)+3600),refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,user});
  const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
  const fetch=async url=>{if(String(url).includes('grant_type=refresh_token'))refreshes++;return Response.json(session());};
  const options={auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage},global:{fetch}};
  const first=createClient('https://test-project.supabase.co','public-test',options);
  await first.auth.signInWithPassword({email:user.email,password:'synthetic-test-only'});
  const reopened=createClient('https://test-project.supabase.co','public-test',options);
  assert.equal((await reopened.auth.getSession()).data.session.user.id,user.id);
  const key='sb-test-project-auth-token';const expired=JSON.parse(saved.get(key));expired.expires_at=1;saved.set(key,JSON.stringify(expired));
  const expiredReopen=createClient('https://test-project.supabase.co','public-test',options);
  assert.equal((await expiredReopen.auth.getSession()).data.session.user.id,user.id);assert.equal(refreshes,1);
});
test('auth panel compiles with the existing Next compiler and sign-out is session-local', async () => {
  const code=fs.readFileSync(path.join(__dirname,'../components/GymCloudSync.jsx'),'utf8');
  const {transform,loadBindings}=require('next/dist/build/swc');await loadBindings();
  const result=await transform(code,{filename:'GymCloudSync.jsx',jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  assert.ok(result.code);assert.match(code,/signOut\(\{ scope: 'local' \}\)/);
});
