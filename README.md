# CLI Evaluation Tool

This directory contains the evaluation script for assessing the performance of LLM models on UI element annotation tasks.

## Overview

The `evaluate.js` script compares predicted annotations against ground truth annotations to calculate precision, recall, and F1 scores for different UI element classes (Button, Input, Radio, Dropdown).

## Prerequisites

- Node.js (version 14 or higher)
- JSON files containing annotation data

## Directory Structure

```
cli/
├── evaluate.js                 # Main evaluation script
├── ground-truth-jsons/        # Ground truth annotation files
├── predicted-jsons/           # Predicted annotation files
└── README.md                  # This file
```

## Input Format

### Ground Truth and Predicted JSON Files

Each JSON file should contain an array of annotations with the following structure:

```json
{
  "annotations": [
    {
      "tag": "Button",
      "x": 100,
      "y": 200,
      "width": 80,
      "height": 40
    },
    {
      "tag": "Input",
      "x": 300,
      "y": 150,
      "width": 200,
      "height": 30
    }
  ]
}
```

**Required fields:**
- `tag`: The UI element class (Button, Input, Radio, Dropdown)
- `x`: X-coordinate of the bounding box
- `y`: Y-coordinate of the bounding box
- `width`: Width of the bounding box
- `height`: Height of the bounding box

## Usage

### Basic Usage

```bash
node evaluate.js --truth ./ground-truth-jsons --pred ./predicted-jsons
```

### Parameters

- `--truth`: Path to the directory containing ground truth JSON files
- `--pred`: Path to the directory containing predicted JSON files

### Example

```bash
# Navigate to the cli directory
cd cli

# Run evaluation
node evaluate.js --truth ./ground-truth-jsons --pred ./predicted-jsons
```

## Output

The script outputs a formatted table showing performance metrics for each UI element class:

```
Class      GT    TP  Precision    Recall       F1
------------------------------------------------
Button     45    42      0.933     0.933    0.933
Input      67    58      0.853     0.866    0.859
Radio      23    20      0.870     0.870    0.870
Dropdown   34    29      0.853     0.853    0.853
------------------------------------------------
Macro                    0.877     0.880    0.877
```

### Metrics Explained

- **GT**: Ground Truth count (total number of actual elements)
- **TP**: True Positives (correctly predicted elements)
- **Precision**: TP / (TP + FP) - accuracy of positive predictions
- **Recall**: TP / (TP + FN) - ability to find all positive instances
- **F1**: Harmonic mean of precision and recall
- **Macro**: Average of metrics across all classes

## Evaluation Criteria

### IoU Threshold
The script uses an Intersection over Union (IoU) threshold of **0.5** to determine if a predicted bounding box matches a ground truth bounding box.

### Supported Classes
- Button
- Input
- Radio
- Dropdown

## File Naming Convention

The script expects corresponding files in both directories with the same names. For example:
- `ground-truth-jsons/sample1.json` should have a corresponding `predicted-jsons/sample1.json`

## Troubleshooting

### Common Issues

1. **"Usage: node evaluate.js --truth ./ground-truth-jsons --pred ./predicted-jsons"**
   - Make sure you're providing both required parameters
   - Check that the directory paths are correct

2. **JSON parsing errors**
   - Ensure all JSON files are valid
   - Check that files contain the expected `annotations` array structure

3. **No output**
   - Verify that both directories contain JSON files
   - Check that the JSON files have the correct format

### Validation

Before running the evaluation, you can validate your JSON files:

```bash
# Check if JSON files are valid
for file in ground-truth-jsons/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8')); console.log('✓ $file')"
done
```

## Performance Notes

- The script processes all JSON files in memory
- For large datasets, ensure sufficient memory is available
- Processing time scales linearly with the number of files and annotations

## Contributing

When modifying the evaluation script:
1. Maintain the same input/output format for compatibility
2. Update this README if adding new metrics or changing the interface
3. Test with the provided sample data before deploying changes 