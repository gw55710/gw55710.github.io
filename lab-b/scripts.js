function hamsterAction() {
    const footer = document.querySelector("footer");
    const hamsters = footer.querySelectorAll(".hamster-guest");

    if (hamsters.length >= 5) {
        hamsters[0].remove();
    }

    const hamster = document.createElement("span");
    hamster.className = "hamster-guest";
    hamster.textContent = "🐹";
    hamster.setAttribute("aria-hidden", "true");
    hamster.addEventListener("animationend", function () {
        hamster.remove();
    });
    footer.append(hamster);
}

const todo = {
    tasks: [],
    term: "",

    load: function () {
        const savedTasks = localStorage.getItem("todo-tasks");

        if (savedTasks === null) {
            todo.tasks = [
                { name: "Przygotować projekt", date: "" },
                { name: "Zrobić zakupy", date: "" },
                { name: "Przeczytać rozdział książki", date: "" }
            ];
            return;
        }

        try {
            todo.tasks = JSON.parse(savedTasks).map(function (task) {
                if (typeof task === "string") {
                    return { name: task, date: "" };
                }
                return { name: task.name, date: task.date || "" };
            });
        } catch (error) {
            console.error("Nie udało się odczytać zapisanych zadań:", error);
            todo.tasks = [];
        }
    },

    getFilteredTasks: function () {
        return todo.tasks
            .map(function (task, index) {
                return { task: task, index: index };
            })
            .filter(function (item) {
                return todo.term.length < 2 ||
                    item.task.name.toLowerCase().includes(todo.term.toLowerCase());
            });
    },

    draw: function () {
        const taskList = document.querySelector("#task-list");
        const visibleTasks = todo.getFilteredTasks();
        taskList.innerHTML = "";

        visibleTasks.forEach(function (item) {
            const row = document.createElement("div");
            row.className = "task";
            row.dataset.index = item.index;

            const details = document.createElement("div");
            const taskName = document.createElement("span");
            taskName.className = "task-name";
            todo.addHighlightedName(taskName, item.task.name);
            details.append(taskName);

            if (item.task.date) {
                const date = document.createElement("small");
                date.className = "task-date";
                date.textContent = "Termin: " + new Date(item.task.date).toLocaleString("pl");
                details.append(document.createElement("br"), date);
            }

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.dataset.action = "remove";
            deleteButton.textContent = "Usuń";
            deleteButton.setAttribute("aria-label", "Usuń zadanie: " + item.task.name);

            row.append(details, deleteButton);
            taskList.append(row);
        });

        document.querySelector("#empty-message").hidden = visibleTasks.length > 0;
        localStorage.setItem("todo-tasks", JSON.stringify(todo.tasks));
    },

    addHighlightedName: function (element, name) {
        const lowerName = name.toLowerCase();
        const lowerTerm = todo.term.toLowerCase();
        let position = 0;

        if (lowerTerm.length < 2) {
            element.textContent = name;
            return;
        }

        while (position < name.length) {
            const match = lowerName.indexOf(lowerTerm, position);

            if (match === -1) {
                element.append(document.createTextNode(name.substring(position)));
                break;
            }

            element.append(document.createTextNode(name.substring(position, match)));
            const highlight = document.createElement("mark");
            highlight.textContent = name.substring(match, match + lowerTerm.length);
            element.append(highlight);
            position = match + lowerTerm.length;
        }
    },

    isValid: function (name, date) {
        if (typeof name !== "string" || typeof date !== "string") {
            return "Wpisz tekst zadania i poprawny termin.";
        }

        if (name.trim().length < 3 || name.trim().length > 255) {
            return "Zadanie musi mieć od 3 do 255 znaków.";
        }

        if (date !== "") {
            const dateTime = new Date(date).getTime();
            if (Number.isNaN(dateTime) || dateTime <= Date.now()) {
                return "Termin musi być ustawiony w przyszłości.";
            }
        }

        return "";
    },

    add: function (name, date) {
        if (date === undefined) date = "";
        const error = todo.isValid(name, date);
        if (error) throw new Error(error);

        todo.tasks.push({ name: name.trim(), date: date });
        todo.draw();
        hamsterAction();
    },

    remove: function (index) {
        if (!Number.isInteger(index) || index < 0 || index >= todo.tasks.length) {
            throw new Error("Nieprawidłowy numer zadania.");
        }
        todo.tasks.splice(index, 1);
        todo.draw();
        hamsterAction();
    },

    edit: function (index, name, date) {
        if (!Number.isInteger(index) || index < 0 || index >= todo.tasks.length) {
            throw new Error("Nieprawidłowy numer zadania.");
        }
        if (date === undefined) date = todo.tasks[index].date;
        const error = todo.isValid(name, date);
        if (error) throw new Error(error);

        todo.tasks[index] = { name: name.trim(), date: date };
        todo.draw();
        hamsterAction();
    },

    editRow: function (row) {
        if (row.querySelector("input")) return;

        const index = Number(row.dataset.index);
        const oldTask = todo.tasks[index];
        hamsterAction();
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.minLength = 3;
        nameInput.maxLength = 255;
        nameInput.value = oldTask.name;
        nameInput.setAttribute("aria-label", "Nazwa zadania");

        const dateInput = document.createElement("input");
        dateInput.type = "datetime-local";
        dateInput.value = oldTask.date;
        dateInput.setAttribute("aria-label", "Termin wykonania");

        row.innerHTML = "";
        row.append(nameInput, dateInput);
        nameInput.focus();

        row.addEventListener("focusout", function (event) {
            if (row.dataset.cancelEdit === "true") return;
            if (row.contains(event.relatedTarget)) return;

            try {
                todo.edit(index, nameInput.value, dateInput.value);
            } catch (error) {
                alert(error.message);
                todo.draw();
            }
        });

        row.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                row.dataset.cancelEdit = "true";
                todo.draw();
            }
            if (event.key === "Enter") {
                event.target.blur();
            }
        });
    }
};

todo.load();

document.querySelector("#task-search").addEventListener("input", function (event) {
    todo.term = event.target.value.trim();
    todo.draw();
    hamsterAction();
});

document.querySelector("#add-task-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const nameInput = document.querySelector("#new-task");
    const dateInput = document.querySelector("#task-date");

    try {
        todo.add(nameInput.value, dateInput.value);
        nameInput.value = "";
        dateInput.value = "";
    } catch (error) {
        alert(error.message);
    }
});

document.querySelector("#task-list").addEventListener("click", function (event) {
    const deleteButton = event.target.closest("button[data-action='remove']");
    if (deleteButton) {
        todo.remove(Number(deleteButton.parentElement.dataset.index));
        return;
    }

    const row = event.target.closest(".task");
    if (row) todo.editRow(row);
});

document.todo = todo;
todo.draw();
