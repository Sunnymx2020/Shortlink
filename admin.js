/******** FIREBASE CONFIG ********/
const firebaseConfig = {
  apiKey: "AIzaSyBPF1VE82Y3VkZe6IibjqKxBC-XHjM_Wco",
  authDomain: "chat-2024-ff149.firebaseapp.com",
  databaseURL: "https://chat-2024-ff149-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-2024-ff149",
  storageBucket: "chat-2024-ff149.appspot.com",
  messagingSenderId: "146349109253",
  appId: "1:146349109253:android:e593afbf0584762519ac6c"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

const SUPER_ADMIN = "admin@sunny.mavale";

/******** AUTH CHECK ********/
auth.onAuthStateChanged(user => {
  if (!user) return;

  const key = user.email.replace(/\./g, "_");

  db.ref("admins/" + key).once("value").then(snap => {
    if (!snap.exists()) {
      alert("Not authorized");
      auth.signOut();
      return;
    }

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
    loadLinks();
  });
});

/******** LOGIN ********/
function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("pass").value;

  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => {
      document.getElementById("error").innerText = err.message;
    });
}

/******** LOGOUT ********/
function logout() {
  auth.signOut();
  location.reload();
}

/******** ADD / UPDATE LINK ********/
function addLink() {
  const code = document.getElementById("code").value.trim();
  const url = document.getElementById("url").value.trim();
  const days = parseInt(document.getElementById("days").value);
  const pwd = document.getElementById("pwd").value;

  if (!code || !url || !days) {
    alert("Fill all required fields");
    return;
  }

  const expires = Date.now() + days * 86400000;

  db.ref("links/" + code).set({
    url: url,
    expires: expires,
    password: pwd || null,
    clicks: 0
  });

  alert("Link saved");
}

/******** LOAD LINKS ********/
function loadLinks() {
  db.ref("links").on("value", snap => {
    const list = document.getElementById("links");
    list.innerHTML = "";

    snap.forEach(child => {
      const d = child.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${child.key}</b><br>
        ${d.url}<br>
        Clicks: ${d.clicks || 0}
        <button onclick="deleteLink('${child.key}')">Delete</button>
      `;
      list.appendChild(li);
    });
  });
}

/******** DELETE LINK ********/
function deleteLink(code) {
  if (confirm("Delete " + code + "?")) {
    db.ref("links/" + code).remove();
  }
}

/******** ADD ADMIN ********/
function addAdmin() {
  if (auth.currentUser.email !== SUPER_ADMIN) {
    alert("Only super admin allowed");
    return;
  }

  const email = document.getElementById("newAdmin").value.trim();
  if (!email) return;

  const key = email.replace(/\./g, "_");
  db.ref("admins/" + key).set("editor");

  alert("Admin added");
}
