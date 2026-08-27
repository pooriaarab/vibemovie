import { formatMinutes, plural } from './scenes-utils.js';
import type { DiffData, MergeData, SceneKind, Template } from './scenes.js';

type CaptionStats = {
  totalMinutes: number;
  tasks: number;
  diff: DiffData;
  pr: MergeData | null;
  hasTests: boolean;
};

function captionsSpeedrun(stats: CaptionStats, dur: string, prWord: string, prNum: string): Record<SceneKind, string> {
  const { totalMinutes, tasks, diff } = stats;
  return {
    title: totalMinutes > 0 ? `${dur}. go.` : 'a session. go.',
    tasks: `${plural(tasks, 'task')}. done.`,
    diff: `+${diff.additions} −${diff.deletions} across ${plural(diff.filesChanged, 'file')}.`,
    terminal: 'green. ship.',
    merge: `${prNum}${prWord}. next.`,
    end: 'gg.',
  };
}

function captionsMeme(stats: CaptionStats): Record<SceneKind, string> {
  const { tasks, pr } = stats;
  return {
    title: 'touch grass? never heard of it.',
    tasks: `${plural(tasks, 'task')} speedrun any%`,
    diff: 'number go up',
    terminal: 'it compiles. ship it.',
    merge: pr !== null && pr.merged ? 'LGTM said the reviewer' : 'CI roulette champion',
    end: 'same time tomorrow?',
  };
}

function captionsDocumentary(stats: CaptionStats, dur: string, prWord: string, prNum: string): Record<SceneKind, string> {
  const { totalMinutes, tasks, diff, pr, hasTests } = stats;
  return {
    title: totalMinutes > 0 ? `${dur} in the flow.` : 'A session worth replaying.',
    tasks: `${plural(tasks, 'task')} landed, clean.`,
    diff:
      diff.additions >= diff.deletions
        ? `${plural(diff.filesChanged, 'file')} touched — more added than removed.`
        : `${plural(diff.filesChanged, 'file')} touched — more removed than added.`,
    terminal: hasTests ? 'Tests green. Shipped.' : 'The commands tell the story.',
    merge: pr !== null ? `Pull request ${prNum}${prWord}.` : '',
    end: "That's the session. Run it back.",
  };
}

export function captions(template: Template, stats: CaptionStats): Record<SceneKind, string> {
  const { totalMinutes, pr } = stats;
  const dur = formatMinutes(totalMinutes);
  const prWord = pr !== null ? (pr.merged ? 'merged' : 'opened') : '';
  const prNum = pr?.pr !== null && pr?.pr !== undefined ? `#${pr.pr} ` : '';
  if (template === 'speedrun') return captionsSpeedrun(stats, dur, prWord, prNum);
  if (template === 'meme') return captionsMeme(stats);
  return captionsDocumentary(stats, dur, prWord, prNum);
}
