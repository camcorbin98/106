
const API = "https://106api-b0bnggbsgnezbzcz.westus3-01.azurewebsites.net/api/tasks";

const OWN_TASKS_KEY = "fsdi106_my_task_ids";

function getMyTaskIds() {
    try {
        const ids = JSON.parse(localStorage.getItem(OWN_TASKS_KEY) || "[]");
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch(error) {
        console.error("Unable to read saved task IDs:", error);
        return [];
    }
}

function rememberTask(id) {
    if(id === undefined || id === null) return;

    const ids = getMyTaskIds();
    const taskId = String(id);

    if(!ids.includes(taskId)) {
        ids.push(taskId);
        localStorage.setItem(OWN_TASKS_KEY, JSON.stringify(ids));
    }
}

function forgetTask(id) {
    const ids = getMyTaskIds();
    const remaining = ids.filter(taskId => taskId !== String(id));

    localStorage.setItem(OWN_TASKS_KEY, JSON.stringify(remaining));
}

function saveTask() {

    console.log("Saving task...");

    // 1. Read the values from the form
    const title = $("#txtTitle").val();
    const desc = $("#txtDescription").val();
    const color = $("#selColor").val();
    const date = $("#selDate").val();
    const status = $("#selStatus").val();
    const budget = $("#numBudget").val();

    // 2. Validate the inputs
    if(title.trim() === "") {
        alert("Please enter a title.");
        return;
    }

    if(desc.trim() === "") {
        alert("Please enter a description.");
        return;
    }

    if(date === "") {
        alert("Please select a date.");
        return;
    }

    if(budget === "" || !Number.isFinite(Number(budget))) {
        alert("Please enter a valid budget.");
        return;
    }

    if(Number(budget) < 0) {
        alert("Budget cannot be negative.");
        return;
    }

    // 3. Create a Task object
    const taskToSave = new Task(
        title,
        desc,
        color,
        date,
        status,
        Number(budget)
    );

    console.log(taskToSave);

    // 4. Save task on the server
    $.ajax({
        type: "POST",
        url: API,
        data: JSON.stringify(taskToSave),
        contentType: "application/json",

        success: function(created) {
            console.log("Task saved successfully:", created);

            // Remember tasks created by this browser
            if(created && created.id !== undefined) {
                rememberTask(created.id);
            } else {
                console.warn("Server did not return a task ID.");
            }

            // Reload tasks from server
            loadTasks();

            // Clear form
            $("#taskForm")[0].reset();
        },

        error: function(fails) {
            console.error("Error saving task:", fails);
            alert("Unable to save task. Please try again.");
        }
    });
}

function deleteTask() {

    console.log("Deleting task...");

    const btn = $(this);
    const taskElement = btn.closest(".task");
    const id = taskElement.attr("id");

    if(!id) {
        alert("This task does not have a valid ID.");
        return;
    }

    $.ajax({
        type: "DELETE",
        url: API + "/" + encodeURIComponent(id),

        success: function() {
            forgetTask(id);

            taskElement.fadeOut(500, function() {
                $(this).remove();
            });
        },

        error: function(fails) {
            console.error("Error deleting task:", fails);
            alert("Unable to delete task.");
        }
    });
}

function deleteAllTasks() {

    const ids = getMyTaskIds();

    if(ids.length === 0) {
        alert("No tasks created in this browser are available to delete.");
        return;
    }

    if(!confirm(
        "Delete all tasks created in this browser? This cannot be undone."
    )) {
        return;
    }

    $("#btnDeleteAll").prop("disabled", true);

    const requests = ids.map(id =>
        $.ajax({
            type: "DELETE",
            url: API + "/" + encodeURIComponent(id)
        }).then(
            () => ({ id, success: true }),
            () => ({ id, success: false })
        )
    );

    Promise.all(requests).then(results => {

        const deleted = results.filter(result => result.success);
        const failed = results.filter(result => !result.success);

        deleted.forEach(result => forgetTask(result.id));

        loadTasks();

        $("#btnDeleteAll").prop("disabled", false);

        if(failed.length === 0) {
            alert("All tracked tasks deleted successfully!");
        } else {
            alert(
                deleted.length + " tasks deleted. " +
                failed.length + " could not be deleted."
            );
        }
    });
}

function filter(status) {

    if(status === "All") {
        $(".task").show();
        return;
    }

    $(".task").each(function() {

        const taskStatus = $(this).find(".status").text().trim();

        if(status === "Pending") {
            if(taskStatus === "New" || taskStatus === "In Progress") {
                $(this).show();
            } else {
                $(this).hide();
            }
        } else {
            if(taskStatus === status) {
                $(this).show();
            } else {
                $(this).hide();
            }
        }
    });
}

function displayTask(task) {

    const taskElement = $("<div>").addClass("task");

    if(task.id !== undefined && task.id !== null) {
        taskElement.attr("id", task.id);
    }

    taskElement.css(
        "border-left-color",
        /^#[0-9a-fA-F]{6}$/.test(task.color)
            ? task.color
            : "#303f9f"
    );

    const info = $("<div>").addClass("info");

    $("<h4>").text(task.title).appendTo(info);
    $("<p>").text(task.desc).appendTo(info);

    info.appendTo(taskElement);

    $("<label>")
        .addClass("status")
        .text(task.status)
        .appendTo(taskElement);

    const dateBudget = $("<div>").addClass("date-budget");

    $("<label>")
        .text("Due: " + (task.date || "Not set"))
        .appendTo(dateBudget);

    $("<label>")
        .text("Budget: $" + (task.budget ?? 0))
        .appendTo(dateBudget);

    dateBudget.appendTo(taskElement);

    $("<button>")
        .addClass("btn-delete")
        .attr("type", "button")
        .text("Delete")
        .appendTo(taskElement);

    $(".list").append(taskElement);
}

function loadTasks() {

    $.ajax({
        type: "GET",
        url: API,
        dataType: "json",

        success: function(data) {

            console.log("Server responded with:", data);

            $(".list").empty();

            for(let i = 0; i < data.length; i++) {
                displayTask(data[i]);
            }
        },

        error: function(err) {
            console.error("Error fetching data:", err);
        }
    });
}

// Example update function
function update(id, taskData) {

    $.ajax({
        type: "PUT",
        url: API + "/" + encodeURIComponent(id),
        data: JSON.stringify(taskData),
        contentType: "application/json",

        success: function(response) {
            console.log("Task updated:", response);
            loadTasks();
        },

        error: function(failure) {
            console.error("Error updating task:", failure);
        }
    });
}

function init() {

    console.log("App initialized");

    // Save task
    $("#btnSave").click(saveTask);

    // Filters
    $("#btnAll").click(function() {
        filter("All");
    });

    $("#btnDone").click(function() {
        filter("Completed");
    });

    $("#btnTodo").click(function() {
        filter("Pending");
    });

    // Individual deletion
    $(".list").on("click", ".btn-delete", deleteTask);

    // Delete all tracked tasks
    $("#btnDeleteAll").click(deleteAllTasks);

    // Prevent normal form submission
    $("#taskForm").on("submit", function(event) {
        event.preventDefault();
        saveTask();
    });

    // Load tasks from server
    loadTasks();
}

window.onload = init;






