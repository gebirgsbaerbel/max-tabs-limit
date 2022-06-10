console.log("overlay control online");
var select = document.getElementById("tabselect");
// let tabURLMap;

function reloadTabList() {
  // TODO: only reload if the newly activated window is a MaxTabsOverlay
  console.log("reloadTabList");
  let index = select.options.length;
  while (index--) {
    select.remove(index);
  }
  browser.tabs.query({})
  .then((tabs) => {
    tabs.sort(function(a, b) {return a.lastAccessed - b.lastAccessed});
    for (let tab of tabs) {
      var option = document.createElement("option");
      option.value = tab.id;
      option.innerHTML = tab.title;
      select.append(option);
    }
  });
}

function onTabRemove(tabId) {
  // Remove option for closed tab
  let index = select.options.length;
  while (index--) {
      if (select.options[index].value == String(tabId)) {
          select.remove(index);
      }
  }
}

document.getElementById("closeSelected").addEventListener("click", function() {
  var tabselect = document.getElementById("tabselect");
  // Close selected tabs
  var options = tabselect.options;
  var selectedOptionsTabIds = [...options].filter(option => option.selected).map(option => option.value);
  for (let tabId of selectedOptionsTabIds) {
    browser.tabs.remove(Number(tabId));
  }

  // Remove selected options from html select element
  let selected = [];

  for (let i = 0; i < tabselect.options.length; i++) {
      selected[i] = tabselect.options[i].selected;
  }

  // Remove all selected option
  let index = tabselect.options.length;
  while (index--) {
      if (selected[index]) {
          tabselect.remove(index);
      }
  }
  browser.storage.local.get("tabURLMap").then(retrievedTabURLMap, onError);
});

function retrievedTabURLMap(value) {
  // If value is set use it, otherwise use default value.
  if (value.tabURLMap) {
    // const tabURLMap = new Map(JSON.parse(value.tabURLMap));
    const tabURLMap = new Map(JSON.parse(value.tabURLMap));
    // const currentTab = browser.tabs.getCurrent().then(openOriginalURL, onError);
    console.log("retrieved url map");
    console.log(tabURLMap);
    browser.tabs.getCurrent().then((tabInfo) => openOriginalURL(tabInfo, tabURLMap), onError);
  } else {
    // URL Map could not be loaded, instead load empty
    browser.tabs.update({url: "about:blank"});
  }
}

function openOriginalURL(tabInfo, tabURLMap) {
  let url = tabURLMap.get(tabInfo.id);
  browser.tabs.update(tabInfo.id, {url: url});
}

// function openOriginalURL(tabInfo, url) {
//   browser.tabs.update(tabInfo.id, {url: url});
// }

// Close currently open tab
document.getElementById("closeCurrent").addEventListener("click", function() {
 browser.tabs.getCurrent().
 then((tab) => {
   browser.tabs.remove(tab.id);
 });
});

/*
Generic error logger. Called when number of maxTabs could not be retrieved for any reason.
Instead then use default value.
*/
function onError(e) {
  console.error(e);
}

/*
Listen to when user adds or removes tabs.
*/
browser.tabs.onRemoved.addListener(
  (tab) => { onTabRemove(tab);
});
browser.tabs.onActivated.addListener(
  (tab) => { reloadTabList(tab);
});
reloadTabList();
