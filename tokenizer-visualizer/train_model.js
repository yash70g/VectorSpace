
async function loadDataset() {
  const response = await fetch('text_classification_dataset.json');
  return await response.json();
}

function textToVector(text, vocabVectors, tokenizer) {
  const tokens = tokenizer(text);
  const vectors = tokens.map(tok => vocabVectors[tok] || Array(8).fill(0));
  // Average the vectors
  const avg = Array(vectors[0].length).fill(0);
  vectors.forEach(vec => {
    vec.forEach((v, i) => { avg[i] += v; });
  });
  return avg.map(v => v / vectors.length);
}

async function trainModel(customDataset) {
  let dataset;
  if (customDataset) {
    dataset = customDataset;
  } else {
    dataset = await loadDataset();
  }
  // tokenizer and vocab from the browser
  const tokenizer = window.tokenize;
  const vocab = window.buildVocabulary(dataset.map(d => tokenizer(d.text)).flat());
  const vocabVectors = window.generateRandomVectors(vocab, 8);
  const texts = dataset.map(d => d.text);
  const labels = dataset.map(d => d.label);
  const labelSet = Array.from(new Set(labels));
  const labelToIndex = Object.fromEntries(labelSet.map((l, i) => [l, i]));

  const xs = texts.map(text => textToVector(text, vocabVectors, tokenizer));
  const ys = labels.map(label => labelToIndex[label]);
  const tf_xs = tf.tensor2d(xs);
  const tf_ys = tf.oneHot(tf.tensor1d(ys, 'int32'), labelSet.length);

  // build 
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [8] }));
  model.add(tf.layers.dense({ units: labelSet.length, activation: 'softmax' }));
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
  await model.fit(tf_xs, tf_ys, { epochs: 10, batchSize: 4 });
  alert('Training complete!');
  return model;
}

if (typeof window !== 'undefined') {
  window.trainModel = trainModel;
  window.textToVector = textToVector;
}
