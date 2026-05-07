#!/usr/bin/env python3
"""Export compact librosa audio features for optional static demos."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import librosa
import numpy as np


def _round_series(values: np.ndarray, limit: int = 256) -> list[float]:
    if values.size > limit:
        indices = np.linspace(0, values.size - 1, limit).astype(int)
        values = values[indices]
    return [round(float(value), 6) for value in values]


def export_features(input_path: Path, output_path: Path) -> None:
    y, sample_rate = librosa.load(input_path, sr=None, mono=True)
    hop_length = 512
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sample_rate, hop_length=hop_length)[0]
    onset = librosa.onset.onset_strength(y=y, sr=sample_rate, hop_length=hop_length)
    tempo = librosa.feature.tempo(onset_envelope=onset, sr=sample_rate, hop_length=hop_length)

    payload = {
        "schema_version": 1,
        "source": str(input_path),
        "duration_seconds": round(float(librosa.get_duration(y=y, sr=sample_rate)), 6),
        "sample_rate": int(sample_rate),
        "tempo_bpm": round(float(tempo[0]), 6) if tempo.size else 0,
        "hop_length": hop_length,
        "rms": _round_series(rms),
        "spectral_centroid": _round_series(centroid),
        "onset_strength": _round_series(onset),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    export_features(args.input, args.output)


if __name__ == "__main__":
    main()
