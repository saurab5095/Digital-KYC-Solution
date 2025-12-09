// backend/src/tasks.js
const tasks = {};

function createTask() {
  const id = Date.now().toString();
  tasks[id] = { status: "processing", result: null };
  return id;
}

function setTaskResult(id, result) {
  if (tasks[id]) {
    tasks[id].status = "completed";
    tasks[id].result = result;
  }
}

function getTask(id) {
  return tasks[id] || null;
}

module.exports = { createTask, setTaskResult, getTask };
