import logging
import shutil
import uuid
import threading
import uvicorn
from subprocess import check_call
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from audio_separator.separator import Separator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration
MODEL_NAME = 'model_bs_roformer_ep_317_sdr_12.9755.ckpt'
TEMP_DIR = Path('temp_audio')
TEMP_DIR.mkdir(exist_ok=True)

# Global state
separator = None
separator_lock = threading.Lock()
jobs = {}

def get_separator():
    global separator
    if separator is None:
        logger.info("Initializing Separator...")
        separator = Separator()
        logger.info(f"Loading model {MODEL_NAME}...")
        separator.load_model(model_filename=MODEL_NAME)
        logger.info("Model loaded.")
    return separator

def process_separation(task_id: str, task_dir: Path, input_path: Path):
    try:
        with separator_lock:
            jobs[task_id]['status'] = 'processing'
            
            sep = get_separator()
            sep.output_dir = str(task_dir)
            
            logger.info(f"Separating {task_id}...")
            output_files = sep.separate(str(input_path))
            logger.info(f"Output files {output_files}")
            
            results = {}
            for file in output_files:
                p = Path(file)
                target_p = task_dir / p.name
                if p != target_p:
                    shutil.move(str(p), str(target_p))
                    p = target_p

                opus_path = p.with_suffix('.opus')
                check_call(['ffmpeg', '-y', '-i', str(p), '-c:a', 'libopus', '-b:a', '96k', '-vbr', 'on', str(opus_path)])
                p.unlink()
                
                if 'Vocals' in p.name:
                    results['vocals'] = str(opus_path)
                elif 'Instrumental' in p.name:
                    results['instrumental'] = str(opus_path)
            
            jobs[task_id]['results'] = results
            jobs[task_id]['status'] = 'completed'
            logger.info(f"Completed {task_id}")

    except Exception as e:
        logger.error(f"Error processing {task_id}: {e}")
        jobs[task_id]['status'] = 'error'
        jobs[task_id]['error'] = str(e)

@app.post("/separate")
async def separate(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    task_dir = TEMP_DIR / task_id
    task_dir.mkdir(parents=True, exist_ok=True)
    
    input_path = task_dir / "input.mp3"
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    jobs[task_id] = {"status": "pending"}
    background_tasks.add_task(process_separation, task_id, task_dir, input_path)
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    return jobs.get(task_id, {"status": "not_found"})

@app.get("/result/{task_id}/{stem}")
async def get_result(task_id: str, stem: str):
    job = jobs.get(task_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Job not completed")
        
    results = job.get('results', {})
    file_path = results.get(stem)
    
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail=f"Stem {stem} not found")
        
    return FileResponse(file_path)

@app.delete("/task/{task_id}")
async def delete_task(task_id: str):
    if task_id in jobs:
        del jobs[task_id]
    
    task_dir = TEMP_DIR / task_id
    if task_dir.exists():
        shutil.rmtree(task_dir)
    
    return {"status": "deleted"}

if __name__ == "__main__":
    print("Starting Audio Separator API on port 24801...")
    uvicorn.run(app, host="0.0.0.0", port=24801)
