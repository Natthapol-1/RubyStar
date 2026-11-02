const {spawn}=require('node:child_process');
const path=require('node:path');
const address='http://127.0.0.1:3001';
let server,electron,stopping=false;
function stop(){
 if(stopping)return;stopping=true;electron?.kill();
 if(server&&server.exitCode===null){if(process.platform==='win32')spawn('taskkill',['/pid',String(server.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});else server.kill();}
}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
async function probe(){
 try{const response=await fetch(address,{signal:AbortSignal.timeout(30000)});const html=await response.text();return html.includes('<title>Ruby Star</title>')?'ruby':'other';}
 catch{return 'unavailable';}
}
(async()=>{
 const existing=await probe();
 if(existing==='other')throw Error('Port 3001 is occupied by another application. Stop that server or use npm run dev:web on a different port.');
 if(existing==='ruby')console.log('Reusing Ruby Star at '+address+'; opening or focusing the desktop app.');
 else{
   server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--port','3001','--hostname','127.0.0.1'],{stdio:'inherit',windowsHide:true,env:{...process.env,RUBY_DESKTOP_DEV:'1'}});
   server.on('exit',stop);server.on('error',error=>{console.error(error.message);stop();});
   let ready=false;
   for(let i=0;i<120&&!stopping;i++){if(await probe()==='ruby'){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,500));}
   if(stopping)return;if(!ready)throw Error('Ruby Star development server did not become ready.');
 }
 if(stopping)return;
 electron=spawn(require('electron'),[path.join(__dirname,'main.cjs'),'--dev'],{stdio:'inherit'});
 electron.on('exit',stop);electron.on('error',error=>{console.error(error.message);stop();});
})().catch(error=>{console.error(error.message);stop();process.exitCode=1;});
