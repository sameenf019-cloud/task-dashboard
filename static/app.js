// Task Dashboard frontend: async/await fetch calls to the FastAPI backend.
const API = "/api/tasks";
const STATUS_LABELS = { todo: "To do", in_progress: "In progress", done: "Done" };

let tasks = [];
let filter = "all";
let editingId = null;

const form = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const prioritySel = document.getElementById("priority");
const statusSel = document.getElementById("status");
const formTitle = document.getElementById("formTitle");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const listEl = document.getElementById("taskList");
const listStatus = document.getElementById("listStatus");
const countEl = document.getElementById("count");
const chips = document.querySelectorAll(".chip");

// ---------- API helper ----------
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = "Request failed (" + res.status + ")";
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg).join(", ");
      }
    } catch (_) {
      /* response had no JSON body */
    }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

// ---------- READ ----------
async function loadTasks() {
  listStatus.textContent = "Loading...";
  try {
    tasks = await api(API);
    listStatus.textContent = "";
  } catch (err) {
    listStatus.textContent = "Could not load tasks: " + err.message;
    tasks = [];
  }
  render();
}

// ---------- Render (textContent only, so user text can never run as HTML) ----------
function formatDate(sqliteUtc) {
  const d = new Date(sqliteUtc.replace(" ", "T") + "Z");
  return isNaN(d) ? "" : d.toLocaleString();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  countEl.textContent = visible.length + " of " + tasks.length + " tasks";
  listEl.replaceChildren();

  if (visible.length === 0 && !listStatus.textContent) {
    listEl.appendChild(el("li", "msg", "No tasks here yet."));
    return;
  }

  visible.forEach((task) => {
    const li = el("li", "task p-" + task.priority + (task.status === "done" ? " done" : ""));

    const head = el("div", "task-head");
    head.appendChild(el("span", "task-title", task.title));
    const badges = el("div", "badges");
    badges.appendChild(el("span", "badge", task.priority));
    badges.appendChild(el("span", "badge", STATUS_LABELS[task.status]));
    head.appendChild(badges);
    li.appendChild(head);

    if (task.description) li.appendChild(el("p", "task-desc", task.description));
    li.appendChild(el("p", "task-meta", "Created " + formatDate(task.created_at)));

    const actions = el("div", "task-actions");

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Change status");
    Object.entries(STATUS_LABELS).forEach(([value, label]) => {
      const opt = el("option", "", label);
      opt.value = value;
      if (value === task.status) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => changeStatus(task, select.value));

    const editBtn = el("button", "mini", "Edit");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => startEdit(task));

    const delBtn = el("button", "mini danger", "Delete");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => removeTask(task));

    actions.append(select, editBtn, delBtn);
    li.appendChild(actions);
    listEl.appendChild(li);
  });
}

// ---------- CREATE / UPDATE ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    priority: prioritySel.value,
    status: statusSel.value,
  };
  if (!payload.title) {
    formError.textContent = "Title is required.";
    titleInput.focus();
    return;
  }

  submitBtn.disabled = true;
  try {
    if (editingId === null) {
      await api(API, { method: "POST", body: JSON.stringify(payload) });
    } else {
      await api(API + "/" + editingId, { method: "PUT", body: JSON.stringify(payload) });
    }
    resetForm();
    await loadTasks();
  } catch (err) {
    formError.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

async function changeStatus(task, newStatus) {
  try {
    await api(API + "/" + task.id, {
      method: "PUT",
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
      }),
    });
  } catch (err) {
    listStatus.textContent = "Could not update: " + err.message;
  }
  await loadTasks();
}

// ---------- DELETE ----------
async function removeTask(task) {
  if (!confirm('Delete "' + task.title + '"?')) return;
  try {
    await api(API + "/" + task.id, { method: "DELETE" });
    if (editingId === task.id) resetForm();
    listStatus.textContent = "";
  } catch (err) {
    listStatus.textContent = "Could not delete: " + err.message;
  }
  await loadTasks();
}

// ---------- Edit mode ----------
function startEdit(task) {
  editingId = task.id;
  titleInput.value = task.title;
  descInput.value = task.description;
  prioritySel.value = task.priority;
  statusSel.value = task.status;
  formTitle.textContent = "Edit task";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  formError.textContent = "";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  titleInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Add a task";
  submitBtn.textContent = "Add task";
  cancelBtn.hidden = true;
  formError.textContent = "";
}

cancelBtn.addEventListener("click", resetForm);

// ---------- Filters ----------
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filter = chip.dataset.filter;
    chips.forEach((c) => c.classList.toggle("active", c === chip));
    render();
  });
});

loadTasks();