const programmingBox =
document.getElementById(
"programmingBox"
);

function chooseGraphic(){

localStorage.setItem(

"projectType",

"Graphic Design"

);

window.location.href =
"project-editor.html";

}

function chooseVideo(){

localStorage.setItem(

"projectType",

"Video Editing"

);

window.location.href =
"project-editor.html";

}

function showProgramming(){

programmingBox.style.display =
"block";

}

function openLanguage(language){

localStorage.setItem(

"projectType",

"Programming"

);

localStorage.setItem(

"language",

language

);

window.location.href =
"project-editor.html";

}





const type =
localStorage.getItem(
"projectType"
);

const language =
localStorage.getItem(
"language"
);

console.log(type);

console.log(language);