/* ==========================================================================
   StudySnap AI - Main App Shell & Router Orchestrator
   ========================================================================== */

const app = {
    currentTab: 'dashboard',
    studyMode: studySnapUtils.safeStorage.getItem('studysnap_mode', 'standard'),
    theme: studySnapUtils.safeStorage.getItem('studysnap_theme', 'dark'),
    userId: 'guest',

    init() {
        console.log("StudySnap AI: Initializing App Shell...");
        this._checkPro();

        // Auto-configure API keys from provided values
        if (!studySnapUtils.safeStorage.getItem('studysnap_tavily_key')) {
            aiEngine.setTavilyKey('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');
        }
        if (!studySnapUtils.safeStorage.getItem('studysnap_firecrawl_key')) {
            aiEngine.setFirecrawlKey('fc-4a6d551ae971424e91466258a3e6c506');
        }
        if (!studySnapUtils.safeStorage.getItem('studysnap_gemini_key')) {
            aiEngine.setGeminiKey('AQ.Ab8RN6Kwba1XP0dZEgYFqxVyVotNcoWVSektaoEiUAJ5MXvp1w');
        }

        // Initialize Firebase Auth state listener
        try {
            auth.onAuthStateChanged((user) => {
                this.userId = user ? user.uid : 'guest';
                // Update profile name
                var nameEl = document.getElementById('profile-name');
                if (user) {
                    var displayName = user.displayName || user.email.split('@')[0];
                    if (nameEl) nameEl.textContent = displayName;
                    this._updateProCrown(user);
                    // On first login, write initial data if none exists
                    database.ref('users/' + user.uid).once('value').then((snap) => {
                        var val = snap.val();
                        if (!val) {
                            database.ref('users/' + user.uid).set({
                                xp: gamification.xp,
                                level: gamification.level,
                                coins: gamification.coins,
                                streak: gamification.streak,
                                badges: gamification.badges,
                                ownedThemes: gamification.ownedThemes,
                                ownedAvatars: gamification.ownedAvatars,
                                activeBoosters: gamification.activeBoosters,
                                activeAvatar: gamification.activeAvatar
                            });
                            this._updateProCrown(user);
                        } else {
                            gamification.loadFromFirebase();
                            if (val.isPro) {
                                this.isPro = true;
                                studySnapUtils.safeStorage.setItem('studysnap_pro', 'true');
                            }
                            this._updateProCrown(user);
                        }
                    });
                } else {
                    if (nameEl) nameEl.textContent = 'Guest Scholar';
                    if (typeof gamification !== 'undefined') gamification.loadShopState();
                }
            });
        } catch(e) {
            console.error('Auth init error:', e);
        }

        // Splash screen auto-dismiss after 3.2s
        this.initSplash();

        // Start sub-modules
        setTimeout(() => {
            gamification.init();
            homework.init();
            flashcards.init();
            quizzes.init();
            essay.init();

            // Sync custom study modes and dark themes
            this.setStudyMode(this.studyMode, false);
            this.setTheme(this.theme);
        }, 100);

        // Dynamic daily reminder check
        setTimeout(() => {
            this.scheduleDailyReminder();
            console.log("StudySnap AI: Ready for active recall testing.");
        }, 1000);
    },

    initSplash() {
        const splash = document.getElementById('splash-screen');
        if (!splash) return;
        const progressText = document.getElementById('splash-loading-text');

        // Exploding typography on the title
        setTimeout(() => {
            const title = splash.querySelector('.splash-title');
            if (title) studySnapUtils.explodeText(title, {
                scatterRadius: 220,
                duration: 700,
                stagger: 40,
                particles: 20,
                particleColor: '#ffd700'
            });
        }, 200);

        const messages = [
            'Loading your study space...',
            'Warming up the brain...',
            'Preparing your tools...',
            'Almost ready...'
        ];
        // Cycle loading text
        messages.forEach((msg, i) => {
            setTimeout(() => {
                if (progressText) progressText.textContent = msg;
            }, (i + 1) * 700);
        });
        // Fade out splash after 3.2s
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
                // Show onboarding if first launch
                if (!studySnapUtils.safeStorage.getItem('studysnap_onboarding')) {
                    this.initOnboarding();
                }
            }, 600);
        }, 3200);
    },

    initOnboarding() {
        const overlay = document.getElementById('onboarding-overlay');
        if (!overlay) return;
        const slides = overlay.querySelectorAll('.onboarding-slide');
        const dots = overlay.querySelectorAll('.onboard-dot');
        const nextBtn = document.getElementById('onboarding-next');
        const skipBtn = document.getElementById('onboarding-skip');
        let currentSlide = 0;
        const totalSlides = slides.length;

        overlay.classList.add('show');

        const goToSlide = (index) => {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
            nextBtn.textContent = index === totalSlides - 1 ? 'Get Started 🎉' : 'Next →';
        };

        nextBtn.addEventListener('click', () => {
            if (currentSlide === totalSlides - 1) {
                this.completeOnboarding(overlay);
            } else {
                goToSlide(currentSlide + 1);
            }
        });

        skipBtn.addEventListener('click', () => {
            this.completeOnboarding(overlay);
        });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => goToSlide(i));
        });
    },

    completeOnboarding(overlay) {
        studySnapUtils.safeStorage.setItem('studysnap_onboarding', 'true');
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 400);
        if (typeof gamification !== 'undefined') gamification.syncToFirebase();
    },

    /* --- SPA SCREEN ROUTING --- */
    changeTab(tabId) {
        if (this.currentTab === tabId) return;

        // Toggle Screen elements
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) activeScreen.classList.remove('active');

        const nextScreen = document.getElementById(`screen-${tabId}`);
        if (nextScreen) nextScreen.classList.add('active');

        // Toggle Navigation Bar items
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) activeNav.classList.remove('active');

        const nextNav = document.getElementById(`nav-${tabId}`);
        if (nextNav) nextNav.classList.add('active');

        this.currentTab = tabId;
        if (typeof gamification !== 'undefined') {
            gamification.syncToFirebase();
            gamification.updateUI();
        }
        if (tabId === 'essay') essay.init();
        
        // Refresh sub-elements if required
        if (tabId === 'homework') {
            document.getElementById('chat-messages-container').scrollTop = document.getElementById('chat-messages-container').scrollHeight;
        }
    },

    /* --- DYNAMIC SYLLABUS STUDY MODES --- */
    setStudyMode(mode, alertUser = true) {
        this.studyMode = mode;
        if (typeof gamification !== 'undefined') gamification.syncToFirebase();

        // Reset and cycle body classes
        document.body.classList.remove('cbse-mode', 'jee-mode');

        const stdBtn = document.getElementById('mode-std');
        const cbseBtn = document.getElementById('mode-cbse');
        const jeeBtn = document.getElementById('mode-jee');
        
        stdBtn.classList.remove('active');
        cbseBtn.classList.remove('active');
        jeeBtn.classList.remove('active');

        const boardHelper = document.getElementById('board-helper-block');

        if (mode === 'cbse') {
            document.body.classList.add('cbse-mode');
            cbseBtn.classList.add('active');
            if (boardHelper) boardHelper.style.display = 'block';
            if (alertUser) gamification.addXP(10, cbseBtn);
        } else if (mode === 'jee') {
            document.body.classList.add('jee-mode');
            jeeBtn.classList.add('active');
            if (boardHelper) boardHelper.style.display = 'block';
            if (alertUser) gamification.addXP(15, jeeBtn);
        } else {
            stdBtn.classList.add('active');
            if (boardHelper) boardHelper.style.display = 'none';
        }
    },

    /* --- THEME TOGGLES --- */
    setTheme(theme) {
        this.theme = theme;
        if (typeof gamification !== 'undefined') gamification.syncToFirebase();
        
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    },

    /* --- DRAWER MODALS CONTROL --- */
    openSettings() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        
        const currentUser = auth.currentUser;
        content.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-gears" style="color:var(--accent-violet)"></i> System Settings</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            
            <div class="settings-group-box" style="border:1px solid var(--accent-violet);">
                <h4 style="font-size:12.5px;">👤 ${currentUser ? 'Account: ' + currentUser.email : 'Sign In to Save Progress'}</h4>
                <p style="font-size:10px; color:var(--text-secondary);">${currentUser ? 'Your coins, XP & progress are synced to the cloud.' : 'Create an account to sync your study data across devices.'}</p>
                ${currentUser
                    ? `<button class="primary-btn" onclick="app.logout(true)" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start; background:#ff6b6b;">Sign Out</button>`
                    : `<button class="primary-btn" onclick="app.closeModal();setTimeout(()=>app.showAuthModal(),100)" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start;">Sign In / Create Account</button>`
                }
            </div>

            <div class="settings-group-box">
                <h4 style="font-size:12.5px;">🧠 Gemini AI API Key</h4>
                <p style="font-size:10px; color:var(--text-secondary);">Primary LLM for RAG — generates answers using web context. Free at makersuite.google.com.</p>
                <input class="settings-input" type="password" id="settings-gemini-input" placeholder="Enter Gemini API Key..." value="${aiEngine.geminiKey}">
                <button class="primary-btn" onclick="app.saveGeminiKey()" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start;">Save Key</button>
            </div>

            <div class="settings-group-box">
                <h4 style="font-size:12.5px;">🔍 Web Search (Tavily) API Key</h4>
                <p style="font-size:10px; color:var(--text-secondary);">Provides context for Gemini answers. Get a free key at tavily.com.</p>
                <input class="settings-input" type="password" id="settings-tavily-input" placeholder="Enter Tavily API Key..." value="${aiEngine.tavilyKey}">
                <button class="primary-btn" onclick="app.saveTavilyKey()" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start;">Save Key</button>
            </div>

            <div class="settings-group-box">
                <h4 style="font-size:12.5px;">🔥 FireCrawl API Key</h4>
                <p style="font-size:10px; color:var(--text-secondary);">Secondary context source when Tavily has no answer. Free at firecrawl.dev.</p>
                <input class="settings-input" type="password" id="settings-fc-input" placeholder="Enter FireCrawl API Key..." value="${aiEngine.firecrawlKey}">
                <button class="primary-btn" onclick="app.saveFirecrawlKey()" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start;">Save Key</button>
            </div>

            <div class="settings-group-box">
                <h4 style="font-size:12.5px;">🧠 Gemini AI API Key</h4>
                <p style="font-size:10px; color:var(--text-secondary);">Primary LLM for RAG — generates answers using web context. Free at makersuite.google.com. Overrides Tavily/FireCrawl.</p>
                <input class="settings-input" type="password" id="settings-gemini-input" placeholder="Enter Gemini API Key..." value="${aiEngine.geminiKey}">
                <button class="primary-btn" onclick="app.saveGeminiKey()" style="padding:6px 12px; font-size:11px; width:auto; align-self:flex-start;">Save Key</button>
            </div>

            <div class="settings-group-box" style="font-size:13px;">
                <div class="settings-row">
                    <span>💡 Light Theme UI</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="theme-toggle-chk" ${this.theme === 'light' ? 'checked' : ''} onchange="app.toggleTheme()">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div class="settings-group-box" style="font-size:13px;">
                <div class="settings-row">
                    <span>🔔 Study Reminders</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="notif-toggle-chk" ${this.notificationsEnabled ? 'checked' : ''} onchange="app.toggleNotifications()">
                        <span class="slider"></span>
                    </label>
                </div>
                <p style="font-size:10px; color:var(--text-secondary); margin-top:4px;">Get reminded at 8 AM, 2 PM, and 8 PM to study.</p>
            </div>

            <div class="settings-group-box" style="font-size:12px;">
                <h4 style="font-size:12.5px;">🎓 About StudySnap AI</h4>
                <p style="color:var(--text-secondary); margin-top:4px;">Built with high-fidelity gamification for board exam revisions in India. Includes spaced repetition counters and timed test engines.</p>
            </div>
        `;
        modal.style.display = 'flex';
    },

    saveApiKey() {
        const key = document.getElementById('settings-key-input').value.trim();
        aiEngine.setApiKey(key);
        alert(key ? "API Key loaded! Sandbox mode disabled." : "API Key cleared. Sandbox mode active.");
        this.closeModal();
    },

    saveTavilyKey() {
        const key = document.getElementById('settings-tavily-input').value.trim();
        aiEngine.setTavilyKey(key);
        alert(key ? "Tavily API Key loaded! Web search enabled for answers." : "Tavily key cleared.");
        this.closeModal();
    },

    saveFirecrawlKey() {
        const key = document.getElementById('settings-fc-input').value.trim();
        aiEngine.setFirecrawlKey(key);
        alert(key ? "FireCrawl API Key loaded! Web scrape enabled." : "FireCrawl key cleared.");
        this.closeModal();
    },

    saveGeminiKey() {
        const key = document.getElementById('settings-gemini-input').value.trim();
        aiEngine.setGeminiKey(key);
        alert(key ? "Gemini API Key loaded! AI answers enabled." : "Gemini key cleared.");
        this.closeModal();
    },

    toggleTheme() {
        const chk = document.getElementById('theme-toggle-chk');
        this.setTheme(chk.checked ? 'light' : 'dark');
    },

    closeModal() {
        document.getElementById('global-modal').style.display = 'none';
        
        // Reset Panic Mode styling variables if modal closes
        if (document.body.classList.contains('panic-mode')) {
            document.body.classList.remove('panic-mode');
        }
    },

    /* --- NCERT EXPLORER (India specific) --- */
    openNCERTExplorer() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        
        content.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-graduation-cap" style="color:var(--accent-violet)"></i> CBSE NCERT Database</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            
            <div class="settings-group-box" style="font-size:12px; display:flex; flex-direction:column; gap:8px;">
                <div>
                    <label style="font-weight:700;">Select Class:</label>
                    <select class="settings-input" id="ncert-class-select" style="margin-top:4px;">
                        <option value="10">Class 10 (Secondary)</option>
                        <option value="12">Class 12 (Higher Secondary)</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700;">Select Subject:</label>
                    <select class="settings-input" id="ncert-subj-select" style="margin-top:4px;" onchange="app.updateNcertChapters()">
                        <option value="science">Science / Physics</option>
                        <option value="math">Mathematics</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight:700;">Select Chapter:</label>
                    <select class="settings-input" id="ncert-chap-select" style="margin-top:4px;">
                        <option value="photo">Photosynthesis Processes</option>
                        <option value="chem">Chemical Reactions & Oxides</option>
                    </select>
                </div>
                <button class="primary-btn" onclick="app.loadNCERTAnswer()" style="margin-top:6px;">View CBSE Solution</button>
            </div>
            
            <div id="ncert-solution-card" style="display:none; font-size:12px; max-height:200px; overflow-y:auto;">
                <!-- Solution details injected dynamically -->
            </div>
        `;
        modal.style.display = 'flex';
    },

    updateNcertChapters() {
        const subj = document.getElementById('ncert-subj-select').value;
        const chap = document.getElementById('ncert-chap-select');
        chap.innerHTML = '';

        if (subj === 'science') {
            chap.innerHTML = `
                <option value="photo">Photosynthesis Processes</option>
                <option value="chem">Chemical Reactions & Oxides</option>
            `;
        } else {
            chap.innerHTML = `
                <option value="quad">Quadratic Roots Formula</option>
                <option value="trig">Trigonometric Identities</option>
            `;
        }
    },

    loadNCERTAnswer() {
        const chap = document.getElementById('ncert-chap-select').value;
        const card = document.getElementById('ncert-solution-card');
        
        let text = "";
        if (chap === 'photo') {
            text = `<h4>Q: Explain light-dependent photolysis of water in plant photosynthesis.</h4>
                    <p style="margin-top:6px; color:var(--text-secondary);"><strong>CBSE Answer Guide (3 Marks):</strong> Photolysis is the process of splitting water molecules into Hydrogen ions, electrons, and Oxygen under the influence of light photons absorbed by Chlorophyll a pigments inside chloroplast thylakoids.</p>
                    <p style="color:var(--accent-green); font-weight:700; font-size:10px; margin-top:6px;"><i class="fa-solid fa-award"></i> Weightage: Section B - Highly Popular Question!</p>`;
        } else if (chap === 'chem') {
            text = `<h4>Q: What color change is observed when iron nails are placed in copper sulfate solution?</h4>
                    <p style="margin-top:6px; color:var(--text-secondary);"><strong>CBSE Answer Guide (3 Marks):</strong> The blue color of copper sulfate fades to light green due to the formation of ferrous sulfate. The iron displaces copper from copper sulfate because iron is more reactive. Fe + CuSO₄ ➔ FeSO₄ + Cu.</p>
                    <p style="color:var(--accent-green); font-weight:700; font-size:10px; margin-top:6px;"><i class="fa-solid fa-award"></i> Weightage: 3 Marks - Diagram identification PYQ.</p>`;
        } else if (chap === 'quad') {
            text = `<h4>Q: Formulate and solve roots of x² - 5x + 6 = 0 using the quadratic discriminant.</h4>
                    <p style="margin-top:6px; color:var(--text-secondary);"><strong>CBSE Answer Guide (2 Marks):</strong> a=1, b=-5, c=6. Discriminant D = b² - 4ac = (-5)² - 4(1)(6) = 25 - 24 = 1. Since D > 0, real roots exist. x = (5 ± √1)/2. Roots are x=3 and x=2.</p>
                    <p style="color:var(--accent-green); font-weight:700; font-size:10px; margin-top:6px;"><i class="fa-solid fa-award"></i> Weightage: Section A - Nature of roots PYQ.</p>`;
        } else {
            text = `<h4>Q: Prove that sin²θ + cos²θ = 1.</h4>
                    <p style="margin-top:6px; color:var(--text-secondary);"><strong>CBSE Answer Guide (5 Marks):</strong> In a right triangle ABC, sinθ = Opp/Hyp, cosθ = Adj/Hyp. sin²θ + cos²θ = Opp²/Hyp² + Adj²/Hyp² = (Opp² + Adj²)/Hyp². By Pythagoras Theorem, Opp² + Adj² = Hyp². Hence, Hyp²/Hyp² = 1.</p>
                    <p style="color:var(--accent-green); font-weight:700; font-size:10px; margin-top:6px;"><i class="fa-solid fa-award"></i> Weightage: Section D - Long Answer Proof.</p>`;
        }

        card.innerHTML = `<div class="settings-group-box" style="margin-top:12px;">${text}</div>`;
        card.style.display = 'block';

        gamification.addXP(20, card);
    },

    /* --- 6. 10 PM EXAM PANIC MODE --- */
    openPanicMode() {
        document.body.classList.add('panic-mode');
        
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        
        content.innerHTML = `
            <div style="text-align:center; padding:10px; display:flex; flex-direction:column; gap:12px; align-items:center;">
                <span style="font-size:48px;">🚨</span>
                <h3 style="font-size:18px; font-family:var(--font-heading); color:#ff6b6b;">10 PM Exam Panic Mode</h3>
                <p style="font-size:11.5px; opacity:0.9;">Soft, calming indigo layout activated. Here is your high-yield cheat sheet revision list for tomorrow's Board Exam:</p>
                
                <div class="settings-group-box" style="text-align:left; font-size:12px; width:100%; max-height:220px; overflow-y:auto; border-left:3.5px solid #ff6b6b;">
                    <h5 style="color:#ff6b6b; font-size:12px; margin-bottom:4px;">📐 Math Core Formulas</h5>
                    <p>• Quadratic roots: x = [-b ± √(b²-4ac)] / 2a<br>• Trig: sin²θ + cos²θ = 1<br>• Trig complementary: sin(90-θ) = cosθ</p>
                    
                    <h5 style="color:#ff6b6b; font-size:12px; margin-top:8px; margin-bottom:4px;">🔬 Science Cheat Codes</h5>
                    <p>• Photosynthesis Eq: 6CO₂ + 6H₂O ➔ C₆H₁₂O₆ + 6O₂<br>• Redox: Oil Rig (Oxidation Is Loss, Reduction Is Gain)<br>• Ohm's Law: V = I * R</p>
                </div>

                <div style="font-size:10px; opacity:0.8; font-style:italic;">
                    "Take a deep breath. You have practiced, solved quizzes, and built streaks. You are fully prepared for this."
                </div>

                <button class="primary-btn" onclick="app.closeModal()" style="background:#ff6b6b; border:none; box-shadow:none; margin-top:10px;">Calm Down & Sleep</button>
            </div>
        `;
        modal.style.display = 'flex';
        
        gamification.unlockBadge('panic_saved');
    },

    showStreakDetails() {
        alert(`Study Streak: ${gamification.streak} Days!\nKeep revising daily to unlock multipliers!`);
    },

    openCoinsShop() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        gamification.renderShop(content);
        modal.style.display = 'flex';
    },

    /* Apply custom shop themes by overriding CSS variables */
    applyCustomTheme(themeId) {
        document.body.classList.remove('theme-sepia', 'theme-midnight', 'theme-forest', 'theme-sunset');
        if (themeId === 'dark') {
            document.body.classList.remove('light-theme');
        } else if (themeId === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('theme-' + themeId);
        }
        this.theme = themeId;
        if (typeof gamification !== 'undefined') gamification.syncToFirebase();
    },

    loadUserData() {
        if (this.userId !== 'guest' && typeof gamification !== 'undefined') {
            gamification.loadFromFirebase();
        }
    },

    /* --- AUTHENTICATION --- */
    showAuthModal() {
        try {
            const modal = document.getElementById('global-modal');
            const content = document.getElementById('modal-content-area');
            if (!modal || !content) return;
            var currentUser = null;
            try { currentUser = auth ? auth.currentUser : null; } catch(e) {}
            
            content.innerHTML = `
                <div class="modal-header">
                    <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-user" style="color:var(--accent-violet)"></i> Account</h3>
                    <span class="modal-close" onclick="app.closeModal()">&times;</span>
                </div>
                <div class="settings-group-box" style="text-align:center;">
                    <span style="font-size:48px">${currentUser ? '👤' : '🔒'}</span>
                    <h4 style="margin:8px 0">${currentUser ? currentUser.email : 'Sign In to Save Progress'}</h4>
                    <p style="font-size:10px; color:var(--text-secondary); margin-bottom:12px;">${currentUser ? 'UID: ' + currentUser.uid.slice(0, 12) + '...' : 'Create an account to sync data across devices.'}</p>
                    ${currentUser
                        ? '<button class="primary-btn" onclick="app.logout()" style="background:#ff6b6b; width:100%;">Sign Out</button>'
                        : '<button class="primary-btn" onclick="app.googleLogin()" style="background:#fff; color:#333; border:1px solid #ccc; width:100%; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px;"><span style="font-size:16px; font-weight:700; color:#4285F4;">G</span> Continue with Google</button>' +
                          '<p style="font-size:10px; color:var(--text-secondary); margin-bottom:8px;">or</p>' +
                          '<input class="settings-input" type="email" id="auth-email" placeholder="Email" style="margin-bottom:8px;">' +
                          '<input class="settings-input" type="password" id="auth-password" placeholder="Password" style="margin-bottom:8px;">' +
                          '<button class="primary-btn" onclick="app.login()" style="margin-bottom:8px; width:100%;">Sign In</button>' +
                          '<button class="primary-btn" onclick="app.register()" style="background:var(--accent-amber); width:100%;">Create Account</button>'
                    }
                </div>
            `;
            modal.style.display = 'flex';
        } catch(e) {
            console.error('showAuthModal error:', e);
        }
    },

    /* --- PUSH NOTIFICATIONS --- */
    notificationsEnabled: studySnapUtils.safeStorage.getItem('studysnap_notifications', 'true') === 'true',

    requestNotificationPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') return;
        if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    },

    sendNotification(title, body) {
        if (!this.notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            new Notification(title, { body: body, icon: 'icon.png', badge: 'icon.png', tag: 'studysnap-reminder' });
        } catch(e) { console.warn('Notification error:', e); }
    },

    toggleNotifications() {
        this.notificationsEnabled = !this.notificationsEnabled;
        studySnapUtils.safeStorage.setItem('studysnap_notifications', String(this.notificationsEnabled));
        if (this.notificationsEnabled) this.requestNotificationPermission();
    },

    scheduleDailyReminder() {
        if (!this.notificationsEnabled) return;
        var self = this;
        var reminders = [
            { hour: 8, msg: 'Good morning! Start your day with a quick study session.' },
            { hour: 14, msg: 'Afternoon check-in: Time for some flashcard revision!' },
            { hour: 20, msg: 'Evening review: Keep your streak alive! Study now.' }
        ];

        function checkReminders() {
            var now = new Date();
            var h = now.getHours();
            var m = now.getMinutes();
            reminders.forEach(function(r) {
                if (h === r.hour && m === 0) {
                    var lastReminder = studySnapUtils.safeStorage.getItem('studysnap_last_reminder', '');
                    var today = now.toDateString();
                    if (lastReminder !== today + r.hour) {
                        self.sendNotification('StudySnap AI', r.msg);
                        studySnapUtils.safeStorage.setItem('studysnap_last_reminder', today + r.hour);
                    }
                }
            });
        }

        setInterval(checkReminders, 60000);
        this.requestNotificationPermission();
    },

    googleLogin() {
        auth.signInWithPopup(googleProvider)
            .then(() => { this.closeModal(); })
            .catch(e => { alert('Google sign-in failed: ' + e.message); });
    },

    login() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        if (!email || !password) { alert('Enter email and password'); return; }
        auth.signInWithEmailAndPassword(email, password)
            .then(() => { this.closeModal(); })
            .catch(e => { alert('Login failed: ' + e.message); });
    },

    register() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        if (!email || !password) { alert('Enter email and password'); return; }
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => { this.closeModal(); })
            .catch(e => { alert('Registration failed: ' + e.message); });
    },

    logout(redirectSettings) {
        auth.signOut().then(() => {
            this.userId = 'guest';
            this.closeModal();
            if (redirectSettings) setTimeout(() => this.openSettings(), 100);
        }).catch(e => { alert('Logout failed: ' + e.message); });
    },

    /* --- PRO PLAN MODAL --- */
    isPro: false,

    _checkPro() {
        try { this.isPro = studySnapUtils.safeStorage.getItem('studysnap_pro', 'false') === 'true'; } catch(e) {}
    },

    _updateProCrown(user) {
        var nameEl = document.getElementById('profile-name');
        if (!nameEl) return;
        var u = user || auth.currentUser;
        if (!u) return;
        var dn = u.displayName || u.email.split('@')[0];
        nameEl.innerHTML = dn + (this.isPro ? ' <span class="pro-crown" onclick="event.stopPropagation();app.openProModal()" style="cursor:pointer;">&#128081;</span>' : '');
    },

    openProModal() {
        var modal = document.getElementById('global-modal');
        var content = document.getElementById('modal-content-area');
        if (!modal || !content) return;

        var isPro = this.isPro;
        var features = [
            ['fa-solid fa-brain', 'Unlimited AI Doubts', 'Real GPT-powered answers, no sandbox'],
            ['fa-solid fa-chart-line', 'Advanced Analytics', 'Weekly progress reports & weak area analysis'],
            ['fa-solid fa-calendar-check', 'Custom Study Plans', 'AI-generated daily schedules for JEE/NEET'],
            ['fa-solid fa-bolt', '2x XP Boost', 'Earn double XP on all activities'],
            ['fa-solid fa-infinity', 'Unlimited Flashcards', 'No daily limit on card generation'],
            ['fa-solid fa-trophy', 'Priority Leaderboard', 'Pro badge + highlighted ranking'],
            ['fa-solid fa-palette', 'Exclusive Themes', 'Unlock 5 premium color themes'],
            ['fa-solid fa-bell', 'Smart Reminders', 'AI-optimized study time notifications']
        ];

        var featuresHtml = '';
        for (var i = 0; i < features.length; i++) {
            var f = features[i];
            featuresHtml += '<div style="display:flex; align-items:flex-start; gap:10px; padding:8px 10px; border-radius:8px; background:' + (isPro ? 'rgba(34,197,94,0.06)' : 'var(--surface-secondary)') + ';">' +
                '<div style="width:28px; height:28px; border-radius:7px; display:flex; align-items:center; justify-content:center; background:' + (isPro ? 'var(--accent-green)' : 'var(--surface-tertiary)') + '; flex-shrink:0;">' +
                    '<i class="' + f[0] + '" style="font-size:12px; color:' + (isPro ? '#fff' : 'var(--text-secondary)') + ';"></i>' +
                '</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:12px; font-weight:600;">' + f[1] + (isPro ? ' <span style="color:var(--accent-green); font-size:10px;">&#10003;</span>' : ' <span style="color:var(--accent-amber); font-size:9px; border:1px solid var(--accent-amber); padding:1px 5px; border-radius:4px; margin-left:4px;">PRO</span>') + '</div>' +
                    '<div style="font-size:10px; color:var(--text-secondary); margin-top:2px;">' + f[2] + '</div>' +
                '</div>' +
            '</div>';
        }

        var pricingHtml = '';
        if (!isPro) {
            pricingHtml = '<div style="display:flex; gap:8px; margin:0 0 12px; justify-content:center;">' +
                '<button id="pro-btn-monthly" class="pro-plan-toggle" onclick="app.selectProPlan(\'monthly\')" style="padding:8px 16px; border-radius:8px; border:1.5px solid var(--accent-amber); background:var(--accent-amber-light); font-size:11px; font-weight:700; cursor:pointer; color:var(--text-primary);">Monthly</button>' +
                '<button id="pro-btn-annual" class="pro-plan-toggle" onclick="app.selectProPlan(\'annual\')" style="padding:8px 16px; border-radius:8px; border:1.5px solid var(--border-color); background:transparent; font-size:11px; font-weight:700; cursor:pointer; color:var(--text-secondary);">Annual <span style="color:var(--accent-green); font-size:9px;">SAVE 40%</span></button>' +
                '</div>' +
                '<div id="pro-pricing" style="text-align:center; margin:8px 0 16px;">' +
                    '<div id="pro-price-display" style="font-size:28px; font-weight:800; font-family:var(--font-heading); color:var(--accent-amber);">₹49<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">/month</span></div>' +
                '</div>';
        }

        var bottomHtml = '';
        if (isPro) {
            bottomHtml = '<div style="text-align:center; padding:12px; border-radius:10px; border:1.5px solid var(--accent-green); background:rgba(34,197,94,0.08);"><i class="fa-solid fa-check-circle" style="color:var(--accent-green); font-size:20px;"></i><p style="font-size:12px; font-weight:600; margin-top:4px;">You are a Pro member!</p><p style="font-size:10px; color:var(--text-secondary);">All premium features are unlocked.</p></div>';
        } else {
            bottomHtml = '<button class="primary-btn" onclick="app.subscribePro()" style="width:100%; padding:12px; font-size:13px; font-weight:700; background:linear-gradient(135deg, var(--accent-amber), #ff8c00); color:#000; border-radius:10px; border:none; cursor:pointer;"><i class="fa-solid fa-crown"></i> Upgrade to Pro</button>' +
                '<p style="text-align:center; font-size:9px; color:var(--text-secondary); margin-top:8px;">Cancel anytime. No questions asked.</p>';
        }

        content.innerHTML = '<div class="modal-header"><h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-crown" style="color:var(--accent-amber)"></i> StudySnap Pro</h3><span class="modal-close" onclick="app.closeModal()">&times;</span></div>' +
            '<div style="text-align:center; padding:16px 0 8px;">' +
                '<div style="font-size:36px; margin-bottom:8px;">&#128081;</div>' +
                '<h3 style="font-size:15px; font-family:var(--font-heading); color:var(--accent-amber);">Unlock Your Full Potential</h3>' +
                '<p style="font-size:11px; color:var(--text-secondary); margin-top:4px;">' + (isPro ? 'You are a Pro member!' : 'Upgrade to access premium features.') + '</p>' +
            '</div>' +
            pricingHtml +
            '<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">' + featuresHtml + '</div>' +
            bottomHtml;

        modal.style.display = 'flex';
    },

    selectProPlan(plan) {
        var priceEl = document.getElementById('pro-price-display');
        var btns = document.querySelectorAll('.pro-plan-toggle');
        btns.forEach(function(b) {
            b.classList.remove('active');
            b.style.border = '1.5px solid var(--border-color)';
            b.style.background = 'transparent';
            b.style.color = 'var(--text-secondary)';
        });
        var activeBtn = document.querySelector('[data-plan="' + plan + '"]');
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.border = '1.5px solid var(--accent-amber)';
            activeBtn.style.background = 'var(--accent-amber-light)';
            activeBtn.style.color = 'var(--text-primary)';
        }
        if (priceEl) {
            priceEl.innerHTML = plan === 'monthly' ? '₹49<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">/month</span>' : '₹29<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">/month</span>';
        }
    },

    subscribePro() {
        if (!auth.currentUser) {
            this.closeModal();
            setTimeout(function() { app.showAuthModal(true); }, 100);
            return;
        }
        this.showPaymentForm();
    },

    showPaymentForm() {
        var content = document.getElementById('modal-content-area');
        if (!content) return;
        var plan = document.querySelector('.pro-plan-toggle.active');
        var planName = plan ? (plan.dataset.plan === 'annual' ? 'Annual' : 'Monthly') : 'Monthly';
        var price = planName === 'Annual' ? '₹29/mo' : '₹49/mo';
        content.innerHTML = '<div class="modal-header"><h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-crown" style="color:var(--accent-amber)"></i> Complete Payment</h3><span class="modal-close" onclick="app.openProModal()">&larr; Back</span></div>' +
            '<div id="payment-form" style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">' +
                '<div style="text-align:center; padding:8px 0;"><span style="font-size:11px; color:var(--text-secondary);">' + planName + ' Plan</span><div style="font-size:22px; font-weight:800; font-family:var(--font-heading); color:var(--accent-amber);">' + price + '</div></div>' +
                '<div style="background:var(--surface-secondary); border-radius:8px; padding:12px;">' +
                    '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px;">UPI ID</label>' +
                    '<input id="payment-upi" class="settings-input" type="text" placeholder="e.g. name@upi" value="student@paytm" style="width:100%;">' +
                '</div>' +
                '<div style="background:var(--surface-secondary); border-radius:8px; padding:12px;">' +
                    '<label style="font-size:11px; font-weight:600; display:block; margin-bottom:4px;">Or Card Number</label>' +
                    '<input id="payment-card" class="settings-input" type="text" placeholder="4111 1111 1111 1111" value="4111 1111 1111 1111" style="width:100%; margin-bottom:6px;">' +
                    '<div style="display:flex; gap:6px;">' +
                        '<input id="payment-expiry" class="settings-input" type="text" placeholder="MM/YY" value="12/28" style="flex:1;">' +
                        '<input id="payment-cvv" class="settings-input" type="text" placeholder="CVV" value="123" style="flex:1;">' +
                    '</div>' +
                '</div>' +
                '<div id="payment-status" style="text-align:center; font-size:11px; color:var(--text-secondary); display:none;">Processing...</div>' +
                '<button id="payment-submit-btn" class="primary-btn" onclick="app.processPayment()" style="width:100%; padding:12px; font-size:13px; font-weight:700; background:linear-gradient(135deg, var(--accent-amber), #ff8c00); color:#000; border-radius:10px; border:none; cursor:pointer;"><i class="fa-solid fa-lock"></i> Pay ' + price + '</button>' +
                '<p style="text-align:center; font-size:9px; color:var(--text-secondary);">Secure simulated payment. No real charge.</p>' +
            '</div>';
    },

    processPayment() {
        var btn = document.getElementById('payment-submit-btn');
        var status = document.getElementById('payment-status');
        if (!btn || !status) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        status.style.display = 'block';
        status.innerHTML = 'Connecting to UPI...';
        var steps = ['Verifying UPI ID...', 'Processing payment...', 'Payment successful!'];
        steps.forEach(function(msg, i) {
            setTimeout(function() {
                status.innerHTML = msg;
                if (i === steps.length - 1) {
                    setTimeout(function() {
                        studySnapUtils.safeStorage.setItem('studysnap_pro', 'true');
                        app.isPro = true;
                        database.ref('users/' + app.userId + '/isPro').set(true);
                        app._updateProCrown();
                        app.sendNotification('StudySnap Pro', 'Welcome to Pro! All premium features unlocked.');
                        app.closeModal();
                        app.openProModal();
                    }, 500);
                }
            }, (i + 1) * 800);
        });
    },

    selectProPlan(plan) {
        var priceEl = document.getElementById('pro-price-display');
        var btns = document.querySelectorAll('.pro-plan-toggle');
        btns.forEach(function(b) {
            b.classList.remove('active');
            b.style.border = '1.5px solid var(--border-color)';
            b.style.background = 'transparent';
            b.style.color = 'var(--text-secondary)';
        });
        var activeBtn = document.querySelector('[data-plan="' + plan + '"]');
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.border = '1.5px solid var(--accent-amber)';
            activeBtn.style.background = 'var(--accent-amber-light)';
            activeBtn.style.color = 'var(--text-primary)';
        }
        if (priceEl) {
            priceEl.innerHTML = plan === 'monthly' ? '₹49<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">/month</span>' : '₹29<span style="font-size:12px; font-weight:400; color:var(--text-secondary);">/month</span>';
        }
    }
};

// Feature card ripple effect
document.addEventListener('click', e => {
    const card = e.target.closest('.feature-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// Initialize app when window loads
window.addEventListener('load', () => app.init());
