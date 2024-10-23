document.addEventListener("DOMContentLoaded", function () {
  // Perform message fetching and scanning here
  chrome.identity.getAuthToken({ interactive: true }, async (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    console.log("Fetching email message");
    // modify here for number of email ?maxResults=10
    await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=&sort=date:desc",
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Data available >> ", data);
        let messages = data.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
          console.log("No messages found in Chrome storage.");
          // Handle case where messages array is empty or undefined
          return;
        }

        // const messageContainer = document.getElementById("message-container");
        // messageContainer.innerHTML = ""; // Clear container before re-populating


        messages.forEach(async (message) => {
          await fetch(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: "Bearer " + token,
              },
            }
          )
            .then((response) => response.json())
            .then((msg) => {
              let messageText = msg.snippet;
              
              //extract subject from message headers
              let subject = getHeader(msg.payload.headers, 'Subject');

          

              fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: messageText }),
              })
                .then((response) => response.json())
                .then((result) => {

                  let subjectDiv = document.createElement("div");
                  subjectDiv.classList.add("subject");
                  subjectDiv.textContent = "Subject: " + subject;

                  let messageDiv = document.createElement("div");
                  messageDiv.classList.add("message");
                  messageDiv.textContent = messageText;

                  // let snippetDiv = document.createElement("div");
                  // snippetDiv.classList.add("snippet");
                  // snippetDiv.textContent = messageText;

                  let buttonContainer = document.createElement("div");
                  buttonContainer.classList.add("button-container");

                  if (result.prediction === 1) {
                    messageDiv.classList.add("spam");
                    let deleteButton = createButton(
                      "Delete",
                      "delete-button",
                      () => {
                        fetch(
                          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}/trash`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: "Bearer " + token,
                            },
                          }
                        ).then((response) => {
                          if (response.ok) {
                            messageDiv.remove();
                          }
                        });
                      }
                    );

                    let markNotSpamButton = createButton(
                      "Mark As Not Spam",
                      "button",
                      () => {
                        fetch(
                          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}/modify`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({
                              removeLabelIds: ["SPAM"],
                            }),
                          }
                        ).then((response) => {
                          if (response.ok) {
                            messageDiv.remove();
                          }
                        });
                      }
                    );

                    buttonContainer.appendChild(deleteButton);
                    buttonContainer.appendChild(markNotSpamButton);
                  } else {
                    let markSpamButton = createButton(
                      "Mark As Spam",
                      "button",
                      () => {
                        fetch(
                          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}/modify`,
                          {
                            method: "POST",
                            headers: {
                              Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({ addLabelIds: ["SPAM"] }),
                          }
                        ).then((response) => {
                          if (response.ok) {
                            messageDiv.remove();
                          }
                        });
                      }
                    );

                    buttonContainer.appendChild(markSpamButton);
                  }

                  messageDiv.appendChild(subjectDiv);
                  // messageDiv.appendChild(snippetDiv);
                  messageDiv.appendChild(buttonContainer);
                  document.getElementById("messages").appendChild(messageDiv);
                });
            });
        });
      })
      .catch((error) => console.error(error));
  });

  //Function to get header values 
  function getHeader(headers, name) {
    let header = headers.find(header => header.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : undefined;
  }

  // Function to create a button with specified text, class, and click handler
  function createButton(text, className, onClick) {
    let button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.onclick = onClick;
    return button;
  }
});
