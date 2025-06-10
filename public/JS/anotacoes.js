let notes = [];
let tasks = [];

// Salva notas e tarefas no Firestore
function saveData() {
  db.collection("anotacoes").doc("dados").set({ notes, tasks });
}

// Carrega dados do Firestore ao iniciar
function loadData() {
  db.collection("anotacoes").doc("dados").get().then(doc => {
    if (doc.exists) {
      notes = doc.data().notes || [];
      tasks = doc.data().tasks || [];
      renderNotes();
      renderTasks();
    }
  });
}

function addNote() {
  const id = Date.now();
  const note = {
    id,
    title: "Nova Anotação",
    content: "",
    tags: [],
    important: false,
    date: new Date().toISOString()
  };
  notes.push(note);
  renderNotes();
  saveData();
}

function showNewTask() {
  const taskDiv = document.createElement("div");
  const newId = Date.now();
  taskDiv.className = "task show";
  taskDiv.innerHTML = `
    <div class="checklist-container">
        <h4>Tarefas:</h4>
        <div id="checklist-task-${newId}"></div>
        <div class="add-task">
            <input type="text" id="newTask-${newId}" placeholder="Nova tarefa">
            <button onclick="addTask(null, this.parentElement.parentElement, ${newId})">Adicionar</button>
        </div>
    </div>
    <div class="actions">
        <button onclick="addTaskToList(this.parentElement.parentElement)">Salvar Tarefa</button>
        <button onclick="deleteTask(null, this.parentElement.parentElement)">🗑️</button>
    </div>
    <small>${new Date().toLocaleString()}</small>`;
  document.getElementById("tasks").appendChild(taskDiv);
}

function addTaskToList(taskElement) {
  const id = Date.now();
  const tasksList = Array.from(taskElement.querySelectorAll('.checklist-item')).map(item => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const text = item.querySelector('span').textContent;
    return { text, completed: checkbox.checked };
  });
  tasks.push({ id, title: "Tarefa", content: "", tasks: tasksList, date: new Date().toISOString() });
  renderTasks();
  saveData();
  taskElement.remove();
}

function renderNotes() {
  const container = document.getElementById("notes");
  container.innerHTML = "";

  notes.forEach(note => {
    const noteEl = document.createElement("div");
    noteEl.className = "note collapsed";
    noteEl.setAttribute("data-id", note.id);

    noteEl.innerHTML = `
      <div class="note-summary" onclick="toggleNote(${note.id})">
        <h3>${note.title}</h3>
        <p>${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
      </div>
      <div class="note-details" style="display: none;">
        <h3 contenteditable="true" onblur="updateTitle(${note.id}, this.textContent)">${note.title}</h3>
        <textarea onblur="updateContent(${note.id}, this.value)">${note.content}</textarea>
        <div class="actions">
          <button onclick="toggleImportant(${note.id})">${note.important ? '⭐' : '☆'}</button>
          <button onclick="deleteNote(${note.id})">🗑️</button>
        </div>
        <small>${new Date(note.date).toLocaleString()}</small>
      </div>
    `;
    container.appendChild(noteEl);
  });
}

function toggleNote(id) {
  const noteEl = document.querySelector(`.note[data-id="${id}"]`);
  if (noteEl) {
    const details = noteEl.querySelector(".note-details");
    const isVisible = details.style.display === "block";
    details.style.display = isVisible ? "none" : "block";
  }
}

function renderTasks() {
  const container = document.getElementById("tasks");
  container.innerHTML = "";

  tasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.innerHTML = `
      <h3>${task.title}</h3>
      <div class="checklist-container">
        <h4>Tarefas:</h4>
        <div id="checklist-${task.id}">
          ${renderChecklist(task.tasks, task.id)}
        </div>
        <div id="add-task-box-${task.id}" style="display: none; margin-top: 8px;">
          <input type="text" id="newTaskInput-${task.id}" placeholder="Nova tarefa">
          <button onclick="addSubtask(${task.id})">➕ Adicionar</button>
        </div>
      </div>
      <div class="actions">
        <button onclick="toggleAddTask(${task.id})">✏️ Editar</button>
        <button onclick="deleteTask(${task.id})">🗑️</button>
      </div>
      <small>${new Date(task.date).toLocaleString()}</small>
    `;
    container.appendChild(taskEl);
  });
}


function renderChecklist(tasksList, taskId) {
  return tasksList.map((task, index) => `
    <div class="checklist-item">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${taskId}, ${index})">
      <span>${task.text}</span>
    </div>
  `).join('');
}

function toggleAddTask(taskId) {
  const box = document.getElementById(`add-task-box-${taskId}`);
  if (box) {
    box.style.display = box.style.display === "none" ? "block" : "none";
  }
}


function addSubtask(taskId) {
  const input = document.getElementById(`newTaskInput-${taskId}`);
  const text = input.value.trim();
  if (!text) return;

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.tasks.push({ text, completed: false });
    renderTasks();
    saveData(); // Se você tiver uma função de salvar, opcional
  }

  input.value = '';
}


function updateTitle(id, newTitle) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.title = newTitle;
    saveData();
  }
}

function updateContent(id, newContent) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.content = newContent;
    saveData();
  }
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  renderNotes();
  saveData();
}

function deleteTask(id, taskElement) {
  if (id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    saveData();
  } else if (taskElement) {
    taskElement.remove();
  }
}

function addTask(taskId, taskElement, newTaskId) {
  const newTaskInput = document.getElementById(`newTask-${newTaskId}`);
  const newTaskText = newTaskInput.value.trim();
  if (newTaskText) {
    const checklistItem = document.createElement("div");
    checklistItem.className = "checklist-item";
    checklistItem.innerHTML = `
      <input type="checkbox" onchange="toggleTask(${taskId}, ${taskElement.querySelectorAll('.checklist-item').length})">
      <span>${newTaskText}</span>
    `;
    taskElement.querySelector(`#checklist-task-${newTaskId}`).appendChild(checklistItem);
    newTaskInput.value = "";
  }
}

function toggleTask(taskId, index) {
  const task = tasks.find(t => t.id === taskId);
  if (task && task.tasks[index]) {
    task.tasks[index].completed = !task.tasks[index].completed;
    saveData();
    renderTasks();
  }
}

function toggleImportant(id) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.important = !note.important;
    saveData();
    renderNotes();
  }
}

function searchNotes() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword));
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(keyword) ||
    t.tasks.some(task => task.text.toLowerCase().includes(keyword))
  );
  const notesContainer = document.getElementById("notes");
  const tasksContainer = document.getElementById("tasks");
  notesContainer.innerHTML = "";
  tasksContainer.innerHTML = "";
  filteredNotes.forEach(note => {
    const noteEl = document.createElement("div");
    noteEl.className = "note";
    noteEl.innerHTML = `
      <h3>${note.title}</h3>
      <p>${note.content}</p>
      <div class="actions">
        <button onclick="deleteNote(${note.id})">🗑️</button>
      </div>
      <small>${new Date(note.date).toLocaleString()}</small>`;
    notesContainer.appendChild(noteEl);
  });
  filteredTasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.className = "task";
    taskEl.innerHTML = `
      <h3>${task.title}</h3>
      <div class="checklist-container">
        <h4>Tarefas:</h4>
        <div>${renderChecklist(task.tasks, task.id)}</div>
      </div>
      <div class="actions">
        <button onclick="deleteTask(${task.id})">🗑️</button>
      </div>
      <small>${new Date(task.date).toLocaleString()}</small>`;
    tasksContainer.appendChild(taskEl);
  });
}

 document.addEventListener('DOMContentLoaded', function () {
      const calendarEl = document.getElementById('calendar');

      // Carrega eventos do localStorage ou inicia vazio
      const savedEvents = JSON.parse(localStorage.getItem('meusEventos')) || [];

      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        editable: true,
        selectable: true,
        events: savedEvents,

        // Adiciona evento ao clicar numa data
        dateClick: function (info) {
          const title = prompt('Digite o título do evento:');
          if (title) {
            const newEvent = {
              title: title,
              start: info.dateStr,
              allDay: true,
            };
            calendar.addEvent(newEvent);

            // Salva no localStorage
            savedEvents.push(newEvent);
            localStorage.setItem('meusEventos', JSON.stringify(savedEvents));
          }
        },

        // Remove evento ao clicar nele
        eventClick: function (info) {
          if (confirm(`Deseja remover o evento "${info.event.title}"?`)) {
            // Remove visualmente
            info.event.remove();

            // Remove do localStorage
            const updatedEvents = savedEvents.filter(e =>
              !(e.title === info.event.title && e.start === info.event.startStr)
            );
            localStorage.setItem('meusEventos', JSON.stringify(updatedEvents));
          }
        }
      });

      calendar.render();
    });

function sair() {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    firebase.auth().signOut().then(() => {
      window.location.href = 'index.html';
    }).catch(error => {
      console.error("Erro ao sair:", error);
    });
  }
}

// Carrega dados automaticamente ao abrir a página
window.onload = loadData;
