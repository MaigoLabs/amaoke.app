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
