const publishedProjectsContainer =
document.getElementById(
    "publishedProjects"
);


// Get all projects from localStorage
let projects =
JSON.parse(
    localStorage.getItem("projects")
) || [];


// Get only published projects
function getPublishedProjects(){

    projects =
    JSON.parse(
        localStorage.getItem(
            "projects"
        )
    ) || [];

    return projects.filter(

        project =>

        project.status ===
        "published"

    );

}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
}

// Open project details page
function viewProject(projectId){

    localStorage.setItem(
        "selectedProject",
        projectId
    );

    window.location.href =
    "project-view.html";

}

// Open project preview modal like the editor preview button
function previewProject(projectId) {
    const allProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    const project = allProjects.find(p => String(p.id) === String(projectId));

    if (!project) {
        alert("Project not found.");
        return;
    }

    const existingModal = document.getElementById("visitor-preview-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "visitor-preview-modal";
    modal.style.cssText = "position:fixed; inset:0; background:rgba(2, 6, 23, 0.86); display:flex; align-items:center; justify-content:center; z-index:99999; padding:24px;";
    modal.innerHTML = `
        <div style="width:min(95vw, 1100px); height:min(90vh, 820px); background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.35); display:flex; flex-direction:column;">
            <div style="background:#111827; color:#fff; padding:12px 16px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-weight:700; font-size:14px;">${escapeHTML(project.name || "Preview")}</div>
                    <div style="font-size:11px; color:#94a3b8;">Live preview for the published project</div>
                </div>
                <button type="button" id="visitor-preview-close-btn" style="border:none; background:#ef4444; color:#fff; width:32px; height:32px; border-radius:999px; cursor:pointer; font-size:14px;">×</button>
            </div>
            <iframe id="visitor-preview-frame" style="flex:1; width:100%; border:0; background:#fff;"></iframe>
        </div>
    `;

    document.body.appendChild(modal);

    const frame = modal.querySelector("#visitor-preview-frame");
    const previewHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(project.name || "Preview")}</title><style>body{margin:0;padding:0;background:#fff;font-family:Inter,Arial,sans-serif;}</style></head><body>${project.content || `<div style="padding:24px; color:#334155;">${escapeHTML(project.description || "No preview content available.")}</div>`}</body></html>`;
    frame.srcdoc = previewHtml;

    modal.querySelector("#visitor-preview-close-btn").onclick = () => modal.remove();
    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.remove();
    });
}


// Delete a published project from the list
function deleteProject(projectId){
    const allProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    const updatedProjects = allProjects.filter(
        project => String(project.id) !== String(projectId)
    );
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    projects = updatedProjects;
    displayPublishedProjects();
}


// Display published projects
function displayPublishedProjects(){

    const publishedProjects =
projects.filter(

    project =>

    project.status ===
    "published"

);

    publishedProjectsContainer.innerHTML = "";

    if(
        publishedProjects.length === 0
    ){

        publishedProjectsContainer.innerHTML =

        `
        <div class="empty-projects">

            <h2>
                No Published Projects Yet
            </h2>

            <p>
                Projects will appear here
                after being published.
            </p>

        </div>
        `;

        return;

    }

    publishedProjects.forEach(

        project => {

            publishedProjectsContainer.innerHTML +=

            `
            <div class="project-card" onclick="viewProject(${project.id})">

                <div class="project-card-header">
                    <h2>${project.name}</h2>
                    <div class="project-card-actions">
                        <button class="preview-btn" onclick="event.stopPropagation(); previewProject(${project.id});">Preview</button>
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteProject(${project.id});">Delete</button>
                    </div>
                </div>

                <p>${project.description}</p>

                <p><strong>Deadline:</strong> ${project.deadline || "Not Set"}</p>

                <p><strong>Started:</strong> ${project.startDate || "Not Set"}</p>

            </div>
            `;

        }

    );

}


// First load
displayPublishedProjects();


// Listen for updates
window.addEventListener(

    "storage",

    () => {

        displayPublishedProjects();

    }

);