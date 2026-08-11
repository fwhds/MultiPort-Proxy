import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});
export const metadata:Metadata={title:"MultiPort-Proxy — Mihomo multi-port converter",description:"Convert Clash YAML and proxy share links into local Mihomo listeners and PortPilot browser profiles without uploading secrets.",openGraph:{title:"MultiPort-Proxy",description:"Turn proxy nodes into clean local ports.",images:[{url:"/og.png",width:1200,height:630}]},twitter:{card:"summary_large_image",title:"MultiPort-Proxy",description:"Turn proxy nodes into clean local ports.",images:["/og.png"]}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
