const newProjectBtn =
document.getElementById("newProjectBtn");

const modal =
document.getElementById("projectModal");

const createProjectBtn =
document.getElementById("createProjectBtn");

const projectsList =
document.getElementById("projectsList");

let projects =
JSON.parse(
    localStorage.getItem("projects")
) || [];


// Open Create Project Modal
newProjectBtn.addEventListener(
    "click",
    () => {
        modal.style.display = "block";
    }
);


// Create Project
createProjectBtn.addEventListener(
    "click",
    () => {

        const name =
        document.getElementById(
            "projectName"
        ).value;

        const description =
        document.getElementById(
            "projectDescription"
        ).value;

        const deadline =
        document.getElementById(
            "projectDeadline"
        ).value;

        if(name.trim() === ""){

            alert(
                "Enter Project Name"
            );

            return;

        }

        const project = {

            id: Date.now(),

            name: name,

            description: description,

            deadline: deadline,

            startDate:
            new Date()
            .toLocaleDateString(),

            status: "draft",

            content: ""

        };

        projects.push(project);

        saveProjects();

        displayProjects();

        modal.style.display = "none";

        document.getElementById(
            "projectName"
        ).value = "";

        document.getElementById(
            "projectDescription"
        ).value = "";

        document.getElementById(
            "projectDeadline"
        ).value = "";

    }
);


// Save Projects
function saveProjects(){

    localStorage.setItem(
        "projects",
        JSON.stringify(projects)
    );

}


// Display Projects
function displayProjects(){

    projectsList.innerHTML = "";

    projects
.filter(

    project =>

    project.status !==
    "published"

)
.forEach(project => {

        projectsList.innerHTML += `

        <div class="project-card">

            <h3 onclick="openProject(${project.id})">

                ${project.name}

            </h3>

            <button
                class="menu-btn"
                onclick="toggleMenu('menu${project.id}')">

                ⋮

            </button>

            <div
                id="menu${project.id}"
                class="menu">

                <button
                    onclick="editProject(${project.id})">

                    Edit

                </button>

                <button
                    onclick="publishProject(${project.id})">

                    Publish

                </button>

                <button
                    onclick="deleteProject(${project.id})">

                    Delete

                </button>

            </div>

            <div class="project-info">

                <p>

                    Started:
                    ${project.startDate}

                </p>

                <p>

                    Deadline:
                    ${project.deadline || "Not Set"}

                </p>

                <p>

                    Status:
                    ${project.status}

                </p>

                <p>

                    ${project.description}

                </p>

            </div>

        </div>

        `;

    });

}


// Open Project
function openProject(projectId){

    localStorage.setItem(
        "currentProjectId",
        projectId
    );

    window.location.href =
    "project-editor.html";

}


// Toggle Menu
function toggleMenu(menuId){

    const menu =
    document.getElementById(menuId);

    menu.classList.toggle(
        "show"
    );

}


// Delete Project
function deleteProject(projectId){

    const confirmDelete =
    confirm(
        "Delete this project?"
    );

    if(!confirmDelete){

        return;

    }

    projects =
    projects.filter(

        project =>

        project.id !== projectId

    );

    saveProjects();

    displayProjects();

}


// Edit Project
function editProject(projectId){

    const project =
    projects.find(

        p =>

        p.id === projectId

    );

    if(!project){

        return;

    }

    const newName =
    prompt(

        "New Project Name",

        project.name

    );

    if(!newName){

        return;

    }

    project.name = newName;

    saveProjects();

    displayProjects();

}


// Publish Project
function publishProject(projectId){

    const project =
    projects.find(

        p => p.id === projectId

    );

    if(!project){

        return;

    }

    project.status =
    "published";

    saveProjects();

    displayProjects();


    alert(
        "Project Published"
    );

}


// First Load
displayProjects();

