#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === '--truth') opts.truth = args[i + 1];
    if (args[i] === '--pred') opts.pred = args[i + 1];
  }
  if (!opts.truth || !opts.pred) {
    console.error('Usage: node evaluate.js --truth ./ground-truth-jsons --pred ./predicted-jsons');
    process.exit(1);
  }
  return opts;
}

function iou(a, b) {
  const xA = Math.max(a.x, b.x);
  const yA = Math.max(a.y, b.y);
  const xB = Math.min(a.x + a.width, b.x + b.width);
  const yB = Math.min(a.y + a.height, b.y + b.height);
  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = a.width * a.height;
  const boxBArea = b.width * b.height;
  return interArea / (boxAArea + boxBArea - interArea);
}

const TAGS = ['Button', 'Input', 'Radio', 'Dropdown'];

function loadAnnotations(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const data = {};
  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    data[file] = content.annotations || [];
  }
  return data;
}

function matchBoxes(preds, truths, tag) {
  const gt = truths.filter(a => a.tag === tag);
  const pd = preds.filter(a => a.tag === tag);
  const matched = new Set();
  let tp = 0;
  for (const p of pd) {
    let found = false;
    for (let i = 0; i < gt.length; i++) {
      if (!matched.has(i) && iou(p, gt[i]) >= 0.5) {
        matched.add(i);
        found = true;
        break;
      }
    }
    if (found) tp++;
  }
  const fp = pd.length - tp;
  const fn = gt.length - tp;
  return { tp, fp, fn };
}

function evaluate(truthDir, predDir) {
  const truths = loadAnnotations(truthDir);
  const preds = loadAnnotations(predDir);
  const perClass = {};
  for (const tag of TAGS) {
    let TP = 0, FP = 0, FN = 0;
    for (const file of Object.keys(truths)) {
      const gt = truths[file];
      const pd = preds[file] || [];
      const { tp, fp, fn } = matchBoxes(pd, gt, tag);
      TP += tp; FP += fp; FN += fn;
    }
    const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
    const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
    const f1 = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall);
    perClass[tag] = { precision, recall, f1 };
  }
  // Macro average
  const macro = {
    precision: 0,
    recall: 0,
    f1: 0,
  };
  for (const tag of TAGS) {
    macro.precision += perClass[tag].precision;
    macro.recall += perClass[tag].recall;
    macro.f1 += perClass[tag].f1;
  }
  macro.precision /= TAGS.length;
  macro.recall /= TAGS.length;
  macro.f1 /= TAGS.length;
  // Output (improved formatting)
  const col1 = 10, col2 = 10, col3 = 10, col4 = 12, col5 = 12, col6 = 12;
  function pad(str, len, right = false) {
    str = String(str);
    if (right) return str.padEnd(len, ' ');
    return str.padStart(len, ' ');
  }
  const header =
    pad('Class', col1, true) +
    pad('GT', col2) +
    pad('TP', col3) +
    pad('Precision', col4) +
    pad('Recall', col5) +
    pad('F1', col6);
  const sep = '-'.repeat(col1 + col2 + col3 + col4 + col5 + col6);
  console.log(header);
  console.log(sep);
  for (const tag of TAGS) {
    let totalGT = 0;
    let totalTP = 0;
    for (const file of Object.keys(truths)) {
      const gt = truths[file].filter(a => a.tag === tag);
      const pd = preds[file] || [];
      const { tp } = matchBoxes(pd, gt, tag);
      totalGT += gt.length;
      totalTP += tp;
    }
    const { precision, recall, f1 } = perClass[tag];
    console.log(
      pad(tag, col1, true) +
      pad(totalGT, col2) +
      pad(totalTP, col3) +
      pad(precision.toFixed(3), col4) +
      pad(recall.toFixed(3), col5) +
      pad(f1.toFixed(3), col6)
    );
  }
  console.log(sep);
  // Macro row: GT and TP are not meaningful as averages, so leave blank
  console.log(
    pad('Macro', col1, true) +
    pad('', col2) +
    pad('', col3) +
    pad(macro.precision.toFixed(3), col4) +
    pad(macro.recall.toFixed(3), col5) +
    pad(macro.f1.toFixed(3), col6)
  );
}

const opts = parseArgs();
evaluate(opts.truth, opts.pred);
