import fs from 'fs';
import { execFileSync } from 'child_process';
const KEY = fs.readFileSync(process.env.HOME + '/Documents/Personal/content-rabbit/code/Content Rabbit/apps/website/.env.local','utf8')
  .split('\n').find(l=>/^WAVESPEED_API_KEY/i.test(l)).split('=')[1].trim().replace(/"/g,'');
const T='/tmp/chain'; const OUT = process.env.HOME + '/code/vibe-mp4-final/viberadio-chain.mp4';
const H={'Authorization':`Bearer ${KEY}`}; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const post=(m,b)=>fetch(`https://api.wavespeed.ai/api/v3/${m}`,{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
const poll=async id=>{for(let i=0;i<60;i++){const j=await(await fetch(`https://api.wavespeed.ai/api/v3/predictions/${id}/result`,{headers:H})).json();const s=j?.data?.status;if(s==='completed')return j.data.outputs[0];if(s==='failed')throw new Error('failed '+JSON.stringify(j).slice(0,150));await sleep(2500);}throw new Error('timeout');};
const dl=async(u,p)=>fs.writeFileSync(p,Buffer.from(await(await fetch(u)).arrayBuffer()));

// per-beat VO lines (synced: line i plays at i*5s), sportscaster narrating HER coding session
// ElevenLabs Eleven V3 — expressive; audio tags drive hype delivery
const LINES=[
 "[energetically] You're locked in to Vibe Radio — the only station that ships while you sleep!",
 "Bottom of the ninth... the build is loading... and the tests step up to the plate!",
 "[shouting] GREEN! Green across the board, folks — that deploy is OUTTA here!",
 "[excited] And there it is — a clean merge! No conflicts, no mercy!",
 "This is Vibe Radio. [warmly] Your coding buddy... out loud."
];
async function tts(text){
  const r=await post('elevenlabs/eleven-v3',{text,voice_id:'George',stability:0.3,similarity:0.75,use_speaker_boost:true});
  const id=r?.data?.id; if(!id)throw new Error('nosub '+JSON.stringify(r).slice(0,120));
  return {u:await poll(id),v:'George'};
}

console.log('TTS 5 lines (parallel)...');
const raw=await Promise.all(LINES.map(async(t,i)=>{ const {u,v}=await tts(t); await dl(u,`${T}/raw${i}.mp3`);
  // old AM-radio filter per line
  execFileSync('ffmpeg',['-y','-i',`${T}/raw${i}.mp3`,'-af','highpass=f=180,lowpass=f=5200,acompressor=threshold=-16dB:ratio=2.5,volume=3dB,aecho=0.4:0.25:3:0.08',`${T}/r${i}.mp3`],{stdio:'ignore'});
  console.log(' line',i,v); return `${T}/r${i}.mp3`; }));

// build: base.mp4 + 5 delayed VO lines + AM-hiss room-tone bed (NO music)
const dur=28;
const inputs=['-i',`${T}/base_g.mp4`];
raw.forEach(f=>inputs.push('-i',f));
// hiss bed: pink noise band-limited, VERY faint room-tone (not music)
inputs.push('-f','lavfi','-i',`anoisesrc=color=pink:d=${dur}:a=0.025`);
const nHiss=1+raw.length; // index of hiss input
let fc='';
raw.forEach((_,i)=>{ const d=i*5000; fc+=`[${i+1}:a]adelay=${d}|${d}[v${i}];`; });
fc+=`[${nHiss}:a]highpass=f=300,lowpass=f=3000,volume=0.5[hiss];`;
fc+=raw.map((_,i)=>`[v${i}]`).join('')+`[hiss]amix=inputs=${raw.length+1}:duration=longest:dropout_transition=0,volume=1.3[a]`;
execFileSync('ffmpeg',['-y',...inputs,'-filter_complex',fc,'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-shortest',OUT],{stdio:'inherit'});
console.log('DONE ->',OUT);
