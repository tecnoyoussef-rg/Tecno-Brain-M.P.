function goVisitor(){
    localStorage.setItem("role","visitor");
    window.location.href="visitor.html";
}


function goMember(){
    localStorage.setItem("role","member");
    window.location.href="regester.html";
}