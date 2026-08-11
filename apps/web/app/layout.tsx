import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});
export const metadata:Metadata={title:"Portsmith — Multi-port proxy workspace",description:"Convert nodes into local Mihomo listeners and browser profiles without uploading secrets.",openGraph:{title:"Portsmith",description:"Turn nodes into clean local ports.",images:[{url:"/og.png",width:1200,height:630}]},twitter:{card:"summary_large_image",title:"Portsmith",description:"Turn nodes into clean local ports.",images:["/og.png"]}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
