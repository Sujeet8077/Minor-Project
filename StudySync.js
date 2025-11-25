
        let resources = JSON.parse(localStorage.getItem('studyResources')) || [];
        let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
        let groups = [
            { id: 1, name: "🔥 Physics Marathon", host: "Rahul", members: 5 },
            { id: 2, name: "☕ Late Night Coding", host: "Dev", members: 12 }
        ];

        let storedUser = localStorage.getItem('currentUser'); 
        let currentUser = null;
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                currentUser = parsedUser.name || parsedUser; 
            } catch (e) {
                currentUser = storedUser;
            }
        }
        let isLoginMode = true; 

        document.addEventListener('DOMContentLoaded', () => {
            checkAuthStatus();
            renderResources();
            renderTasks();
            renderGroups();
            updateDashboard(); 
        });

        function updateDashboard() {
            const pendingTasks = tasks.filter(t => !t.completed).length;
            const completedTasks = tasks.filter(t => t.completed).length;
            const totalTasks = tasks.length;
            document.getElementById('total-tasks-count').innerText = pendingTasks;
            document.getElementById('total-resources-count').innerText = resources.length;
            document.getElementById('active-group-count').innerText = groups.length;

            let percentage = 0;
            if (totalTasks > 0) {
                percentage = Math.round((completedTasks / totalTasks) * 100);
            }
            document.getElementById('chart-percent').innerText = percentage + "%";
            document.getElementById('circle-chart').style.background = 
                `conic-gradient(var(--success) ${percentage * 3.6}deg, #eee 0deg)`;

            renderWidgets();
        }

        function renderWidgets() {
            const dashTaskContainer = document.getElementById('dash-task-list');
            const topTasks = tasks.filter(t => !t.completed).slice(0, 5);
            if(topTasks.length === 0) {
                dashTaskContainer.innerHTML = '<p style="color:#aaa; text-align:center; margin-top:20px;">No pending tasks! 🎉</p>';
            } else {
                dashTaskContainer.innerHTML = topTasks.map(t => `
                    <div class="mini-item">
                        <span>${t.desc}</span>
                        <span class="status-tag tag-todo">Due: ${t.date || 'Soon'}</span>
                    </div>`).join('');
            }

            const dashResContainer = document.getElementById('dash-res-list');
            const recentResources = resources.slice(-5).reverse();
            if(recentResources.length === 0) {
                dashResContainer.innerHTML = '<p style="color:#aaa; text-align:center; margin-top:20px;">No resources shared.</p>';
            } else {
                dashResContainer.innerHTML = recentResources.map(r => `
                    <div class="mini-item"><span>${r.title}</span><span class="status-tag tag-res">Link</span></div>`).join('');
            }

            const dashGroupContainer = document.getElementById('dash-group-list');
            dashGroupContainer.innerHTML = groups.map(g => `
                <div class="mini-item">
                    <span>${g.name}</span>
                    <button class="status-tag tag-group" style="border:none; cursor:pointer;" onclick="joinRoom('${g.name}')">Join</button>
                </div>`).join('');
        }

        function openAuthModal() { if(currentUser) return; document.getElementById('auth-modal').style.display = 'block'; }
        function toggleAuthMode() {
            isLoginMode = !isLoginMode;
            const title = document.getElementById('auth-title'); const btn = document.getElementById('auth-action-btn'); const toggle = document.getElementById('auth-toggle-text');
            if(isLoginMode) { title.innerText = "Sign In"; btn.innerText = "Login"; toggle.innerText = "Don't have an account? Sign Up"; } 
            else { title.innerText = "Create Account"; btn.innerText = "Sign Up"; toggle.innerText = "Already have an account? Sign In"; }
        }
        function handleAuth() {
            const userIn = document.getElementById('auth-username').value;
            const passIn = document.getElementById('auth-password').value;
            if(!userIn || !passIn) { alert("Please fill fields"); return; }
            localStorage.setItem('currentUser', userIn); 
            currentUser = userIn;
            alert("Success!"); closeModal('auth-modal'); checkAuthStatus(); location.reload(); 
        }
        function handleLogout() {
            if(confirm("Sign out?")) { localStorage.removeItem('currentUser'); currentUser = null; checkAuthStatus(); location.reload(); }
        }
        function checkAuthStatus() {
            const sidebarBtn = document.getElementById('sidebar-auth-btn');
            const welcomeMsg = document.getElementById('welcome-msg');
            const settingsName = document.getElementById('settings-name');
            const settingsEmail = document.getElementById('settings-email');

            if(currentUser) {
                sidebarBtn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser;
                sidebarBtn.classList.remove('btn-login'); sidebarBtn.style.background = '#e0e0e0'; sidebarBtn.style.color = '#333';
                sidebarBtn.onclick = () => showSection('settings');
                welcomeMsg.innerText = `Welcome back, ${currentUser}!`;
                settingsName.value = currentUser; settingsEmail.value = currentUser.toLowerCase().replace(/\s/g, '') + "@studysync.com";
            } else {
                sidebarBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                sidebarBtn.classList.add('btn-login'); sidebarBtn.onclick = openAuthModal;
                welcomeMsg.innerText = "Welcome, Guest!"; settingsName.value = ""; settingsEmail.value = "";
            }
        }
        function saveSettings() {
            const newName = document.getElementById('settings-name').value;
            if(newName && currentUser) { localStorage.setItem('currentUser', newName); currentUser = newName; checkAuthStatus(); alert("Settings Saved!"); }
            else { alert("Please sign in first."); }
        }

        function renderGroups() {
            document.getElementById('group-list').innerHTML = groups.map(g => `
                <div class="group-card"><div><h3>${g.name}</h3><small>Host: ${g.host} | ${g.members} Members</small></div>
                <button class="join-btn" onclick="joinRoom('${g.name}')">Join</button></div>`).join('');
            updateDashboard();
        }
        function createRoom() {
            if(!currentUser) { alert("Please Sign In."); return; }
            const roomName = prompt("Enter Room Name:");
            if(roomName) { groups.push({ id: Date.now(), name: roomName, host: currentUser, members: 1 }); renderGroups(); }
        }
        function joinRoom(topic) { if(!currentUser) { alert("Please Sign In."); return; } alert(`Joined ${topic} Room!`); }

        function showSection(id) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            document.getElementById(id).classList.add('active-section');
            updateDashboard();
        }
        function openModal(id) { document.getElementById(id).style.display = 'block'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        
        function addResource() {
            const t = document.getElementById('res-title').value;
            const l = document.getElementById('res-link').value;
            if(!t) return;
            resources.push({id: Date.now(), title: t, link: l});
            saveData(); renderResources(); closeModal('resource-modal'); updateDashboard();
        }
        function renderResources() {
            document.getElementById('resource-list').innerHTML = resources.map(r => `
                <div class="resource-card"><h3>${r.title}</h3><p>${r.link}</p>
                <button class="btn-delete" onclick="deleteRes(${r.id})"><i class="fas fa-trash"></i></button></div>`).join('');
        }
        function deleteRes(id) { resources = resources.filter(r => r.id !== id); saveData(); renderResources(); updateDashboard(); }

        function addTask() {
            const d = document.getElementById('task-desc').value;
            if(!d) return;
            tasks.push({id: Date.now(), desc: d, date: document.getElementById('task-date').value, completed: false});
            saveData(); renderTasks(); closeModal('task-modal'); updateDashboard();
        }
        function renderTasks() {
            document.getElementById('task-list').innerHTML = tasks.map(t => `
                <div class="task-item ${t.completed?'completed':''}">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <input type="checkbox" ${t.completed?'checked':''} onchange="toggleTask(${t.id})">
                        <div><h4>${t.desc}</h4><small>${t.date}</small></div>
                    </div>
                    <button class="btn-delete" onclick="delTask(${t.id})"><i class="fas fa-trash"></i></button>
                </div>`).join('');
        }
        function toggleTask(id) { const t = tasks.find(x => x.id === id); t.completed = !t.completed; saveData(); renderTasks(); updateDashboard(); }
        function delTask(id) { tasks = tasks.filter(x => x.id !== id); saveData(); renderTasks(); updateDashboard(); }

        function saveData() {
            localStorage.setItem('studyResources', JSON.stringify(resources));
            localStorage.setItem('studyTasks', JSON.stringify(tasks));
        }