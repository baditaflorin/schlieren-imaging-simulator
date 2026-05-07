# Librosa Offline Helper

The runtime app is Mode A and does not ship Python or librosa to browsers.

This optional helper converts an audio file into a small JSON feature envelope that can be inspected or adapted into future static demos.

## Setup

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r tools/librosa/requirements.txt
```

## Run

```sh
python tools/librosa/export_features.py input.wav output.json
```

The output JSON contains duration, tempo estimate, RMS envelope, spectral centroid, and onset envelope values.
