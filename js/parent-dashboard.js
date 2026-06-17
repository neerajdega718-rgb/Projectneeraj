/* ==========================================================================
   StudySnap AI - Parent Dashboard
   ========================================================================== */

const parentDashboard = {
    currentChildId: null,

    openDashboard() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        if (!modal || !content) return;

        const userId = app.userId;
        if (!userId || userId === 'guest') {
            content.innerHTML = `
                <div class="modal-header">
                    <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-user-shield" style="color:var(--accent-blue);"></i> Parent Dashboard</h3>
                    <span class="modal-close" onclick="app.closeModal()">&times;</span>
                </div>
                <div style="text-align:center; padding:20px;">
                    <div style="font-size:48px;">🔐</div>
                    <h4 style="font-size:14px; margin-top:12px;">Login Required</h4>
                    <p style="font-size:11px; color:var(--text-secondary); margin-top:6px;">Please login first to access the Parent Dashboard</p>
                    <button class="primary-btn" onclick="app.closeModal(); app.showAuthModal();" style="margin-top:12px;">Login Now</button>
                </div>
            `;
            modal.style.display = 'flex';
            return;
        }

        this.currentChildId = userId;
        this.renderDashboard(content);
        modal.style.display = 'flex';
    },

    async renderDashboard(content) {
        const childId = this.currentChildId;
        let userData = {};

        try {
            const snap = await database.ref('users/' + childId).once('value');
            if (snap.exists()) userData = snap.val();
        } catch (e) {
            console.warn('Parent dashboard load error:', e);
        }

        const name = userData.name || studySnapUtils.safeStorage.getItem('studysnap_profile_name') || 'Student';
        const xp = userData.xp || 0;
        const level = userData.level || 1;
        const coins = userData.coins || 0;
        const streak = userData.streak || 0;
        const quizzesTaken = userData.quizzesTaken || 0;
        const flashcardsFlipped = userData.flashcardsFlipped || 0;
        const homeworkSolved = userData.homeworkSolved || 0;
        const lastActive = userData.lastActive ? new Date(userData.lastActive).toLocaleString() : 'Never';

        const levelNames = ['Beginner', 'Learner', 'Student', 'Scholar', 'Expert', 'Master', 'Genius', 'Sage', 'Legend', 'Prodigy'];
        const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];

        const xpForNext = level * 500;
        const xpProgress = Math.min((xp / xpForNext) * 100, 100);

        let quizAccuracy = 0;
        if (quizzesTaken > 0 && userData.correctAnswers) {
            quizAccuracy = Math.round((userData.correctAnswers / quizzesTaken) * 100);
        }

        const totalStudyItems = quizzesTaken + flashcardsFlipped + homeworkSolved;

        content.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-user-shield" style="color:var(--accent-blue);"></i> Parent Dashboard</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <div style="padding:8px 0; max-height:70vh; overflow-y:auto;">
                <!-- Student Profile Card -->
                <div style="background:linear-gradient(135deg, var(--accent-blue), var(--accent-violet)); padding:16px; border-radius:12px; margin-bottom:12px; color:white;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:50px; height:50px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:24px;">👨‍🎓</div>
                        <div style="flex:1;">
                            <h3 style="font-size:16px; font-weight:700;">${name}</h3>
                            <p style="font-size:11px; opacity:0.9;">Level ${level} • ${levelName}</p>
                        </div>
                        <div style="text-align:right;">
                            <p style="font-size:10px; opacity:0.8;">Last Active</p>
                            <p style="font-size:10px; font-weight:600;">${lastActive}</p>
                        </div>
                    </div>
                    <div style="margin-top:12px; background:rgba(255,255,255,0.2); border-radius:6px; padding:6px 10px;">
                        <div style="display:flex; justify-content:space-between; font-size:10px;">
                            <span>Level ${level} → ${level + 1}</span>
                            <span>${xp} / ${xpForNext} XP</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.2); border-radius:4px; height:6px; margin-top:4px;">
                            <div style="width:${xpProgress}%; height:100%; background:white; border-radius:4px;"></div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Grid -->
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
                    <div style="background:var(--bg-card); padding:12px; border-radius:10px; text-align:center; border:1px solid var(--border);">
                        <div style="font-size:20px;">🔥</div>
                        <p style="font-size:18px; font-weight:800; font-family:var(--font-heading); color:var(--accent-saffron);">${streak}</p>
                        <p style="font-size:9px; color:var(--text-secondary);">Day Streak</p>
                    </div>
                    <div style="background:var(--bg-card); padding:12px; border-radius:10px; text-align:center; border:1px solid var(--border);">
                        <div style="font-size:20px;">⭐</div>
                        <p style="font-size:18px; font-weight:800; font-family:var(--font-heading); color:var(--accent-amber);">${xp}</p>
                        <p style="font-size:9px; color:var(--text-secondary);">Total XP</p>
                    </div>
                    <div style="background:var(--bg-card); padding:12px; border-radius:10px; text-align:center; border:1px solid var(--border);">
                        <div style="font-size:20px;">🪙</div>
                        <p style="font-size:18px; font-weight:800; font-family:var(--font-heading); color:var(--accent-green);">${coins}</p>
                        <p style="font-size:9px; color:var(--text-secondary);">Coins</p>
                    </div>
                </div>

                <!-- Study Activity -->
                <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                    <h4 style="font-size:13px; margin-bottom:10px;"><i class="fa-solid fa-chart-bar" style="color:var(--accent-green);"></i> Study Activity</h4>
                    
                    <div style="margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                            <span><i class="fa-solid fa-circle-question" style="color:var(--accent-amber);"></i> Quizzes Taken</span>
                            <span style="font-weight:700;">${quizzesTaken}</span>
                        </div>
                        <div style="background:var(--border); border-radius:4px; height:6px;">
                            <div style="width:${Math.min(quizzesTaken * 10, 100)}%; height:100%; background:var(--accent-amber); border-radius:4px;"></div>
                        </div>
                    </div>

                    <div style="margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                            <span><i class="fa-solid fa-clone" style="color:var(--accent-violet);"></i> Flashcards Studied</span>
                            <span style="font-weight:700;">${flashcardsFlipped}</span>
                        </div>
                        <div style="background:var(--border); border-radius:4px; height:6px;">
                            <div style="width:${Math.min(flashcardsFlipped * 5, 100)}%; height:100%; background:var(--accent-violet); border-radius:4px;"></div>
                        </div>
                    </div>

                    <div style="margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                            <span><i class="fa-solid fa-comments" style="color:var(--accent-blue);"></i> Homework Solved</span>
                            <span style="font-weight:700;">${homeworkSolved}</span>
                        </div>
                        <div style="background:var(--border); border-radius:4px; height:6px;">
                            <div style="width:${Math.min(homeworkSolved * 10, 100)}%; height:100%; background:var(--accent-blue); border-radius:4px;"></div>
                        </div>
                    </div>

                    <div style="border-top:1px solid var(--border); padding-top:10px; margin-top:6px;">
                        <div style="display:flex; justify-content:space-between; font-size:11px;">
                            <span style="font-weight:600;">Total Study Items</span>
                            <span style="font-weight:700; color:var(--accent-green);">${totalStudyItems}</span>
                        </div>
                    </div>
                </div>

                <!-- Performance Summary -->
                <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                    <h4 style="font-size:13px; margin-bottom:10px;"><i class="fa-solid fa-chart-pie" style="color:var(--accent-violet);"></i> Performance Summary</h4>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div style="text-align:center; padding:10px; background:var(--bg-secondary); border-radius:8px;">
                            <p style="font-size:22px; font-weight:800; font-family:var(--font-heading); color:var(--accent-green);">${quizAccuracy}%</p>
                            <p style="font-size:10px; color:var(--text-secondary);">Quiz Accuracy</p>
                        </div>
                        <div style="text-align:center; padding:10px; background:var(--bg-secondary); border-radius:8px;">
                            <p style="font-size:22px; font-weight:800; font-family:var(--font-heading); color:var(--accent-amber);">Level ${level}</p>
                            <p style="font-size:10px; color:var(--text-secondary);">Current Level</p>
                        </div>
                    </div>
                </div>

                <!-- Achievements -->
                <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                    <h4 style="font-size:13px; margin-bottom:10px;"><i class="fa-solid fa-trophy" style="color:var(--accent-amber);"></i> Achievements</h4>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${streak >= 1 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-saffron-light); color:var(--accent-saffron); font-size:10px; font-weight:600;">🔥 Streak Starter</span>' : ''}
                        ${streak >= 7 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-amber-light); color:var(--accent-amber); font-size:10px; font-weight:600;">⭐ Week Warrior</span>' : ''}
                        ${streak >= 30 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-green-light); color:var(--accent-green); font-size:10px; font-weight:600;">🏆 Monthly Master</span>' : ''}
                        ${quizzesTaken >= 5 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-blue-light); color:var(--accent-blue); font-size:10px; font-weight:600;">📚 Quiz Champion</span>' : ''}
                        ${flashcardsFlipped >= 50 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-violet-light); color:var(--accent-violet); font-size:10px; font-weight:600;">🧠 Memory Master</span>' : ''}
                        ${level >= 5 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--accent-red-light); color:var(--accent-red); font-size:10px; font-weight:600;">💎 Expert Level</span>' : ''}
                        ${totalStudyItems === 0 ? '<span style="padding:4px 8px; border-radius:12px; background:var(--bg-secondary); color:var(--text-secondary); font-size:10px; font-weight:600;">Start studying to earn badges!</span>' : ''}
                    </div>
                </div>

                <!-- Recommendations -->
                <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                    <h4 style="font-size:13px; margin-bottom:8px;"><i class="fa-solid fa-lightbulb" style="color:var(--accent-amber);"></i> Recommendations</h4>
                    <div style="font-size:11px; color:var(--text-secondary);">
                        ${streak < 3 ? '<p>• Encourage daily study habit — 3+ day streak unlocks bonuses!</p>' : ''}
                        ${quizzesTaken < 10 ? '<p>• More quiz practice can improve exam performance</p>' : ''}
                        ${flashcardsFlipped < 20 ? '<p>• Flashcards help with long-term memory retention</p>' : ''}
                        ${quizAccuracy < 70 && quizzesTaken > 0 ? '<p>• Focus on weak topics identified in quiz results</p>' : ''}
                        ${totalStudyItems > 50 ? '<p>• Great progress! Keep up the consistent study routine</p>' : ''}
                        ${streak >= 7 ? '<p>• Excellent streak! The consistency is paying off</p>' : ''}
                    </div>
                </div>

                <!-- Share Report -->
                <button class="primary-btn" onclick="parentDashboard.shareReport()" style="width:100%; margin-bottom:8px;">
                    <i class="fa-solid fa-share-nodes"></i> Share Progress Report
                </button>
            </div>
        `;
    },

    shareReport() {
        const name = studySnapUtils.safeStorage.getItem('studysnap_profile_name') || 'Student';
        const text = `StudySnap AI Progress Report\n\nStudent: ${name}\nKeep studying! 📚\n\nhttps://study-snap-ai-752f1.web.app`;
        
        if (navigator.share) {
            navigator.share({ title: 'StudySnap Progress', text: text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('Report copied to clipboard!');
            });
        }
    }
};
