/**
 * Update the UI: set the value of preferences.
 */
async function updateUI() {
  browser.storage.local.get(["maxTabs", "enableNotif"]).then(updateInputFields, onError);
}

/**
 * Save settings to storage.
 */
function saveOptions(e) {
  saveOptions();
}

function saveOptions() {
  browser.storage.local.set({
    "maxTabs": document.querySelector("#maxTabs").value,
    "enableNotif": !!document.querySelector("#enableNotif").checked,
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
  Set input fields to values in storage.
*/
function updateInputFields(e) {
  if (e.maxTabs) {
    document.querySelector("#maxTabs").value = e.maxTabs;
  } else {
    var maxTabsDefault = 5;
    document.querySelector("#maxTabs").value = maxTabsDefault;
    saveOptions();
  }

  let enableNotif = e.enableNotif === undefined ? true : !!e.enableNotif
  document.querySelector("#enableNotif").checked = enableNotif
}

/**
 * Update the UI when the page loads.
 */
document.addEventListener('DOMContentLoaded', updateUI);
document.querySelector("form").addEventListener("submit", saveOptions);
