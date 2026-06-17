/* ==========================================================================
   StudySnap AI - Study With Friends (Real-time Multiplayer)
   ========================================================================== */

const studyFriends = {
    currentRoom: null,
    myName: '',
    peers: {},
    rtcConnections: {},
    dataChannels: {},
    localStream: null,

    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 6);
    },

    openLobby() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        if (!modal || !content) return;

        const userName = studySnapUtils.safeStorage.getItem('studysnap_profile_name') || 'Student';

        content.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-users" style="color:var(--accent-blue);"></i> Study With Friends</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <div style="padding:8px 0;">
                <div style="text-align:center; margin-bottom:16px;">
                    <div style="font-size:40px;">👥</div>
                    <h4 style="font-size:14px; margin-top:8px;">Real-time Study Sessions</h4>
                    <p style="font-size:11px; color:var(--text-secondary);">Create or join a room to study with friends in real-time</p>
                </div>

                <div style="display:grid; gap:10px; margin-bottom:16px;">
                    <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border);">
                        <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-plus-circle" style="color:var(--accent-green);"></i> Create Room</h4>
                        <p style="font-size:10px; color:var(--text-secondary); margin-bottom:8px;">Share code with friends to join</p>
                        <button class="primary-btn" onclick="studyFriends.createRoom()" style="width:100%; background:linear-gradient(135deg, var(--accent-green), #16a34a);">
                            <i class="fa-solid fa-plus"></i> Create Study Room
                        </button>
                    </div>

                    <div style="background:var(--bg-card); padding:14px; border-radius:10px; border:1px solid var(--border);">
                        <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-right-to-bracket" style="color:var(--accent-blue);"></i> Join Room</h4>
                        <div style="display:flex; gap:6px;">
                            <input type="text" id="join-room-input" placeholder="Enter room code..." style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:12px;">
                            <button class="primary-btn" onclick="studyFriends.joinRoom()" style="background:linear-gradient(135deg, var(--accent-blue), #2563eb);">
                                <i class="fa-solid fa-arrow-right-to-bracket"></i> Join
                            </button>
                        </div>
                    </div>
                </div>

                <div id="study-rooms-list" style="margin-bottom:12px;">
                    <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-list" style="color:var(--accent-amber);"></i> Active Rooms</h4>
                    <div id="active-rooms-container" style="max-height:150px; overflow-y:auto;">
                        <p style="font-size:10px; color:var(--text-secondary);">Loading active rooms...</p>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        this.loadActiveRooms();
    },

    async createRoom() {
        const roomId = this.generateRoomId();
        const userName = studySnapUtils.safeStorage.getItem('studysnap_profile_name') || 'Student';
        const userId = app.userId || 'guest_' + Date.now();

        try {
            const roomRef = database.ref('studyRooms/' + roomId);
            await roomRef.set({
                id: roomId,
                host: userId,
                hostName: userName,
                createdAt: Date.now(),
                members: {
                    [userId]: { name: userName, joinedAt: Date.now(), online: true }
                },
                status: 'waiting',
                currentActivity: null
            });

            this.currentRoom = roomId;
            this.myName = userName;
            this.openRoom(roomId);
        } catch (e) {
            console.warn('Create room error:', e);
            alert('Could not create room. Make sure you are logged in.');
        }
    },

    async joinRoom() {
        const input = document.getElementById('join-room-input');
        if (!input) return;
        const roomId = input.value.trim();
        if (!roomId) return;

        const userName = studySnapUtils.safeStorage.getItem('studysnap_profile_name') || 'Student';
        const userId = app.userId || 'guest_' + Date.now();

        try {
            const roomSnap = await database.ref('studyRooms/' + roomId).once('value');
            if (!roomSnap.exists()) {
                alert('Room not found! Check the code and try again.');
                return;
            }

            const roomData = roomSnap.val();
            if (roomData.status === 'closed') {
                alert('This room is closed.');
                return;
            }

            await database.ref('studyRooms/' + roomId + '/members/' + userId).set({
                name: userName,
                joinedAt: Date.now(),
                online: true
            });

            this.currentRoom = roomId;
            this.myName = userName;
            this.openRoom(roomId);
        } catch (e) {
            console.warn('Join room error:', e);
            alert('Could not join room.');
        }
    },

    openRoom(roomId) {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        if (!modal || !content) return;

        const userName = this.myName;

        content.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-users" style="color:var(--accent-blue);"></i> Study Room</h3>
                <span class="modal-close" onclick="studyFriends.leaveRoom()">&times;</span>
            </div>
            <div style="padding:8px 0;">
                <div style="background:var(--bg-card); padding:12px; border-radius:10px; border:1px solid var(--border); margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <p style="font-size:10px; color:var(--text-secondary);">Room Code</p>
                            <h3 style="font-size:18px; font-family:var(--font-heading); color:var(--accent-green); letter-spacing:2px;" id="room-code-display">${roomId}</h3>
                        </div>
                        <button onclick="studyFriends.copyRoomCode()" style="padding:6px 12px; border-radius:6px; border:1px solid var(--accent-green); background:rgba(34,197,94,0.1); color:var(--accent-green); font-size:10px; cursor:pointer;">
                            <i class="fa-solid fa-copy"></i> Copy Code
                        </button>
                    </div>
                    <p style="font-size:10px; color:var(--text-secondary); margin-top:6px;">Share this code with friends to join</p>
                </div>

                <div style="margin-bottom:12px;">
                    <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-user-group" style="color:var(--accent-violet);"></i> Members Online</h4>
                    <div id="room-members-list" style="max-height:120px; overflow-y:auto;">
                        <p style="font-size:10px; color:var(--text-secondary);">Loading members...</p>
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-comments" style="color:var(--accent-amber);"></i> Room Chat</h4>
                    <div id="room-chat-messages" style="max-height:150px; overflow-y:auto; background:var(--bg-secondary); border-radius:8px; padding:8px; margin-bottom:8px;">
                        <p style="font-size:10px; color:var(--text-secondary); text-align:center;">Chat with your study group...</p>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <input type="text" id="room-chat-input" placeholder="Type a message..." style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:11px;" onkeydown="if(event.key==='Enter')studyFriends.sendChat()">
                        <button onclick="studyFriends.sendChat()" style="padding:8px 12px; border-radius:6px; border:none; background:var(--accent-blue); color:white; font-size:11px; cursor:pointer;">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <h4 style="font-size:12px; margin-bottom:8px;"><i class="fa-solid fa-gamepad" style="color:var(--accent-saffron);"></i> Group Activities</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <button onclick="studyFriends.startGroupQuiz()" style="padding:10px; border-radius:8px; border:1px solid var(--accent-amber); background:rgba(255,165,0,0.08); color:var(--text-primary); font-size:11px; cursor:pointer; text-align:center;">
                            <i class="fa-solid fa-circle-question" style="color:var(--accent-amber);"></i><br>Group Quiz
                        </button>
                        <button onclick="studyFriends.startStudyTimer()" style="padding:10px; border-radius:8px; border:1px solid var(--accent-green); background:rgba(34,197,94,0.08); color:var(--text-primary); font-size:11px; cursor:pointer; text-align:center;">
                            <i class="fa-solid fa-clock" style="color:var(--accent-green);"></i><br>Study Timer
                        </button>
                    </div>
                </div>

                <button class="primary-btn" onclick="studyFriends.leaveRoom()" style="width:100%; background:linear-gradient(135deg, var(--accent-red), #dc2626);">
                    <i class="fa-solid fa-right-from-bracket"></i> Leave Room
                </button>
            </div>
        `;
        modal.style.display = 'flex';

        database.ref('studyRooms/' + roomId).on('value', (snap) => {
            if (!snap.exists()) return;
            const data = snap.val();
            this.updateMembersUI(data.members || {});
        });

        database.ref('studyRooms/' + roomId + '/chat').on('child_added', (snap) => {
            const msg = snap.val();
            this.appendChatMessage(msg.name, msg.text, msg.time);
        });
    },

    updateMembersUI(members) {
        const container = document.getElementById('room-members-list');
        if (!container) return;

        let html = '';
        for (const [uid, m] of Object.entries(members)) {
            const isMe = uid === (app.userId || '');
            html += `<div style="display:flex; align-items:center; gap:8px; padding:6px; border-radius:6px; background:${isMe ? 'rgba(34,197,94,0.1)' : 'transparent'};">
                <div style="width:28px; height:28px; border-radius:50%; background:var(--accent-violet); display:flex; align-items:center; justify-content:center; color:white; font-size:11px; font-weight:700;">${m.name ? m.name[0].toUpperCase() : '?'}</div>
                <div style="flex:1;">
                    <p style="font-size:11px; font-weight:600;">${m.name}${isMe ? ' (You)' : ''}</p>
                </div>
                <span style="width:8px; height:8px; border-radius:50%; background:${m.online ? 'var(--accent-green)' : 'var(--text-secondary)'};"></span>
            </div>`;
        }
        container.innerHTML = html || '<p style="font-size:10px; color:var(--text-secondary);">No members yet</p>';
    },

    async sendChat() {
        const input = document.getElementById('room-chat-input');
        if (!input || !input.value.trim() || !this.currentRoom) return;

        const text = input.value.trim();
        input.value = '';

        try {
            await database.ref('studyRooms/' + this.currentRoom + '/chat').push({
                name: this.myName,
                text: text,
                time: Date.now()
            });
        } catch (e) {
            console.warn('Chat send error:', e);
        }
    },

    appendChatMessage(name, text, time) {
        const container = document.getElementById('room-chat-messages');
        if (!container) return;

        const isMe = name === this.myName;
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `margin-bottom:6px; text-align:${isMe ? 'right' : 'left'};`;
        msgEl.innerHTML = `<div style="display:inline-block; max-width:80%; padding:6px 10px; border-radius:8px; background:${isMe ? 'var(--accent-blue)' : 'var(--bg-card)'}; color:${isMe ? 'white' : 'var(--text-primary)'}; font-size:11px;">
            ${!isMe ? `<p style="font-size:9px; font-weight:600; margin-bottom:2px; color:${isMe ? 'rgba(255,255,255,0.8)' : 'var(--accent-violet)'};">${name}</p>` : ''}
            <p>${text}</p>
        </div>`;
        container.appendChild(msgEl);
        container.scrollTop = container.scrollHeight;
    },

    async loadActiveRooms() {
        try {
            const snap = await database.ref('studyRooms').orderByChild('status').equalTo('waiting').limitToLast(10).once('value');
            const container = document.getElementById('active-rooms-container');
            if (!container) return;

            if (!snap.exists()) {
                container.innerHTML = '<p style="font-size:10px; color:var(--text-secondary);">No active rooms. Create one!</p>';
                return;
            }

            let html = '';
            snap.forEach((child) => {
                const room = child.val();
                const memberCount = room.members ? Object.keys(room.members).length : 0;
                html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-radius:6px; border:1px solid var(--border); margin-bottom:6px;">
                    <div>
                        <p style="font-size:11px; font-weight:600;">${room.hostName}'s Room</p>
                        <p style="font-size:9px; color:var(--text-secondary);">Code: ${room.id} • ${memberCount} member${memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <button onclick="document.getElementById('join-room-input').value='${room.id}'; studyFriends.joinRoom();" style="padding:4px 10px; border-radius:4px; border:none; background:var(--accent-blue); color:white; font-size:10px; cursor:pointer;">Join</button>
                </div>`;
            });
            container.innerHTML = html;
        } catch (e) {
            console.warn('Load rooms error:', e);
        }
    },

    copyRoomCode() {
        const code = document.getElementById('room-code-display');
        if (code) {
            navigator.clipboard.writeText(code.textContent).then(() => {
                alert('Room code copied!');
            }).catch(() => {});
        }
    },

    startGroupQuiz() {
        if (!this.currentRoom) return;
        database.ref('studyRooms/' + this.currentRoom + '/activity').set({
            type: 'quiz',
            startedBy: this.myName,
            startedAt: Date.now()
        });
        alert('Quiz mode started! All members can now take a quiz together.');
    },

    startStudyTimer() {
        if (!this.currentRoom) return;
        database.ref('studyRooms/' + this.currentRoom + '/activity').set({
            type: 'timer',
            startedBy: this.myName,
            startedAt: Date.now(),
            duration: 25 * 60
        });
        alert('25-minute Pomodoro timer started for the group!');
    },

    async leaveRoom() {
        if (!this.currentRoom) return;
        const userId = app.userId || 'guest_' + Date.now();

        try {
            await database.ref('studyRooms/' + this.currentRoom + '/members/' + userId).remove();
            database.ref('studyRooms/' + this.currentRoom).off();
            database.ref('studyRooms/' + this.currentRoom + '/chat').off();

            const memberSnap = await database.ref('studyRooms/' + this.currentRoom + '/members').once('value');
            if (!memberSnap.exists()) {
                await database.ref('studyRooms/' + this.currentRoom).remove();
            }
        } catch (e) {
            console.warn('Leave room error:', e);
        }

        this.currentRoom = null;
        app.closeModal();
    }
};
