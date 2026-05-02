function buildVocabulary(tokens) {
  const vocab = {};
  tokens.forEach(token => {
    vocab[token] = (vocab[token] || 0) + 1;
  });
  // array of [token, count]
  return Object.entries(vocab).sort((a, b) => b[1] - a[1]);
}
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
}
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function generateRandomVectors(vocab, dim = 8) {
  // vocab: array of [token, count]
  const vectors = {};
  vocab.forEach(([token]) => {
    const seed = hashString(token);
    const rand = mulberry32(seed);
    vectors[token] = Array.from({ length: dim }, () => +(rand() * 2 - 1).toFixed(3));
  });
  return vectors;
}

if (typeof window !== 'undefined') {
  window.buildVocabulary = buildVocabulary;
  window.generateRandomVectors = generateRandomVectors;
}
