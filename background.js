var maxTabs;
// Maps browser tab id to url that should have been loaded instead of Tablist.
// Allows opening the URL once the user has closed enough tabs.
var tabURLMap;

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
    // Only limit number of tabs other than preferences
    isPreferencesWindow = tabId.title == null || tabId.title.includes("about:preferences") || tabId.title.includes("about:addons") || tabId.title.includes("about:logins");
    if (!isOnRemoved && length > maxTabs && !isPreferencesWindow) {
      console.log(tabId);

      // Firefox does not set url at this point yet. The url is instead in the title. This changes later on in onUpdate.
      // TODO: Figure out better way to handle this.
      tabURLMap.set(tabId.id, tabId.title);
      storeTabURLMap();
      console.log(tabId.url);
      browser.tabs.update(tabId.id, {url: "./overlay.html"}).then(onActivatedOverlay, onError);;
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
Retrieved information of maxTabs setting from storage.
*/
function retrievedMaxTabs(value) {
  // If maxTabs value is set use it, otherwise use default value.
  if (value.maxTabs) {
    maxTabs = value.maxTabs;
  } else {
    setMaxTabsDefaultValue();
  }
}

function setMaxTabsDefaultValue() {
  maxTabsDefault = 50;
  maxTabs = maxTabsDefault;
  browser.storage.local.set({
    "maxTabs": maxTabsDefault
  }).then(savedSuccessfully, onSaveError);
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

function retrievedTabURLMap(value) {
  // If value is set use it, otherwise use default value.
  if (value.tabURLMap) {
    tabURLMap = new Map(JSON.parse(value.tabURLMap));
  } else {
    tabURLMap = new Map();
    storeTabURLMap();
  }
}

/*
Get data for tabURLMap from local storage
*/
function retrieveTabURLMap() {
  browser.storage.local.get("tabURLMap").then(retrievedTabURLMap, onError);
}

function storeTabURLMap() {
  browser.storage.local.set({
    "tabURLMap": JSON.stringify(Array.from(tabURLMap.entries()))
  }).then(savedSuccessfully, onSaveError);
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
retrieveTabURLMap();
// Load list of URLs that should have been loaded into a tab,
// when MaxTabsOverlay was loaded instead, as too many tabs were open at the time.
// browser.storage.local.get("tabURLMap").then(retrievedtabURLMap, onErrorRetrievingTabURLMap);
// Listen to changes of the maxTabs value
browser.storage.onChanged.addListener(retrieveMaxTabsValue);
browser.storage.onChanged.addListener(retrieveTabURLMap);
