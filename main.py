"""Task Dashboard - FastAPI backend.

Run:  uvicorn main:app --reload
Open: http://127.0.0.1:8000        (frontend)
Docs: http://127.0.0.1:8000/docs   (interactive API docs)
"""
import os
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

import db

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

Priority = Literal["low", "medium", "high"]
Status = Literal["todo", "in_progress", "done"]


class TaskIn(BaseModel):
    """Validated input for create + update (bad data is rejected with HTTP 422)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    priority: Priority = "medium"
    status: Status = "todo"


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Task Dashboard API", lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/tasks")
def read_tasks(status: Optional[Status] = None):
    return db.list_tasks(status)


@app.post("/api/tasks", status_code=201)
def create_task(task: TaskIn):
    return db.create_task(task.model_dump())


@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task: TaskIn):
    updated = db.update_task(task_id, task.model_dump())
    if updated is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    if not db.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return Response(status_code=204)


# Serve the frontend. Mounted LAST so the /api routes above take priority.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")