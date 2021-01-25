var maxTabs;

/*
Update the browser when the number of tabs changes.
Update the badge. Including text and color.
Notify user, when too many tabs were opened.
*/
function updateCount(tabId, isOnRemoved) {
  browser.tabs.query({})
  .then((tabs) => {
    let length = tabs.length;

    // onRemoved fires too early and the count is one too many.
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
    if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
      length--;
    }

    updateBadge(length);

    if (!isOnRemoved && length > maxTabs) {
      let content = `Max Tabs: ${maxTabs}    Current Tabs: ${length}`;
      browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.extension.getURL("icons/link-48.png"),
        "title": "Too many tabs opened",
        "message": content
      });
      browser.tabs.remove(tabId.id);
    }
  });
}

/*
Display tab count on badge and switch color depending on how close user is to maxTabs limit.
*/
function updateBadge(length) {
  browser.browserAction.setBadgeText({text: length.toString()});
  if (length > maxTabs * 0.7) {
    browser.browserAction.setBadgeBackgroundColor({'color': 'red'});
  } else if (length > maxTabs * 0.3) {
    browser.browserAction.setBadgeBackgroundColor({'color': 'yellow'});
  } else {
    browser.browserAction.setBadgeBackgroundColor({'color': 'green'});
  }
}

/*
Generic error logger.
*/
function onError(e) {
  console.error(e);
}

/*
Retrieved information of maxTabs setting from storage.
*/
function retrievedMaxTabs(value) {
  maxTabs = value.maxTabs;
}

/*
Retrieve the value of maxTabs from storage and update the UI accordingly.
*/
function retrieveMaxTabsValue() {
  browser.storage.local.get("maxTabs").then(retrievedMaxTabs, onError);
  browser.tabs.query({})
  .then((tabs) => {
    let length = tabs.length;
    updateBadge(length);
  });
}

/*
Listen to when user adds or removes tabs.
*/
browser.tabs.onRemoved.addListener(
  (tabId) => { updateCount(tabId, true);
});
browser.tabs.onCreated.addListener(
  (tabId) => { updateCount(tabId, false);
});
updateCount();

// Receive initial value for maxTabs
browser.storage.local.get("maxTabs").then(retrievedMaxTabs, onError);
// Listen to changes of the maxTabs value
browser.storage.onChanged.addListener(retrieveMaxTabsValue);
