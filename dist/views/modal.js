!function(){"use strict";chrome.runtime.onMessage.addListener(({type:e,payload:t},n,o)=>{switch(e){case"CONFIRMATION_DISPLAY.LOAD":const{documentTitle:n,title:c,message:r,buttons:u}=t;return document.querySelector("#document-title").innerText=n,document.querySelector("#modal #title").innerText=c,document.querySelector("#modal #message").innerHTML=r,u.forEach((e,t)=>{let n=document.createElement("button");n.innerText=e,n.className="button",document.querySelector("#modal #modal-footer").appendChild(n),n.onclick=function(){o({status:1,index:t})}}),!0;default:return!1}})}();
