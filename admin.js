/************ FIREBASE CONFIG ************/
const firebaseConfig = {
  apiKey: "AIzaSyBPF1VE82Y3VkZe6IibjqKxBC-XHjM_Wco",
  authDomain: "chat-2024-ff149.firebaseapp.com",
  databaseURL: "https://chat-2024-ff149-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-2024-ff149",
  storageBucket: "chat-2024-ff149.appspot.com",
  messagingSenderId: "146349109253",
  appId: "1:146349109253:android:e593afbf0584762519ac6c"
};

/************ INIT ************/
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

/************ SUPER ADMIN ************/
const SUPER = "admin@sunny.mavale";

/************ AUTH STATE ************/
auth.onAuthStateChanged(u => {
  if (!u) return;

  const key = u.email.replace(/\./g, "_");
  db.ref("admins/" + key).once("value").then(r => {
    if (!r.exists()) {
      alert("Not authorized");
      auth.signOut();
      return;
    }

    document.getElementById("login").hidden = true;
    document.getElementById("panel").hidden = false;
    loadLinks();
  });
});

/************ LOGIN ************/
function login() {
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("pass").value
  ).catch(err => alert(err.message));
}

/************ LOGOUT ************/
function logout() {
  auth.signOut();
}

/************ ADD / UPDATE LINK ************/
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

/************ LOAD LINKS ************/
function loadLinks() {
  db.ref("links").on("value", s => {
    const list = document.getElementById("links");
    list.innerHTML = "";

    s.forEach(c => {
      const d = c.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <span>
          <b>${c.key}</b> → ${d.url}<br>
          clicks: ${d.clicks || 0}
        </span>
        <button onclick="delLink('${c.key}')">Delete</button>
      `;
      list.appendChild(li);
    });
  });
}

/************ DELETE LINK ************/
function delLink(code) {
  if (confirm("Delete " + code + "?")) {
    db.ref("links/" + code).remove();
  }
}

/************ ADD ADMIN (SUPER ONLY) ************/
function addAdmin() {
  if (auth.currentUser.email !== SUPER) {
    alert("Only super admin can add admins");
    return;
  }

  const email = document.getElementById("newAdmin").value.trim();
  if (!email) return;

  const key = email.replace(/\./g, "_");
  db.ref("admins/" + key).set("editor");

  alert("Admin added");
}
