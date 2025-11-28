  // --- CONFIGURATION ---
        const SYSTEM_API_KEY = "AIzaSyB7zcnXtLZOiJ0cq7JF5KAoie1Xg9qUeU4"; 
        const firebaseConfig = { apiKey: "YOUR_API_KEY_HERE" }; // Placeholder
        
        if(firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") { firebase.initializeApp(firebaseConfig); }

        // --- GLOBAL VARIABLES ---
        let resources = [], tasks = [];
        let groups = [{ id: 1, name: "🔥 Physics Marathon", host: "Rahul", members: 5 }, { id: 2, name: "☕ Late Night Coding", host: "Dev", members: 12 }];
        let currentUser = null, currentUserEmail = "", userApiKey = "";
        let userPreferences = { theme: 'light', goal: 4, notifications: false };
        let isLoginMode = true; 
        
        // NEW: Study Data Tracking
        let dailyStudyData = { date: new Date().toLocaleDateString(), seconds: 0 };
        let studyTimer = null;
        let isTimerRunning = false;

        document.addEventListener('DOMContentLoaded', () => {
            const storedUser = localStorage.getItem('currentUser');
            const storedEmail = localStorage.getItem('currentUserEmail');
            if (storedUser) {
                currentUser = storedUser;
                currentUserEmail = storedEmail || "local@user.com";
                loadUserData();
                startStudyTimer(); // Auto start on load if logged in
            }
            checkAuthStatus();
            updateDashboard();
            if(currentUser) { renderResources(); renderTasks(); renderGroups(); }

            // Firebase Listener
            if(typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
                 firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        currentUser = user.displayName;
                        currentUserEmail = user.email;
                        const uid = user.uid;
                        localStorage.setItem('currentUser', currentUser);
                        localStorage.setItem('currentUserEmail', currentUserEmail);
                        localStorage.setItem('currentUid', uid);
                        loadUserData();
                        checkAuthStatus();
                        closeModal('auth-modal');
                        startStudyTimer();
                        renderResources(); renderTasks(); renderGroups(); updateDashboard();
                    }
                });
            }
        });

        /* --- ACCORDION LOGIC --- */
        function toggleAccordion(element) {
            const item = element.parentElement;
            const content = item.querySelector('.accordion-content');
            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = "0";
            }
        }

        /* --- DATA MANAGEMENT --- */
        function loadUserData() {
            if(!currentUser) return;
            const uid = localStorage.getItem('currentUid') || currentUser;
            const resKey = `studyResources_${uid}`, taskKey = `studyTasks_${uid}`, apiKeyKey = `geminiKey_${uid}`, prefsKey = `studyPrefs_${uid}`, studyKey = `studyData_${uid}`;
            
            resources = JSON.parse(localStorage.getItem(resKey)) || [];
            tasks = JSON.parse(localStorage.getItem(taskKey)) || [];
            userApiKey = localStorage.getItem(apiKeyKey) || "";
            userPreferences = JSON.parse(localStorage.getItem(prefsKey)) || { theme: 'light', goal: 4, notifications: false };
            
            // LOAD DAILY STUDY DATA
            const savedStudy = JSON.parse(localStorage.getItem(studyKey));
            const today = new Date().toLocaleDateString();
            if (savedStudy && savedStudy.date === today) {
                dailyStudyData = savedStudy;
                // Migration check: if old format (hours), reset to 0 seconds or convert roughly
                if (typeof dailyStudyData.hours !== 'undefined') {
                    dailyStudyData.seconds = dailyStudyData.hours * 3600;
                    delete dailyStudyData.hours;
                }
            } else {
                dailyStudyData = { date: today, seconds: 0 }; // Reset for new day
            }
            
            applyTheme(userPreferences.theme);

            // Populate Settings Inputs
            const apiInput = document.getElementById('settings-api-key'); if(apiInput) apiInput.value = userApiKey;
            const themeInput = document.getElementById('settings-theme'); if(themeInput) themeInput.value = userPreferences.theme;
            const goalInput = document.getElementById('settings-goal'); if(goalInput) goalInput.value = userPreferences.goal;
            const notifInput = document.getElementById('settings-notifications'); if(notifInput) notifInput.checked = userPreferences.notifications;
        }

        function saveData() {
            if(!currentUser) return;
            const uid = localStorage.getItem('currentUid') || currentUser;
            localStorage.setItem(`studyResources_${uid}`, JSON.stringify(resources));
            localStorage.setItem(`studyTasks_${uid}`, JSON.stringify(tasks));
            localStorage.setItem(`geminiKey_${uid}`, userApiKey);
            localStorage.setItem(`studyPrefs_${uid}`, JSON.stringify(userPreferences));
            localStorage.setItem(`studyData_${uid}`, JSON.stringify(dailyStudyData)); // Save progress
        }
        
        function clearAllData() {
            if(confirm("Are you sure? This will delete ALL resources and tasks for this account. This cannot be undone.")) {
                resources = []; tasks = [];
                dailyStudyData = { date: new Date().toLocaleDateString(), seconds: 0 };
                saveData(); renderResources(); renderTasks(); updateDashboard();
                alert("All data cleared.");
            }
        }
        
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }

        function saveSettings() {
            const newName = document.getElementById('settings-name').value;
            const newKey = document.getElementById('settings-api-key').value.trim();
            const newTheme = document.getElementById('settings-theme').value;
            const newGoal = document.getElementById('settings-goal').value;
            const newNotif = document.getElementById('settings-notifications').checked;

            if(!currentUser) {
                alert("You must be logged in to save settings.");
                return;
            }

            if(newName) {
                const uid = localStorage.getItem('currentUid') || currentUser;
                currentUser = newName;
                userApiKey = newKey; 
                userPreferences = { theme: newTheme, goal: parseInt(newGoal), notifications: newNotif };
                
                applyTheme(newTheme);
                localStorage.setItem('currentUser', currentUser);
                saveData(); // Save everything
                checkAuthStatus(); 
                updateDashboard(); // Reflect Goal Changes on Dash
                alert("Settings Saved Successfully!"); 
            }
        }

        /* --- DASHBOARD TIMER LOGIC (NEW) --- */
        function startStudyTimer() {
            if (isTimerRunning) return;
            isTimerRunning = true;
            document.getElementById('timer-status').innerText = "Studying...";
            document.getElementById('timer-status').style.color = "var(--success)";
            document.getElementById('btn-toggle-timer').innerHTML = '<i class="fas fa-pause"></i>';
            
            studyTimer = setInterval(() => {
                dailyStudyData.seconds++;
                updateDashboard(); // Update UI
                
                // Check 30m Achievement
                if (dailyStudyData.seconds > 0 && dailyStudyData.seconds % 1800 === 0) {
                    openModal('achievement-modal');
                }
                
                // Save occasionally (every minute)
                if (dailyStudyData.seconds % 60 === 0) {
                    saveData();
                }
            }, 1000);
        }

        function stopStudyTimer() {
            if (!isTimerRunning) return;
            isTimerRunning = false;
            clearInterval(studyTimer);
            document.getElementById('timer-status').innerText = "Paused";
            document.getElementById('timer-status').style.color = "var(--warning)";
            document.getElementById('btn-toggle-timer').innerHTML = '<i class="fas fa-play"></i>';
            saveData(); // Save on pause
        }

        function toggleTimer() {
            if (isTimerRunning) stopStudyTimer();
            else startStudyTimer();
        }

        /* --- AUTH & HELPERS --- */
        function handleAuth() {
            const userIn = document.getElementById('auth-username').value;
            const passIn = document.getElementById('auth-password').value;
            if(!userIn || !passIn) { alert("Please fill fields"); return; }
            currentUser = userIn;
            currentUserEmail = userIn.toLowerCase().replace(/\s/g,'') + "@studysync.com";
            localStorage.setItem('currentUser', currentUser);
            localStorage.setItem('currentUserEmail', currentUserEmail);
            localStorage.removeItem('currentUid');
            loadUserData();
            closeModal('auth-modal'); checkAuthStatus();
            startStudyTimer();
            renderResources(); renderTasks(); renderGroups(); updateDashboard();
        }

        function handleLogout() {
            if(confirm("Sign out?")) { 
                stopStudyTimer();
                if(typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") firebase.auth().signOut();
                localStorage.removeItem('currentUser'); localStorage.removeItem('currentUserEmail'); localStorage.removeItem('currentUid');
                currentUser = null; userApiKey = ""; userPreferences = { theme: 'light', goal: 4, notifications: false };
                applyTheme('light');
                resources = []; tasks = []; 
                document.getElementById('resource-list').innerHTML = ""; document.getElementById('task-list').innerHTML = "";
                document.getElementById('dash-task-list').innerHTML = ""; document.getElementById('dash-res-list').innerHTML = "";
                document.getElementById('goal-tracker-widget').style.display = 'none'; // Hide Goal Widget
                checkAuthStatus(); updateDashboard(); 
                location.reload();
            }
        }
        
        function checkAuthStatus() {
            const btn = document.getElementById('sidebar-auth-btn');
            const msg = document.getElementById('welcome-msg');
            const sName = document.getElementById('settings-name');
            const sEmail = document.getElementById('settings-email');
            if(currentUser) {
                btn.innerHTML = '<i class="fas fa-user"></i> ' + currentUser;
                btn.classList.remove('btn-login'); btn.onclick = () => showSection('settings');
                msg.innerText = `Welcome back, ${currentUser}!`;
                sName.value = currentUser; sEmail.value = currentUserEmail;
            } else {
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                btn.classList.add('btn-login'); btn.onclick = openAuthModal;
                msg.innerText = "Welcome, Guest!";
                sName.value = ""; sEmail.value = "";
            }
        }

        /* --- BASIC UI LOGIC --- */
        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); document.querySelector('.sidebar-overlay').classList.toggle('active'); }
        
        function openModal(id) {
            if (id === 'auth-modal') {
                document.getElementById(id).style.display = 'block';
                return;
            }
            if (!currentUser) {
                alert("Please Sign In first.");
                document.getElementById('auth-modal').style.display = 'block';
            } else {
                document.getElementById(id).style.display = 'block';
            }
        }

        function openAuthModal() { 
            if(!currentUser) document.getElementById('auth-modal').style.display = 'block'; 
        }

        function closeModal(id) { document.getElementById(id).style.display = 'none'; }
        function toggleAuthMode() {
            isLoginMode = !isLoginMode;
            document.getElementById('auth-title').innerText = isLoginMode ? "Sign In" : "Create Account";
            document.getElementById('auth-action-btn').innerText = isLoginMode ? "Login" : "Sign Up";
        }
        function showSection(id) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            document.getElementById(id).classList.add('active-section');
            if(window.innerWidth <= 768) toggleSidebar();
            updateDashboard();
        }
        
        /* --- RESOURCES & TASKS --- */
        function openResourceHelper(id) {
            const res = resources.find(r => r.id === id); if(!res) return;
            if(res.type === 'link') window.open(res.link, '_blank');
            else {
                const viewerBody = document.getElementById('viewer-body');
                document.getElementById('viewer-title').innerText = "Preview: " + res.title;
                viewerBody.innerHTML = ''; viewerBody.style.cssText = "flex: 1; display: flex; justify-content: center; align-items: center; background: #333; height: 100%; overflow: hidden;";
                if(res.type === 'image') viewerBody.innerHTML = `<img src="${res.link}" style="max-width: 90%; max-height: 90%; display: block; margin: auto;">`;
                else if (res.type === 'pdf') viewerBody.innerHTML = `<iframe src="${res.link}" style="width:100%; height:100%; border:none;"></iframe>`;
                else viewerBody.innerHTML = `<p style="color:white;">Cannot preview. <a href="${res.link}" download>Download</a></p>`;
                openModal('viewer-modal');
            }
        }
        function toggleResourceInput() {
            const type = document.getElementById('res-type').value;
            document.getElementById('input-url-container').style.display = (type === 'link') ? 'block' : 'none';
            document.getElementById('input-file-container').style.display = (type !== 'link') ? 'block' : 'none';
        }
        function processAndAddResource() {
            const title = document.getElementById('res-title').value;
            const type = document.getElementById('res-type').value;
            if(!title) { alert("Title required"); return; }
            if(type === 'link') saveRes(title, document.getElementById('res-link').value, type);
            else {
                const file = document.getElementById('res-file-upload').files[0];
                if(!file || file.size > 3000000) { alert("Invalid/Large File"); return; }
                const reader = new FileReader(); reader.onload = e => saveRes(title, e.target.result, type); reader.readAsDataURL(file);
            }
        }
        function saveRes(title, link, type) { try { resources.push({id: Date.now(), title, link, type}); saveData(); renderResources(); closeModal('resource-modal'); updateDashboard(); document.getElementById('res-title').value = ''; } catch(e) { alert("Storage full"); } }
        function renderResources() { document.getElementById('resource-list').innerHTML = resources.map(r => `<div class="resource-card"><h3><i class="fas ${r.type==='link'?'fa-link':'fa-file'}"></i> ${r.title}</h3><button class="resource-link-btn" onclick="openResourceHelper(${r.id})">View</button><button class="btn-delete" style="position:absolute;bottom:20px;right:20px;" onclick="delRes(${r.id})"><i class="fas fa-trash"></i></button></div>`).join(''); }
        function delRes(id) { resources = resources.filter(r => r.id !== id); saveData(); renderResources(); updateDashboard(); }
        function addTask() { const d = document.getElementById('task-desc').value; if(d) { tasks.push({id:Date.now(), desc:d, date: document.getElementById('task-date').value, completed:false}); saveData(); renderTasks(); closeModal('task-modal'); updateDashboard(); } }
        function renderTasks() { document.getElementById('task-list').innerHTML = tasks.map(t => `<div class="task-item ${t.completed?'completed':''}"><div style="display:flex;gap:10px;align-items:center"><input type="checkbox" ${t.completed?'checked':''} onchange="toggleTask(${t.id})"><div><h4>${t.desc}</h4><small>${t.date}</small></div></div><button class="btn-delete" onclick="delTask(${t.id})"><i class="fas fa-trash"></i></button></div>`).join(''); }
        function toggleTask(id) { const t = tasks.find(x => x.id === id); t.completed = !t.completed; saveData(); renderTasks(); updateDashboard(); }
        function delTask(id) { tasks = tasks.filter(x => x.id !== id); saveData(); renderTasks(); updateDashboard(); }
        
        // --- RESTORED FUNCTIONS ---
        function renderGroups() {
            const list = document.getElementById('group-list');
            if(!list) return;
            list.innerHTML = groups.map(g => `
                <div class="group-card">
                    <div>
                        <h3>${g.name}</h3>
                        <small style="color:var(--text-muted)">Host: ${g.host} | ${g.members} Members</small>
                    </div>
                    <button class="join-btn" onclick="joinRoom('${g.name}')">Join</button>
                </div>`).join('');
        }

        function createRoom() {
            if(!currentUser) { alert("Please Sign In first."); return; }
            const name = prompt("Enter Room Name:");
            if(name) {
                groups.push({ id: Date.now(), name: name, host: currentUser, members: 1 });
                renderGroups();
                updateDashboard();
            }
        }
        
        /* --- EXTRAS --- */
        function startGoogleMeet() { window.open('https://meet.google.com/new', '_blank'); }
        function joinGoogleMeet() { const code = document.getElementById('meet-code-input').value.trim(); window.open(`https://meet.google.com/${code || ''}`, '_blank'); }
        function handleEnter(e) { if(e.key === 'Enter') sendChatMessage(); }
        async function sendChatMessage() {
            if(!currentUser) { alert("Please Sign In first."); return; }
            const input = document.getElementById('chat-input'); const message = input.value.trim(); if(!message) return;
            const finalKey = userApiKey || SYSTEM_API_KEY;
            if(!finalKey) { appendMessage("System", "Missing API Key"); showSection('settings'); return; }
            appendMessage("User", message); input.value = ""; const loadingId = appendMessage("Bot", "Thinking...", true);
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${finalKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] }) });
                const data = await response.json(); document.getElementById(loadingId).remove();
                if (data.error) appendMessage("Bot", "Error: " + data.error.message); else appendMessage("Bot", data.candidates[0].content.parts[0].text);
            } catch (error) { document.getElementById(loadingId).remove(); appendMessage("Bot", "Network Error."); }
        }
        function appendMessage(sender, text, isLoading = false) {
            const chatBox = document.getElementById('chat-box'); const div = document.createElement('div'); div.id = "msg-" + Date.now();
            div.classList.add('chat-message', sender === 'User' ? 'user-message' : 'bot-message');
            if(sender === 'Bot') text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
            div.innerHTML = text; chatBox.appendChild(div); chatBox.scrollTop = chatBox.scrollHeight; return div.id;
        }
        function updateDashboard() {
            if(!currentUser) {
                document.getElementById('total-tasks-count').innerText = 0; document.getElementById('total-resources-count').innerText = 0; document.getElementById('active-group-count').innerText = 0;
                document.getElementById('chart-percent').innerText = "0%"; document.getElementById('circle-chart').style.background = `conic-gradient(var(--success) 0deg, var(--light) 0deg)`;
                const msg = '<p style="color:var(--text-muted); text-align:center; padding:20px;">Please Sign In</p>';
                ['dash-task-list', 'dash-res-list', 'dash-group-list'].forEach(id => document.getElementById(id).innerHTML = msg);
                document.getElementById('goal-tracker-widget').style.display = 'none'; // Hide Goal Widget if Logout
                return;
            }
            const pending = tasks.filter(t => !t.completed).length;
            const completed = tasks.filter(t => t.completed).length;
            document.getElementById('total-tasks-count').innerText = pending; document.getElementById('total-resources-count').innerText = resources.length; document.getElementById('active-group-count').innerText = groups.length;
            let pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
            document.getElementById('chart-percent').innerText = pct + "%"; document.getElementById('circle-chart').style.background = `conic-gradient(var(--success) ${pct * 3.6}deg, var(--light) 0deg)`;
            
            // UPDATE GOAL WIDGET
            const goalWidget = document.getElementById('goal-tracker-widget');
            goalWidget.style.display = 'flex';
            document.getElementById('dash-goal-text').innerText = userPreferences.goal;
            
            // Format Seconds to HH:MM:SS
            const h = Math.floor(dailyStudyData.seconds / 3600);
            const m = Math.floor((dailyStudyData.seconds % 3600) / 60);
            const s = dailyStudyData.seconds % 60;
            document.getElementById('dash-timer-display').innerText = `${h}h ${m}m ${s}s`;
            
            // Calculate progress based on Goal Hours (converted to seconds)
            const goalSeconds = userPreferences.goal * 3600;
            let progressPct = (dailyStudyData.seconds / goalSeconds) * 100;
            if(progressPct > 100) progressPct = 100;
            document.getElementById('dash-progress-fill').style.width = progressPct + "%";

            renderWidgets();
        }
        function renderWidgets() {
            const dashTask = document.getElementById('dash-task-list'); const topTasks = tasks.filter(t => !t.completed).slice(0, 5);
            dashTask.innerHTML = topTasks.length ? topTasks.map(t => `<div class="mini-item"><span>${t.desc}</span><span class="status-tag tag-todo">Due: ${t.date}</span></div>`).join('') : '<p style="text-align:center; color:var(--text-muted);">No pending tasks.</p>';
            const dashRes = document.getElementById('dash-res-list'); const recentRes = resources.slice(-5).reverse();
            dashRes.innerHTML = recentRes.length ? recentRes.map(r => `<div class="mini-item"><span>${r.title}</span><button class="status-tag tag-res" style="border:none; cursor:pointer;" onclick="openResourceHelper(${r.id})">Open</button></div>`).join('') : '<p style="text-align:center; color:var(--text-muted);">No resources.</p>';
            const dashGroup = document.getElementById('dash-group-list');
            dashGroup.innerHTML = groups.map(g => `<div class="mini-item"><span>${g.name}</span><button class="status-tag tag-group" style="border:none; cursor:pointer;" onclick="joinRoom('${g.name}')">Join</button></div>`).join('');
        }