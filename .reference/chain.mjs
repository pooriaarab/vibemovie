import fs from 'fs';
import { execFileSync } from 'child_process';
const KEY = fs.readFileSync(process.env.HOME + '/Documents/Personal/content-rabbit/code/Content Rabbit/apps/website/.env.local','utf8')
  .split('\n').find(l=>/^WAVESPEED_API_KEY/i.test(l)).split('=')[1].trim().replace(/"/g,'');
const DIR = process.env.HOME + '/code/vibe-final/viberadio3'; fs.mkdirSync(DIR,{recursive:true});
const OUT = process.env.HOME + '/code/vibe-mp4-final'; fs.mkdirSync(OUT,{recursive:true});
const T='/tmp/chain'; fs.mkdirSync(T,{recursive:true});
const FONT=['/System/Library/Fonts/Supplemental/Arial.ttf','/System/Library/Fonts/Helvetica.ttc'].find(f=>fs.existsSync(f));
const H={'Authorization':`Bearer ${KEY}`}; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const post=(m,b)=>fetch(`https://api.wavespeed.ai/api/v3/${m}`,{method:'POST',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json());
const poll=async(id,max=95)=>{for(let i=0;i<max;i++){const j=await(await fetch(`https://api.wavespeed.ai/api/v3/predictions/${id}/result`,{headers:H})).json();const s=j?.data?.status;if(s==='completed')return j.data.outputs[0];if(s==='failed')throw new Error('failed '+JSON.stringify(j).slice(0,150));await sleep(3000);}throw new Error('timeout');};
const dl=async(u,p)=>fs.writeFileSync(p,Buffer.from(await(await fetch(u)).arrayBuffer()));
const upload=p=>JSON.parse(execFileSync('curl',['-s','-X','POST','https://api.wavespeed.ai/api/v3/media/upload/binary','-H',`Authorization: Bearer ${KEY}`,'-F',`file=@${p}`],{encoding:'utf8',maxBuffer:1e7}))?.data?.download_url;
const t2i=async p=>poll((await post('bytedance/seedream-v4',{prompt:p,size:'1920*1080'}))?.data?.id);
const edit=async(p,img)=>poll((await post('wavespeed-ai/flux-kontext-max',{prompt:p,image:img}))?.data?.id);
const kling=async(first,last,prompt)=>poll((await post('kwaivgi/kling-v2.5-turbo-pro/image-to-video',{image:first,last_image:last,prompt,duration:5,negative_prompt:'morphing, warping, distorted face, changing outfit, extra fingers, flicker, duplicated objects, duplicate stove, duplicate radio, ghosting, double image, cloned furniture'}))?.data?.id);

const STYLE='cinematic 1980s film still, warm tungsten light with subtle magenta and cyan neon accents, 35mm film grain, shallow depth of field, night';
const SET='the SAME single cozy 1980s kitchen: wooden cabinets on the left, stove with a pan, a glowing retro wooden radio on the counter, and — visible across the room on the right — a wooden desk with a glowing laptop';
const GIRL='a beautiful young woman early twenties, big voluminous curly blonde 80s hair, natural makeup with soft neutral eyeshadow and red lipstick, wearing a VIBRANT colorful 80s outfit: a bold color-blocked cropped tank top in hot pink and electric blue with high-waisted bright teal shorts, vibrant and colorful';
const HERO=`${STYLE}. Wide reference of ${GIRL}, actively cooking in ${SET}.`;
const FACEP=`${STYLE}. Clean sharp front-facing headshot portrait of ${GIRL}, looking straight at camera, evenly lit, crisp focus on her face.`;
const LOCK=`Identical woman and identical kitchen as reference (same face, big curly blonde hair, natural red-lip makeup, vibrant hot-pink-and-blue crop top, teal shorts, same cabinets/stove/radio/laptop). Only change pose and camera.`;
// 6 KEYFRAMES — REAL cooking action, varied cinematic angles
const EYE='looking at what she is doing, not at the camera';
const KF=[
 `high-angle overhead insert over the cutting board: her hands rapidly chopping colorful vegetables, knife in motion, ${EYE}`,
 `dynamic side dolly shot: she tosses chopped vegetables into a sizzling pan, a small flame flare and steam rising, mid-action, ${EYE}`,
 `three-quarter shot from the same side: still at the stove, she stirs the pan with one hand and reaches over to turn up the glowing retro radio, ${EYE}`,
 `close-up profile side view: she lifts a wooden spoon with sauce and tastes it, eyes closed savoring, steam around her, ${EYE}`,
 `wide slightly dutch-angle shot: she does a playful shoulder-shimmy dance by the stove, energetic, ${EYE}`,
 `low-angle over-the-shoulder shot: she sits at the desk with empty hands and leans into the glowing laptop, hands near the keyboard, screen light on her, ${EYE}`
];
// 5 CHAIN CLIPS motion — real cooking (K_i -> K_{i+1})
const MO=[
 'her hands chop the vegetables fast, knife moving, natural cooking motion',
 'she scoops the veg from the board and tosses them into the sizzling pan, flame flares and steam rises, dynamic',
 'she stirs the pan then reaches over and turns up the radio dial, smooth motion',
 'she lifts the spoon, tastes the sauce, and slowly smiles with her eyes closed, subtle',
 'she shimmies her shoulders in a little playful dance by the stove, energetic motion',
 'she steps over to the desk and sits down at the glowing laptop with empty hands, smooth follow then settle'
];

// 1) HERO + crisp FACE ref (stronger swap lock)
console.log('hero + face ref...');
const [heroU,faceU]=await Promise.all([t2i(HERO),t2i(FACEP)]);
await dl(heroU, `${DIR}/hero.jpg`); await dl(faceU, `${DIR}/face.jpg`);
const hu=upload(`${DIR}/hero.jpg`); const fu=upload(`${DIR}/face.jpg`);
// 2) 6 keyframes IN PARALLEL
console.log('6 keyframes (parallel)...');
await Promise.all(KF.map(async(k,i)=>{ await dl(await edit(`${LOCK} ${k}. ${STYLE}`, hu), `${DIR}/k${i}.jpg`); console.log(' kf',i); }));
const kurls=[]; for(let i=0;i<6;i++) kurls[i]=upload(`${DIR}/k${i}.jpg`);
// 3) 5 chained Kling clips IN PARALLEL (first=k_i, last=k_{i+1})
console.log('5 Kling clips (parallel, first+last frame chained)...');
await Promise.all(MO.map(async(m,i)=>{ try{ await dl(await kling(kurls[i],kurls[i+1],`${m}. ${STYLE}`), `${T}/c${i}.mp4`); console.log(' clip',i);}catch(e){console.log(' clip FAIL',i,e.message);} }));
// 4) normalize clips (video only) + CTA
const segs=[];
for(let i=0;i<5;i++){ const c=`${T}/c${i}.mp4`; if(!fs.existsSync(c)){console.log('missing clip',i);continue;} const s=`${T}/s${i}.mp4`;
  execFileSync('ffmpeg',['-y','-i',c,'-an','-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24','-c:v','libx264','-pix_fmt','yuv420p',s],{stdio:'ignore'}); segs.push(s);}
const cf=['viberadio','your coding buddy, out loud','npx viberadio-fm'].map((t,i)=>{fs.writeFileSync(`${T}/t${i}.txt`,t);return `${T}/t${i}.txt`;});
execFileSync('ffmpeg',['-y','-f','lavfi','-i','color=c=0x0a0a0c:s=1280x720:d=3:r=24','-vf',`drawtext=textfile=${cf[0]}:fontfile=${FONT}:fontsize=90:fontcolor=0xf0b429:x=(w-text_w)/2:y=h/2-120,drawtext=textfile=${cf[1]}:fontfile=${FONT}:fontsize=34:fontcolor=white:x=(w-text_w)/2:y=h/2-10,drawtext=textfile=${cf[2]}:fontfile=${FONT}:fontsize=32:fontcolor=0xf0b429:x=(w-text_w)/2:y=h/2+60`,'-an','-c:v','libx264','-pix_fmt','yuv420p',`${T}/cta.mp4`],{stdio:'ignore'}); segs.push(`${T}/cta.mp4`);
fs.writeFileSync(`${T}/list.txt`, segs.map(s=>`file '${s}'`).join('\n'));
execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',`${T}/list.txt`,'-an',`${T}/base_raw.mp4`],{stdio:'ignore'});
console.log('base built, clips:',segs.length-1);
// 5) IDENTITY LOCK: face-swap hero's exact face onto every frame (one consistent person)
console.log('face-swap identity lock...');
try{ const bu=upload(`${T}/base_raw.mp4`);
  const sw=await poll((await post('wavespeed-ai/video-face-swap',{video:bu,face_image:fu,target_gender:'female'}))?.data?.id, 140);
  await dl(sw, `${T}/base.mp4`); console.log(' identity locked'); }
catch(e){ console.log(' faceswap fail, using raw:',e.message); fs.copyFileSync(`${T}/base_raw.mp4`,`${T}/base.mp4`); }
console.log('-> audio next (run vo-chain.mjs)');
