import type{Config}from'tailwindcss'
const config:Config={content:['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],theme:{extend:{colors:{accent:'#AAFF00',hot:'#FF3054',amber:'#FFB800',blue:'#00AEFF',card:'#141414',card2:'#1C1C1C'},fontFamily:{display:['var(--font-unbounded)','system-ui','sans-serif'],body:['var(--font-dm-sans)','system-ui','sans-serif']}}},plugins:[]}
export default config
