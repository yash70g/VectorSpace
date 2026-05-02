const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let dataset = [];
try {
  const dataPath = path.join(__dirname, 'text_classification_dataset.json');
  dataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Dataset loaded: ${dataset.length} examples`);
} catch (err) {
  console.error('Failed to load dataset:', err);
}

function tokenize(text) {
  text = text.replace(/\r?\n|\r/g, ' ');
  let roughTokens = text.split(/\s+/).filter(Boolean);
  let tokens = [];
  for (let token of roughTokens) {
    token = token.replace(/(\w+)'(\w+)/g, "$1 '$2");
    let subTokens = token.split(/([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/).filter(Boolean);
    for (let sub of subTokens) {
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

function buildVocabulary(tokens) {
  const vocab = {};
  tokens.forEach(token => {
    vocab[token] = (vocab[token] || 0) + 1;
  });
  return Object.entries(vocab).sort((a, b) => b[1] - a[1]);
}

function generateRandomVectors(vocab, dim = 8) {
  const vectors = {};
  vocab.forEach(([token]) => {
    const seed = hashString(token);
    const rand = mulberry32(seed);
    vectors[token] = Array.from({ length: dim }, () => +(rand() * 2 - 1).toFixed(3));
  });
  return vectors;
}

function textToVector(text, vocabVectors, tokenizer) {
  const tokens = tokenizer(text);
  const vectors = tokens.map(tok => vocabVectors[tok] || Array(8).fill(0));
  const avg = Array(vectors[0].length).fill(0);
  vectors.forEach(vec => {
    vec.forEach((v, i) => { avg[i] += v; });
  });
  return avg.map(v => v / (vectors.length || 1));
}

let trainedModel = null;
let trainedVocabVectors = null;
let trainedLabelSet = null;
let trainedVocab = null;

app.post('/api/train', async (req, res) => {
  try {
    console.log('Training model...');
    const allTokens = dataset.map(d => tokenize(d.text)).flat();
    const vocab = buildVocabulary(allTokens);
    const vocabVectors = generateRandomVectors(vocab, 8);
    
    const texts = dataset.map(d => d.text);
    const labels = dataset.map(d => d.label);
    const labelSet = Array.from(new Set(labels));
    const labelToIndex = Object.fromEntries(labelSet.map((l, i) => [l, i]));
    const xs = texts.map(text => textToVector(text, vocabVectors, tokenize));
    const ys = labels.map(label => labelToIndex[label]);
    const tf_xs = tf.tensor2d(xs);
    const tf_ys = tf.oneHot(tf.tensor1d(ys, 'int32'), labelSet.length);
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [8] }),
        tf.layers.dense({ units: labelSet.length, activation: 'softmax' })
      ]
    });
    
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    await model.fit(tf_xs, tf_ys, { epochs: 10, batchSize: 4, verbose: 0 });
    trainedModel = model;
    trainedVocabVectors = vocabVectors;
    trainedLabelSet = labelSet;
    trainedVocab = vocab;
    
    console.log('Training complete!');
    const vocabData = vocab.map(([token]) => ({ 
      token, 
      vector: vocabVectors[token] 
    }));
    res.json({ success: true, message: 'Model trained successfully', labels: labelSet, vocab: vocab, vocabData: vocabData });
  } catch (err) {
    console.error('Training error:', err);
    res.status(500).json({ error: 'Training failed', details: err.message });
  }
});

app.post('/api/predict', async (req, res) => {
  try {
    if (!trainedModel) {
      return res.status(400).json({ error: 'Model not trained yet' });
    }
    
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }
    
    const vec = textToVector(text, trainedVocabVectors, tokenize);
    const inputTensor = tf.tensor2d([vec]);
    const pred = trainedModel.predict(inputTensor);
    const idx = (await pred.argMax(1).data())[0];
    
    res.json({ prediction: trainedLabelSet[idx], text, vector: vec });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Prediction failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Train the model: POST /api/train');
  console.log('Predict: POST /api/predict');
});
