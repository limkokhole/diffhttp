# Diff HTTP

**Diff the network traffic in real-time to observe the urls variant over the time.**

## Brief ##

This extension capture network traffic in developer tools Diff HTTP tab, and then diff the current entry (URL/Post data/Sent Headers/Received Headers) with the previous CLOSEST MATCH entries if meet "The Rules". The first entry will always marked as [New] since no previous entry. The second entry and the following may mark as any of [New]/[Diff]/[Same] after it meets the rule and diff. 

Note that the Post data and headers are choosen depends on it's URL.

Mark as [None] if no prev rules AND curr no post data and headers. Normal in post data. But it will mark as [Same] if got prev rules AND curr no post data and headers.

Mark as [Wait] in "Recv Headers" if prev URL's "Recv Headers" still empty, it may updated to [Waited:Diff|Same] later after received prev "Recv Headers".

[Same] in "Post data" which is [None] data will underline with black padding.

## Something is broken ? ##

1. Currently no support on Private Window.

2. You can load the extension code from about:debugging, by click "Load temporary Add-on", then navigate to the downloaded folder, click first depth files(not directory) like manifest.json to load.

3. The panel will shows blank if you click the "Diff HTTP" tab before "Inspector" tab loading done, see https://bugzilla.mozilla.org/show_bug.cgi?id=1424515

4. You may need to upgrade your firefox to lastest version (v58 or v59) if panel doesn't capture anything.

5. Change panel black theme to white by navigate: about:config -> devtools.theme -> double-click the "black" Value and edit it to "white".

6.  You should open a new tab to continue your task after done with this extension since currently no way to remove listeners once run on current tab even though inspector window has been closed.

## Logic behind the scene ##

Everytime the URL captured insert to the table, the internal all entries list will be sort right away. Due to the list is always has been sorted:  
[1] It only need to do binary sort when insert new single entry.  
[2] It can quickly picks 2 siblings of current entry which consider as 2 CLOSEST MATCH.  

Then it will try to calculate the diff count for both siblings, and try to pick the least count of diff which is the 1st CLOSEST MATCH. If it did match “The Rules” below, then it will choosen to diff with the current entry. If the 1st CLOSEST MATCH sibling doesn’t match “The Rules”, then it will try the 2nd CLOSEST MATCH to test the “The Rules”. If both sibling failed to pass the test of “The Rules”, then it will give up and mark current entry as [New].  

## The Rules ##

The url https://mozilla.org/video/foo/hi?q=1 will compare with https://mozilla.org/video/foo/hello?q=1 since the protocol://path1/path2/(except last path) are same, i.e. both have the same prefix https://mozilla.org/video/foo

The url https://mozilla.org/video/foo/hi?q=1 will NOT compare with https://mozilla.org/video/bar/hello?q=1 since the middle path /foo and /bar are different.

The url https://mozilla.org/video/foo/hi?q=1 will NOT compare with https://mozilla.com/video/foo/hello?q=1 since both hosts are different, i.e. https://mozilla.org not equal to https://mozilla.com.

The reasons how this rules has been choosen is because of the valuable comparison of query string/headers between 2 URLs most likely target on filename/last path with the same host and middle path. You can imaging that youtube.com/video/a.mp4 shouldn’t diff with youtube.com/audio/b.m4a, instead youtube.com/video/a.mp4 should diff with youtube.com/video/b.mp4 if possible. And if compare google.com with facebook.com, it doesn’t make much sense. But I create a button called ‘Diff only if host same’ (i.e. as long as both hosts are same) to allow you to tick for youtube.com/AAA/BBB/CCC and youtube.com/DDD/EEE/FFF to diff.  

## Some Features ##

1. Click the [Diff] URL entry to reveals the current and previous entry URL. You can copy the URLs by click to select and Ctrl+C.
2. Click the [Diff/Same/New/] URL entries to expands if not enough space of height.
3. Click the Post data and headers entries to open new window to show the [prev][diff][current] side by side comparison.
4. Hover the top bar buttons to popup functionality tooltip.
5. Status other than 200 and Method other than GET will highlight as bold for easier to spot on.
6. Click "Diff" button to manually diff the text you want, or direct edit the fields on popup window then click "Diff" button to diff.

## Listed in Mozilla Add-on store ##
Address: https://addons.mozilla.org/en-US/firefox/addon/diff-http/

## Demonstration video (Click image to play at YouTube): ##

[![watch in youtube](https://i.ytimg.com/vi/wiovFFOgl-s/hqdefault.jpg)](https://www.youtube.com/watch?v=wiovFFOgl-s "Diff HTTP")



