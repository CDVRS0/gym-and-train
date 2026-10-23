const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function handler(env, fetch) {
 const source = fs.readFileSync(require('node:path').join(__dirname,'../app/api/coach/route.js'),'utf8').replace('export async function POST','async function POST');
 return vm.runInNewContext(source+'; POST;', { process:{env}, fetch, Response, URL, AbortSignal });
}
const request = (body, auth = 'Bearer user-token') => new Request('http://localhost/api/coach',{method:'POST',headers:auth ? {Authorization:auth} : {},body:JSON.stringify(body)});
test('coach proxy clearly reports missing backend configuration', async()=>{
 assert.equal((await handler({},()=>{})(request({message:'Hi'}))).status,503);
});
test('coach proxy requires a bearer token before forwarding',async()=>{
 let called=false;const post=handler({CDVRS_AI_URL:'https://ai.example'},()=>{called=true;});
 assert.equal((await post(request({message:'Hi'},null))).status,401);assert.equal(called,false);
});
test('coach forwards only question and bearer to fixed central endpoint',async()=>{
 let forwarded;const post=handler({CDVRS_AI_URL:'https://ai.example/some/path'},async(url,options)=>{forwarded={url:String(url),options};return Response.json({message:'Advice'});});
 assert.equal((await post(request({message:'What today?',user_id:'victim',url:'https://evil.example',records:[1]}))).status,200);
 assert.equal(forwarded.url,'https://ai.example/api/training/coach');assert.equal(forwarded.options.headers.Authorization,'Bearer user-token');assert.deepEqual(JSON.parse(forwarded.options.body),{message:'What today?'});assert.equal(forwarded.options.redirect,'error');
});
test('coach rejects non-HTTPS targets in production',async()=>{
 const post=handler({CDVRS_AI_URL:'http://localhost:3000',NODE_ENV:'production'},()=>{throw Error('must not call');});assert.equal((await post(request({message:'Hi'}))).status,503);
});
test('coach rejects oversized input and propagates central auth failure',async()=>{
 const post=handler({CDVRS_AI_URL:'https://ai.example'},async()=>Response.json({error:'Sign in'},{status:401}));
 assert.equal((await post(request({message:'x'.repeat(8001)}))).status,400);assert.equal((await post(request({message:'Hi'}))).status,401);
});
