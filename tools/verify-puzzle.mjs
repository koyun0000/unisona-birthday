/**
 * 驗證排序謎題：枚舉七人的 5040 種排列，確認線索只有一組解。
 * 用法：node tools/verify-puzzle.mjs
 */
import {
  CHARACTERS, CLUES, SOLUTION_ORDER, INITIAL_ORDER,
  REHEARSAL, PERFORMANCE, FINALE, NOTES, DESIGN_ASSUMPTIONS,
} from '../src/config/show.js';
import { verifyPuzzle, unsatisfiedClues, permutations } from '../src/puzzle/solver.js';

let failures = 0;
const ok = (msg) => console.log(`  通過  ${msg}`);
const bad = (msg) => { failures += 1; console.log(`  失敗  ${msg}`); };

const ids = CHARACTERS.map((c) => c.id);

console.log('\n[1] 排序謎題');
let total = 0;
for (const _ of permutations(ids)) total += 1;
console.log(`  枚舉排列數：${total}`);
if (total !== 5040) bad(`排列數應為 5040，實得 ${total}`); else ok('排列數 5040');

const result = verifyPuzzle({ ids, clues: CLUES, solution: SOLUTION_ORDER, initial: INITIAL_ORDER });
if (result.ok) {
  ok(`唯一解：${result.solutions[0].map((id) => CHARACTERS.find((c) => c.id === id).label).join(' ')}`);
} else {
  result.problems.forEach(bad);
  result.solutions.slice(0, 5).forEach((s) => console.log(`        解：${s.join('-')}`));
}

const initialUnsat = unsatisfiedClues(CLUES, INITIAL_ORDER);
if (initialUnsat.length > 0) ok(`初始站位違反 ${initialUnsat.length} 張便條`);
else bad('初始站位已經滿足所有便條');

console.log('\n[2] 角色與徽章');
if (new Set(ids).size === ids.length) ok('角色 id 不重複'); else bad('角色 id 重複');
const labels = CHARACTERS.map((c) => c.label);
if (new Set(labels).size === labels.length) ok('文字標籤不重複'); else bad('文字標籤重複');
const symbols = CHARACTERS.map((c) => c.symbol);
if (new Set(symbols).size === symbols.length) ok('圖案徽章不重複'); else bad('圖案徽章重複');
if (CHARACTERS.length === 7) ok('團員共七位'); else bad(`團員應為 7 位，實得 ${CHARACTERS.length}`);

console.log('\n[3] 排練旋律（生日歌第一句）');
const seq = SOLUTION_ORDER.map((id) => CHARACTERS.find((c) => c.id === id).rehearsalNote);
console.log(`  正解事件：${seq.map((n) => n ?? '休止').join('、')}`);
const expected = ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', null];
if (seq.join('|') === expected.join('|')) ok('與設計假設一致（六位唱音＋一位休止）');
else bad(`事件序列不符，預期 ${expected.map((n) => n ?? '休止').join('、')}`);
if (REHEARSAL.events.length === 7) ok('排練事件有 7 個時間點'); else bad('排練事件數不是 7');
const restIdx = DESIGN_ASSUMPTIONS.rehearsalRestIndex;
if (seq[restIdx] === null) ok(`休止在第 ${restIdx + 1} 位`); else bad('休止位置與設計假設不符');
const r = REHEARSAL.events;
for (let i = 1; i < r.length; i += 1) {
  if (r[i].beat < r[i - 1].beat) bad('排練事件時間沒有遞增');
}
if (r[r.length - 1].beat + r[r.length - 1].dur <= REHEARSAL.roundLengthBeats) ok('一輪長度足夠容納所有事件');
else bad('roundLengthBeats 太短');

console.log('\n[4] 正式演出');
PERFORMANCE.phrases.forEach((p, i) => {
  if (p.notes.length !== p.rhythm.length) bad(`${p.id}：音符數與節奏數不符`);
  p.notes.forEach((n) => { if (!(n in NOTES)) bad(`${p.id}：音高 ${n} 不在 NOTES`); });
  if (p.singers !== 'all' && p.singers.length !== p.notes.length) bad(`${p.id}：接唱人數與音符數不符`);
  if (i > 0 && p.startBeat <= PERFORMANCE.phrases[i - 1].startBeat) bad(`${p.id}：startBeat 沒有遞增`);
});
const soloPhrases = PERFORMANCE.phrases.filter((p) => p.mode === 'solo');
const chorusPhrases = PERFORMANCE.phrases.filter((p) => p.mode === 'chorus');
if (soloPhrases.length === 3 && chorusPhrases.length === 1) ok('前三句逐音接唱，最後一句合唱');
else bad('演出段落組成不符（應為 3 句接唱 + 1 句合唱）');
if (PERFORMANCE.phrases[PERFORMANCE.phrases.length - 1] === chorusPhrases[0]) ok('合唱是最後一句');
else bad('合唱不是最後一句');

const participants = new Set();
PERFORMANCE.phrases.forEach((p) => {
  if (p.singers === 'all') ids.forEach((_, i) => participants.add(i));
  else p.singers.forEach((s) => participants.add(s));
});
if (participants.size === 7) ok('七位團員都參與正式演出'); else bad(`只有 ${participants.size} 位參與演出`);

const last = chorusPhrases[0];
const lastEvent = last.rhythm[last.rhythm.length - 1];
if (lastEvent.dur >= 4) ok(`最後一音延長 ${lastEvent.dur} 拍`); else bad('最後一音沒有延長');
const lastNoteAbs = last.startBeat + lastEvent.beat;
if (PERFORMANCE.cues.signsStartBeat >= lastNoteAbs
  && PERFORMANCE.cues.signsStartBeat < lastNoteAbs + lastEvent.dur) ok('舉牌落在延長音期間');
else bad('舉牌時間不在延長音期間');
if (PERFORMANCE.cues.freezeBeat > PERFORMANCE.cues.greetingStartBeat + PERFORMANCE.cues.greetingDurationBeats) {
  ok('定格在 HAPPY BIRTHDAY 寫完之後');
} else bad('定格時間太早');

console.log('\n[5] 結尾牌子');
if (FINALE.signLetters.length === 7) ok('牌子共七張'); else bad('牌子不是七張');
if (FINALE.signLetters.join('') === 'UNISONA') ok('左至右組成 UNISONA');
else bad(`牌面組成 ${FINALE.signLetters.join('')}，不是 UNISONA`);
if (FINALE.greeting === 'HAPPY BIRTHDAY') ok('結尾文字 HAPPY BIRTHDAY');
else bad(`結尾文字為 ${FINALE.greeting}`);

console.log(`\n${failures === 0 ? '全部通過。' : `有 ${failures} 項失敗。`}\n`);
process.exit(failures === 0 ? 0 : 1);
