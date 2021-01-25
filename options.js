/**
 * Update the UI: set the value of the maxTabs textbox.
 */
async function updateUI() {
  browser.storage.local.get("maxTabs").then(updateMaxTabsText, onError);
}

/**
 * Save settings to storage.
 */
function saveOptions(e) {
  saveOptions();
}

function saveOptions() {
  browser.storage.local.set({
    "maxTabs": document.querySelector("#maxTabs").value
  }).then(savedSuccessfully, onError);
  e.preventDefault();
}

/*
  Log message in case storing settings has been successfull.
*/
function savedSuccessfully(e) {
  console.log(`Saved successfully: ${e}`);
}

/*
Generic error logger.
*/
function onError(e) {
  console.error(e);
}

/*
  Set text of maxTabs textField to the current maxTabs value.
*/
function updateMaxTabsText(e) {
  if (e.maxTabs) {
    document.querySelector("#maxTabs").value = e.maxTabs;
  } else {
    var maxTabsDefault = 5;
    document.querySelector("#maxTabs").value = maxTabsDefault;
    saveOptions();
  }
}

/**
 * Update the UI when the page loads.
 */
document.addEventListener('DOMContentLoaded', updateUI);
document.querySelector("form").addEventListener("submit", saveOptions);
