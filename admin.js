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

auth.onAuthStateChanged(user => {
  if (user && user.email === SUPER_ADMIN) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadLinks();
  } else {
    document.getElementById("loginBox").style.display = "block";
    document.getElementById("adminPanel").style.display = "none";
  }
});

function login() {
  const email = email.value;
  const password = password.value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      document.getElementById("loginError").innerText = err.message;
    });
}

function logout() {
  auth.signOut();
}

function addLink() {
  const code = document.getElementById("code").value.trim();
  const url = document.getElementById("url").value.trim();
  const days = parseInt(document.getElementById("days").value);

  if (!code || !url || !days) {
    alert("Fill all fields");
    return;
  }

  const expires = Date.now() + days * 86400000;

  db.ref("links/" + code).set({
    url,
    expires
  });

  document.getElementById("code").value = "";
  document.getElementById("url").value = "";
  document.getElementById("days").value = "";
}

function loadLinks() {
  db.ref("links").on("value", snap => {
    const list = document.getElementById("linkList");
    list.innerHTML = "";

    snap.forEach(child => {
      const li = document.createElement("li");
      li.innerHTML = `
        <b>${child.key}</b> → ${child.val().url}
        <button onclick="deleteLink('${child.key}')">Delete</button>
      `;
      list.appendChild(li);
    });
  });
}

function deleteLink(code) {
  if (confirm("Delete " + code + "?")) {
    db.ref("links/" + code).remove();
  }
}
