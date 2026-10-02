/**
 * 線索判定與排列枚舉。
 * 7! = 5040 種排列，直接枚舉驗證「只有一個解」。
 * 此檔案不依賴 DOM，可由 Node 匯入。
 */

/** 回傳 id -> 位置索引 的對照表 */
function indexMap(order) {
  const m = Object.create(null);
  for (let i = 0; i < order.length; i += 1) m[order[i]] = i;
  return m;
}

/** 單一條件是否成立 */
export function testPart(part, order, idx = indexMap(order)) {
  switch (part.kind) {
    case 'leftmost':
      return idx[part.a] === 0;
    case 'rightmost':
      return idx[part.a] === order.length - 1;
    case 'leftOf':
      return idx[part.a] < idx[part.b];
    case 'rightOf':
      return idx[part.a] > idx[part.b];
    case 'adjacentRight':
      return idx[part.b] - idx[part.a] === 1;
    case 'adjacent':
      return Math.abs(idx[part.a] - idx[part.b]) === 1;
    case 'gap':
      return idx[part.b] - idx[part.a] === part.distance;
    case 'position':
      return idx[part.a] === part.position;
    case 'chain': {
      for (let k = 1; k < part.seq.length; k += 1) {
        if (idx[part.seq[k]] - idx[part.seq[k - 1]] !== 1) return false;
      }
      return true;
    }
    case 'compound':
      return part.parts.every((p) => testPart(p, order, idx));
    default:
      throw new Error(`未知的線索類型：${part.kind}`);
  }
}

/** 某張便條是否被目前站位滿足 */
export function clueSatisfied(clue, order) {
  return testPart(clue, order, indexMap(order));
}

/** 回傳未被滿足的便條清單 */
export function unsatisfiedClues(clues, order) {
  return clues.filter((c) => !clueSatisfied(c, order));
}

/** 產生所有排列 */
export function* permutations(items) {
  const arr = items.slice();
  const n = arr.length;
  const c = new Array(n).fill(0);
  yield arr.slice();
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      c[i] += 1;
      i = 0;
      yield arr.slice();
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

/** 枚舉所有符合線索的站位 */
export function findSolutions(ids, clues, limit = Infinity) {
  const found = [];
  for (const order of permutations(ids)) {
    if (clues.every((c) => clueSatisfied(c, order))) {
      found.push(order);
      if (found.length >= limit) break;
    }
  }
  return found;
}

/**
 * 驗證設定檔：線索唯一解、解答一致、初始站位不是答案。
 * 回傳 { ok, solutions, problems[] }
 */
export function verifyPuzzle({ ids, clues, solution, initial }) {
  const problems = [];
  const solutions = findSolutions(ids, clues);

  if (solutions.length === 0) problems.push('線索沒有任何解。');
  if (solutions.length > 1) problems.push(`線索有 ${solutions.length} 組解，必須只有一組。`);
  if (solutions.length === 1 && solution && solutions[0].join() !== solution.join()) {
    problems.push(`唯一解是 ${solutions[0].join('-')}，與設定的 SOLUTION_ORDER 不同。`);
  }
  if (solution && initial && solution.join() === initial.join()) {
    problems.push('初始站位就是正解，必須不同。');
  }
  return { ok: problems.length === 0, solutions, problems };
}
