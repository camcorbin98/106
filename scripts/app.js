
const API = "https://106api-b0bnggbsgnezbzcz.westus3-01.azurewebsites.net/api/tasks";

function saveTask(){

    console.log("Saving task...");

    // 1. Read the values from the form
    const title = $("#txtTitle").val();
    const desc = $("#txtDescription").val();
    const color = $("#selColor").val();
    const date = $("#selDate").val();
    const status = $("#selStatus").val();
    const budget = $("#numBudget").val();

    // 2. Validate the inputs
    if(title.trim() === ""){
        alert("Please enter a title.");
        return;
    }

    if(desc.trim() === ""){
        alert("Please enter a description.");
        return;
    }

    if(date === ""){
        alert("Please select a date.");
        return;
    }

    if(budget === ""){
        alert("Please enter a budget.");
        return;
    }

    if(Number(budget) < 0){
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

    // 4. Save the task on the server
    $.ajax({
        type: "POST",
        url: API,
        data: JSON.stringify(taskToSave),
        contentType: "application/json",

        success: function(created){
            console.log("Task saved successfully:", created);

            // 5. Reload tasks from the server
            loadTasks();

            // 6. Clear the form
            $("#taskForm")[0].reset();
        },

        error: function(fails){
            console.error("Error saving task:", fails);
            alert("Unable to save task. Please try again.");
        }
    });
}


function deleteTask(){

    console.log("Deleting task...");

    // 1. Identify the delete button
    let btn = $(this);

    // 2. Find the parent task element
    let taskElement = btn.closest(".task");

    // 3. Get the task ID
    let id = taskElement.attr("id");

    console.log("Deleting task ID:", id);

    // 4. Delete the task from the server
    $.ajax({
        type: "DELETE",
        url: API + "/" + encodeURIComponent(id),

        success: function(){
            taskElement.fadeOut(500, function(){
                $(this).remove();
            });
        },

        error: function(fails){
            console.error("Error deleting task:", fails);
            alert("Unable to delete task.");
        }
    });
}


function filter(status){

    if(status === "All"){
        $(".task").show();
        return;
    }

    $(".task").each(function(){

        let taskStatus = $(this).find(".status").text().trim();

        if(status === "Pending"){
            if(taskStatus === "New" || taskStatus === "In Progress"){
                $(this).show();
            }else{
                $(this).hide();
            }
        }else{
            if(taskStatus === status){
                $(this).show();
            }else{
                $(this).hide();
            }
        }
    });
}


function displayTask(task){

    // Create the task elements safely
    let taskElement = $("<div>").addClass("task");

    if(task.id !== undefined && task.id !== null){
        taskElement.attr("id", task.id);
    }

    taskElement.css("border-left-color", task.color || "#303f9f");

    let info = $("<div>").addClass("info");

    $("<h4>").text(task.title).appendTo(info);
    $("<p>").text(task.desc).appendTo(info);

    info.appendTo(taskElement);

    $("<label>")
        .addClass("status")
        .text(task.status)
        .appendTo(taskElement);

    let dateBudget = $("<div>").addClass("date-budget");

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


function loadTasks(){

    $.ajax({
        type: "GET",
        url: API,
        dataType: "json",

        success: function(data){

            console.log("Server responded with:", data);

            $(".list").empty();

            for(let i = 0; i < data.length; i++){
                displayTask(data[i]);
            }
        },

        error: function(err){
            console.error("Error fetching data:", err);
        }
    });
}


// Example function for updating a task on the server
function update(id, taskData){

    $.ajax({
        type: "PUT",
        url: API + "/" + encodeURIComponent(id),
        data: JSON.stringify(taskData),
        contentType: "application/json",

        success: function(response){
            console.log("Task updated:", response);
            loadTasks();
        },

        error: function(failure){
            console.error("Error updating task:", failure);
        }
    });
}


function init(){

    console.log("App initialized");

    // Save task button
    $("#btnSave").click(saveTask);

    // Task filters
    $("#btnAll").click(function(){
        filter("All");
    });

    $("#btnDone").click(function(){
        filter("Completed");
    });

    $("#btnTodo").click(function(){
        filter("Pending");
    });

    // Event delegation for dynamically created delete buttons
    $(".list").on("click", ".btn-delete", deleteTask);

    // Prevent accidental form submission on Enter
    $("#taskForm").on("submit", function(event){
        event.preventDefault();
        saveTask();
    });

    // Load saved tasks when the page opens
    loadTasks();
}


// Wait until the HTML and CSS have loaded
window.onload = init;





