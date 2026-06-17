/* ==========================================================================
   StudySnap AI - Gamification & Canvas Confetti Engine
   ========================================================================== */

const gamification = {
    xp: parseInt(studySnapUtils.safeStorage.getItem('studysnap_xp', '250')) || 250,
    maxXp: 500,
    level: parseInt(studySnapUtils.safeStorage.getItem('studysnap_level', '2')) || 2,
    coins: parseInt(studySnapUtils.safeStorage.getItem('studysnap_coins', '250')) || 250,
    streak: parseInt(studySnapUtils.safeStorage.getItem('studysnap_streak', '3')) || 3,
    badges: studySnapUtils.safeJsonParse(studySnapUtils.safeStorage.getItem('studysnap_badges'), ['streak_3', 'first_login']),
    goalCards: parseInt(studySnapUtils.safeStorage.getItem('studysnap_goal_cards', '0')) || 0,
    goalQuizzes: parseInt(studySnapUtils.safeStorage.getItem('studysnap_goal_quizzes', '0')) || 0,
    goalClaimed: studySnapUtils.safeStorage.getItem('studysnap_goal_claimed') === 'true',

    levelTitles: [
        "Beginner",
        "Student",
        "Scholar",
        "Genius",
        "Einstein"
    ],

    init() {
        this.loadShopState();
        this.updateUI();
        this.initConfetti();
        this.updateGoalUI();
    },

    updateUI() {
        // Update values in header
        document.getElementById('stat-streak-val').textContent = `${this.streak} d`;
        document.getElementById('stat-coins-val').textContent = this.coins;
        
        // Calculate max XP bound based on level: level 1=300, level 2=500, level 3=800, etc.
        this.maxXp = this.level * 250;
        document.getElementById('profile-level').textContent = `Level ${this.level} (${this.levelTitles[Math.min(Math.max(this.level - 1, 0), this.levelTitles.length - 1)]})`;
        document.getElementById('xp-text-ratio').textContent = `${this.xp}/${this.maxXp}`;
        
        // Update XP Bar width percentage
        const pct = Math.min((this.xp / this.maxXp) * 100, 100);
        document.getElementById('xp-bar-fill').style.width = `${pct}%`;

        // Sync with LocalStorage
        studySnapUtils.safeStorage.setItem('studysnap_xp', String(this.xp));
        studySnapUtils.safeStorage.setItem('studysnap_level', String(this.level));
        studySnapUtils.safeStorage.setItem('studysnap_coins', String(this.coins));
        studySnapUtils.safeStorage.setItem('studysnap_streak', String(this.streak));
        studySnapUtils.safeStorage.setItem('studysnap_badges', JSON.stringify(this.badges));

        // Sync to Firebase if logged in
        this.syncToFirebase();
    },

    syncToFirebase() {
        const userId = typeof app !== 'undefined' && app.userId;
        if (!userId || userId === 'guest') return;
        try {
            if (typeof database === 'undefined' || !database) return;
            database.ref('users/' + userId).update({
                xp: this.xp,
                level: this.level,
                coins: this.coins,
                streak: this.streak,
                badges: this.badges
            });
            // Update leaderboard
            var userName = 'Anonymous';
            try {
                var u = auth ? auth.currentUser : null;
                if (u) userName = u.displayName || (u.email ? u.email.split('@')[0] : 'Student');
            } catch(e) {}
            database.ref('leaderboard/' + userId).set({
                name: userName,
                xp: this.level * 250 + this.xp,
                level: this.level,
                streak: this.streak
            });
        } catch(e) { console.warn('syncToFirebase error:', e); }
    },

    /* Increment XP, trigger level ups, float text */
    addXP(amount, targetEl = null) {
        this.xp += amount;
        
        // Trigger floating numbers animation
        if (targetEl) {
            this.spawnXpPopup(amount, targetEl);
        }

        // Handle Level up calculations
        if (this.xp >= this.maxXp) {
            this.xp -= this.maxXp;
            this.level += 1;
            this.maxXp = this.level * 250;
            
            // Level up animation and audio simulator
            setTimeout(() => {
                this.triggerLevelUpEffects();
            }, 300);
        }

        this.updateUI();
    },

    addCoins(amount) {
        this.coins += amount;
        this.updateUI();
    },

    incrementFlashcardGoal() {
        if (this.goalClaimed) return;
        this.goalCards = Math.min(this.goalCards + 1, 5);
        studySnapUtils.safeStorage.setItem('studysnap_goal_cards', String(this.goalCards));
        this.updateGoalUI();
    },

    incrementQuizGoal() {
        if (this.goalClaimed) return;
        this.goalQuizzes = Math.min(this.goalQuizzes + 1, 1);
        studySnapUtils.safeStorage.setItem('studysnap_goal_quizzes', String(this.goalQuizzes));
        this.updateGoalUI();
    },

    updateGoalUI() {
        const inner = document.getElementById('goal-progress-inner');
        const valText = document.getElementById('goal-ratio-val');
        const title = document.getElementById('goal-title-text');
        const desc = document.getElementById('goal-desc-text');
        
        if (!inner || !valText) return;

        const total = this.goalCards + this.goalQuizzes;
        valText.textContent = `${total}/6`;
        
        // Calculate percentage out of 6
        const pct = Math.min((total / 6) * 100, 100);
        inner.style.width = `${pct}%`;

        if (this.goalClaimed) {
            if (title) title.textContent = "Goal Completed! 🎉";
            if (desc) desc.textContent = "Flipped 5 cards & completed 1 quiz successfully today!";
            inner.style.background = "var(--accent-green)";
            return;
        }

        if (total >= 6) {
            this.goalClaimed = true;
            studySnapUtils.safeStorage.setItem('studysnap_goal_claimed', 'true');
            
            if (title) title.textContent = "Goal Completed! 🎉";
            if (desc) desc.textContent = "Flipped 5 cards & completed 1 quiz successfully today!";
            
            inner.style.background = "var(--accent-green)";
            
            // Award bonus XP and trigger visual confetti
            setTimeout(() => {
                this.addXP(100, title);
                this.addCoins(20);
                this.triggerConfetti();
            }, 400);
        }
    },

    unlockBadge(badgeId) {
        if (!this.badges.includes(badgeId)) {
            this.badges.push(badgeId);
            this.updateUI();
            
            // Visual badge alert popup
            this.showBadgeAlert(badgeId);
        }
    },

    /* Floating XP Number Generator */
    spawnXpPopup(amount, element) {
        const rect = element.getBoundingClientRect();
        const popup = document.createElement('span');
        popup.className = 'xp-popup';
        popup.textContent = `+${amount} XP`;
        
        // Position pop-up relative to trigger click
        popup.style.left = `${rect.left + rect.width / 2}px`;
        popup.style.top = `${rect.top}px`;
        
        document.body.appendChild(popup);
        
        // Remove after animation completes
        setTimeout(() => {
            popup.remove();
        }, 1200);
    },

    showBadgeAlert(badgeId) {
        const badgeNames = {
            'streak_7': '🔥 7-Day Study Master',
            'perfect_quiz': '🏆 Quiz Genius (100% Score)',
            'first_flashcard': '🎴 Flashcard Voyager',
            'essay_master': '✍️ Scholar of Letters (Grade A)',
            'panic_saved': '🚨 Night Owl Revision'
        };
        
        const title = badgeNames[badgeId] || '🏅 New Achievement unlocked!';
        
        const alertBox = document.createElement('div');
        alertBox.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            background: linear-gradient(135deg, var(--accent-violet), var(--accent-blue));
            color: white;
            padding: 12px 20px;
            border-radius: 30px;
            font-size: 13px;
            font-weight: 700;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
            pointer-events: none;
        `;
        alertBox.innerHTML = `<span>🎉</span> <span>${title}</span>`;
        
        document.body.appendChild(alertBox);
        
        // Animate Enter
        setTimeout(() => {
            alertBox.style.transform = 'translateX(-50%) translateY(0)';
            alertBox.style.opacity = '1';
        }, 100);

        // Animate Exit
        setTimeout(() => {
            alertBox.style.transform = 'translateX(-50%) translateY(-100%)';
            alertBox.style.opacity = '0';
            setTimeout(() => alertBox.remove(), 500);
        }, 3500);
    },

    triggerLevelUpEffects() {
        this.triggerConfetti();
        const prevLevel = this.level - 1;

        const overlay = document.createElement('div');
        overlay.className = 'levelup-overlay';
        overlay.innerHTML = `
            <div class="levelup-container">
                <!-- Speed lines -->
                <div class="lu-speedline ls1"></div><div class="lu-speedline ls2"></div>
                <div class="lu-speedline ls3"></div><div class="lu-speedline ls4"></div>
                <div class="lu-speedline ls5"></div><div class="lu-speedline ls6"></div>
                <!-- Energy bursts -->
                <div class="lu-burst b1"></div><div class="lu-burst b2"></div>
                <div class="lu-burst b3"></div><div class="lu-burst b4"></div>
                <!-- Floating educational particles -->
                <span class="lu-float-icon fi1">📚</span>
                <span class="lu-float-icon fi2">✏️</span>
                <span class="lu-float-icon fi3">∑</span>
                <span class="lu-float-icon fi4">⚗️</span>
                <span class="lu-float-icon fi5">E=mc²</span>
                <span class="lu-float-icon fi6">π</span>
                <span class="lu-float-icon fi7">🧪</span>
                <span class="lu-float-icon fi8">🔬</span>
                <span class="lu-float-icon fi9">f(x)</span>
                <span class="lu-float-icon fi10">⚡</span>
                <!-- Spark particles -->
                <div class="lu-spark sp1">✦</div><div class="lu-spark sp2">✦</div>
                <div class="lu-spark sp3">✦</div><div class="lu-spark sp4">✦</div>
                <div class="lu-spark sp5">✦</div><div class="lu-spark sp6">✦</div>
                <div class="lu-spark sp7">✦</div><div class="lu-spark sp8">✦</div>
                <div class="lu-spark sp9">✦</div><div class="lu-spark sp10">✦</div>
                <div class="lu-spark sp11">✦</div><div class="lu-spark sp12">✦</div>

                <div class="lu-content">
                    <!-- Anime Student Hero -->
                    <div class="lu-hero">
                        <div class="lu-hero-avatar">
                            <span class="lu-hero-face">${this.activeAvatar}</span>
                            <div class="lu-hero-hoodie">AI</div>
                        </div>
                        <div class="lu-hero-glow"></div>
                        <div class="lu-hero-fist">✊</div>
                    </div>

                    <!-- XP Progress -->
                    <div class="lu-xp-section">
                        <div class="lu-xp-label">${this.xp} / ${this.maxXp} XP</div>
                        <div class="lu-xp-track">
                            <div class="lu-xp-fill"></div>
                        </div>
                        <div class="lu-xp-float">⚡ Level Up Bonus</div>
                    </div>

                    <!-- Level Up Title with glow -->
                    <div class="lu-title-section">
                        <div class="lu-title-glow"></div>
                        <h2 class="lu-title">LEVEL UP!</h2>
                        <div class="lu-level-display">
                            <span class="lu-level-old">${prevLevel}</span>
                            <span class="lu-level-arrow">→</span>
                            <span class="lu-level-new">${this.level}</span>
                        </div>
                        <div class="lu-level-rank">${this.levelTitles[Math.min(Math.max(this.level - 1, 0), this.levelTitles.length - 1)]}</div>
                    </div>

                    <!-- Achievement Badge with Wings -->
                    <div class="lu-badge">
                        <div class="lu-badge-wings">
                            <span class="lu-wing lw">🪽</span>
                            <span class="lu-wing rw">🪽</span>
                        </div>
                        <div class="lu-badge-center">
                            <span class="lu-badge-star">⭐</span>
                            <div class="lu-badge-glow"></div>
                        </div>
                    </div>

                    <!-- Holographic Mentor Message -->
                    <div class="lu-mentor">
                        <span class="lu-mentor-icon">👩‍💻</span>
                        <div class="lu-mentor-bubble">
                            <span class="lu-mentor-name">AI Mentor</span>
                            "Amazing work! You're stronger than 85% of students at your level!"
                        </div>
                    </div>

                    <!-- Reward Cards -->
                    <div class="lu-rewards">
                        <div class="lu-reward-card rc-1">
                            <div class="lu-reward-icon">🪙</div>
                            <div class="lu-reward-label">+50 Coins</div>
                        </div>
                        <div class="lu-reward-card rc-2">
                            <div class="lu-reward-icon">🖼️</div>
                            <div class="lu-reward-label">New Avatar Frame</div>
                        </div>
                        <div class="lu-reward-card rc-3">
                            <div class="lu-reward-icon">🔥</div>
                            <div class="lu-reward-label">Streak Boost</div>
                        </div>
                    </div>

                    <!-- CTA Button -->
                    <button class="lu-btn" onclick="gamification.dismissLevelUp(this)">
                        🚀 KEEP LEARNING
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Trigger entrance
        requestAnimationFrame(() => {
            overlay.querySelector('.lu-content').classList.add('show');
        });

        // Exploding typography on the LEVEL UP title
        setTimeout(() => {
            const title = overlay.querySelector('.lu-title');
            if (title) studySnapUtils.explodeText(title, {
                scatterRadius: 250,
                duration: 650,
                stagger: 30,
                particles: 24,
                particleColor: '#ffd700'
            });
        }, 800);

        // Animate XP bar fill
        setTimeout(() => {
            const fill = overlay.querySelector('.lu-xp-fill');
            if (fill) fill.style.width = '100%';
        }, 600);

        this.addCoins(50);
    },

    dismissLevelUp(btn) {
        const overlay = btn.closest('.levelup-overlay');
        overlay.querySelector('.lu-content').classList.remove('show');
        overlay.querySelector('.lu-content').classList.add('hide');
        setTimeout(() => overlay.remove(), 600);
    },

    /* --- 2D CONFETTI PARTICLE ENGINE --- */
    canvas: null,
    ctx: null,
    confettiParticles: [],
    confettiTimer: null,
    confettiColors: [
        '#FF9933', // Saffron
        '#FFFFFF', // White
        '#138808', // Green
        '#8A2BE2', // Violet
        '#00BFFF'  // Sky Blue
    ],

    initConfetti() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    resizeCanvas() {
        if (this.canvas) {
            const wrapper = document.getElementById('app-shell');
            if (wrapper) {
                this.canvas.width = wrapper.clientWidth;
                this.canvas.height = wrapper.clientHeight;
            }
        }
    },

    triggerConfetti() {
        this.resizeCanvas();
        this.confettiParticles = [];
        
        // Spawn 80 confetti items
        for (let i = 0; i < 80; i++) {
            this.confettiParticles.push({
                x: Math.random() * this.canvas.width,
                y: -10 - Math.random() * 20,
                r: Math.random() * 6 + 4,
                d: Math.random() * this.canvas.height,
                color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1
            });
        }

        if (this.confettiTimer) cancelAnimationFrame(this.confettiTimer);
        this.animateConfetti();
    },

    animateConfetti() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let remaining = false;
        
        this.confettiParticles.forEach((p) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speedY;
            p.x += p.speedX;
            p.tilt = Math.sin(p.tiltAngle) * 12;

            if (p.y <= this.canvas.height) {
                remaining = true;
            }

            this.ctx.beginPath();
            this.ctx.lineWidth = p.r;
            this.ctx.strokeStyle = p.color;
            this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            this.ctx.stroke();
        });

        if (remaining) {
            this.confettiTimer = requestAnimationFrame(() => this.animateConfetti());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    /* ===================== SHOP SYSTEM ===================== */
    shopThemes: [
        { id: 'dark', name: 'Dark Mode', icon: '🌙', price: 0, desc: 'Classic dark theme — easy on the eyes' },
        { id: 'light', name: 'Light Mode', icon: '☀️', price: 0, desc: 'Clean light theme for daytime study' },
        { id: 'sepia', name: 'Sepia Night', icon: '🕯️', price: 50, desc: 'Warm sepia tones for late-night reading' },
        { id: 'midnight', name: 'Midnight Blue', icon: '🌃', price: 75, desc: 'Deep blue — premium visual comfort' },
        { id: 'forest', name: 'Forest Green', icon: '🌲', price: 75, desc: 'Calming green shade for long sessions' },
        { id: 'sunset', name: 'Sunset Orange', icon: '🌅', price: 100, desc: 'Vibrant warm orange gradient feel' },
    ],
    shopAvatars: [
        { key: '🧠', name: 'Brainiac', price: 0 },
        { key: '🦉', name: 'Wise Owl', price: 30 },
        { key: '🚀', name: 'Rocket', price: 40 },
        { key: '🌟', name: 'Superstar', price: 50 },
        { key: '💡', name: 'Bright Idea', price: 60 },
        { key: '🦊', name: 'Clever Fox', price: 70 },
        { key: '🐉', name: 'Dragon', price: 80 },
        { key: '👨‍🔬', name: 'Scientist', price: 100 },
        { key: '🧙', name: 'Wizard', price: 120 },
        { key: '🦄', name: 'Unicorn', price: 150 },
    ],
    shopBoosters: [
        { id: 'xp2', name: '2x XP Boost', icon: '⚡', price: 100, desc: 'Double XP for 24 hours', duration: 24 },
        { id: 'streak_freeze', name: 'Streak Freeze', icon: '🧊', price: 50, desc: 'Protect your streak for one day', duration: 24 },
        { id: 'extra_goal', name: 'Extra Goal', icon: '🎯', price: 30, desc: '+3 daily goal slots for today', duration: 24 },
    ],

    ownedThemes: [],
    ownedAvatars: [],
    activeBoosters: {},
    activeAvatar: '🧠',

    loadShopState() {
        this.ownedThemes = studySnapUtils.safeJsonParse(
            studySnapUtils.safeStorage.getItem('studysnap_shop_themes'), ['dark', 'light']);
        this.ownedAvatars = studySnapUtils.safeJsonParse(
            studySnapUtils.safeStorage.getItem('studysnap_shop_avatars'), ['🧠']);
        this.activeBoosters = studySnapUtils.safeJsonParse(
            studySnapUtils.safeStorage.getItem('studysnap_shop_boosters'), {});
        // auto-clear expired boosters
        for (const key in this.activeBoosters) {
            if (this.activeBoosters.hasOwnProperty(key)) {
                const b = this.activeBoosters[key];
                if (b && b.purchased && (Date.now() - b.purchased) > 86400000) {
                    delete this.activeBoosters[key];
                }
            }
        }
        this.activeAvatar = studySnapUtils.safeStorage.getItem('studysnap_avatar', '🧠');
        // Try loading from Firebase if logged in
        this.loadFromFirebase();
    },

    loadFromFirebase() {
        const userId = typeof app !== 'undefined' && app.userId;
        if (!userId || userId === 'guest') return;
        database.ref('users/' + userId).once('value').then((snap) => {
            const data = snap.val();
            if (data) {
                if (data.coins !== undefined) this.coins = data.coins;
                if (data.xp !== undefined) this.xp = data.xp;
                if (data.level !== undefined) this.level = data.level;
                if (data.streak !== undefined) this.streak = data.streak;
                if (data.badges) this.badges = data.badges;
                if (data.ownedThemes) this.ownedThemes = data.ownedThemes;
                if (data.ownedAvatars) this.ownedAvatars = data.ownedAvatars;
                if (data.activeBoosters) this.activeBoosters = data.activeBoosters;
                if (data.activeAvatar) this.activeAvatar = data.activeAvatar;
                this.updateUI();
            }
        }).catch(() => {});
    },

    saveShopState() {
        studySnapUtils.safeStorage.setItem('studysnap_shop_themes', JSON.stringify(this.ownedThemes));
        studySnapUtils.safeStorage.setItem('studysnap_shop_avatars', JSON.stringify(this.ownedAvatars));
        studySnapUtils.safeStorage.setItem('studysnap_shop_boosters', JSON.stringify(this.activeBoosters));
        studySnapUtils.safeStorage.setItem('studysnap_avatar', this.activeAvatar);
        // Sync to Firebase if logged in
        const userId = typeof app !== 'undefined' && app.userId;
        if (!userId || userId === 'guest') return;
        database.ref('users/' + userId).update({
            coins: this.coins,
            ownedThemes: this.ownedThemes,
            ownedAvatars: this.ownedAvatars,
            activeBoosters: this.activeBoosters,
            activeAvatar: this.activeAvatar
        });
    },

    buyItem(category, id) {
        let item, price;
        if (category === 'theme') {
            item = this.shopThemes.find(t => t.id === id);
            if (!item || this.ownedThemes.includes(id)) return 'owned';
            price = item.price;
            this.ownedThemes.push(id);
        } else if (category === 'avatar') {
            item = this.shopAvatars.find(a => a.key === id);
            if (!item || this.ownedAvatars.includes(id)) return 'owned';
            price = item.price;
            this.ownedAvatars.push(id);
        } else if (category === 'booster') {
            item = this.shopBoosters.find(b => b.id === id);
            if (!item) return 'owned';
            price = item.price;
            if (this.activeBoosters[id]) return 'active';
            this.activeBoosters[id] = { purchased: Date.now(), duration: item.duration };
        }
        if (this.coins < price) return 'insufficient';
        this.coins -= price;
        this.saveShopState();
        this.updateUI();
        return 'bought';
    },

    equipTheme(themeId) {
        if (!this.ownedThemes.includes(themeId)) return;
        if (typeof app !== 'undefined' && app.applyCustomTheme) {
            app.applyCustomTheme(themeId);
        }
    },

    equipAvatar(avatarKey) {
        if (!this.ownedAvatars.includes(avatarKey)) return;
        this.activeAvatar = avatarKey;
        this.saveShopState();
    },

    renderShop(contentEl, activeTab) {
        this.loadShopState();
        if (!activeTab) {
            const existing = contentEl.querySelector('.shop-panel');
            activeTab = existing ? (existing.getAttribute('data-tab') || 'themes') : 'themes';
        }
        let tab = activeTab;

        const renderItems = () => {
            let items = [];
            if (tab === 'themes') {
                items = this.shopThemes.map(t => {
                    const owned = this.ownedThemes.includes(t.id);
                    const active = document.body.classList.contains('theme-' + t.id) || (t.id === 'dark' && !document.body.classList.contains('light-theme') && !document.querySelector('[class*="theme-"]'));
                    return `<div class="shop-item ${owned ? 'owned' : ''}">
                        <div class="shop-item-icon">${t.icon}</div>
                        <div class="shop-item-info">
                            <div class="shop-item-name">${t.name}</div>
                            <div class="shop-item-desc">${t.desc}</div>
                        </div>
                        ${owned
                            ? `<button class="shop-btn ${active ? 'active' : ''}" onclick="gamification.equipTheme('${t.id}');gamification.renderShop(document.getElementById('modal-content-area'),'${tab}')">${active ? '✓ Equipped' : 'Equip'}</button>`
                            : `<button class="shop-btn buy" onclick="gamification.shopBuyClick('theme','${t.id}')">${t.price === 0 ? 'Free' : '🪙 ' + t.price}</button>`
                        }
                    </div>`;
                });
            } else if (tab === 'avatars') {
                items = this.shopAvatars.map(a => {
                    const owned = this.ownedAvatars.includes(a.key);
                    const active = this.activeAvatar === a.key;
                    return `<div class="shop-item ${owned ? 'owned' : ''}">
                        <div class="shop-item-icon" style="font-size:28px">${a.key}</div>
                        <div class="shop-item-info">
                            <div class="shop-item-name">${a.name}</div>
                        </div>
                        ${owned
                            ? `<button class="shop-btn ${active ? 'active' : ''}" onclick="gamification.equipAvatar('${a.key}');gamification.renderShop(document.getElementById('modal-content-area'),'${tab}')">${active ? '✓ Equipped' : 'Equip'}</button>`
                            : `<button class="shop-btn buy" onclick="gamification.shopBuyClick('avatar','${a.key}')">🪙 ${a.price}</button>`
                        }
                    </div>`;
                });
            } else if (tab === 'boosters') {
                items = this.shopBoosters.map(b => {
                    const active = this.activeBoosters[b.id];
                    const remaining = active ? Math.max(0, 24 - Math.floor((Date.now() - active.purchased) / 3600000)) : 0;
                    return `<div class="shop-item ${active ? 'owned' : ''}">
                        <div class="shop-item-icon">${b.icon}</div>
                        <div class="shop-item-info">
                            <div class="shop-item-name">${b.name}</div>
                            <div class="shop-item-desc">${b.desc}${active ? ` — <strong>${remaining}h remaining</strong>` : ''}</div>
                        </div>
                        ${active
                            ? `<button class="shop-btn active" disabled>✓ Active</button>`
                            : `<button class="shop-btn buy" onclick="gamification.shopBuyClick('booster','${b.id}')">🪙 ${b.price}</button>`
                        }
                    </div>`;
                });
            }

            contentEl.innerHTML = `
                <div class="shop-panel" data-tab="${tab}">
                    <div class="shop-header">
                        <div class="shop-coins"><span>🪙</span> ${this.coins}</div>
                    </div>
                    <div class="shop-tabs">
                        <button class="shop-tab ${tab === 'themes' ? 'active' : ''}" onclick="gamification.switchShopTab('themes', document.getElementById('modal-content-area'))">🎨 Themes</button>
                        <button class="shop-tab ${tab === 'avatars' ? 'active' : ''}" onclick="gamification.switchShopTab('avatars', document.getElementById('modal-content-area'))">😄 Avatars</button>
                        <button class="shop-tab ${tab === 'boosters' ? 'active' : ''}" onclick="gamification.switchShopTab('boosters', document.getElementById('modal-content-area'))">⚡ Boosters</button>
                    </div>
                    <div class="shop-items">${items.join('')}</div>
                </div>
            `;
        };
        renderItems();
    },

    switchShopTab(newTab, contentEl) {
        this.renderShop(contentEl, newTab);
    },

    shopBuyClick(category, id) {
        const result = this.buyItem(category, id);
        const el = document.getElementById('modal-content-area');
        if (!el) return;
        const currentTab = el.querySelector('.shop-panel')?.getAttribute('data-tab') || 'themes';
        if (result === 'insufficient') {
            el.innerHTML = `<div class="shop-panel" data-tab="${currentTab}"><div style="text-align:center;padding:40px"><span style="font-size:48px">😕</span><h3 style="margin:12px 0">Not enough coins!</h3><p style="color:var(--text-secondary)">Complete quizzes and homework to earn more.</p><button class="primary-btn" style="margin-top:16px" onclick="gamification.renderShop(document.getElementById('modal-content-area'),'${currentTab}')">Back to Shop</button></div></div>`;
        } else if (result === 'active') {
            this.renderShop(el, currentTab);
        } else {
            this.renderShop(el, currentTab);
        }
    },
};
