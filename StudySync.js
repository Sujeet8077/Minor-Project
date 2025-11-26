// Global Variables
let resources = [];
let tasks = [];
let groups = [
    { id: 1, name: "🔥 Physics Marathon", host: "Rahul", members: 5 },
    { id: 2, name: "☕ Late Night Coding", host: "Dev", members: 12 }
];

let currentUser = null;
let isLoginMode = true; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if user is already logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = storedUser;
        // 2. Load DATA SPECIFIC TO THIS USER
        loadUserData();
    }
    
    // 3. Update UI
    checkAuthStatus();
    updateDashboard();
    
    // 4. Render lists if user exists
    if(currentUser) {
        renderResources();
        renderTasks();
        renderGroups();
    }
});

/* --- DATA MANAGEMENT --- */
function loadUserData() {
    if(!currentUser) return;
    
    // We use the username in the key: 'studyResources_Sujeet', 'studyTasks_Rahul'
    const resKey = `studyResources_${currentUser}`;
    const taskKey = `studyTasks_${currentUser}`;
    
    resources = JSON.parse(localStorage.getItem(resKey)) || [];
    tasks = JSON.parse(localStorage.getItem(taskKey)) || [];
}

function saveData() {
    if(!currentUser) return;
    
    const resKey = `studyResources_${currentUser}`;
    const taskKey = `studyTasks_${currentUser}`;
    
    localStorage.setItem(resKey, JSON.stringify(resources));
    localStorage.setItem(taskKey, JSON.stringify(tasks));
}

/* --- AUTHENTICATION --- */
function handleAuth() {
    const userIn = document.getElementById('auth-username').value;
    const passIn = document.getElementById('auth-password').value;
    
    if(!userIn || !passIn) { alert("Please fill fields"); return; }
    
    // Set User
    currentUser = userIn;
    localStorage.setItem('currentUser', currentUser);
    
    // Load THEIR data
    loadUserData();
    
    closeModal('auth-modal'); 
    
    // Refresh UI
    checkAuthStatus();
    renderResources();
    renderTasks();
    renderGroups();
    updateDashboard();
}

function handleLogout() {
    if(confirm("Sign out?")) { 
        localStorage.removeItem('currentUser'); 
        currentUser = null;
        
        // CLEAR DATA FROM SCREEN
        resources = []; 
        tasks = []; 
        
        // Wipe the HTML containers
        document.getElementById('resource-list').innerHTML = "";
        document.getElementById('task-list').innerHTML = "";
        document.getElementById('dash-task-list').innerHTML = "";
        document.getElementById('dash-res-list').innerHTML = "";
        
        checkAuthStatus();
        updateDashboard(); 
        
        location.reload();
    }
}

/* --- VIEWER LOGIC (CENTERED) --- */
function openResourceHelper(id) {
    const res = resources.find(r => r.id === id);
    if(!res) return;

    if(res.type === 'link') {
        window.open(res.link, '_blank');
    } else {
        const viewerBody = document.getElementById('viewer-body');
        document.getElementById('viewer-title').innerText = "Preview: " + res.title;
        
        // Clear previous content
        viewerBody.innerHTML = '';

        // Create container that forces centering
        viewerBody.style.cssText = "flex: 1; display: flex; justify-content: center; align-items: center; background: #333; height: 100%; overflow: hidden;";
        
        if(res.type === 'image') {
            // Image styling for perfect center
            viewerBody.innerHTML = `<img src="${res.link}" style="max-width: 90%; max-height: 90%; display: block; margin: auto; box-shadow: 0 0 20px rgba(0,0,0,0.5);">`;
        } else if (res.type === 'pdf') {
            viewerBody.innerHTML = `<iframe src="${res.link}" style="width:100%; height:100%; border:none;"></iframe>`;
        } else {
            viewerBody.innerHTML = `<p style="color:white;">Cannot preview this file type. <a href="${res.link}" download="file" style="color:#a29bfe;">Download</a></p>`;
        }
        
        openModal('viewer-modal');
    }
}

/* --- GOOGLE MEET LOGIC (NEW) --- */
function startGoogleMeet() {
    window.open('https://meet.google.com/new', '_blank');
}

function joinGoogleMeet() {
    const code = document.getElementById('meet-code-input').value.trim();
    if(code) {
        window.open(`https://meet.google.com/${code}`, '_blank');
    } else {
        window.open('https://meet.google.com/', '_blank');
    }
}

/* --- DASHBOARD UPDATES --- */
function updateDashboard() {
    if(!currentUser) {
        document.getElementById('total-tasks-count').innerText = 0;
        document.getElementById('total-resources-count').innerText = 0;
        document.getElementById('active-group-count').innerText = 0;
        document.getElementById('chart-percent').innerText = "0%";
        document.getElementById('circle-chart').style.background = `conic-gradient(var(--success) 0deg, #eee 0deg)`;
        
        const msg = '<p style="color:#aaa; text-align:center; padding:20px;">Please Sign In</p>';
        document.getElementById('dash-task-list').innerHTML = msg;
        document.getElementById('dash-res-list').innerHTML = msg;
        document.getElementById('dash-group-list').innerHTML = msg;
        return;
    }

    const pending = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    
    document.getElementById('total-tasks-count').innerText = pending;
    document.getElementById('total-resources-count').innerText = resources.length;
    document.getElementById('active-group-count').innerText = groups.length;

    let pct = 0;
    if (tasks.length > 0) pct = Math.round((completed / tasks.length) * 100);
    
    document.getElementById('chart-percent').innerText = pct + "%";
    document.getElementById('circle-chart').style.background = `conic-gradient(var(--success) ${pct * 3.6}deg, #eee 0deg)`;

    renderWidgets();
}

function renderWidgets() {
    const dashTask = document.getElementById('dash-task-list');
    const topTasks = tasks.filter(t => !t.completed).slice(0, 5);
    dashTask.innerHTML = topTasks.length ? topTasks.map(t => `<div class="mini-item"><span>${t.desc}</span><span class="status-tag tag-todo">Due: ${t.date}</span></div>`).join('') : '<p style="text-align:center; color:#aaa;">No pending tasks.</p>';

    const dashRes = document.getElementById('dash-res-list');
    const recentRes = resources.slice(-5).reverse();
    dashRes.innerHTML = recentRes.length ? recentRes.map(r => `<div class="mini-item"><span>${r.title}</span><button class="status-tag tag-res" style="border:none; cursor:pointer;" onclick="openResourceHelper(${r.id})">Open</button></div>`).join('') : '<p style="text-align:center; color:#aaa;">No resources.</p>';

    const dashGroup = document.getElementById('dash-group-list');
    dashGroup.innerHTML = groups.map(g => `<div class="mini-item"><span>${g.name}</span><button class="status-tag tag-group" style="border:none; cursor:pointer;" onclick="joinRoom('${g.name}')">Join</button></div>`).join('');
}

/* Helper Functions */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}
function openAuthModal() { if(!currentUser) document.getElementById('auth-modal').style.display = 'block'; }
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Sign In" : "Create Account";
    document.getElementById('auth-action-btn').innerText = isLoginMode ? "Login" : "Sign Up";
}
function checkAuthStatus() {
    const btn = document.getElementById('sidebar-auth-btn');
    const msg = document.getElementById('welcome-msg');
    const sName = document.getElementById('settings-name');
    const sEmail = document.getElementById('settings-email');

    if(currentUser) {
        btn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser;
        btn.classList.remove('btn-login');
        btn.onclick = () => showSection('settings');
        msg.innerText = `Welcome back, ${currentUser}!`;
        sName.value = currentUser; 
        sEmail.value = currentUser.toLowerCase().replace(/\s/g,'') + "@studysync.com";
    } else {
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        btn.classList.add('btn-login');
        btn.onclick = openAuthModal;
        msg.innerText = "Welcome, Guest!";
        sName.value = ""; sEmail.value = "";
    }
}
function saveSettings() {
    const newName = document.getElementById('settings-name').value;
    if(newName && currentUser) {
        const oldKeyRes = `studyResources_${currentUser}`;
        const oldKeyTask = `studyTasks_${currentUser}`;
        currentUser = newName;
        localStorage.setItem('currentUser', currentUser);
        localStorage.setItem(`studyResources_${currentUser}`, localStorage.getItem(oldKeyRes));
        localStorage.setItem(`studyTasks_${currentUser}`, localStorage.getItem(oldKeyTask));
        checkAuthStatus(); 
        alert("Settings Saved!"); 
    }
}
function renderGroups() {
    document.getElementById('group-list').innerHTML = groups.map(g => `
        <div class="group-card"><div><h3>${g.name}</h3><small>Host: ${g.host}</small></div>
        <button class="join-btn" onclick="joinRoom('${g.name}')">Join</button></div>`).join('');
}
function createRoom() {
    if(!currentUser) { alert("Sign In first"); return; }
    const name = prompt("Room Name:");
    if(name) { groups.push({id:Date.now(), name:name, host:currentUser}); renderGroups(); updateDashboard(); }
}
function joinRoom(n) { if(currentUser) alert(`Joined ${n}`); else alert("Sign In first"); }

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active-section');
    if(window.innerWidth <= 768) toggleSidebar();
    updateDashboard();
}
function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function toggleResourceInput() {
    const type = document.getElementById('res-type').value;
    document.getElementById('input-url-container').style.display = (type === 'link') ? 'block' : 'none';
    document.getElementById('input-file-container').style.display = (type !== 'link') ? 'block' : 'none';
}
function processAndAddResource() {
    const title = document.getElementById('res-title').value;
    const type = document.getElementById('res-type').value;
    if(!title) { alert("Title required"); return; }
    if(type === 'link') {
        saveRes(title, document.getElementById('res-link').value, type);
    } else {
        const file = document.getElementById('res-file-upload').files[0];
        if(!file) { alert("File required"); return; }
        if(file.size > 3000000) { alert("File too large (Max 3MB)"); return; }
        const reader = new FileReader();
        reader.onload = e => saveRes(title, e.target.result, type);
        reader.readAsDataURL(file);
    }
}
function saveRes(title, link, type) {
    try {
        resources.push({id: Date.now(), title, link, type});
        saveData(); 
        renderResources();
        closeModal('resource-modal');
        updateDashboard();
        document.getElementById('res-title').value = '';
    } catch(e) { alert("Storage full"); }
}
function renderResources() {
    document.getElementById('resource-list').innerHTML = resources.map(r => `
        <div class="resource-card">
            <h3><i class="fas ${r.type==='link'?'fa-link':'fa-file'}"></i> ${r.title}</h3>
            <button class="resource-link-btn" onclick="openResourceHelper(${r.id})">View</button>
            <button class="btn-delete" style="position:absolute;bottom:20px;right:20px;" onclick="delRes(${r.id})"><i class="fas fa-trash"></i></button>
        </div>`).join('');
}
function delRes(id) { resources = resources.filter(r => r.id !== id); saveData(); renderResources(); updateDashboard(); }
function addTask() {
    const d = document.getElementById('task-desc').value;
    if(d) { tasks.push({id:Date.now(), desc:d, date: document.getElementById('task-date').value, completed:false}); saveData(); renderTasks(); closeModal('task-modal'); updateDashboard(); }
}
function renderTasks() {
    document.getElementById('task-list').innerHTML = tasks.map(t => `
        <div class="task-item ${t.completed?'completed':''}">
            <div style="display:flex;gap:10px;align-items:center"><input type="checkbox" ${t.completed?'checked':''} onchange="toggleTask(${t.id})">
            <div><h4>${t.desc}</h4><small>${t.date}</small></div></div>
            <button class="btn-delete" onclick="delTask(${t.id})"><i class="fas fa-trash"></i></button>
        </div>`).join('');
}
function toggleTask(id) { const t = tasks.find(x => x.id === id); t.completed = !t.completed; saveData(); renderTasks(); updateDashboard(); }
function delTask(id) { tasks = tasks.filter(x => x.id !== id); saveData(); renderTasks(); updateDashboard(); }