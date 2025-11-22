# Scripts

## Setup

```bash
mamba create -n audio-separator python=3.13
mamba activate audio-separator
pip install "audio-separator[cpu]" fastapi uvicorn python-multipart
```

## Usage

```bash
python server.py
```

## Compute requirements

My hardware is V100 16GB, and the model took ~1.5GB. So probably any potato would work.