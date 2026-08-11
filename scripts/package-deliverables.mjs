import JSZip from "jszip";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const release=path.join(root,"release");
const ignored=new Set(["node_modules",".git",".next",".vinext",".wrangler","release","dist","tmp"]);
async function addTree(zip,absolute,inside){for(const name of await readdir(absolute)){if(ignored.has(name)||name.endsWith(".log")||name.endsWith(".tsbuildinfo"))continue;const full=path.join(absolute,name),target=path.posix.join(inside,name);if((await stat(full)).isDirectory())await addTree(zip,full,target);else zip.file(target,await readFile(full))}}
await rm(release,{recursive:true,force:true});await mkdir(release,{recursive:true});
const source=new JSZip();
for(const name of ["README.md","README.zh-CN.md","package.json","package-lock.json"]){source.file(name,await readFile(path.join(root,name)))}
await addTree(source,path.join(root,"apps","web"),"apps/web");await addTree(source,path.join(root,"packages","core"),"packages/core");
await writeFile(path.join(release,"multiport-proxy-cloudflare-source.zip"),await source.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:9}}));
const built=new JSZip();await addTree(built,path.join(root,"apps","web","dist"),"dist");
await writeFile(path.join(release,"multiport-proxy-built-site.zip"),await built.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:9}}));
console.log(`Created MultiPort-Proxy deployment files in ${release}`);
