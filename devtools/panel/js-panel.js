/* jshint esversion: 6 */

var hole = new diff_match_patch();
var urls_tbl = document.getElementById("urls_tbl");
var urls_tbl_body = document.getElementById("urls_tbl_body");

//rf: https://stackoverflow.com/questions/30661497/xss-prevention-and-innerhtml
function escapeHTML(unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

function makeQ(url) {
  let q_sharp_i = url.indexOf('#');
  let q_question_i = url.indexOf('?');
  let qParams;
  /*   console.log(q_question_i)
    console.log(q_sharp_i) */
  if ((q_question_i === -1) || (q_sharp_i === -1)) {
    if (q_question_i === q_sharp_i) { //=== MUST put on top
      qParams = "";
    } else if (q_question_i !== -1) {
      qParams = url.substring(q_question_i + 1);
    } else if (q_sharp_i !== -1) {
      qParams = url.substring(q_sharp_i + 1);
    } //impossible else
  } else if (q_question_i < q_sharp_i) { //start to compare <> only if no one is -1, checked on first if condition above
    qParams = url.substring(q_question_i + 1);
  } else if (q_question_i > q_sharp_i) {
    qParams = url.substring(q_sharp_i + 1);
  }
  //console.log("qParams:" + qParams);
  let ql = qParams.split(/[?#&]+/);
  ql.sort(function (a, b) {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
  return ql.join('\n');
}

function prettyParams(qParams) {
  let ql = qParams.split(/[&]+/); //no nid do ?# in this case, unlike makeQ() above
  ql.sort(function (a, b) {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
  return ql.join('\n');
}

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function addURL(rid, prevReqId, method, url, prevURL, postedString, prevPostData, currTime) {

  //let table = document.getElementById("urls");

  let row = urls_tbl_body.insertRow(0);
  //"nextSibling" failed, nid "nextElementSibling", but still careful don't override first title row
  //note that since the table is drop-down, so prev row means nid access next sibling elem
  /*
  let prevRow = row.nextElementSibling;
  if (prevRow) {
      prevURL = prevRow.url;
  }
  */

  //Hover [tag]'s tooltip, reasons of rid better than count table length:
  //[1] no nid re-count(not sure internal implementation though)
  //[2] can refer id with other tab if use All Tabs
  //[3] nid array store manually prev count, can't simply rely on table len
  //urls_tbl_body.getElementsByTagName("tr").length;

  //row.setAttribute('id', "diffhttp_" + rid ); //https://stackoverflow.com/questions/10280250/getattribute-versus-element-object-properties
  row.id = "diffhttp_" + rid;
  row.url = url;
  //console.log("row: " + document.getElementById("diffhttp_" + rid));
  let cell1 = row.insertCell(0);
  let cell2 = row.insertCell(1);
  let cell3 = row.insertCell(2);
  let cell4 = row.insertCell(3);
  let cell5 = row.insertCell(4);
  let cell6 = row.insertCell(5);


  //start cell STATUS
  let tdDiv = document.createElement("div");
  tdDiv.id = "diffhttp_status_" + rid;
  cell1.appendChild(tdDiv);
  cell1.setAttribute("class", "dotcellNormalParent");
  //END cell STATUS


  //start cell METHOD
  tdDiv = document.createElement("div");
  tdDiv.textContent = method;
  if (method !== "GET") {
    tdDiv.style.fontWeight = 'bold';
  }
  tdDiv.setAttribute("class", "dotcellNormal");
  cell2.appendChild(tdDiv);
  cell2.setAttribute("class", "dotcellNormalParent");
  //END cell METHOD


  //START cell postData
  tdDiv = document.createElement("div");
  tdDiv.setAttribute("class", "dotcellPOST_UA");
  if (prevPostData !== null) {
    if (postedString === null) postedString = ""; //can't diff with null
    let diffString = "";

    if (!IsJsonString(prevPostData) && (prevPostData !== "")) {
      prevPostData = prettyParams(prevPostData); //only try to split by '&' if not json
    }
    if (!IsJsonString(postedString) && (postedString !== "")) {
      //console.log("not json: " + postedString);
      postedString = prettyParams(postedString);
    } //else if (postedString === "") { console.log("got empty"); }

    let humanDiffs = hole.diff_main(prevPostData, postedString);
    prevPostData = escapeHTML(prevPostData);
    postedString = escapeHTML(postedString);
    hole.diff_cleanupSemantic(humanDiffs);
    let nidPopUp = true;
    if (prevPostData === postedString) {
      if (prevPostData === "") {
        nidPopUp = false;
        tdDiv.innerHTML = "<div style=\"border-bottom: 8px solid black; background-color:#00ffff;color:#000000;\"><b>[Same]</b>&nbsp;" + currTime + "</div>" + hole.diff_prettyHtml(humanDiffs);
      } else {
        /*         console.log("prevPostData");
                console.log(prevPostData);
                console.log(humanDiffs); */
        tdDiv.innerHTML = "<div style=\"background-color:#00ffff;color:#000000;\"><b>[Same]</b>&nbsp;" + currTime + "</div>" + hole.diff_prettyHtml(humanDiffs);
      }
    } else {
      diffString = hole.diff_prettyHtml(humanDiffs);
      tdDiv.innerHTML = "<div style=\"background-color:#ffaaff;color:#000000;\"><b>[&nbsp;Diff&nbsp;]</b>&nbsp;" + currTime + "</div>" + diffString;
    }
    cell4.appendChild(tdDiv);
    cell4.appendChild(document.createElement("br"));
    if (nidPopUp) {
      tdDiv.addEventListener("click", () => {
        //no nid worry prevURL is null, bcoz .title able shows it as null
        let postDataHTML = {
          prevURL: prevURL,
          currURL: url,
          prevPostData: prevPostData,
          diffString: diffString,
          postedString: postedString
        };
        respond({
          "tag": "showPostDataWindow",
          "postdata": postDataHTML
        }); //, "rid":rid, useless since can't pass rid at oncreate window
      });
    }
  } else {

    let tdDivPre = document.createElement("div");
    tdDivPre.setAttribute("class", "dotcellPOST_UA");
    if (postedString !== null) {

      //no nid do prevPostData which is null here
      if (!IsJsonString(postedString) && (postedString !== "")) {
        postedString = prettyParams(postedString);
      }

      let tdDivContainerNoPrev = document.createElement("div");
      tdDivPre.textContent = "[New] " + currTime;
      tdDivPre.style.color = "White";
      tdDivPre.style.backgroundColor = "Blue";
      tdDivContainerNoPrev.appendChild(tdDivPre);
      /*          let str = hole.diff_prettyHtml(hole.diff_main(postedString, postedString));
              str = str.replace(/&para;/g, ''); 
              tdDiv.innerHTML = "<br>" + str + "</pre>"; */ //after convert from diff, the indent will lose
      tdDiv.innerHTML = "<pre>" + postedString + "</pre>";
      //console.log(hole.diff_prettyHtml(hole.diff_main(postedString, postedString)));
      tdDivContainerNoPrev.addEventListener("click", () => {
        let humanDiffs = hole.diff_main("", postedString);
        let diffString = hole.diff_prettyHtml(humanDiffs);
        let postDataHTML = {
          prevURL: prevURL,
          currURL: url,
          prevPostData: "",
          diffString: diffString,
          postedString: postedString
        };
        respond({
          "tag": "showPostDataWindow",
          "postdata": postDataHTML
        });
      });
      tdDivContainerNoPrev.appendChild(tdDiv);
      cell4.appendChild(tdDivContainerNoPrev);
    } else {
      tdDivPre.textContent = "[None] " + currTime;
      tdDivPre.style.color = "White";
      tdDivPre.style.backgroundColor = "Black";
      cell4.appendChild(tdDivPre);
    }
  }
  cell4.setAttribute("class", "dotcellUAParent");
  //END cell postData


  //start cell sentHeaders
  cell5.id = "diffhttp_sH_" + rid;
  cell5.setAttribute("class", "dotcellUAParent");
  //END cell sentHeaders


  //start cell recvHeaders
  cell6.id = "diffhttp_rH_" + rid;
  cell6.setAttribute("class", "dotcellUAParent");
  //END cell recvHeaders


  //START cell URL
  //seems overflow (auto, scroll, none to expand) only works if column put last
  //[todo:0] pls test data URI
  tdDiv = document.createElement("div");
  tdDiv.setAttribute("class", "dotcellURL");
  function diffQ(prevURL, url) {
    let prevQ;
    if (prevURL !== "") prevQ = makeQ(prevURL);
    else prevQ = "";
    let currQ;
    if (url !== "") currQ = makeQ(url);
    else currQ = "";
    let humanDiffs = hole.diff_main(prevQ, currQ);
    hole.diff_cleanupSemantic(humanDiffs);
    let diffString = hole.diff_prettyHtml(humanDiffs);
    let postDataHTML = {
      prevURL: prevURL,
      currURL: url,
      prevPostData: prevQ,
      diffString: diffString,
      postedString: currQ
    };
    respond({
      "tag": "showPostDataWindow",
      "postdata": postDataHTML
    });
  }
  if (prevURL !== null) {
    let sameUrl = false;

    let humanDiffs = hole.diff_main(prevURL, url);
    hole.diff_cleanupSemantic(humanDiffs);

    if (prevURL === url) { //== must compare here instead of devtools.js early otherwise will always [New] if duplicated
      sameUrl = true;
      tdDiv.innerHTML = "<b title='" + rid + " (Prev: " + prevReqId + ")' style=\"background-color:#00ffff;color:#000000;\">[Same]</b> " +
        hole.diff_prettyHtml(humanDiffs);
    } else {
      tdDiv.innerHTML = "<b title='" + rid + " (Prev: " + prevReqId + ")' style=\"background-color:#ffaaff;color:#000000;\">[&nbsp;Diff&nbsp;]</b>&nbsp; " +
      hole.diff_prettyHtml(humanDiffs);
    }

    cell3.appendChild(tdDiv);
    cell3.appendChild(document.createElement("br"));

    let tdDivContainer = document.createElement("div");

    //tdBtn.textContent = "≠";
    tdDiv.addEventListener("click", () => {
      //if (!sameUrl) {
      if (tdDivContainer.style.display === "block") {
        tdDivContainer.style.display = "none";
      } else {
        tdDivContainer.style.display = "block";
      }
      //}
      if (tdDiv.style.maxHeight === "none") {
        tdDiv.style.maxHeight = "6.6em";
      } else if (tdDiv.style.maxHeight === "6.6em") {
        tdDiv.style.maxHeight = "none";
      } else { //the first time expand will be empty for unknown reason
        tdDiv.style.maxHeight = "none";
      }
    });
    if (!sameUrl) {
      cell3.appendChild(document.createElement("br"));
      let tdDivPost = document.createElement("div");
      tdDivPost.innerHTML = "<pre><b title='" + rid + "' style=\"background-color:#0cff00;\">[Curr]</b><br>" + url +
        "<br><br><b title='" + prevReqId + "' style=\"background-color:#ff0004;\">[Prev]</b><br>" + prevURL + "</pre>";
      tdDivPost.style.overflow = "scroll";
      tdDivContainer.appendChild(tdDivPost);
    }
    let tdDivQ = document.createElement("div");
    tdDivQ.innerHTML = '<input type="submit" id="button_queries" value="" />';
    tdDivQ.addEventListener("click", () => {
      diffQ(prevURL, url);
    });
    tdDivContainer.appendChild(tdDivQ);
    tdDivContainer.style.display = "none";
    cell3.appendChild(tdDivContainer);
  } else {
    //must got span to fixed the width, so can't use textContent
    /*       let tdDivPre = document.createElement("div");
          tdDivPre.textContent = "[New]";
          tdDivPre.style.color = "White";
          tdDivPre.style.backgroundColor = "Blue";
          cell3.appendChild(tdDivPre); 
          tdDiv.textContent = " " + url;
          */
    //to try match the start position x of url with other [SAME]/[Diff], add &nbsp; extra spaces
    //tdDiv.innerHTML = '<b style="background-color:#0000ff;color:#ffffff;">[&nbsp;New&nbsp;]</b><span> ' + url + '</span>';

    tdDiv.innerHTML = '<b title="' + rid + '" style="background-color:#0000ff;color:#ffffff;">[&nbsp;New&nbsp;]</b> <span> ' + url + '</span>';
    tdDiv.addEventListener("click", () => {
      if (tdDivContainer.style.display === "block") {
        tdDivContainer.style.display = "none";
      } else {
        tdDivContainer.style.display = "block";
      }
      if (tdDiv.style.maxHeight === "none") {
        tdDiv.style.maxHeight = "6.6em";
      } else if (tdDiv.style.maxHeight === "6.6em") {
        tdDiv.style.maxHeight = "none";
      } else { //the first time expand will be empty for unknown reason
        tdDiv.style.maxHeight = "none";
      }
    });
    cell3.appendChild(tdDiv);
    cell3.appendChild(document.createElement("br"));
    let tdDivContainer = document.createElement("div");
    let tdDivQ = document.createElement("div");
    tdDivQ.innerHTML = '<input type="submit" id="button_queries" value="" />';
    tdDivQ.addEventListener("click", () => {
      diffQ("", url);
    });
    tdDivContainer.appendChild(tdDivQ);
    tdDivContainer.style.display = "none";
    cell3.appendChild(tdDivContainer);
  }
  cell3.setAttribute("class", "dotcellURLParent");
  //END cell URL

}

function updateURL(rid, statusCode) {
  let tdDiv = document.getElementById("diffhttp_status_" + rid);
  if (tdDiv !== null) {
    tdDiv.textContent = statusCode;
    if (statusCode !== 200) tdDiv.style.fontWeight = 'bold';
  }
}

function sentHeaders(rid, currHeaders, prevHeaders, prevURL, currURL) {

  //Note that I don't have binaryValue test cast, rf: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/HttpHeaders
  /* 					for (var header of currHeaders) {
						console.log("h name: ");
						console.log(header.name);
						console.log("h value:");
						console.log(header.value);
					  if (header.name.toLowerCase() === "Cookie") {
						console.log(header.value);
					  }
          } */

  let cell5 = document.getElementById("diffhttp_sH_" + rid); //sH means sentHeaders
  if (cell5 !== null) {
    let tdDiv = document.createElement("div");
    tdDiv.setAttribute("class", "dotcellPOST_UA");
    if (prevHeaders !== null && prevHeaders !== undefined) { //if array no such index will undefined
      if (currHeaders === null) currHeaders = ""; //can't diff with null
      let diffString = "";
      let humanDiffs = hole.diff_main(prevHeaders, currHeaders);
      prevHeaders = escapeHTML(prevHeaders); //must sescape after diff otherwise will get &quot; results
      currHeaders = escapeHTML(currHeaders);
      hole.diff_cleanupSemantic(humanDiffs);
      if (prevHeaders === currHeaders) {
        tdDiv.innerHTML = "<b style=\"background-color:#00ffff;color:#000000;\">[Same]</b>" + hole.diff_prettyHtml(humanDiffs);
      } else {
        diffString = hole.diff_prettyHtml(humanDiffs);
        tdDiv.innerHTML = "<b style=\"background-color:#ffaaff;color:#000000;\">[&nbsp;Diff&nbsp;]</b>" + diffString;
      }
      cell5.appendChild(tdDiv);
      cell5.appendChild(document.createElement("br"));
      tdDiv.addEventListener("click", () => {
        let postDataHTML = {
          prevURL: prevURL,
          currURL: currURL,
          prevPostData: prevHeaders,
          diffString: diffString,
          postedString: currHeaders
        };
        respond({
          "tag": "showPostDataWindow",
          "postdata": postDataHTML
        });
      });
    } else {
      let tdDivPre = document.createElement("div");
      tdDivPre.setAttribute("class", "dotcellPOST_UA");
      if (currHeaders !== null) {
        //no point do humanDiffs here bcoz comapre with empty string
        let diffString = hole.diff_prettyHtml(hole.diff_main("", currHeaders));
        currHeaders = escapeHTML(currHeaders);
        tdDiv.innerHTML = "<b style=\"background-color:#0000ff;color:#ffffff;\">[New]</b>" + currHeaders;
        tdDiv.addEventListener("click", () => {
          let postDataHTML = {
            prevURL: prevURL,
            currURL: currURL,
            prevPostData: "",
            diffString: diffString,
            postedString: currHeaders
          };
          respond({
            "tag": "showPostDataWindow",
            "postdata": postDataHTML
          });
        });
        cell5.appendChild(tdDiv);
      } else { //unlikely no headers
        tdDivPre.textContent = "[None]";
        tdDivPre.style.color = "White";
        tdDivPre.style.backgroundColor = "Black";
        cell5.appendChild(tdDivPre);
      }
    }
  }
}


function recvHeaders(rid, currHeaders, prevHeaders, prevHeadersId, fromRevive, prevURL, currURL) {
  //console.log(rid + " :win: " + currHeaders);
  let cell6 = document.getElementById("diffhttp_rH_" + rid); //sH means sentHeaders
  if (cell6 !== null) {

    //for unknown reason, it may return twice for single request (e.g. youtube's  https://i.ytimg.com/vi/)
    //, but the 2nd has more data than the 1st, so this will replace the 1st
    //, rf: https://stackoverflow.com/a/11776682/1074998 , https://stackoverflow.com/a/15771070/1074998
    // [UPDATE] this also help to replace older elem after revive from wait prev headers
    if (cell6.childElementCount > 0) {
      let last;
      while (last = cell6.lastChild) {
        cell6.removeChild(last);
      }
    }

    let tdDiv = document.createElement("div");
    tdDiv.setAttribute("class", "dotcellPOST_UA");
    if (prevHeadersId !== null) {
      //if array no such index will undefined
      let waitPrevHeaders = false
      if (prevHeaders === undefined) waitPrevHeaders = true;
      if ((prevHeaders === null) || (prevHeaders === undefined)) prevHeaders = "";
      if (currHeaders === null) currHeaders = ""; //can't diff with null
      let diffString = "";
      let humanDiffs = hole.diff_main(prevHeaders, currHeaders);
      prevHeaders = escapeHTML(prevHeaders);
      currHeaders = escapeHTML(currHeaders);
      hole.diff_cleanupSemantic(humanDiffs);
      if (waitPrevHeaders) {
        tdDiv.innerHTML = "<b style=\"background-color:#aa00ff;color:#ffffff;\">[Wait]</b>" + hole.diff_prettyHtml(humanDiffs);
      } else if (prevHeaders === currHeaders) {
        if (!fromRevive) tdDiv.innerHTML = "<b style=\"background-color:#00ffff;color:#000000;\">[Same]</b>" + hole.diff_prettyHtml(humanDiffs);
        else tdDiv.innerHTML = "<b style=\"background-color:#00ffff;color:#000000;\">[Waited:Same]</b>" + hole.diff_prettyHtml(humanDiffs);
      } else {
        diffString = hole.diff_prettyHtml(humanDiffs);
        if (!fromRevive) tdDiv.innerHTML = "<b style=\"background-color:#ffaaff;color:#000000;\">[&nbsp;Diff&nbsp;]</b>" + diffString;
        else tdDiv.innerHTML = "<b style=\"background-color:#ffaaff;color:#000000;\">[&nbsp;Waited:Diff&nbsp;]</b>" + diffString;
      }
      cell6.appendChild(tdDiv);
      cell6.appendChild(document.createElement("br"));
      tdDiv.addEventListener("click", () => {
        let postDataHTML = {
          prevURL: prevURL,
          currURL: currURL,
          prevPostData: prevHeaders,
          diffString: diffString,
          postedString: currHeaders
        };
        respond({
          "tag": "showPostDataWindow",
          "postdata": postDataHTML
        });
      });
    } else {
      let tdDivPre = document.createElement("div");
      tdDivPre.setAttribute("class", "dotcellPOST_UA");
      if (currHeaders !== null) {
        //no point do humanDiffs here bcoz comapre with empty string
        let diffString = hole.diff_prettyHtml(hole.diff_main("", currHeaders));
        currHeaders = escapeHTML(currHeaders);
        tdDiv.innerHTML = "<b style=\"background-color:#0000ff;color:#ffffff;\">[New]</b>" + currHeaders;
        tdDiv.addEventListener("click", () => {
          let postDataHTML = {
            prevURL: prevURL,
            currURL: currURL,
            prevPostData: "",
            diffString: diffString,
            postedString: currHeaders
          };
          respond({
            "tag": "showPostDataWindow",
            "postdata": postDataHTML
          });
        });
        cell6.appendChild(tdDiv);
      } else { //unlikely no headers
        tdDivPre.textContent = "[None]";
        tdDivPre.style.color = "White";
        tdDivPre.style.backgroundColor = "Black";
        cell6.appendChild(tdDivPre);
      }
    }
  }
}

document.getElementById("button_clear").addEventListener("click", () => {
  urls_tbl_body.innerHTML = "";
});
