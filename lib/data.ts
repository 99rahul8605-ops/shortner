import { query } from '@/lib/db';
export type LinkRow = {id:number;slug:string;destination:string;title:string;enabled:boolean;created_at:string;clicks:number};
export async function getLink(slug:string) {
  const r=await query<{slug:string;destination:string;title:string;enabled:boolean}>('SELECT slug, destination, title, enabled FROM links WHERE slug=$1 LIMIT 1',[slug]);
  return r.rows[0] ?? null;
}
export type SettingName = 'monetag_script_url' | 'inpage_script_url' | 'ads_enabled' | 'ad_1_seconds' | 'ad_2_seconds' | 'ad_3_seconds' | 'final_seconds';
const defaults: Record<SettingName,string>={monetag_script_url:'',inpage_script_url:'',ads_enabled:'false',ad_1_seconds:'30',ad_2_seconds:'30',ad_3_seconds:'30',final_seconds:'10'};
export async function getSettings(){ const r=await query<{key:string;value:string}>('SELECT key,value FROM settings');return {...defaults,...Object.fromEntries(r.rows.map(x=>[x.key,x.value]))} as Record<SettingName,string>; }
export function seconds(s:Record<SettingName,string>,step:number){return Math.min(60,Math.max(5,Number(s[step===4?'final_seconds':`ad_${step}_seconds` as SettingName])|| (step===4?10:30)));}
