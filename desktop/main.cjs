const {app,BrowserWindow,ipcMain,protocol,session,Menu,dialog}=require('electron');
const path=require('node:path');const fs=require('node:fs');
const {SaveStore}=require('./save-store.cjs');
const {Readable}=require('node:stream');
protocol.registerSchemesAsPrivileged([{scheme:'ruby',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
app.setName('Ruby Star');
app.setPath('userData',app.commandLine.getSwitchValue('user-data-dir')||(process.env.RUBY_STAR_TEST_DATA&&!app.isPackaged?process.env.RUBY_STAR_TEST_DATA:path.join(app.getPath('appData'),'Ruby Star')));
let win,store,closing=false,closeTimer;
const dev=process.argv.includes('--dev');const origin=dev?'http://127.0.0.1:3001':'ruby://game';
if(!app.requestSingleInstanceLock())app.quit();
else {
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
app.whenReady().then(()=>{
 store=new SaveStore(path.join(app.getPath('userData'),'saves'));
 const root=app.isPackaged?path.join(process.resourcesPath,'game'):path.resolve(__dirname,'../out');
 protocol.handle('ruby',request=>{
  const url=new URL(request.url);if(url.host!=='game')return new Response('',{status:403});
  let target;try{target=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{return new Response('',{status:400});}
  if(!target.startsWith(root+path.sep)&&target!==root)return new Response('',{status:403});
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target)&&fs.existsSync(target+'.html'))target+='.html';
  if(!fs.existsSync(target)||!fs.statSync(target).isFile())return new Response('',{status:404});
  const size=fs.statSync(target).size;
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'}[path.extname(target)]||'application/octet-stream';
  const headers={'Content-Type':mime,'Accept-Ranges':'bytes','Content-Length':String(size)};
  if(!dev)headers['Content-Security-Policy']="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'";
  const range=request.headers.get('range');let start=0,end=size-1,status=200;
  if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416});
    start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
    if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;headers['Content-Length']=String(end-start+1);
  }
  return new Response(request.method==='HEAD'||size===0?null:Readable.toWeb(fs.createReadStream(target,{start,end})),{status,headers});
 });
 session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(origin+'/')&&details.url!==origin&&!details.url.startsWith('data:')&&!(dev&&details.url.startsWith('ws://127.0.0.1:3001/'))}));
 if(!dev)session.defaultSession.webRequest.onHeadersReceived((details,callback)=>callback({responseHeaders:{...details.responseHeaders,'Content-Security-Policy':["default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'"]}}));
 Menu.setApplicationMenu(null);
 win=new BrowserWindow({title:'Ruby Star',width:1280,height:800,minWidth:1024,minHeight:600,icon:path.join(__dirname,'icon.ico'),backgroundColor:'#07080f',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==new URL(origin).origin||(!dev&&!url.startsWith('ruby://game/')))event.preventDefault();});
 const trusted=event=>{if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame)throw Error('Untrusted sender');const url=event.senderFrame.url;if(!url.startsWith(origin+'/'))throw Error('Untrusted origin');};
 ipcMain.handle('profile:load',event=>{trusted(event);return store.load();});
 ipcMain.handle('profile:save',(event,data)=>{trusted(event);store.write(data);return true;});
 ipcMain.handle('window:fullscreen',event=>{trusted(event);win.setFullScreen(!win.isFullScreen());return win.isFullScreen();});
 ipcMain.handle('window:quit',event=>{trusted(event);win.close();});
 ipcMain.on('window:close-ready',(event,saved)=>{trusted(event);clearTimeout(closeTimer);closeTimer=undefined;if(saved===false)return;closing=true;win.close();});
 win.on('close',event=>{if(!closing){event.preventDefault();win.webContents.send('window:closing');closeTimer??=setTimeout(()=>{closing=true;win.close();},5000);}});
 win.once('ready-to-show',()=>win.show());win.loadURL(origin+'/').catch(error=>{dialog.showErrorBox('Ruby Star could not start','Unable to load the game assets. Rebuild or reinstall Ruby Star.\n'+error.message);closing=true;app.quit();});
});
app.on('window-all-closed',()=>app.quit());
}
