export default class Todo {
    InputField = null;
    AddButton = null;
    TaskList = null;
    SaveButton = null;
    DeleteButton = null;
    StorageKey = '_tasks';

    constructor(root, options = {}) {
        const defaultOptions = {
            cssInputField: options.inputField ?? '',
            cssAddButton: options.addButton ?? 'btn btn-dark mx-auto',
            cssTaskList: options.taskList ?? 'list-group',
            cssSaveButton: options.saveButton ?? 'btn btn-success',
            cssDeleteButton: options.deleteButton ?? 'btn btn-danger'
        }
        this.init(root, defaultOptions);
    }

    init = (root, defaultOptions) => {
        this.initDom(root, defaultOptions);
        this.initElementObjects();
        this.initEventListeners();
        this.checkStorage();
    }

    initDom = (root, defaultOptions) => {
        const rootElement = document.querySelector(root);
        const todoDom = `
        <h1 class="text-center mb-5">ToDo</h1>
        
        <div class="container-fluid">
            <div class="row"> 
                <div class="col-lg-6 col-xl-4 mx-auto input-group-text">
                        <input type="text" id="inputField" class="${defaultOptions.cssInputField}"placeholder="Add task""/>
                        <button type="button" id="addButton" class="${defaultOptions.cssAddButton}">Add task</button>
                </div>
            </div>
            
            <div class="row"> 
                <div class="col-lg-6 col-xl-4 mx-auto">
                        <ul id="taskList" class="${defaultOptions.cssTaskList}"></ul>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-6 col-xl-4 mx-auto btn-group">
                    <button type="button" id="saveButton" class="${defaultOptions.cssSaveButton}">Save task list</button>
                    <button type="button" id="deleteButton" class="${defaultOptions.cssDeleteButton}">Delete task list</button>
                </div>
            </div>
        </div>`;
        rootElement.innerHTML = todoDom;
    }

    initElementObjects = () => {
        this.InputField = document.querySelector('#inputField');
        this.AddButton = document.querySelector('#addButton');
        this.TaskList = document.querySelector('#taskList');
        this.SaveButton = document.querySelector('#saveButton');
        this.DeleteButton = document.querySelector('#deleteButton');
    }

    initEventListeners = () => {
        this.AddButton.addEventListener('click', this.addTaskToList);
        this.InputField.addEventListener('keyup', this.addTaskToListOnEnter);
        this.SaveButton.addEventListener('click', this.saveList);
        this.DeleteButton.addEventListener('click', this.deleteList);
    }

    checkStorage = () => {
        if (window.localStorage === undefined) {
            Swal.fire('Your browser does not support local storage!');
            return;
        }

        const storageData = localStorage.getItem(this.StorageKey);
        if (storageData != null) {
            const tasks = JSON.parse(decodeURIComponent(atob(storageData)));
            for (const task of tasks) {
                const taskItem = this.createTaskItem(task.text);
                taskItem.dataset.createdAt = task.createdAt;
                taskItem.dataset.completedAt = task.completedAt;
                if (task.isDone) {
                    taskItem.style.textDecoration = 'line-through';
                    taskItem.querySelector('input').checked = true;
                }

                this.TaskList.append(taskItem);
            }
        }
    }

    createTaskItem = (task) => {
        const listElement = document.createElement('li');
        listElement.innerHTML = task;
        listElement.dataset.createdAt = this.generateTimestamp();
        listElement.dataset.completedAt = '';
        listElement.classList.add('list-group-item', 'fw-semibold', 'text-wrap', 'd-flex', 'justify-content-center', 'p-2', 'align-items-center', 'text-break', 'bg-info', 'fs-4');
        this.addCheckboxToListElement(listElement);
        this.addRemoveBtnToListElement(listElement);
        return listElement;
    }

    addCheckboxToListElement = (listElement) => {
        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input', 'd-flex', 'justify-content-center', 'p-2', 'm-2');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('change', this.changeTaskState);
        listElement.prepend(checkbox);
    }

    addRemoveBtnToListElement = (listElement) => {
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'p-2', 'm-2');
        removeBtn.setAttribute('type', 'button');
        removeBtn.innerHTML = 'X';
        removeBtn.addEventListener('click', this.removeTaskItem);
        listElement.append(removeBtn);
    }

    addTaskToList = () => {
        const task = this.InputField.value.trim();
        if (!task) {
            Swal.fire('Please add a task!');
            return;
        }

        const taskItem = this.createTaskItem(task);
        this.TaskList.append(taskItem);
        this.resetInputField();
    }

    addTaskToListOnEnter = (event) => {
        if (event.key === 'Enter') {
            this.addTaskToList();
        }
    }
    
    changeTaskState = (event) => {
        const checkbox = event.target;
        const listElement = checkbox.parentNode;
        if (checkbox.checked) {
            listElement.classList.add('bg-warning', 'text-decoration-line-through');
            listElement.dataset.completedAt = this.generateTimestamp();
        } else {
            listElement.classList.remove('bg-warning', 'text-decoration-line-through');
            listElement.dataset.completedAt = '';
        }
    }

    removeTaskItem = (event) => {
        const removeBtn = event.target;
        const listElement = removeBtn.parentNode;
        const checkbox = listElement.querySelector('input');
        if (checkbox.checked) {
            Swal.fire('You cannot delete completed task!');
            return;
        }

        Swal.fire({
            title: 'Delete task from list?',
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Yes',
            denyButtonText: 'No',
            customClass: {
              actions: 'my-actions',
              cancelButton: 'order-1 right-gap',
              confirmButton: 'order-2',
              denyButton: 'order-3',
            }
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire('Task deleted!', '', 'success');
              listElement.remove();
              return;
            } else if (result.isDenied) {
              Swal.fire('Task was not deleted!', '', 'info');
              return;
            }
          })
    }

    saveList = () => {
        if (window.localStorage === undefined) {
            Swal.fire('Your browser does not support local storage!');
            return;
        }

        const taskItems = this.TaskList.childNodes;
        if (taskItems.length === 0) {
            Swal.fire('No tasks to be saved found!');
            return;
        }

        const tasks = [];
        for (const task of taskItems) {
            tasks.push({
                isDone: task.querySelector('input').checked,
                text: task.childNodes[1].data,
                createdAt: task.dataset.createdAt,
                completedAt: task.dataset.completedAt
            });
        }
        localStorage.setItem(this.StorageKey, btoa(encodeURIComponent(JSON.stringify(tasks))));
    }

    deleteList = () => {
        Swal.fire({
            title: 'Delete tasks from local storage and list?',
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: 'Yes',
            denyButtonText: 'No',
            customClass: {
              actions: 'my-actions',
              cancelButton: 'order-1 right-gap',
              confirmButton: 'order-2',
              denyButton: 'order-3',
            }
          }).then((result) => {
            if (result.isConfirmed) {
              Swal.fire('Your tasks from local storage and list have been deleted!', '', 'success');
              localStorage.removeItem(this.StorageKey);
              this.TaskList.innerHTML = '';
              return;
            } else if (result.isDenied) {
              Swal.fire('Your tasks from local storage and list have not been deleted!', '', 'info');
              return;
            }
          })
    }

    resetInputField = () => {
        this.InputField.value = '';
        this.InputField.focus();
    }
    generateTimestamp = () => {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }
}