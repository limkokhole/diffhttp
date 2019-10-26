/* jshint esversion: 6 */
//console.log("running popup script 0");
let tabUrl = null;

/** modify 3 parts from https://github.com/google/diff-match-patch/blob/62f2e689f498f9c92dbc588c58750addec9b1654/javascript/diff_match_patch_uncompressed.js 
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_prettyHtml = function(diffs) {
  var html = [];
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
        .replace(pattern_gt, '&gt;').replace(pattern_para, '<br>'); //1st part changed: removed &para; to remove weird delimiter symbol "¶" on popup windows <pre/> when diff
        //.replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<ins style="background:#0cff00;">' + text + '</ins>'; //2nd part changed: html color code
        break;
      case DIFF_DELETE:
        html[x] = '<del style="background:#ff0004;">' + text + '</del>'; //3rd part changed: html color code
        break;
      case DIFF_EQUAL:
        html[x] = '<span>' + text + '</span>';
        break;
    }
  }
  return html.join('');
};

browser.runtime.onMessage.addListener(async (msg, sender) => {
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
            let label_prev_title = document.getElementById("label_prev_title");
            let label_curr_title = document.getElementById("label_curr_title");
            let manual_diff_btn = document.getElementById("button_diff_manual");

            let prevURL = msg.msg.postdata.prevURL;
            if ((prevURL === null) || (prevURL === "")) label_prev_title.title = "<No url>"; //to easy to know no url, better always set
            else label_prev_title.title = msg.msg.postdata.prevURL;

            label_curr_title.title = msg.msg.postdata.currURL;

            //nid <pre></pre> for indent effect
            prevPostData_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.prevPostData + "</pre>";
            diffString_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.diffString + "</pre>";
            postedString_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + msg.msg.postdata.postedString + "</pre>";
            //postedString_row.click();
            let hole = new diff_match_patch();

            manual_diff_btn.addEventListener("click", function () {
                //MUST use innerText instead of textContent to accept newline when diff
                //, ref: https://stackoverflow.com/a/9330754/1074998
                let humanDiffs = hole.diff_main(prevPostData_row.innerText, postedString_row.innerText);
                hole.diff_cleanupSemantic(humanDiffs);
                let diffString = diff_prettyHtml(humanDiffs);
                diffString_row.innerHTML = "<pre style=\"overflow-x:scroll\">" + diffString + "</pre>";
            });

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
