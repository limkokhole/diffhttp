/* jshint esversion: 6 */
//console.log("hole bg 0");
/**
When we receive the message, execute the given script in the given
tab.
*/
/*
function handleMessage(request, sender, sendResponse) {
 
  if (sender.url != browser.runtime.getURL("/devtools/panel/panel.html")) {
    return;
  }
    console.log("run me 0");
  browser.tabs.executeScript(
    request.tabId, 
    {
      code: request.lala
    });
    console.log("run me 1");

  
} */

/**
Listen for messages from our devtools panel.
*/
/*
browser.runtime.onMessage.addListener(handleMessage); */

//var tabId = "";

//function messageTab(tabs) {
//console.log("msg 0");
//browser.tabs.sendMessage(tabs[0].id, {
//browser.tabs.sendMessage(browser.devtools.inspectedWindow.tabId, {
//rf: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/sendMessage
//browser.runtime.sendMessage({

//  replacement: "Message from the extension!"
//  });
//notifyDevtools(requestDetails);

//}

/*
function isDict(v) {
    return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}
*/

function addURL(requestDetails) {
    //if requestDetails.tabId is -1, means failed(exclude data:image) which will not get status also, I think is bug since not able to get tabId
    //console.log("Loading: " + requestDetails.url);

    //when test, don't forget nid reopen inspector window first
    //console.log("type: " + requestDetails.type + " t: " + requestDetails.timeStamp);
    //console.log("type: " + requestDetails.type + " t: " + requestDetails.timeStamp + "url: " + requestDetails.url);

    /*     console.log("frameId: " + requestDetails.frameId + " #proxyInfo: " +
            requestDetails.proxyInfo + " #sframeAncestors: " + requestDetails.frameAncestors); */

    /*
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    filter.ondata = event => {
        let str = decoder.decode(event.data, {stream: true});
        // Just change any instance of Example in the HTTP response
        // to WebExtension Example.
        console.log("hole" + str);
        str = str.replace(/Example/g, 'WebExtension Example');
        console.log("hole2" + str);
        filter.write(encoder.encode(str));
        filter.disconnect();
    }
    */

    //console.log("tab id: " + c.devtools.inspectedWindow.tabId);
    /*  browser.runtime.sendMessage({
    tabId: browser.devtools.inspectedWindow.tabId,
    url: requestDetails.url
  });
*/

    //if ("diffHTTP_" + requestDetails.tabId === tabId) {
    //    console.log("req is same tabId");
    notifyDevtools({
        "tabId": "diffHTTP_" + requestDetails.tabId,
        "tag": "add",
        "items": requestDetails
    });
    //} else console.log("req is NOT same tabId");

    /*
        var querying = browser.tabs.query({
            active: true,
            currentWindow: true
        });
        querying.then(messageTab);
    */
}

//currently no such 304 Not Modified which happen in builtin network tab
function updateURL(responseDetails) {
    //console.log("updating: " + responseDetails.url + " #tabId:" + "diffHTTP_" + responseDetails.tabId);
    //if ("diffHTTP_" + responseDetails.tabId === tabId) {
    //    console.log("response is same tabId");
    notifyDevtools({
        "tabId": "diffHTTP_" + responseDetails.tabId,
        "tag": "update",
        "items": responseDetails
    });
    //} else console.log("response is NOT same tabId");
}

function logSentHeaders(e) {
    //console.log("sent: " +" #e.tabId: " + e.tabId);
    notifyDevtools({
        "tabId": "diffHTTP_" + e.tabId,
        "tag": "sentHeaders",
        "items": e
    });
}

function logReceivedHeaders(e) {
    //console.log("recv: " +" #e.tabId: " + e.tabId);
    notifyDevtools({
        "tabId": "diffHTTP_" + e.tabId,
        "tag": "recvHeaders",
        "items": e
    });
}

let popUpPostDataQueue = [];

function donePopUpReceiver(request, sender, sendResponse) {
    /*     console.log("done popup 0 ?: " + sender.id);
        console.log(sender); */
    //can't compare URL since sender.url is .../_generated_background_page.html instead of .../postdata.html
    //if (sender.url === browser.extension.getURL("postdata.html")) {
    if (sender.id === browser.runtime.id) {
        browser.tabs.sendMessage(sender.tab.id, {
            tag: "inject_pop_up",
            msg: popUpPostDataQueue.pop()
        });
    }
    //console.log("done send");
}

function popupTabs(tabs) {
    //console.log("hello guy");

    for (let tab of tabs) {
        // tab.url requires the `tabs` permission
        /*         console.log(tab.url); //undefined if browser.windows.create without `url :`
                console.log(tab.id);
                console.log(typeof tab.id); */

        //Content Security Policy: The page’s settings blocked the loading of a resource at self 
        //(“script-src moz-extension://xxx”). 
        //Source: call to eval() or related function blocked by CSP.
        //code: makeItGreen also failed
        /*         let executing = browser.tabs.executeScript(tab.id, {
                    file: "popup/js-postdata.js"
                });
                executing.then(onExecuted); */

        browser.runtime.onMessage.addListener(donePopUpReceiver);


        break;
    }

}

/* function onPopUpTabsError(error) {
    console.log(`Error: ${error}`);
} */

browser.runtime.onMessage.addListener(donePopUpReceiver);

function popUpWindow(msg) {

    //onCreated no guarantee that window js was compeleted, so can't rely on thiss
    /*     browser.windows.onCreated.addListener((window) => {
            console.log("New window: " + window.id);
            var querying = browser.tabs.query({windowId: window.id});
            querying.then(popupTabs, onPopUpTabsError);
          }); */

    //can't do this // url: "data:text/html,<!DOCTYPE html><html><body><p>hello</p></body></html>"
    //... , rf: https://bugzilla.mozilla.org/show_bug.cgi?id=1426434 
    //... , but still not recommend do this since post data can (e.g. 20M) bigger than max visible 65556 in url bar.
    // type: "popup" //keep blank when pop up, rf: https://bugzilla.mozilla.org/show_bug.cgi?id=1426405
    //..., incognito: true will purple in blank in this case, then back to white after right-click
    //...,  [browser.extension.getURL("postdata.html"),"https://google.com"] try to force it non-blank not working
    // url: browser.extension.getURL("postdata.html")
    //url: "https://www.google.com"
    //"content_security_policy": "script-src 'self' https://*.jquery.com https://www.googleapis.com/*; object-src 'self'",
    //impossible specify id at this point to target html js, so it might sequence safe to say this window from which click
    //... and so nid do popUpPostDataQueue style
    popUpPostDataQueue.push(msg);
    browser.windows.create({
        url: "popup/postdata.html"

    });
}

var ports = [];

function removeItem(array, item) {
    var i = array.length;
    //console.log("removing item ....");
    while (i--) {
        if (array[i] === item) {
            //console.log("removed item");
            array.splice(array.indexOf(item), 1);
        }
    }
    //console.log("remove item done");
}

browser.runtime.onConnect.addListener((port) => {
    //console.log("port 111111: " + port.name);

    if (!port.name || !port.name.startsWith("diffHTTP_")) return;

    /* 
    let shouldAddWebListener = true;
    ports.forEach((portI) => {
        console.log("#1 portI: " + portI.name + " VS port.name: " + port.name);
        if (portI.name === port.name) {
            //shouldAddWebListener = false;
            console.log("got same port already, disconnect old one");
            //no nid anymore which causes diconnect valid new port and error //portI.disconnect();
            //portI.disconnect();
            //portI.disconnect(); //proved that even disconnect disconnected port will no error to continue next code, to prevent onDisconnected clean up process not reset ports and cause ports loop may try to disconnect DISCONNECTED port.
        }
    });
    */

    //ports = ports.filter(portI => portI.name !== port.name); //remove all ports item which same name with new port(happen if panel window closed and reopen in same tab), only after this will push new port to ports
    /* 
    ports.forEach(function(portI) {
         console.log("#2 portI: " + portI.name + " VS port.name: " + port.name);
         if (portI.name === port.name) {
           console.log("got same port already 2");
         }
    });
    */

    //can't use var, which will get override in multiple tabs
    //let tabId = port.name;

    //console.log("port 333333 tab id: ");

    //this browser.webRequest *is not* depends on port, so port disconnected doesn't means browser.webRequest listener has been remove,
    //, and so you shouldn't add listener here with duplicated tabId (And onResponseStarted will failed to get statusCode in duplicated listener)
    //if (shouldAddWebListener) {
        //console.log("add method now");

        //should add listener after onConnect, not put otuside which before still no tabId yet
        //rf: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onResponseStarted
        //let realTabId = Number(tabId.replace(/^(diffHTTP_)/,"")); //also let uncomment tabId = port.name; above
        browser.webRequest.onBeforeRequest.addListener(
            //browser.webRequest.onResponseStarted.addListener(
            addURL,
            //{tabId: realTabId, urls: ["<all_urls>"]}, //since I want to support all tabs, so I can't do this way, otherwise I need to toogle/re-define all tabs listener once enabled All Tabs
            //and no nid worry too much, since this bg script only called once user toggle inspect element once and not close the tab
            {
                urls: ["<all_urls>"]
            }, ["requestBody"]
        );

        browser.webRequest.onBeforeRedirect.addListener(
            updateURL,
            //{tabId: realTabId, urls: ["<all_urls>"]}
            {
                urls: ["<all_urls>"]
            }
        );

        browser.webRequest.onResponseStarted.addListener(
            updateURL,
            //{tabId: realTabId, urls: ["<all_urls>"]}
            {
                urls: ["<all_urls>"]
            }
        );

        browser.webRequest.onSendHeaders.addListener(
            logSentHeaders, {
                urls: ["<all_urls>"]
            }, ["requestHeaders"]
        );

        browser.webRequest.onHeadersReceived.addListener(
            logReceivedHeaders, {
                urls: ["<all_urls>"]
            }, ["responseHeaders"]
        );
    //} //else console.log("dont method");

    //since panel onHidden not trigger if close, so point do any clean up, and this also allow tab continue update even though navigate to other tab.
    // Remove port when destroyed (eg when devtools instance is closed)
    /*
    port.onDisconnect.addListener(function() {
        console.log("hole disconnected 0");
        var i = ports.indexOf(port);
        if (i !== -1) ports.splice(i, 1);
    });
    */
    port.onDisconnect.addListener((p) => {
        //console.log("hole disconnected ?");
        if (p.error) {
            console.log(`diffhttp: Disconnected due to an error: ${p.error.message}`);
        } else console.log("diffhttp: disconnected success");
        removeItem(ports, port); //fixed "Attempt to postMessage on disconnected port"
    });

    port.onMessage.addListener((msg) => {
        // Received message from devtools. Do something:
        /*         console.log('Received message from devtools page');
                console.log(msg); */
        if (msg.tag === "showPostDataWindow") {

            /*             browser.webRequest.onBeforeRequest.removeListener(addURL);
                        browser.webRequest.onResponseStarted.removeListener(updateURL);
                        browser.webRequest.onSendHeaders.removeListener(logSentHeaders);
                        browser.webRequest.onHeadersReceived.removeListener(logSentHeaders); */
            popUpWindow(msg);
        }
    });

    ports.push(port);
    //console.log("port 4444444 port: " + ports);

});
// Function to send a message to all devtools.html views:
function notifyDevtools(msg) {
    //console.log("hole start loop port 0");
    ports.forEach((port) => {
        //console.log("notify 1: " + port.name);
        port.postMessage(msg); //push to disconnected port will trigger warning, but since we use filter to remove, when onConnect() above, so no more such warning.
    });
    //console.log("hole end loop port -1");
}


//console.log("hole bg -1");
