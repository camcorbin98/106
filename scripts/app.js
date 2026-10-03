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

    if(title == ""){
        alert("Please enter a title.");
        return;
    }

    if(desc == ""){
        alert("Please enter a description.");
        return;
    }

    if(date == ""){
        alert("Please select a date.");
        return;
    }

    if(budget == ""){
        alert("Please enter a budget.");
        return;
    }

    if(budget < 0){
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
        budget
    );

    console.log(taskToSave);


    // 4. Show the task on the screen
    // Local echo - gone on refresh
    displayTask(taskToSave);


    // 5. Clear the form after saving
    $("#taskForm")[0].reset();
}


function init(){

    console.log("App initialized");

    $("#btnSave").click(saveTask);

    loadTasks();

    //example();
}


// const name = "Cam";

// Old way:
// "Hello " + name + ", welcome back"

// Template literal:
// `Hello, ${name}, welcome back`


function displayTask(task){

    let syntax = `

        <div class="task" style="border-left-color: ${task.color}">
            <div class="info">
                <h4>${task.title}</h4>
                <p>${task.desc}</p>
            </div>

            <label class="status">${task.status}</label>

            <div class="date-budget">
                <label>Due: ${task.date}</label>
                <label>Budget: $${task.budget}</label>
            </div>
        </div>`;

    // Growing a new branch on the DOM tree
    $(".list").append(syntax);
}


function loadTasks(){

    $.ajax({

        type: "GET", // HTTP verb for reading
        url: API,    // Where to send it
        dataType: "json", // What we expect back

        success: function(data){

            console.log("Server responded with: ", data);

            $(".list").empty();

            for(let i = 0; i < data.length; i++){
                displayTask(data[i]);
            }
        },

        error: function(err){

            console.error("Error fetching data", err);
        }
    });
}


window.onload = init;

// Force the HTML and CSS to get resolved
// before executing the logic



