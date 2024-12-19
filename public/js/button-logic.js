document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#form");
  const btn = document.querySelector("#send-btn");
  const input = document.querySelector("#input");
  const log = document.querySelector("#chatPanel .messages");
  const usernameInput = document.querySelector("#username-overlay");
  const tokenList = document.getElementById("tokenList");
  const deleteButton = document.getElementById("deleteButton");

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    if (input.value === "") {
      alert("say something jamie");
      return;
    }

    const username = usernameInput.value;
    const color = document
      .getElementById("player")
      .getAttribute("player-info").color;
    const message = `<div><span style="color: ${color}">${username}:</span> ${input.value}</div>`;
    log.insertAdjacentHTML("afterbegin", message);

    NAF.connection.broadcastDataGuaranteed("chat", {
      txt: input.value,
      name: username,
      color: color,
    });
    input.value = "";
  });

  NAF.connection.subscribeToDataChannel(
    "chat",
    (senderId, dataType, data, targetId) => {
      const message = `<div><span style="color: ${data.color}">${data.name}:</span> ${data.txt}</div>`;
      log.insertAdjacentHTML("afterbegin", message);
    }
  );

  const buttons = document.querySelectorAll("#buttons button");
  const panels = document.querySelectorAll("#panel > div");
  let lastClickedButton = null;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.id.replace("Button", "Panel");
      const panel = document.getElementById(panelId);

      if (lastClickedButton === button) {
        panel.style.display = "none";
        lastClickedButton = null;
        console.log("Closed the Pane");
      } else {
        panels.forEach((p) => (p.style.display = "none"));
        panel.style.display = "block";
        lastClickedButton = button;
        console.log(lastClickedButton);
      }
    });
  });

  const movementButtons = document.querySelectorAll("#movementPanel button");
  const playerEntity = document.getElementById("player");

  movementButtons.forEach((button) => {
    button.addEventListener("mousedown", handleButtonInteraction);
    button.addEventListener("mouseup", handleButtonInteraction);
    button.addEventListener("touchstart", handleButtonInteraction);
    button.addEventListener("touchend", handleButtonInteraction);
  });

  function handleButtonInteraction(event) {
    event.preventDefault(); // Prevent default behavior for both mouse and touch events

    const isPressed = event.type === "mousedown" || event.type === "touchstart";
    const buttonId = event.target.id;

    playerEntity.components["beholder-controls"].handleButtonPress(
      buttonId,
      isPressed
    );
    console.log(buttonId, isPressed);
  }

  function onConnect() {
    console.log("onConnect", new Date());
  }

  function updateTokenList() {
    tokenList.innerHTML = "";
    const tokens = document.querySelectorAll(".token");
    tokens.forEach((token) => {
      const tokenName = token.getAttribute("name") || "Token";
      const option = document.createElement("option");
      option.value = token.id;
      option.textContent = tokenName;
      tokenList.appendChild(option);
    });
  }

  // Update token list initially and whenever a new token is added
  updateTokenList();
  document.body.addEventListener("persistentEntityCreated", (event) => {
    updateTokenList();
  });
});
