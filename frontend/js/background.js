chrome.runtime.onInstalled.addListener(() => {
  console.log("Service worker installed");

  // Getting auth token during installation
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    console.log("Token acquired: ", token);
    chrome.storage.sync.set({ token: token });
  });
});

// Listener for action button clicks
chrome.action.onClicked.addListener(() => {
  console.log("chrome.action.onClicked");
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    console.log("Fetching email message");
    fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Data available >> " + data);
        chrome.storage.sync.set({ messages: data.messages });
        chrome.action.setPopup({ popup: "../html/popup.html" });
      })
      .catch((error) => console.error(error));
  });
});
