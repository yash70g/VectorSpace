function buildVocabulary(tokens) {
  const vocab = {};
  tokens.forEach(token => {
    vocab[token] = (vocab[token] || 0) + 1;
  });
  // array of [token, count]
  return Object.entries(vocab).sort((a, b) => b[1] - a[1]);
}

// Generate random vectors for each token
function generateRandomVectors(vocab, dim = 8) {
  // vocab: array of [token, count]
  const vectors = {};
  vocab.forEach(([token]) => {
    vectors[token] = Array.from({ length: dim }, () => +(Math.random() * 2 - 1).toFixed(3));
  });
  return vectors;
}

if (typeof window !== 'undefined') {
  window.buildVocabulary = buildVocabulary;
  window.generateRandomVectors = generateRandomVectors;
}
