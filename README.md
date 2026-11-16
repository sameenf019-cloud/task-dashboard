# Task Dashboard

A full-stack task manager with a FastAPI backend, SQLite database and a vanilla JavaScript frontend. Built for the Progree Full Stack Development internship (Task 3).

## Features

- Create, view, edit and delete tasks (full CRUD)
- Priority (low, medium, high) and status (to do, in progress, done)
- Filter tasks by status
- Data saved in SQLite, so tasks stay after a refresh
- Input validation on both frontend and backend
- Parameterised SQL queries, and user text rendered with `textContent` (protection from SQL injection and XSS)
- Responsive layout

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | HTML, CSS, JavaScript (async/await) |
| Backend  | Python, FastAPI                     |
| Database | SQLite                              |

## Run locally

```bash
git clone https://github.com/sameenf019-cloud/task-dashboard.git
cd task-dashboard
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Open http://127.0.0.1:8000 for the app and http://127.0.0.1:8000/docs for the interactive API docs.

## API endpoints

| Method | Endpoint           | Description                              |
|--------|--------------------|------------------------------------------|
| GET    | `/api/tasks`       | List tasks (optional `?status=todo`)     |
| POST   | `/api/tasks`       | Create a task                            |
| PUT    | `/api/tasks/{id}`  | Update a task                            |
| DELETE | `/api/tasks/{id}`  | Delete a task                            |
| GET    | `/api/health`      | Health check                             |

Example request body for `POST` and `PUT`:

```json
{
  "title": "Finish Progree Task 3",
  "description": "Write the README",
  "priority": "high",
  "status": "in_progress"
}
```

## Project structure

```
task-dashboard/
├── main.py          # FastAPI app and routes
├── db.py            # SQLite data layer
├── requirements.txt
└── static/
    ├── index.html
    ├── style.css
    └── app.js
```

## Author

Sameen Fatima, Full Stack Developer Intern at Progree