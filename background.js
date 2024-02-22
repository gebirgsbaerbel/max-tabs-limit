var maxTabs;
var enableNotif;

/*
Update the browser when the number of tabs changes.
Update the badge. Including text and color.
Notify user, when too many tabs were opened.
*/
function updateCount(tabId, isOnRemoved) {
  browser.tabs.query({})
  .then((tabs) => {
    let length = tabs.length;

    if (tabId == undefined) {
      updateBadge(length);
      return;
    }

    // onRemoved fires too early and the count is one too many.
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
    if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
      length--;
    }
    // Only limit number of tabs other than preferences
    isPreferencesWindow = tabId.title == null || tabId.title.includes("about");
    isNewTabWindow = tabId.title != null && tabId.title.includes("about:newTab");
    // Do not block any about pages except for newTab. about:home and about:welcome are also blocked as they start an about:newTab page first.
    isBlockable = !isPreferencesWindow || isNewTabWindow;
    if (!isOnRemoved && length > maxTabs && isBlockable) {
      let content = `Max Tabs Limit: ${maxTabs}`;
      enableNotif && browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/link-48.png"),
        "title": "Too many tabs opened",
        "message": content
      });
      browser.tabs.remove(tabId.id);
    }

    updateBadge(length);

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
Generic error logger. Called when number of maxTabs could not be retrieved for any reason.
Instead then use default value.
*/
function onError(e) {
  console.error(e);
  setMaxTabsDefaultValue();
}

/*
  Called when saving maxTabs value was not successfull.
*/
function onSaveError(e) {
  console.error(e);
}

/*
  Log message in case storing settings has been successfull.
*/
function savedSuccessfully(e) {
  console.log(`Saved successfully: ${e}`);
}

/*
Retrieved settings from storage.
*/
function retrievedSettings(value) {
  // If maxTabs value is set use it, otherwise use default value.
  if (value.maxTabs) {
    maxTabs = value.maxTabs;
  } else {
    setMaxTabsDefaultValue();
  }
  enableNotif = !!value.enableNotif
}

function setMaxTabsDefaultValue() {
  maxTabsDefault = 50;
  maxTabs = maxTabsDefault;
  browser.storage.local.set({
    "maxTabs": maxTabsDefault
  }).then(savedSuccessfully, onSaveError);
}

/*
Retrieve the value of settings from storage and update the UI accordingly.
*/
function retrieveAndUpdateSettings() {
  browser.storage.local.get(["maxTabs", "enableNotif"]).then(retrievedSettings, onError);
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

// Receive initial value for settings
browser.storage.local.get(["maxTabs", "enableNotif"]).then(retrievedSettings, onError);
// Listen to changes of the setting values
browser.storage.onChanged.addListener(retrieveAndUpdateSettings);
