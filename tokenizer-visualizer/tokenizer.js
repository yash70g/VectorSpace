// Simple tokenizer: splits text into words and punctuation
function tokenize(text) {
  // This regex splits on word boundaries and keeps punctuation as separate tokens
  return text.match(/\w+|[^\w\s]/g) || [];
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.tokenize = tokenize;
}
