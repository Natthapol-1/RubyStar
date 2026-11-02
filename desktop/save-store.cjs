const fs = require('node:fs');
const path = require('node:path');
const MAX_BYTES = 8 * 1024 * 1024;
class SaveStore {
  constructor(directory) { this.directory=directory; this.file=path.join(directory,'profile-v1.json'); this.blocked=false; }
  load() {
    fs.mkdirSync(this.directory,{recursive:true});
    try { const raw=fs.readFileSync(this.file,'utf8'); const data=JSON.parse(raw); if(data.version!==1){this.blocked=true;return {data:null,error:'This save needs a newer Ruby Star. Saving is disabled to preserve it.'};} return {data,error:null}; }
    catch(error) {
      if(error.code==='ENOENT')return {data:null,error:null};
      try { fs.copyFileSync(this.file,this.file+'.corrupt-'+Date.now()); } catch { this.blocked=true; }
      try { const data=JSON.parse(fs.readFileSync(this.file+'.bak','utf8'));if(data.version===1)return {data,error:'Recovered your backup save. The damaged file was preserved.'}; }catch{}
      return {data:null,error:'Could not read your save. A damaged-file copy was preserved when possible.'};
    }
  }
  write(data) {
    if(this.blocked)throw Error('Save is protected');
    const raw=JSON.stringify(data);if(data?.version!==1||Buffer.byteLength(raw)>MAX_BYTES)throw Error('Invalid save');
    fs.mkdirSync(this.directory,{recursive:true});
    const temp=this.file+'.tmp';const fd=fs.openSync(temp,'w');
    try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    // Keep the last readable save, then atomically replace on the same volume.
    if(fs.existsSync(this.file)){try{const previous=JSON.parse(fs.readFileSync(this.file,'utf8'));if(previous.version===1)fs.copyFileSync(this.file,this.file+'.bak');}catch{}}
    fs.renameSync(temp,this.file);
  }
}
module.exports={SaveStore,MAX_BYTES};
