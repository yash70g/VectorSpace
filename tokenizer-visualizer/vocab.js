function buildVocabulary(tokens) {
  const vocab = {};
  tokens.forEach(token => {
    vocab[token] = (vocab[token] || 0) + 1;
  });
  // array of [token, count]
  return Object.entries(vocab).sort((a, b) => b[1] - a[1]);
}

if (typeof window !== 'undefined') {
  window.buildVocabulary = buildVocabulary;
}
