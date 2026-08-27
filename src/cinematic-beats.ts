import { formatMinutes } from './scenes.js';
import type { Scene, SceneKind } from './scenes.js';

export interface Beat {
  kind: SceneKind;
  keyframe: string;
  motion: string;
  vo: string;
}

const STYLE =
  'cinematic 1980s film still, warm tungsten light with subtle magenta and cyan neon accents, ' +
  '35mm film grain, shallow depth of field, night';

const SET =
  'the SAME single cozy 1980s home office at night: a wooden desk front and center with a ' +
  'glowing laptop and mechanical keyboard, a steaming mug, sticky notes on the wall behind it, ' +
  'a warm desk lamp on the left, and a bookshelf with a glowing retro radio on the right';

const DEV =
  'a young woman software developer in her early twenties, big voluminous curly blonde 80s hair, ' +
  'natural makeup with soft neutral eyeshadow and red lipstick, wearing a VIBRANT colorful 80s ' +
  'outfit: a bold color-blocked cropped jacket in hot pink and electric blue over a bright teal ' +
  'tee, vibrant and colorful';

const LOCK =
  'Identical woman and identical office as the reference (same face, big curly blonde hair, ' +
  'natural red-lip makeup, vibrant hot-pink-and-blue cropped jacket, teal tee, same ' +
  'desk/laptop/lamp/sticky-notes/bookshelf). Only change pose and camera.';

const EYE = 'looking at what she is doing, not at the camera';

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export function deriveReferencePrompts(): { hero: string; face: string } {
  return {
    hero: `${STYLE}. Wide reference of ${DEV}, settling in to work at ${SET}.`,
    face:
      `${STYLE}. Clean sharp front-facing headshot portrait of ${DEV}, looking straight at ` +
      'camera, evenly lit, crisp focus on her face.',
  };
}

function titleBeat(scene: Extract<Scene, { kind: 'title' }>): Beat {
  const d = scene.data;
  const dur = d.totalMinutes > 0 ? `${formatMinutes(d.totalMinutes)} in the flow` : 'a session worth replaying';
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Wide establishing shot from across the room: she drops into her desk chair ` +
      `and flips open the glowing laptop, screen light spilling onto her face, ${EYE}. ${STYLE}`,
    motion:
      `she sits down at the desk and opens the laptop, the screen wakes and lights her ` +
      `face, smooth settle-in. ${STYLE}`,
    vo: `[energetically] ${d.sessionName} — ${dur}. Let's run it back.`,
  };
}

function tasksBeat(scene: Extract<Scene, { kind: 'tasks' }>): Beat {
  const d = scene.data;
  const first = d.tasks[0]?.label ?? 'the first task';
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Close-up side profile: she types fast on the mechanical keyboard, then ` +
      `reaches up and ticks a sticky note on the wall, mid-action, ${EYE}. ${STYLE}`,
    motion:
      `she types quickly, then reaches over and checks off a sticky note, natural ` +
      `working rhythm. ${STYLE}`,
    vo:
      d.total === 1
        ? `[excited] One task landed, clean — ${first}.`
        : `[excited] ${plural(d.total, 'task')} landed, clean — kicked off by ${first}.`,
  };
}

function diffBeat(scene: Extract<Scene, { kind: 'diff' }>): Beat {
  const d = scene.data;
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Over-the-shoulder shot from behind her: she leans into the glowing laptop ` +
      `covered in code, one hand mid-scroll, screen glow catching her hair, ${EYE}. ${STYLE}`,
    motion: `she scrolls through the diff and leans in closer to the code, subtle continuous motion. ${STYLE}`,
    vo: `[excited] ${plural(d.filesChanged, 'file')} touched — plus ${d.additions}, minus ${d.deletions}.`,
  };
}

function terminalBeat(scene: Extract<Scene, { kind: 'terminal' }>): Beat {
  const d = scene.data;
  const hasTests = d.lines.some((l) => l.cls === 'ok' && l.text.includes('passed'));
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Three-quarter shot from the lamp side: she throws a triumphant fist pump at ` +
      `the glowing screen, mid-cheer, ${EYE}. ${STYLE}`,
    motion: `she reads the screen, then pumps her fist in celebration, energetic. ${STYLE}`,
    vo: hasTests
      ? '[shouting] GREEN! Green across the board — every test, passing!'
      : '[excited] The commands tell the story — clean, top to bottom.',
  };
}

function mergeBeat(scene: Extract<Scene, { kind: 'merge' }>): Beat {
  const d = scene.data;
  const vo =
    d.pr !== null
      ? d.merged
        ? `[excited] And there it is — pull request number ${d.pr}, merged into ${d.branch}! No conflicts, no mercy!`
        : `[excited] Pull request number ${d.pr} is open on ${d.branch} — reviews incoming!`
      : d.merged
        ? `[excited] Merged into ${d.branch}! No conflicts, no mercy!`
        : `[excited] The pull request is open on ${d.branch}!`;
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Low-angle shot from the desk surface: she hits the enter key with a flourish ` +
      `and throws both hands up, screen glow flaring, mid-celebration, ${EYE}. ${STYLE}`,
    motion: `she slams enter, throws both hands up and leans back laughing, joyful release. ${STYLE}`,
    vo,
  };
}

function endBeat(scene: Extract<Scene, { kind: 'end' }>): Beat {
  return {
    kind: scene.kind,
    keyframe:
      `${LOCK} Wide slightly dutch-angle shot: she closes the laptop and leans back in her ` +
      `chair with a satisfied smile, lamplight warm on the room, ${EYE}. ${STYLE}`,
    motion: `she gently closes the laptop and leans back, smiling, calm settle. ${STYLE}`,
    vo: `[warmly] ${scene.caption} This is vibemovie.`,
  };
}

function beatFor(scene: Scene): Beat {
  switch (scene.kind) {
    case 'title':
      return titleBeat(scene);
    case 'tasks':
      return tasksBeat(scene);
    case 'diff':
      return diffBeat(scene);
    case 'terminal':
      return terminalBeat(scene);
    case 'merge':
      return mergeBeat(scene);
    case 'end':
      return endBeat(scene);
  }
}

export function deriveBeats(scenes: readonly Scene[]): Beat[] {
  return scenes.map(beatFor);
}
