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

/******** AUTH CHECK WITH SESSION MANAGEMENT ********/
auth.onAuthStateChanged(user => {
  if (!user) {
    showLoginPanel();
    return;
  }

  const key = user.email.replace(/\./g, "_");

  db.ref("admins/" + key).once("value").then(snap => {
    if (!snap.exists()) {
      showStatus("Not authorized as admin", "error");
      setTimeout(() => {
        auth.signOut();
      }, 2000);
      return;
    }

    showAdminPanel(user.email);
    loadLinks();
  });
});

/******** SHOW/HIDE PANELS ********/
function showLoginPanel() {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("panel").style.display = "none";
  document.body.classList.remove("admin-view");
}

function showAdminPanel(email) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("panel").style.display = "block";
  document.body.classList.add("admin-view");
  document.getElementById("adminEmail").textContent = email;
  
  // Set welcome message based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  document.getElementById("welcomeText").textContent = `${greeting}, ${email.split('@')[0]}`;
}

/******** SHOW STATUS MESSAGES ********/
function showStatus(message, type = "success") {
  const statusEl = document.getElementById("statusMessage");
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = "block";
  
  setTimeout(() => {
    statusEl.style.display = "none";
  }, 3000);
}

/******** ENHANCED LOGIN ********/
function login() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("pass").value.trim();
  
  if (!email || !pass) {
    showStatus("Please enter both email and password", "error");
    return;
  }

  // Show loading state
  const loginBtn = document.getElementById("loginBtn");
  loginBtn.classList.add("loading");
  loginBtn.disabled = true;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      showStatus("Login successful!", "success");
    })
    .catch(err => {
      console.error("Login error:", err);
      let errorMessage = "Login failed";
      
      switch(err.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email address";
          break;
        case 'auth/user-disabled':
          errorMessage = "Account disabled";
          break;
        case 'auth/user-not-found':
          errorMessage = "Account not found";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many attempts. Try again later";
          break;
      }
      
      showStatus(errorMessage, "error");
    })
    .finally(() => {
      loginBtn.classList.remove("loading");
      loginBtn.disabled = false;
    });
}

/******** ENHANCED LOGOUT ********/
function logout() {
  // Show confirmation for logout
  if (confirm("Are you sure you want to logout?")) {
    auth.signOut().then(() => {
      showStatus("Logged out successfully", "success");
      setTimeout(() => {
        location.reload();
      }, 1000);
    });
  }
}

/******** VALIDATE URL ********/
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/******** ENHANCED ADD/UPDATE LINK ********/
function addLink() {
  const code = document.getElementById("code").value.trim().toLowerCase();
  const url = document.getElementById("url").value.trim();
  const days = parseInt(document.getElementById("days").value);
  const pwd = document.getElementById("pwd").value.trim();

  // Validation
  if (!code || code.length < 3) {
    showStatus("Code must be at least 3 characters", "error");
    return;
  }
  
  if (!url) {
    showStatus("URL is required", "error");
    return;
  }
  
  if (!isValidUrl(url) && !url.startsWith('/')) {
    showStatus("Please enter a valid URL or path", "error");
    return;
  }
  
  if (!days || days < 1 || days > 3650) {
    showStatus("Days must be between 1 and 3650", "error");
    return;
  }

  const expires = Date.now() + days * 86400000;
  const linkData = {
    url: url,
    expires: expires,
    password: pwd || null,
    clicks: 0,
    created: Date.now(),
    createdBy: auth.currentUser.email
  };

  // Show loading
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.classList.add("loading");

  db.ref("links/" + code).set(linkData)
    .then(() => {
      showStatus(`Link "${code}" saved successfully!`, "success");
      // Clear form
      document.getElementById("code").value = "";
      document.getElementById("url").value = "";
      document.getElementById("days").value = "30";
      document.getElementById("pwd").value = "";
      
      // Generate preview URL
      const previewUrl = `${window.location.origin}/${code}`;
      document.getElementById("previewUrl").innerHTML = 
        `Preview: <a href="${previewUrl}" target="_blank">${previewUrl}</a>`;
    })
    .catch(err => {
      showStatus("Error saving link: " + err.message, "error");
    })
    .finally(() => {
      setTimeout(() => {
        saveBtn.classList.remove("loading");
      }, 500);
    });
}

/******** ENHANCED LOAD LINKS WITH FILTERING ********/
function loadLinks() {
  db.ref("links").on("value", snap => {
    const list = document.getElementById("links");
    const stats = document.getElementById("linkStats");
    
    if (!snap.exists()) {
      list.innerHTML = '<li class="no-links">No links found. Create your first link!</li>';
      stats.innerHTML = "Total Links: 0";
      return;
    }

    let totalLinks = 0;
    let totalClicks = 0;
    let activeLinks = 0;
    const now = Date.now();
    list.innerHTML = "";

    snap.forEach(child => {
      totalLinks++;
      const d = child.val();
      const clicks = d.clicks || 0;
      totalClicks += clicks;
      
      const isExpired = d.expires && d.expires < now;
      if (!isExpired) activeLinks++;
      
      const createdDate = d.created ? new Date(d.created).toLocaleDateString() : "Unknown";
      const expiresDate = d.expires ? new Date(d.expires).toLocaleDateString() : "Never";
      
      const li = document.createElement("li");
      li.className = isExpired ? "expired" : "active";
      li.innerHTML = `
        <div class="link-header">
          <span class="link-code">${child.key}</span>
          <span class="link-status ${isExpired ? 'status-expired' : 'status-active'}">
            ${isExpired ? 'Expired' : 'Active'}
          </span>
        </div>
        <div class="link-url">${d.url}</div>
        <div class="link-meta">
          <span class="link-clicks">👆 ${clicks} clicks</span>
          <span class="link-date">📅 Expires: ${expiresDate}</span>
        </div>
        <div class="link-actions">
          <button class="btn-small btn-copy" onclick="copyLink('${child.key}')" title="Copy URL">
            📋 Copy
          </button>
          <button class="btn-small btn-delete" onclick="deleteLink('${child.key}')" title="Delete">
            🗑️ Delete
          </button>
        </div>
      `;
      list.appendChild(li);
    });

    // Update stats
    stats.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${totalLinks}</div>
          <div class="stat-label">Total Links</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${activeLinks}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalClicks}</div>
          <div class="stat-label">Total Clicks</div>
        </div>
      </div>
    `;
  });
}

/******** COPY LINK TO CLIPBOARD ********/
function copyLink(code) {
  const url = `${window.location.origin}/${code}`;
  navigator.clipboard.writeText(url)
    .then(() => {
      showStatus("Link copied to clipboard!", "success");
    })
    .catch(err => {
      showStatus("Failed to copy: " + err.message, "error");
    });
}

/******** ENHANCED DELETE LINK ********/
function deleteLink(code) {
  if (confirm(`Are you sure you want to delete "${code}"?\nThis action cannot be undone.`)) {
    db.ref("links/" + code).remove()
      .then(() => {
        showStatus(`Link "${code}" deleted`, "success");
      })
      .catch(err => {
        showStatus("Error deleting link: " + err.message, "error");
      });
  }
}

/******** ENHANCED ADD ADMIN ********/
function addAdmin() {
  if (auth.currentUser.email !== SUPER_ADMIN) {
    showStatus("Only super admin can add new admins", "error");
    return;
  }

  const email = document.getElementById("newAdmin").value.trim();
  if (!email) {
    showStatus("Please enter an email address", "error");
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showStatus("Please enter a valid email address", "error");
    return;
  }

  const key = email.replace(/\./g, "_");
  
  // Check if admin already exists
  db.ref("admins/" + key).once("value").then(snap => {
    if (snap.exists()) {
      showStatus("This admin already exists", "error");
      return;
    }

    db.ref("admins/" + key).set({
      email: email,
      role: "editor",
      addedBy: auth.currentUser.email,
      addedAt: Date.now()
    });

    showStatus(`Admin "${email}" added successfully`, "success");
    document.getElementById("newAdmin").value = "";
  });
}

/******** QUICK ACTIONS ********/
function quickAdd(days = 30) {
  document.getElementById("days").value = days;
  showStatus(`Default expiry set to ${days} days`, "success");
}

/******** SEARCH LINKS ********/
function searchLinks() {
  const searchTerm = document.getElementById("searchBox").value.toLowerCase();
  const links = document.querySelectorAll('#links li');
  
  links.forEach(link => {
    const text = link.textContent.toLowerCase();
    link.style.display = text.includes(searchTerm) ? "flex" : "none";
  });
}

/******** KEYBOARD SHORTCUTS ********/
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to save
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (document.getElementById("code").value) {
      addLink();
    }
  }
  
  // Escape to clear search
  if (e.key === 'Escape') {
    document.getElementById("searchBox").value = "";
    searchLinks();
  }
});

/******** INITIALIZE ON LOAD ********/
document.addEventListener('DOMContentLoaded', () => {
  // Auto-focus first input
  if (document.getElementById("email")) {
    document.getElementById("email").focus();
  }
  
  // Add event listeners for enter key
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (input.id === 'email') {
          document.getElementById('pass').focus();
        } else if (input.id === 'pass') {
          login();
        } else if (input.id === 'code' || input.id === 'url') {
          const nextInput = input.nextElementSibling;
          if (nextInput && nextInput.tagName === 'INPUT') {
            nextInput.focus();
          }
        }
      }
    });
  });
});
