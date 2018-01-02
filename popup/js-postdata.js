/* jshint esversion: 6 */
//console.log("running popup script 0");
let tabUrl = null;

browser.runtime.onMessage.addListener(async(msg, sender) => {
    /*     console.log(msg);
        console.log(sender); */
    if (sender.id === browser.runtime.id) {
        /*         console.log(msg);
                console.log("inject_pop_up tag: " + msg.tag);
                console.log("inject_pop_up postdata: " + msg.msg.postdata); */
        if (msg.tag === "inject_pop_up") {

            let prevPostData_row = document.getElementById("prevPostData");
            let diffString_row = document.getElementById("diffString");
            let postedString_row = document.getElementById("postedString");

            //nid <pre></pre> for indent effect
            prevPostData_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.prevPostData + "</pre>";
            diffString_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.diffString + "</pre>";
            postedString_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.postedString + "</pre>";
            //postedString_row.click();

        }
    }
    //console.log("popup html received msg");

});

function onGot(tabInfo) {
    tabUrl = tabInfo.url;
    /*     console.log("curr tab is:");
        console.log(tabUrl);
        console.log(tabInfo); */

    //test https://bugzilla.mozilla.org/show_bug.cgi?id=1426434 scenario, proved that it's possible 
    //... window B shows item A first without wait for window A done
    /*     let myArray = [10000, 1000, 10000, 30000]
        let c = myArray[Math.floor(Math.random() * myArray.length)];
        setTimeout(() => {
            console.log("THIS IS: " + c);
            browser.runtime.sendMessage({
              tag: "popup_postdata",
              title: "done load popup post data window script"
          });
        }, c); */

    browser.runtime.sendMessage({
        tag: "popup_postdata",
        title: "done load popup post data window script"
    });
}

function onError(error) {
    console.log(`diffhttp onError: ${error}`);
}

function getInfoForTab(tabs) {
    if (tabs.length > 0) {
        var gettingInfo = browser.tabs.get(tabs[0].id);
        gettingInfo.then(onGot, onError);
    }
}

var querying = browser.tabs.query({
    currentWindow: true,
    active: true
});
querying.then(getInfoForTab, onError);

//console.log("running popup script done");

/* function eatPageReceiver(request, sender, sendResponse) {
  console.log("come here 2");
  document.body.textContent = "";
  var header = document.createElement('h1');
  header.textContent = request.replacement;
  document.body.appendChild(header);
  console.log("come here 3");
}
browser.runtime.onMessage.addListener(eatPageReceiver); */