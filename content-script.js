/* function receiveMessage(event)
{
	// console.log("event.data:");
	// console.log(event.data);
	// console.log("done");
  // Do we trust the sender of this message?
  //if (event.origin !== "http://example.com:8080")
  //  return;

  // event.source is window.opener
  // event.data is "hello there!"

  // Assuming you've verified the origin of the received message (which
  // you must do in any case), a convenient idiom for replying to a
  // message is to call postMessage on event.source and provide
  // event.origin as the targetOrigin.
  // event.source.postMessage("hi there yourself!  the secret response " +
  //                          "is: rheeeeet!",
  //                          event.origin);
}

window.addEventListener("message", receiveMessage, false); */

//console.log("come here 0"); //content script log shows in normal inspector window console, not browser console !
/* function eatPageReceiver(request, sender, sendResponse) {
  document.body.textContent = "";
  var header = document.createElement('h1');
  header.textContent = request.replacement;
  document.body.appendChild(header);
}
browser.runtime.onMessage.addListener(eatPageReceiver);
document.body.textContent = "lalaalla";
document.body.style.border = "5px solid green";
document.body.textContent = "lalaalla2"; */

/* //manifest
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content-script.js"]
}] */