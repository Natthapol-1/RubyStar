const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),scratch=path.join(root,'.tmp');
fs.mkdirSync(scratch,{recursive:true});
const stage=fs.mkdtempSync(path.join(scratch,'desktop-build-'));
// Build a snapshot so Next's intermediate files never conflict with a running web/app dev server.
if(path.dirname(stage)!==path.join(root,'.tmp'))throw Error('Invalid staging directory');
fs.mkdirSync(stage,{recursive:true});
for(const name of ['app','components','game','public']){const destination=path.join(stage,name);fs.rmSync(destination,{recursive:true,force:true});fs.cpSync(path.join(root,name),destination,{recursive:true});}
for(const name of ['next.config.ts','tsconfig.json','package.json','package-lock.json','next-env.d.ts'])if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(stage,name));
const result=spawnSync(process.execPath,[require.resolve('next/dist/bin/next'),'build',stage],{cwd:stage,stdio:'inherit',env:{...process.env,RUBY_DESKTOP:'1'}});
if(result.status!==0)process.exit(result.status??1);
const destination=path.join(root,'out');if(path.dirname(destination)!==root)throw Error('Invalid export destination');
fs.rmSync(destination,{recursive:true,force:true});fs.cpSync(path.join(stage,'.next-desktop'),destination,{recursive:true});
