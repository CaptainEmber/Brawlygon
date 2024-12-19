// public/js/token-selector.js
document.addEventListener("DOMContentLoaded", () => {
  const tokenSelector = document.createElement("select");
  tokenSelector.id = "token-selector";

  // Fetch the list of filenames from the JSON file
  fetch("/token-list.json")
    .then((response) => response.json())
    .then((files) => {
      files.forEach((file) => {
        const option = document.createElement("option");
        option.value = file.path;
        option.text = file.name;
        tokenSelector.appendChild(option);
      });

      // Append the selector to the token panel
      const tokenPanel = document.getElementById("tokenPanel");
      tokenPanel.appendChild(tokenSelector);
    })
    .catch((error) => console.error("Error fetching filenames:", error));
});
