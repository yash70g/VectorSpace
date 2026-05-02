
function tokenize(text) {
  text = text.replace(/\r?\n|\r/g, ' ');
  let roughTokens = text.split(/\s+/).filter(Boolean);
  let tokens = [];
  for (let token of roughTokens) {
    //  contractions  don't -> don 't
    token = token.replace(/(\w+)'(\w+)/g, "$1 '$2");
    // Split on punctuation
    let subTokens = token.split(/([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/).filter(Boolean);
    for (let sub of subTokens) {
      // Further split long words into subwords 
      if (sub.length > 6 && /^[a-zA-Z]+$/.test(sub)) {
        let mid = Math.floor(sub.length / 2);
        tokens.push(sub.slice(0, mid));
        tokens.push(sub.slice(mid));
      } else {
        tokens.push(sub);
      }
    }
  }
  return tokens;
}

if (typeof window !== 'undefined') {
  window.tokenize = tokenize;
}
