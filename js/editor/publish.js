export function initPublish(editor){
document
.getElementById(
"publishBtn"
)

.onclick=()=>{

localStorage.setItem(

"published_html",

editor.getHtml()

);

localStorage.setItem(

"published_css",

editor.getCss()

);

alert(

"Published"

);

};

}