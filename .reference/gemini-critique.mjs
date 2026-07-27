import fs from 'fs';
import { execSync } from 'child_process';
const ADC = process.env.HOME + '/.config/gcloud/adc_personal.json';
const PROJ='pooria-personal', LOC='us-central1';
const URL=`https://${LOC}-aiplatform.googleapis.com/v1/projects/${PROJ}/locations/${LOC}/publishers/google/models/gemini-2.5-flash:generateContent`;
const tok=execSync(`GOOGLE_APPLICATION_CREDENTIALS=${ADC} gcloud auth application-default print-access-token 2>/dev/null`).toString().trim();
const vid=fs.readFileSync(process.argv[2]).toString('base64');
const prompt=`You are a brutal film editor. This is a ~30s launch video for a CLI tool. Critique it HARD and specifically. Answer in tight markdown:
1. AUDIO COHERENCE — does the music/voice feel like one coherent track or disjointed? what breaks?
2. CHARACTER CONSISTENCY — does the same woman persist shot to shot, or does her face/hair/outfit drift? name which cuts break.
3. SCENE CONTINUITY — does it read as ONE short film with a through-line, or random clips glued together? what's missing (matched action, eyeline, spatial logic, pacing)?
4. MOTION QUALITY — is the animation natural or warping/morphing?
5. THE 5 CONCRETE FIXES that would make this feel like a real short film, ranked. Be specific and actionable.
No praise. No hedging.`;
const body={contents:[{role:'user',parts:[{inlineData:{mimeType:'video/mp4',data:vid}},{text:prompt}]}],generationConfig:{temperature:0.4}};
const r=await fetch(URL,{method:'POST',headers:{'Authorization':`Bearer ${tok}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
const j=await r.json();
console.log(j?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('')||JSON.stringify(j).slice(0,500));
