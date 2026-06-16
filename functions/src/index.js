const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.database();

// 1. Daily Goal Reset — runs at midnight IST (6:30 PM UTC)
exports.dailyGoalReset = functions.pubsub.schedule('30 18 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const usersSnap = await db.ref('users').once('value');
        const updates = {};
        usersSnap.forEach((child) => {
            updates[`${child.key}/dailyGoalsCompleted`] = 0;
            updates[`${child.key}/dailyGoalTarget`] = 5;
        });
        await db.ref('users').update(updates);
        console.log('Daily goals reset for', Object.keys(updates).length / 2, 'users');
    });

// 2. Streak Manager — triggers on XP change
exports.updateStreak = functions.database.ref('/users/{uid}/xp')
    .onWrite(async (change, context) => {
        const uid = context.params.uid;
        const userRef = db.ref(`users/${uid}`);
        const snap = await userRef.once('value');
        const data = snap.val();
        if (!data) return;

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastActive = data.lastActiveDate || '';

        if (lastActive === today) return;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = data.streak || 0;
        if (lastActive === yesterdayStr) {
            newStreak += 1;
        } else if (lastActive !== today) {
            newStreak = 1;
        }

        await userRef.update({
            streak: newStreak,
            lastActiveDate: today
        });

        // Milestone notifications at 7, 30, 100 day streaks
        if ([7, 30, 100].includes(newStreak)) {
            await db.ref(`notifications/${uid}`).push({
                title: `🔥 ${newStreak}-Day Streak!`,
                body: newStreak === 100 ? 'Legendary! 100 days straight!' : `Amazing! Keep it going!`,
                timestamp: Date.now()
            });
        }
    });

// 3. Weekend XP Multiplier — triggered on XP change
exports.weekendXpMultiplier = functions.database.ref('/users/{uid}/xp')
    .onWrite(async (change, context) => {
        const uid = context.params.uid;
        const before = change.before.val() || 0;
        const after = change.after.val() || 0;
        if (after <= before) return;

        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;
        if (!isWeekend) return;

        const earned = after - before;
        const bonus = Math.floor(earned * 0.25);
        if (bonus <= 0) return;

        await db.ref(`users/${uid}/xp`).set(after + bonus);
    });

// 4. Cleanup expired boosters — runs daily at 1 AM IST
exports.cleanupBoosters = functions.pubsub.schedule('0 19 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
        const usersSnap = await db.ref('users').once('value');
        const now = Date.now();
        const updates = {};
        let cleaned = 0;

        usersSnap.forEach((child) => {
            const boosters = child.val().activeBoosters || {};
            Object.keys(boosters).forEach((key) => {
                if (boosters[key].expiresAt && boosters[key].expiresAt < now) {
                    updates[`${child.key}/activeBoosters/${key}`] = null;
                    cleaned++;
                }
            });
        });

        if (cleaned > 0) await db.ref('users').update(updates);
        console.log('Cleaned', cleaned, 'expired boosters');
    });
