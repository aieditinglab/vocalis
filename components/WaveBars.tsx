'use client'
import { useEffect, useRef } from 'react'
const H = [12,22,32,18,38,26,14,30,36,20,28,16,34,24,18,30,40,14,26,20]
export default function WaveBars({ count=30, active=false, color='#AAFF00', height=44, gap=4 }: { count?:number; active?:boolean; color?:string; height?:number; gap?:number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    for (let i=0; i<count; i++) {
      const b = document.createElement('div')
      b.style.cssText = `width:3px;border-radius:2px;background:${color};transform-origin:center bottom;height:${active?H[i%H.length]:4}px;${active?`animation:wave ${(0.62+(i%5)*0.12).toFixed(2)}s ease-in-out ${(i*0.04).toFixed(2)}s infinite`:''};transition:height 0.3s ease`
      ref.current.appendChild(b)
    }
  }, [active, color, count])
  return <div ref={ref} style={{ display:'flex', alignItems:'center', gap:`${gap}px`, height:`${height}px` }} />
}
