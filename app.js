// Simple TODO app with localStorage persistence
// State shape: [{ id, text, completed, createdAt }]

(function () {
    "use strict";

    /** DOM elements */
    const newTodoForm = document.getElementById("new-todo-form");
    const newTodoInput = document.getElementById("new-todo-input");
    const todoList = document.getElementById("todo-list");
    const itemsLeftEl = document.getElementById("items-left");
    const clearCompletedBtn = document.getElementById("clear-completed");
    const filterButtons = Array.from(document.querySelectorAll(".filter"));

    /** App state */
    /** @type {Array<{id:string,text:string,completed:boolean,createdAt:number}>} */
    let todos = [];
    /** @type {"all"|"active"|"completed"} */
    let activeFilter = "all";

    /** Storage helpers */
    const STORAGE_KEY = "todo.items.v1";
    function loadTodos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const data = JSON.parse(raw);
            if (!Array.isArray(data)) return [];
            return data.map((t) => ({
                id: String(t.id ?? crypto.randomUUID()),
                text: String(t.text ?? ""),
                completed: Boolean(t.completed),
                createdAt: Number(t.createdAt ?? Date.now()),
            }));
        } catch {
            return [];
        }
    }
    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    /** State operations */
    function addTodo(text) {
        const trimmed = text.trim();
        if (!trimmed) return;
        todos.unshift({
            id: crypto.randomUUID(),
            text: trimmed,
            completed: false,
            createdAt: Date.now(),
        });
        saveTodos();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        todo.completed = !todo.completed;
        saveTodos();
        render();
    }

    function deleteTodo(id) {
        todos = todos.filter((t) => t.id !== id);
        saveTodos();
        render();
    }

    function updateTodoText(id, newText) {
        const trimmed = newText.trim();
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        if (!trimmed) {
            // If text becomes empty, remove the item
            deleteTodo(id);
            return;
        }
        todo.text = trimmed;
        saveTodos();
        render();
    }

    function clearCompleted() {
        const hadCompleted = todos.some((t) => t.completed);
        if (!hadCompleted) return;
        todos = todos.filter((t) => !t.completed);
        saveTodos();
        render();
    }

    /** Rendering */
    function render() {
        // Items left
        const activeCount = todos.filter((t) => !t.completed).length;
        itemsLeftEl.textContent = `${activeCount} item${activeCount === 1 ? "" : "s"} left`;

        // Filters UI
        filterButtons.forEach((btn) => {
            const isActive = btn.dataset.filter === activeFilter;
            btn.classList.toggle("is-active", isActive);
            btn.setAttribute("aria-selected", String(isActive));
        });

        // Filtered list
        let visible = todos;
        if (activeFilter === "active") visible = todos.filter((t) => !t.completed);
        if (activeFilter === "completed") visible = todos.filter((t) => t.completed);

        // Clear list
        while (todoList.firstChild) todoList.removeChild(todoList.firstChild);

        // Render items
        const fragment = document.createDocumentFragment();
        for (const t of visible) {
            const li = document.createElement("li");
            li.className = `todo-item${t.completed ? " completed" : ""}`;
            li.dataset.id = t.id;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = t.completed;
            checkbox.setAttribute("aria-label", "Toggle completed");
            checkbox.addEventListener("change", () => toggleTodo(t.id));

            const text = document.createElement("div");
            text.className = "todo-text";
            text.textContent = t.text;
            text.setAttribute("role", "textbox");
            text.setAttribute("contenteditable", "false");
            text.setAttribute("aria-label", "Edit todo text");

            const actions = document.createElement("div");
            actions.className = "todo-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "icon-btn";
            editBtn.type = "button";
            editBtn.title = "Edit";
            editBtn.setAttribute("aria-label", "Edit");
            editBtn.textContent = "✏️";

            const delBtn = document.createElement("button");
            delBtn.className = "icon-btn";
            delBtn.type = "button";
            delBtn.title = "Delete";
            delBtn.setAttribute("aria-label", "Delete");
            delBtn.textContent = "🗑️";

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            li.appendChild(checkbox);
            li.appendChild(text);
            li.appendChild(actions);
            fragment.appendChild(li);

            // Edit handlers
            function enableEditing() {
                text.setAttribute("contenteditable", "true");
                text.focus();
                // Move caret to end
                document.getSelection()?.collapse(text, 1);
            }

            function disableEditing(commit) {
                const isEditing = text.getAttribute("contenteditable") === "true";
                if (!isEditing) return;
                text.setAttribute("contenteditable", "false");
                if (commit) updateTodoText(t.id, text.textContent || "");
                else render();
            }

            editBtn.addEventListener("click", () => {
                const isEditing = text.getAttribute("contenteditable") === "true";
                if (isEditing) disableEditing(true);
                else enableEditing();
            });

            text.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    disableEditing(true);
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    disableEditing(false);
                }
            });

            delBtn.addEventListener("click", () => deleteTodo(t.id));
        }
        todoList.appendChild(fragment);
    }

    /** Events */
    newTodoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        addTodo(newTodoInput.value);
        newTodoInput.value = "";
        newTodoInput.focus();
    });

    clearCompletedBtn.addEventListener("click", () => clearCompleted());

    filterButtons.forEach((btn) =>
        btn.addEventListener("click", () => {
            const next = btn.dataset.filter;
            if (next === activeFilter) return;
            activeFilter = /** @type {typeof activeFilter} */ (next);
            render();
        })
    );

    // Init
    todos = loadTodos();
    render();
})();


