export function initSave(editor){

document

.getElementById(

"saveBtn"

)

.onclick=()=>{

localStorage.setItem(

"html",

editor.getHtml()

);

localStorage.setItem(

"css",

editor.getCss()

);

alert(

"Saved"

);

};

}