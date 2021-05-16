const socket = io();

//UI Variables
const form = document.getElementById("message-form");
const send = document.getElementById("send");
const sendLoc = document.getElementById("send-location");
const uiInput = document.getElementById("msg");
const messages = document.querySelector(".chat-messages");
const leaveBtn = document.getElementById("leave-btn");

//Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//Scroll
const autoScroll = () => {
  /*messages.scrollTop = messages.scrollHeight;*/
  // New message element
  const newMessage = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = (messages.scrollTop + visibleHeight) * 2;

  if (containerHeight - newMessageHeight < scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

//Listens to message event
socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//Listen to location-message event
socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//Output room name and users to DOM
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector(".chat-sidebar").innerHTML = html;
});

//Emit sendMessage event
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = uiInput.value;

  //diable send button until message is send
  send.setAttribute("disabled", "disabled");
  socket.emit("sendMessage", msg, (error) => {
    //enable the buttton
    send.removeAttribute("disabled");

    uiInput.focus();
    clearInput();
    if (error) {
      console.log(error);
      return;
    }
    console.log("Message delivered");
  });
});

//Emit sendLocation event
sendLoc.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  //disable
  sendLoc.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        //enable
        sendLoc.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});

//Emit join event
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

//Function to clear form input
function clearInput() {
  uiInput.value = "";
}

//Prompt the user before leave chat room
leaveBtn.addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});
