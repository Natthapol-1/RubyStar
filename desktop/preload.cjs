const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('rubyDesktop',Object.freeze({
  load:()=>ipcRenderer.invoke('profile:load'),
  save:data=>ipcRenderer.invoke('profile:save',data),
  fullscreen:()=>ipcRenderer.invoke('window:fullscreen'),
  quit:()=>ipcRenderer.invoke('window:quit'),
  onClosing:callback=>{const handler=()=>callback();ipcRenderer.on('window:closing',handler);return ()=>ipcRenderer.removeListener('window:closing',handler);},
  closeReady:(saved=true)=>ipcRenderer.send('window:close-ready',saved),
}));
