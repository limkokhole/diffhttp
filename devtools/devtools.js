/* jshint esversion: 6 */
//This script is run whenever the devtools are open.

/* function handleShown() {
  console.log("panel is being shown");
} */

//bug: not called if close inspector window instead of change panel, so you can't rely one this to do cleanup process (e.g. disconnect port)
//OR you can consider it's not the bug, the bug is no new function to detect inspector is close to clean up this script.
/* function handleHidden() {
	//console.log("panel is being hidden");
} */

/**
Create a panel, and add listeners for panel show/hide events.
*/
/*
browser.devtools.panels.create(
  "Diff HTTP",
  "icons/star.png",
  "devtools/panel/panel.html"
).then((newPanel) => {
  newPanel.onShown.addListener(handleShown);
  newPanel.onHidden.addListener(handleHidden);
});
*/


function binarySearch(a, low, high, key) {
	let mid;
	let s;
	while (low !== high) {
		mid = Math.floor(low + ((high - low) / 2));
		s = key.localeCompare(a[mid][0], undefined, {
			numeric: true,
			sensitivity: 'base'
		})
		if (s == 1) {
			low = mid + 1;
		} else if (s == -1) {
			high = mid;
		} else { //== 0
			return mid;
		}
	}
	return low; //high is === here
}


//var tabId = 'diffHTTP_' + browser.devtools.inspectedWindow.tabId;

//rf: https://stackoverflow.com/questions/11661613/chrome-devpanel-extension-communicating-with-background-page
browser.devtools.panels.create("Diff HTTP", "icons/star.png", "devtools/panel/panel.html", (extensionPanel) => {

	let tabId = 'diffHTTP_' + browser.devtools.inspectedWindow.tabId;

	//console.log("panel create 0: " + tabId);
	var _window; // Going to hold the reference to panel.html's `window`
	//var data = [];


	let port = browser.runtime.connect({
		name: tabId
	});
	//console.log("hole port 0: " + port);
	//browser.runtime.reload();
	//console.log("hole port 1: " + port); 

	/*browser.tabs.connect(
        browser.devtools.inspectedWindow.tabId,
        "hole"
    )
*/

	let itemRequestRecordURLs = [];
	let itemReqIds = {};
	let itemReqHeaders = {};
	let itemRecvHeaders = {};
	let waitHeadersIds = {};

	let checkPause;
	let checkedAllWeb;
	let checkIncludeDataURI;
	let checkDiffFullPath;

	//var port = browser.runtime.connect({name: 'diffHTTPUpdateURL'});

	//if inspector window is close, the portMessage still send but failed, only disconnect if webpage tab close (or disconnect old port and connect to new port if reopen inspector in same tab)
	port.onMessage.addListener((msg) => {
		//console.log("tabId: " + msg.tabId + " #this.tabId: " + tabId);
		if (_window) {

			if (checkPause.checked) {
				return;
				//if (msg.tag === "add") return;
			}

			let items = msg.items;

			if (checkIncludeDataURI && !checkIncludeDataURI.checked) {
				//rf: https://en.wikipedia.org/wiki/Media_type
				if (items.url.startsWith("data:")) {
					return;
				}
			}

			if ((checkedAllWeb && checkedAllWeb.checked) || (tabId === msg.tabId)) {
				//let items = msg["items"];
				//console.log("received log 1: " + items.requestId + "url: " + items.url + " #tag: " + msg.tag);
				//_window.do_something(msg);

				let prevURL = null;
				let prevPostData = null;
				let prevReqId = null;
				if (msg.tag === "add") {

					let qi = items.url.indexOf('?');
					let qArr = [];
					//let prefixURL = null;
					if (qi >= 0) {
						let qParams = items.url.substring(qi + 1);
						if (qParams) qArr = qParams.split("&");
						//prefixURL = items.url.substring(0, qi + 1); //prefixURL will keep '?'
					} //else prefixURL = items.url;

					let compareIt;
					let rec_len = itemRequestRecordURLs.length;
					let insertIndex = binarySearch(itemRequestRecordURLs, 0, rec_len, items.url);
					let alternateIndex = null;
					if (rec_len >= 2) {

						let compareDownIndex = insertIndex - 1;
						let compareUpIndex = insertIndex;
						let compareDown;
						let compareUp;
						let choosenIndex = null;
						if (compareDownIndex >= 0) compareDown = true;
						if (compareUpIndex < rec_len) compareUp = true;

						// console.log("rec_len: " + rec_len);
						// console.log("insertIndex: " + insertIndex);
						// console.log("compareDownIndex: " + compareDownIndex);
						// console.log("compareUpIndex: " + compareUpIndex);

						if (compareDown && compareUp) { //console.log("compareDown && compareUp");

							let compareItDown = itemRequestRecordURLs[compareDownIndex];
							let compareItUp = itemRequestRecordURLs[compareUpIndex];
							let hole = _window.hole;
							// let diffNDown = hole.diff_levenshtein(hole.diff_main(items.url, compareItDown[0]));
							// let diffNUp = hole.diff_levenshtein(hole.diff_main(items.url, compareItUp[0]));
							//console.log("#diff_levenshtein down: " + diffNDown + " #up: " + diffNUp);
							//if (diffNDown <= diffNUp) { //if equal, simply choose down //don't use temp vars if not debug
							if (hole.diff_levenshtein(hole.diff_main(items.url, compareItDown[0])) <= hole.diff_levenshtein(hole.diff_main(items.url, compareItUp[0]))) {
								choosenIndex = compareDownIndex;
								alternateIndex = compareUpIndex;
							} else { //if (diffNUp < diffNDown) {
								choosenIndex = compareUpIndex;
								alternateIndex = compareDownIndex;
							}
						} else if (compareDown) { //console.log("compareDown ONLY");
							choosenIndex = compareDownIndex;
						} else if (compareUp) { //console.log("compareUp ONLY");
							choosenIndex = compareUpIndex;
						}

						if (choosenIndex !== null) {
							// console.log(itemRequestRecordURLs);
							// console.log("choosenIndex: " + choosenIndex);
							compareIt = itemRequestRecordURLs[choosenIndex];
							prevURL = compareIt[0];
							prevPostData = compareIt[2];
							prevReqId = compareIt[3];
						}

					} else if (rec_len == 1) {
						compareIt = itemRequestRecordURLs[0];
						prevURL = compareIt[0];
						prevPostData = compareIt[2];
						prevReqId = compareIt[3];
					}

					if (prevURL != null) {

						let sliceFullPath = false;
						if (checkDiffFullPath && checkDiffFullPath.checked) {
							sliceFullPath = true;
						}

						let slash_l = items.url.split("/");
						let checkPrefixCurrURL;
						if (!sliceFullPath) {
							if (slash_l.length >= 4) { //extra trailing slash work except https://connect.facebook.net/a/b/?c case, which b will be compare
								checkPrefixCurrURL = slash_l.slice(0, -1).join('/');
							} else {
								checkPrefixCurrURL = items.url.split("?")[0];
							}
						} else {
							checkPrefixCurrURL = slash_l.slice(0, 3).join('/');
						}

						slash_l = prevURL.split("/");
						let checkPrefixPrevURL;
						if (!sliceFullPath) {
							if (slash_l.length >= 4) {
								checkPrefixPrevURL = slash_l.slice(0, -1).join('/');
							} else {
								checkPrefixPrevURL = prevURL.split("?")[0];
							}
						} else {
							checkPrefixPrevURL = slash_l.slice(0, 3).join('/');
						}

						if (checkPrefixPrevURL !== checkPrefixCurrURL) { //can't simply use startsWith to compare bcoz it may cause a/b/c/d same with a/b which shouldn't
							if (alternateIndex != null) {
								compareIt = itemRequestRecordURLs[alternateIndex];
								prevURL = compareIt[0];
								prevPostData = compareIt[2];
								prevReqId = compareIt[3];

								slash_l = prevURL.split("/");
								if (!sliceFullPath) {
									if (slash_l.length >= 4) {
										checkPrefixPrevURL = slash_l.slice(0, -1).join('/');
									} else {
										checkPrefixPrevURL = prevURL.split("?")[0];
									}
								} else {
									checkPrefixPrevURL = slash_l.slice(0, 3).join('/');
								}

								if (checkPrefixPrevURL !== checkPrefixCurrURL) {
									prevURL = null; //no match scheme://host/path[except last path (except /? case above)] , then reset
									prevPostData = null;
									prevReqId = null;
								}
							} else {
								prevURL = null;
								prevPostData = null;
								prevReqId = null;
							}
						}
					}

					//you can access https://github.com/join and submit without fill-in to test :p
					let postedString = null;
					if (items.requestBody != null) {
						if (typeof items.requestBody.formData === 'undefined') { //json
							//console.log(requestDetails.requestBody.raw);
							if (items.requestBody.raw !== 'undefined') {
								postedString = decodeURIComponent(String.fromCharCode.apply(null,
									new Uint8Array(items.requestBody.raw[0].bytes)));
								//console.log("postedString: " + postedString);

								try {
									var json = JSON.parse(postedString); //convert string to json object
									postedString = JSON.stringify(json, null, 3); //pretty print json object as string
									//console.log(postedString);
								} catch (e) {
									//console.log('invalid json');
								}

							} else { //[toproved:0] is it possible requestDetails.requestBody.raw undefined here ?
								//console.log("first time see undefined raw, url: " + items.url);
							}
						} else { //multipart/form-data OR application/x-www-form-urlencoded
							//don't print which concate which not able to expand object tree view in console
							//console.log(items.requestBody.formData);
							postedString = JSON.stringify(items.requestBody.formData, null, 3);
							//console.log(postedString);
						}
					}

					let st = new Date(items.timeStamp);
					let currTime = st.getHours() +
						':' + (st.getMinutes() < 10 ? '0' + st.getMinutes() : st.getMinutes()) +
						':' + (st.getSeconds() < 10 ? '0' + st.getSeconds() : st.getSeconds());

					
					//we must store "" if exist, not null which means not exist to be evalutate next time
					//, but don't direct set postedString to "" here since we nid null in this round in js-pnael.js
					let it;
					if (postedString === null) {
						it = [items.url, qArr, "", items.requestId]; //[todo:0] remake url with sorted qArr
					} else {
						it = [items.url, qArr, postedString, items.requestId]; //[todo:0] remake url with sorted qArr
					}
					itemRequestRecordURLs.splice(insertIndex, 0, it);

/* 					let sameStr;
					let prevExist = true;
					if (prevPostData !== null) {
						if (prevPostData === postedString) {
							sameStr = true;
						} else {
							sameStr = false;
						}
					} else {
						prevExist = false;
					}
					console.log(prevReqId + " :prevExist 1: " + prevExist);
					itemReqIds[items.requestId] = [prevReqId, prevExist]; */
					itemReqIds[items.requestId] = prevReqId;

					//console.log(items.requestId + " id:URL " + items.url);

					//itemRequestRecordURLs.unshift([prefixURL, items.url, qArr, postedString]); //unshift() to add beginning instead of push()
					//itemRequestRecordURLs.push( [prefixURL, items.url, qArr] );
					_window.addURL(items.requestId, items.method, items.url, prevURL, postedString, prevPostData, currTime);
				} else if (msg.tag === "update") {
					_window.updateURL(items.requestId, items.statusCode);
				} else if (msg.tag === "sentHeaders") {
					items.requestHeaders.sort(function(a, b) { //rf: https://stackoverflow.com/a/979289/1074998
                                            return a.name.localeCompare(b.name);
                                        });
					let sentHeadersJson = JSON.stringify(items.requestHeaders, null, 3);
					itemReqHeaders[items.requestId] = sentHeadersJson;
					let prevHeadersJson = itemReqHeaders[itemReqIds[items.requestId]];
					//console.log("lol: " + items.requestId + " #currHeaders: " + items.requestHeader);
					_window.sentHeaders(items.requestId, sentHeadersJson, prevHeadersJson);
				} else if (msg.tag === "recvHeaders") {
					items.responseHeaders.sort(function(a, b) {
                                            return a.name.localeCompare(b.name);
                                        });
					let recvHeadersJson = JSON.stringify(items.responseHeaders, null, 3);
					itemRecvHeaders[items.requestId] = recvHeadersJson;
					let prevHeadersId = itemReqIds[items.requestId];
					let prevRecvHeadersJson;
					if (prevHeadersId !== null) {
						prevRecvHeadersJson = itemRecvHeaders[prevHeadersId];
						if (prevRecvHeadersJson  === undefined) {
							let existingIds = waitHeadersIds[prevHeadersId];
							if (existingIds === undefined) existingIds = [];
							let giveUpPushDuplicated = false;
							for (let exId of existingIds) {
								if (items.requestId === exId) giveUpPushDuplicated = true;
							}
							if (!giveUpPushDuplicated) existingIds.push(items.requestId);
							waitHeadersIds[prevHeadersId] = existingIds;
						}
					} //else prevRecvHeadersJson keep undefined
					//console.log("lol: " + items.requestId + " #currHeaders: " + items.responseHeaders);

/* 					let reviveIdsDebug = waitHeadersIds[items.requestId];
					if (reviveIdsDebug !== undefined) console.log(items.requestId + "revive PRE recvHeadersJson: " + recvHeadersJson);
 */
					_window.recvHeaders(items.requestId, recvHeadersJson, prevRecvHeadersJson, prevHeadersId, false);

					let reviveIds = waitHeadersIds[items.requestId];
					if (reviveIds !== undefined) {
						for (let reviveId of reviveIds) {
							reviveRecvHeadersJson = itemRecvHeaders[reviveId];
/* 							console.log("reviveId: " + reviveId);
							console.log("reviveId recvHeadersJson: " + recvHeadersJson); */
							_window.recvHeaders(reviveId, reviveRecvHeadersJson, recvHeadersJson, items.requestId, true);
						}
						//don't remove since it can return second time with more data (.e.g "keep-alive" become  "Accept-Ranges")
						//and hard-code remove only after 2nd time is overkill, ids shouldn't take much space
						//delete waitHeadersIds[items.requestId]; //remove reviveIds after done
					}
				}
			} else {
				//console.log("skip :p");
			}
		} //else data.push(msg);
	});


	//console.log("panel create 1");
	/*    var portUpdateURL = browser.runtime.connect({name: 'diffHTTPUpdateURL'});
	    portUpdateURL.onMessage.addListener(function(msg) {
	        if (_window) {
	          console.log("received log update URL id: " + msg.requestId + " #statusCode: " + msg.statusCode + " #url: " + msg.url);
	          //_window.updateURL(msg.requestId, msg.method, msg.url);
	        } else {
	            data.push(msg);
	        }
	    });
	*/
	extensionPanel.onShown.addListener(function tmp(panelWindow) {
		//console.log("hole got port: " + port);
		extensionPanel.onShown.removeListener(tmp); // Run once only
		_window = panelWindow;

		checkPause = _window.document.getElementById("checkbox_pause");
		checkedAllWeb = _window.document.getElementById("checkbox_accept_all_web");
		checkIncludeDataURI = _window.document.getElementById("checkbox_include_data_uri");
		checkDiffFullPath = _window.document.getElementById("checkbox_diff_if_host_same");
		/* 		let special_param_group = _window.document.getElementById("special_param_group");
				special_param_group.addEventListener("input", function (evt) {
					special_param_groupVar = this.value + "=";
				}); */

		_window.document.getElementById("button_clear").addEventListener("click", () => {
			itemRequestRecordURLs = [];
			itemReqIds = {};
			itemReqHeaders = {};
			itemRecvHeaders = {};
			waitHeadersIds = {};
		});


		// Release queued data
		/*
        var msg;
        while (msg = data.shift()) {
    		console.log("received log 2: " + msg);
            //_window.do_something(msg);
        }
		*/

		// Just to show that it's easy to talk to pass a message back:
		_window.respond = function (msg) {
			port.postMessage(msg);
		};
	});


	//extensionPanel.onHidden.addListener(handleHidden);
	/*
	extensionPanel.onHidden.addListener(function() {
	    console.log("hole panel hidden 0");
	    extensionPanel.onShown.removeListener(tmp);
	    console.log("hole panel hidden 1");
	});
	*/
	//console.log("panel create 2");
});

//console.log("init script -1");
