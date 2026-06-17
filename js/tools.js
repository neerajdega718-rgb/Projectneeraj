/* ==========================================================================
   StudySnap AI - Specialized Tools Hub (Mind Maps, NCERT, Predictor, Mistakes)
   ========================================================================== */

const tools = {
    mistakes: studySnapUtils.safeJsonParse(studySnapUtils.safeStorage.getItem('studysnap_mistakes'), []),

    openTool(toolId) {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        
        if (toolId === 'mistake') {
            this.renderMistakeBook(content);
        } else if (toolId === 'predict') {
            this.renderExamPredictor(content);
        } else if (toolId === 'diagram') {
            this.renderDiagramGenerator(content);
        } else if (toolId === 'leaderboard') {
            this.renderLeaderboard(content);
        } else if (toolId === 'formula') {
            this.renderFormulaSheet(content);
        } else if (toolId === 'challenge') {
            this.renderChallengeMode(content);
        }
        
        modal.style.display = 'flex';
    },

    /* --- 1. PERSONAL MISTAKE BOOK --- */
    logMistake(question, correctAnswer) {
        const item = { question, correctAnswer, timestamp: new Date().getTime() };
        // Avoid duplicates
        if (!this.mistakes.some(m => m.question === question)) {
            this.mistakes.push(item);
            studySnapUtils.safeStorage.setItem('studysnap_mistakes', JSON.stringify(this.mistakes));
        }
    },

    renderMistakeBook(el) {
        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-book-bookmark" style="color:var(--accent-green)"></i> Personal Mistake Book</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary);">Here are the questions you missed during quiz and study sessions. Review them regularly to solidify understanding.</p>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px; max-height:400px; overflow-y:auto;">
                ${this.mistakes.length === 0 ? `
                    <div style="text-align:center; padding:30px; color:var(--text-secondary); font-size:12px;">
                        <span>🍀</span> <p style="margin-top:8px;">Your Mistake Book is empty! Keep up the brilliant study work.</p>
                    </div>
                ` : this.mistakes.map((m, idx) => `
                    <div class="settings-group-box" style="font-size:12px; border-left:3.5px solid var(--accent-red)">
                        <p style="font-weight:600;">Q: ${studySnapUtils.escapeHtml(m.question)}</p>
                        <p style="color:var(--accent-green); font-weight:600; margin-top:6px; font-size:11px;">Correct Key: ${studySnapUtils.escapeHtml(m.correctAnswer)}</p>
                        <button class="primary-btn" onclick="tools.resolveMistake(${idx}, this)" style="padding:4px 10px; font-size:10px; width:auto; align-self:flex-start; margin-top:8px; background:var(--accent-green-light); border:1px solid var(--accent-green); color:var(--accent-green); box-shadow:none;">
                            <i class="fa-solid fa-circle-check"></i> Mastered (+10 XP)
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    resolveMistake(idx, btn) {
        // Fade and remove mistake item from cache
        this.mistakes.splice(idx, 1);
        studySnapUtils.safeStorage.setItem('studysnap_mistakes', JSON.stringify(this.mistakes));
        
        gamification.addXP(10, btn);
        
        // Refresh Mistake Book view
        this.renderMistakeBook(document.getElementById('modal-content-area'));
    },

    /* --- 2. AI EXAM PREDICTOR --- */
    renderExamPredictor(el) {
        const boardMode = document.body.className;
        let title = "CBSE Class 10 Board Predictor";
        let topics = [
            { name: "Trigonometric Identities", prob: 92, weight: "5 Marks", desc: "Proven high frequency in Section D. Focus heavily on proving identities using sin²θ + cos²θ = 1." },
            { name: "Photosynthesis Light Cycle", prob: 88, weight: "3 Marks", desc: "Commonly combined with diagram identification of thylakoids." },
            { name: "Quadratic Equations roots", prob: 84, weight: "2 Marks", desc: "Guaranteed question on finding nature of roots using Discriminant (D)." },
            { name: "Chemical Displacement Reactions", prob: 76, weight: "3 Marks", desc: "Expect color change observation questions (e.g. Iron nails in Copper Sulfate)." }
        ];

        if (boardMode.includes("jee")) {
            title = "JEE Main Physics & Math Predictor";
            topics = [
                { name: "Rotational Inertia Theorems", prob: 94, weight: "4 Marks", desc: "High probability of parallel/perpendicular axis theorem application on composites." },
                { name: "Definite Integral limits", prob: 86, weight: "4 Marks", desc: "Calculus questions focusing on Leibniz integral rules." },
                { name: "Electrostatic potential fields", prob: 78, weight: "4 Marks", desc: "Coulomb vector forces on multi-point charges configurations." }
            ];
        }

        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-chart-line" style="color:var(--accent-red)"></i> ${title}</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary);">Historical paper pattern analysis of past 10 years. Revision priorities organized by probability of appearance:</p>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px; max-height:400px; overflow-y:auto;">
                ${topics.map(t => `
                    <div class="settings-group-box" style="font-size:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700;">${t.name}</span>
                            <span style="padding:2px 8px; border-radius:10px; background:var(--accent-red-light); color:var(--accent-red); font-size:9.5px; font-weight:700;">${t.weight}</span>
                        </div>
                        <p style="font-size:11px; color:var(--text-secondary); margin:4px 0;">${t.desc}</p>
                        
                        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
                            <div style="flex:1; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
                                <div style="width:${t.prob}%; height:100%; background:var(--accent-red);"></div>
                            </div>
                            <span style="font-size:10px; font-weight:700; color:var(--accent-red);">${t.prob}% Probability</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /* --- 3. YOUTUBE SUMMARIZER --- */
    /* --- 4. DIAGRAM GENERATOR (SVG RENDERER) --- */
    diagramDb: {
        photosynthe: { title: "Photosynthesis", svg: `<svg viewBox="0 0 340 240" width="100%" height="100%">
            <text x="170" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Photosynthesis in a Chloroplast</text>
            <rect x="60" y="50" width="220" height="150" rx="75" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <ellipse cx="170" cy="150" rx="60" ry="20" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="170" y="155" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Stroma (Calvin Cycle)</text>
            <ellipse cx="170" cy="100" rx="40" ry="20" fill="#1a1a2e" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="170" y="105" text-anchor="middle" font-size="8" font-weight="600" fill="var(--accent-amber)">Thylakoid</text>
            <circle cx="140" cy="95" r="6" fill="#ffd700" opacity="0.6"/>
            <circle cx="160" cy="90" r="5" fill="#ffd700" opacity="0.6"/>
            <circle cx="180" cy="95" r="6" fill="#ffd700" opacity="0.6"/>
            <circle cx="200" cy="92" r="4" fill="#ffd700" opacity="0.6"/>
            <text x="15" y="50" font-size="8" fill="var(--accent-amber)">6CO₂ + 6H₂O</text>
            <text x="15" y="65" font-size="8" fill="var(--accent-amber)">+ Light</text>
            <line x1="55" y1="58" x2="85" y2="85" stroke="var(--accent-amber)" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#arrow)"/>
            <text x="230" y="190" font-size="8" fill="var(--accent-green)">C₆H₁₂O₆ + 6O₂</text>
            <line x1="220" y1="175" x2="245" y2="185" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="170" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Chloroplast: Site of photosynthesis</text>
        </svg>` },
        chloroplast: { title: "Chloroplast", svg: `<svg viewBox="0 0 340 240" width="100%" height="100%">
            <text x="170" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Chloroplast Structure</text>
            <ellipse cx="170" cy="120" rx="120" ry="80" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <ellipse cx="170" cy="120" rx="90" ry="55" fill="none" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="130" y="20" font-size="8" fill="var(--text-secondary)">Outer Membrane</text>
            <text x="110" y="55" font-size="8" fill="var(--text-secondary)">Inner Membrane</text>
            <rect x="130" y="90" width="80" height="50" rx="8" fill="#1a1a2e" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <circle cx="145" cy="100" r="8" fill="#ffd700" opacity="0.5"/>
            <circle cx="165" cy="105" r="6" fill="#ffd700" opacity="0.5"/>
            <circle cx="185" cy="95" r="7" fill="#ffd700" opacity="0.5"/>
            <circle cx="195" cy="115" r="5" fill="#ffd700" opacity="0.5"/>
            <text x="170" y="125" text-anchor="middle" font-size="8" fill="var(--accent-amber)">Grana (Thylakoid stacks)</text>
            <text x="170" y="160" text-anchor="middle" font-size="8" fill="var(--text-primary)">Stroma (fluid matrix)</text>
            <line x1="130" y1="95" x2="36" y2="43" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="36" y="38" font-size="7" fill="var(--text-secondary)">Thylakoid</text>
        </svg>` },
        heart: { title: "Human Heart", svg: `<svg viewBox="0 0 340 280" width="100%" height="100%">
            <text x="170" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Human Heart (Cross-section)</text>
            <ellipse cx="170" cy="150" rx="90" ry="85" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="170" y1="65" x2="170" y2="235" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="80" y1="150" x2="260" y2="150" stroke="var(--accent-red)" stroke-width="1.5" stroke-dasharray="4,2"/>
            <rect x="100" y="75" width="55" height="55" rx="8" fill="#ff6b6b" opacity="0.5" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="127" y="95" text-anchor="middle" font-size="7" font-weight="700" fill="white">RA</text>
            <text x="127" y="108" text-anchor="middle" font-size="6" fill="white">Right</text>
            <text x="127" y="117" text-anchor="middle" font-size="6" fill="white">Atrium</text>
            <rect x="210" y="75" width="55" height="55" rx="8" fill="#ff6b6b" opacity="0.5" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="237" y="95" text-anchor="middle" font-size="7" font-weight="700" fill="white">LA</text>
            <text x="237" y="108" text-anchor="middle" font-size="6" fill="white">Left</text>
            <text x="237" y="117" text-anchor="middle" font-size="6" fill="white">Atrium</text>
            <rect x="100" y="170" width="55" height="55" rx="8" fill="#ff4757" opacity="0.6" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="127" y="192" text-anchor="middle" font-size="7" font-weight="700" fill="white">RV</text>
            <text x="127" y="205" text-anchor="middle" font-size="6" fill="white">Right</text>
            <text x="127" y="214" text-anchor="middle" font-size="6" fill="white">Ventricle</text>
            <rect x="210" y="170" width="55" height="55" rx="8" fill="#ff4757" opacity="0.6" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="237" y="192" text-anchor="middle" font-size="7" font-weight="700" fill="white">LV</text>
            <text x="237" y="205" text-anchor="middle" font-size="6" fill="white">Left</text>
            <text x="237" y="214" text-anchor="middle" font-size="6" fill="white">Ventricle</text>
            <path d="M 170 65 Q 130 30 100 40" fill="none" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="80" y="35" font-size="7" fill="var(--text-secondary)">Aorta</text>
            <path d="M 80 80 Q 40 80 50 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="30" y="95" font-size="7" fill="var(--text-secondary)">Vena Cava</text>
            <text x="170" y="270" text-anchor="middle" font-size="8" fill="var(--text-secondary)">RA=Right Atrium  RV=Right Ventricle</text>
            <text x="170" y="280" text-anchor="middle" font-size="8" fill="var(--text-secondary)">LA=Left Atrium  LV=Left Ventricle</text>
        </svg>` },
        neuron: { title: "Neuron Structure", svg: `<svg viewBox="0 0 400 200" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Structure of a Neuron</text>
            <circle cx="70" cy="100" r="25" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="70" y="105" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Cell Body</text>
            <circle cx="70" cy="100" r="10" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <text x="70" y="90" text-anchor="middle" font-size="6" fill="var(--text-secondary)">Nucleus</text>
            <line x1="95" y1="100" x2="160" y2="100" stroke="var(--accent-violet)" stroke-width="3"/>
            <text x="120" y="90" font-size="7" fill="var(--text-secondary)">Axon</text>
            <rect x="155" y="80" width="40" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="175" y="100" text-anchor="middle" font-size="7" fill="var(--text-primary)">Myelin</text>
            <text x="175" y="110" text-anchor="middle" font-size="7" fill="var(--text-primary)">Sheath</text>
            <line x1="195" y1="100" x2="250" y2="100" stroke="var(--accent-violet)" stroke-width="3"/>
            <line x1="250" y1="100" x2="280" y2="70" stroke="var(--accent-green)" stroke-width="1.5"/>
            <line x1="250" y1="100" x2="280" y2="100" stroke="var(--accent-green)" stroke-width="1.5"/>
            <line x1="250" y1="100" x2="280" y2="130" stroke="var(--accent-green)" stroke-width="1.5"/>
            <circle cx="280" cy="70" r="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <circle cx="280" cy="100" r="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <circle cx="280" cy="130" r="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <text x="285" y="68" font-size="7" fill="var(--text-secondary)">Axon</text>
            <text x="285" y="78" font-size="7" fill="var(--text-secondary)">Terminals</text>
            <line x1="45" y1="90" x2="20" y2="60" stroke="var(--accent-green)" stroke-width="1.5"/>
            <line x1="45" y1="95" x2="15" y2="100" stroke="var(--accent-green)" stroke-width="1.5"/>
            <line x1="45" y1="110" x2="20" y2="140" stroke="var(--accent-green)" stroke-width="1.5"/>
            <circle cx="20" cy="60" r="3" fill="var(--accent-green)"/>
            <circle cx="15" cy="100" r="3" fill="var(--accent-green)"/>
            <circle cx="20" cy="140" r="3" fill="var(--accent-green)"/>
            <text x="10" y="55" font-size="6" fill="var(--text-secondary)">Dendrites</text>
        </svg>` },
        flower: { title: "Flower Structure", svg: `<svg viewBox="0 0 340 280" width="100%" height="100%">
            <text x="170" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Structure of a Flower</text>
            <line x1="170" y1="240" x2="170" y2="190" stroke="var(--accent-green)" stroke-width="4"/>
            <text x="185" y="235" font-size="8" fill="var(--text-secondary)">Stem (Pedicle)</text>
            <ellipse cx="170" cy="195" rx="40" ry="10" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="200" y="198" font-size="7" fill="var(--text-secondary)">Receptacle</text>
            <ellipse cx="170" cy="170" rx="25" ry="12" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="200" y="173" font-size="7" fill="var(--text-secondary)">Ovary</text>
            <line x1="170" y1="158" x2="170" y2="100" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="180" y="130" font-size="7" fill="var(--text-secondary)">Style</text>
            <ellipse cx="170" cy="95" rx="10" ry="6" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="185" y="97" font-size="7" fill="var(--text-secondary)">Stigma</text>
            <ellipse cx="170" cy="145" rx="8" ry="6" fill="var(--accent-amber)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="185" y="148" font-size="6" fill="var(--text-secondary)">Anther</text>
            <line x1="150" y1="150" x2="140" y2="140" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="120" y="138" font-size="6" fill="var(--text-secondary)">Filament</text>
            <text x="120" y="178" font-size="6" fill="var(--text-secondary)">Pistil</text>
            <line x1="50" y1="190" x2="80" y2="190" stroke="var(--accent-violet)" stroke-width="2"/>
            <line x1="260" y1="190" x2="290" y2="190" stroke="var(--accent-violet)" stroke-width="2"/>
            <ellipse cx="80" cy="190" rx="20" ry="8" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <text x="60" y="188" font-size="6" fill="var(--text-secondary)">Petal (Corolla)</text>
            <ellipse cx="260" cy="190" rx="20" ry="8" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <ellipse cx="130" cy="185" rx="12" ry="6" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <text x="105" y="210" font-size="6" fill="var(--text-secondary)">Sepal (Calyx)</text>
            <text x="170" y="270" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Flower: Reproductive organ of a plant</text>
        </svg>` },
        "water cycle": { title: "Water Cycle", svg: `<svg viewBox="0 0 400 260" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Water Cycle (Hydrological Cycle)</text>
            <rect x="30" y="180" width="340" height="60" rx="5" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="200" y="215" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-blue)">Ocean / Water Body</text>
            <path d="M 100 180 Q 95 130 110 90" fill="none" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
            <text x="60" y="140" font-size="8" fill="var(--accent-amber)">Evaporation</text>
            <path d="M 250 180 Q 260 150 270 130" fill="none" stroke="var(--accent-green)" stroke-width="1.5" stroke-dasharray="4,3"/>
            <text x="270" y="160" font-size="8" fill="var(--accent-green)">Transpiration</text>
            <ellipse cx="200" cy="70" rx="120" ry="35" fill="rgba(200,200,200,0.15)" stroke="var(--text-secondary)" stroke-width="1.5" stroke-dasharray="2,2"/>
            <text x="200" y="55" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-secondary)">Clouds (Condensation)</text>
            <path d="M 160 35 Q 140 15 160 10 Q 180 0 200 5 Q 220 0 240 10 Q 260 15 240 35" fill="rgba(200,200,200,0.3)" stroke="var(--text-secondary)" stroke-width="1"/>
            <path d="M 120 45 Q 100 25 120 20 Q 140 10 160 15 Q 180 10 180 25" fill="rgba(200,200,200,0.2)" stroke="var(--text-secondary)" stroke-width="1"/>
            <path d="M 220 35 Q 240 15 260 20 Q 280 10 290 30 Q 300 40 290 45" fill="rgba(200,200,200,0.2)" stroke="var(--text-secondary)" stroke-width="1"/>
            <line x1="200" y1="90" x2="200" y2="120" stroke="var(--accent-blue)" stroke-width="2" stroke-dasharray="4,2"/>
            <text x="185" y="110" font-size="8" fill="var(--accent-blue)">Precipitation</text>
            <line x1="120" y1="95" x2="50" y2="130" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <text x="30" y="120" font-size="7" fill="var(--accent-amber)">Condensation</text>
            <path d="M 230 130 Q 280 150 320 170 L 330 180" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <text x="280" y="140" font-size="7" fill="var(--accent-blue)">Runoff</text>
        </svg>` },
        refraction: { title: "Light Refraction", svg: `<svg viewBox="0 0 400 220" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Refraction of Light</text>
            <rect x="30" y="110" width="340" height="100" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="200" y="170" text-anchor="middle" font-size="9" fill="var(--accent-blue)">Glass / Water (Denser Medium)</text>
            <line x1="30" y1="110" x2="370" y2="110" stroke="var(--accent-amber)" stroke-width="2" stroke-dasharray="6,3"/>
            <text x="310" y="105" font-size="8" fill="var(--accent-amber)">Surface (Normal)</text>
            <line x1="200" y1="10" x2="200" y2="210" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="205" y="25" font-size="7" fill="var(--text-secondary)">Normal</text>
            <line x1="80" y1="10" x2="175" y2="110" stroke="var(--accent-saffron)" stroke-width="2.5"/>
            <text x="45" y="25" font-size="8" fill="var(--accent-saffron)">Incident Ray</text>
            <line x1="175" y1="110" x2="240" y2="170" stroke="var(--accent-saffron)" stroke-width="2.5"/>
            <text x="245" y="175" font-size="8" fill="var(--accent-saffron)">Refracted Ray</text>
            <line x1="240" y1="170" x2="300" y2="210" stroke="var(--accent-saffron)" stroke-width="2.5" stroke-dasharray="4,2"/>
            <text x="295" y="205" font-size="7" fill="var(--accent-saffron)">Emergent</text>
            <path d="M 195 80 A 30 30 0 0 0 175 100" fill="none" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="155" y="80" font-size="7" fill="var(--text-secondary)">θ₁</text>
            <path d="M 195 120 A 20 20 0 0 1 185 130" fill="none" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="180" y="125" font-size="7" fill="var(--text-secondary)">θ₂</text>
            <text x="200" y="215" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Snell's Law: n₁ sin θ₁ = n₂ sin θ₂</text>
        </svg>` },
        eye: { title: "Human Eye", svg: `<svg viewBox="0 0 380 240" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Structure of the Human Eye</text>
            <ellipse cx="190" cy="130" rx="140" ry="80" fill="white" stroke="var(--text-secondary)" stroke-width="2"/>
            <circle cx="190" cy="130" r="40" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <circle cx="190" cy="130" r="20" fill="#1a1a2e" stroke="var(--text-primary)" stroke-width="1.5"/>
            <circle cx="190" cy="130" r="8" fill="#1a1a2e"/>
            <text x="220" y="165" font-size="8" fill="var(--text-primary)">Iris</text>
            <line x1="215" y1="155" x2="210" y2="140" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="220" y="115" font-size="8" fill="var(--text-primary)">Pupil</text>
            <line x1="200" y1="115" x2="210" y2="120" stroke="var(--text-secondary)" stroke-width="1"/>
            <path d="M 50 130 Q 80 100 100 100" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="20" y="105" font-size="8" fill="var(--accent-blue)">Cornea</text>
            <ellipse cx="120" cy="130" rx="12" ry="25" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="100" y="100" font-size="8" fill="var(--accent-amber)">Lens</text>
            <path d="M 310 100 Q 320 130 310 160" fill="none" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="295" y="110" font-size="8" fill="var(--accent-red)">Retina</text>
            <line x1="50" y1="175" x2="100" y2="190" stroke="var(--accent-green)" stroke-width="2.5"/>
            <text x="20" y="185" font-size="8" fill="var(--accent-green)">Optic Nerve</text>
            <text x="190" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Light enters → Cornea → Lens → Retina → Brain</text>
        </svg>` },
        "digestive system": { title: "Digestive System", svg: `<svg viewBox="0 0 350 280" width="100%" height="100%">
            <text x="175" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Human Digestive System</text>
            <path d="M 95 40 Q 175 30 255 40" fill="none" stroke="var(--accent-saffron)" stroke-width="3"/>
            <text x="255" y="37" font-size="8" fill="var(--text-secondary)">Mouth</text>
            <path d="M 120 50 L 120 80 Q 120 95 175 95 Q 230 95 230 80 L 230 50" fill="none" stroke="var(--accent-saffron)" stroke-width="2"/>
            <text x="175" y="110" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Pharynx</text>
            <line x1="145" y1="85" x2="60" y2="55" stroke="var(--accent-saffron)" stroke-width="2"/>
            <text x="25" y="55" font-size="7" fill="var(--accent-saffron)">Salivary Glands</text>
            <line x1="175" y1="110" x2="175" y2="140" stroke="var(--accent-saffron)" stroke-width="3"/>
            <text x="187" y="128" font-size="8" fill="var(--text-secondary)">Esophagus</text>
            <ellipse cx="175" cy="155" rx="40" ry="20" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="2"/>
            <text x="175" y="160" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Stomach</text>
            <path d="M 175 175 Q 175 190 130 200 Q 85 210 85 240 L 265 240 Q 265 210 220 200 Q 175 190 175 175" fill="none" stroke="var(--accent-saffron)" stroke-width="2"/>
            <text x="175" y="225" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Small Intestine</text>
            <rect x="270" y="185" width="50" height="30" rx="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="295" y="195" text-anchor="middle" font-size="6" fill="var(--text-primary)">Large</text>
            <text x="295" y="207" text-anchor="middle" font-size="6" fill="var(--text-primary)">Intestine</text>
            <line x1="270" y1="200" x2="260" y2="200" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <rect x="135" y="133" width="30" height="15" rx="3" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="115" y="140" font-size="6" fill="var(--accent-amber)">Liver</text>
            <text x="175" y="270" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Food: Mouth → Stomach → Small Intestine</text>
        </svg>` },
        "respiratory system": { title: "Respiratory System", svg: `<svg viewBox="0 0 350 280" width="100%" height="100%">
            <text x="175" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Human Respiratory System</text>
            <path d="M 80 50 Q 100 45 120 50" fill="none" stroke="var(--accent-blue)" stroke-width="3"/>
            <path d="M 230 50 Q 250 45 270 50" fill="none" stroke="var(--accent-blue)" stroke-width="3"/>
            <text x="60" y="48" font-size="8" fill="var(--text-secondary)">Nasal Passage</text>
            <path d="M 120 50 Q 175 40 230 50" fill="none" stroke="var(--accent-blue)" stroke-width="3"/>
            <text x="175" y="42" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Pharynx</text>
            <line x1="175" y1="50" x2="175" y2="85" stroke="var(--accent-blue)" stroke-width="3"/>
            <text x="187" y="70" font-size="8" fill="var(--text-secondary)">Trachea</text>
            <path d="M 175 85 L 130 110 L 100 105" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="85" y="105" font-size="7" fill="var(--text-secondary)">Bronchus</text>
            <path d="M 175 85 L 220 110 L 250 105" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="235" y="103" font-size="7" fill="var(--text-secondary)">Bronchus</text>
            <ellipse cx="90" cy="160" rx="50" ry="55" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="90" y="145" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Right</text>
            <text x="90" y="158" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Lung</text>
            <circle cx="100" cy="175" r="3" fill="var(--accent-blue)"/>
            <circle cx="80" cy="165" r="3" fill="var(--accent-blue)"/>
            <circle cx="95" cy="150" r="3" fill="var(--accent-blue)"/>
            <circle cx="75" cy="180" r="2" fill="var(--accent-blue)"/>
            <ellipse cx="260" cy="160" rx="50" ry="55" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="260" y="145" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Left</text>
            <text x="260" y="158" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Lung</text>
            <circle cx="270" cy="175" r="3" fill="var(--accent-blue)"/>
            <circle cx="250" cy="165" r="3" fill="var(--accent-blue)"/>
            <circle cx="265" cy="150" r="3" fill="var(--accent-blue)"/>
            <path d="M 90 215 L 90 245" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="75" y="250" font-size="7" fill="var(--text-secondary)">Diaphragm</text>
            <path d="M 45 240 Q 90 255 135 240" fill="none" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="175" y="275" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Air → Nasal → Trachea → Bronchi → Lungs</text>
        </svg>` },
        "solar system": { title: "Solar System", svg: `<svg viewBox="0 0 400 200" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">The Solar System</text>
            <circle cx="200" cy="120" r="18" fill="#ffd700" stroke="#ff8c00" stroke-width="2"/>
            <text x="200" y="125" text-anchor="middle" font-size="8" font-weight="700" fill="#1a1a2e">Sun</text>
            <ellipse cx="200" cy="120" rx="35" ry="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <circle cx="165" cy="120" r="4" fill="#aaa"/>
            <text x="155" y="115" font-size="6" fill="var(--text-secondary)">Mercury</text>
            <ellipse cx="200" cy="120" rx="55" ry="30" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <circle cx="255" cy="120" r="6" fill="#ffb07c"/>
            <text x="255" y="110" font-size="6" fill="var(--text-secondary)">Venus</text>
            <ellipse cx="200" cy="120" rx="80" ry="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            <circle cx="120" cy="120" r="7" fill="#4a90d9"/>
            <text x="105" y="115" font-size="6" fill="var(--text-secondary)">Earth</text>
            <ellipse cx="200" cy="120" rx="105" ry="50" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            <circle cx="305" cy="120" r="5" fill="#e85d4a"/>
            <text x="305" y="110" font-size="6" fill="var(--text-secondary)">Mars</text>
            <ellipse cx="200" cy="120" rx="135" ry="65" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
            <circle cx="65" cy="120" r="12" fill="#d4a574"/>
            <text x="50" y="118" font-size="6" fill="var(--text-secondary)">Jupiter</text>
            <ellipse cx="200" cy="120" rx="160" ry="75" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <circle cx="360" cy="115" r="10" fill="#c8a45c"/>
            <text x="350" y="110" font-size="6" fill="var(--text-secondary)">Saturn</text>
            <line x1="350" y1="120" x2="370" y2="120" stroke="#c8a45c" stroke-width="1" opacity="0.5"/>
            <text x="200" y="195" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Sun at center, planets orbit in ellipses</text>
        </svg>` },
        "plant cell": { title: "Plant Cell", svg: `<svg viewBox="0 0 380 260" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Plant Cell Structure</text>
            <rect x="30" y="35" width="320" height="200" rx="10" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2.5"/>
            <text x="160" y="30" font-size="8" fill="var(--text-secondary)">Cell Wall</text>
            <rect x="50" y="55" width="280" height="160" rx="8" fill="var(--bg-card)" stroke="var(--accent-green)" stroke-width="1.5" stroke-dasharray="4,3"/>
            <text x="160" y="50" font-size="8" fill="var(--text-secondary)">Cell Membrane</text>
            <circle cx="120" cy="130" r="22" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="120" y="135" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Nucleus</text>
            <circle cx="120" cy="130" r="10" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <text x="120" y="123" text-anchor="middle" font-size="6" fill="var(--text-secondary)">Nucleolus</text>
            <ellipse cx="270" cy="100" rx="30" ry="18" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="270" y="105" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Vacuole</text>
            <ellipse cx="190" cy="170" rx="25" ry="15" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="190" y="175" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Chloroplast</text>
            <circle cx="190" cy="170" r="4" fill="var(--accent-green)" opacity="0.4"/>
            <ellipse cx="70" cy="90" rx="15" ry="8" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="70" y="93" text-anchor="middle" font-size="6" fill="var(--text-primary)">Golgi</text>
            <text x="190" y="250" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Plant cells have cell wall, chloroplasts, and large central vacuole</text>
        </svg>` },
        "animal cell": { title: "Animal Cell", svg: `<svg viewBox="0 0 380 260" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Animal Cell Structure</text>
            <ellipse cx="190" cy="140" rx="140" ry="100" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="300" y="50" font-size="8" fill="var(--text-secondary)">Cell Membrane</text>
            <circle cx="140" cy="110" r="25" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="140" y="115" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Nucleus</text>
            <circle cx="140" cy="110" r="10" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <text x="140" y="103" text-anchor="middle" font-size="6" fill="var(--text-secondary)">Nucleolus</text>
            <ellipse cx="250" cy="130" rx="18" ry="12" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="250" y="135" text-anchor="middle" font-size="7" fill="var(--text-primary)">Golgi</text>
            <ellipse cx="200" cy="180" rx="16" ry="10" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="200" y="185" text-anchor="middle" font-size="6" fill="var(--text-primary)">Lysosome</text>
            <ellipse cx="90" cy="175" rx="15" ry="8" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="90" y="178" text-anchor="middle" font-size="6" fill="var(--text-primary)">ER</text>
            <ellipse cx="260" cy="180" rx="13" ry="8" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <text x="260" y="183" text-anchor="middle" font-size="6" fill="var(--text-primary)">Mitochondria</text>
            <text x="190" y="255" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Animal cells lack cell wall and chloroplasts</text>
        </svg>` },
        nephron: { title: "Nephron Structure", svg: `<svg viewBox="0 0 380 270" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Structure of a Nephron</text>
            <circle cx="190" cy="60" r="28" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="190" y="65" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Bowman's</text>
            <text x="190" y="75" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Capsule</text>
            <text x="225" y="55" font-size="7" fill="var(--text-secondary)">Glomerulus</text>
            <line x1="190" y1="88" x2="190" y2="120" stroke="var(--accent-blue)" stroke-width="3"/>
            <text x="200" y="108" font-size="8" fill="var(--text-secondary)">PCT</text>
            <path d="M 190 120 Q 220 130 230 150 Q 240 170 220 180 Q 200 190 190 180" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="240" y="165" font-size="7" fill="var(--text-secondary)">Loop of Henle</text>
            <path d="M 190 180 Q 180 170 160 180 Q 140 190 150 210" fill="none" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="120" y="200" font-size="7" fill="var(--text-secondary)">DCT</text>
            <path d="M 150 210 Q 160 230 190 230 Q 220 230 230 210" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="200" y="243" font-size="7" fill="var(--text-secondary)">Collecting Duct</text>
            <line x1="100" y1="60" x2="80" y2="50" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="50" y="48" font-size="7" fill="var(--accent-red)">Afferent Arteriole</text>
            <line x1="280" y1="60" x2="300" y2="50" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="270" y="46" font-size="7" fill="var(--accent-green)">Efferent Arteriole</text>
            <text x="190" y="265" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Nephron: functional unit of the kidney</text>
        </svg>` },
        dna: { title: "DNA Double Helix", svg: `<svg viewBox="0 0 340 260" width="100%" height="100%">
            <text x="170" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">DNA Double Helix Structure</text>
            <path d="M 120 35 Q 80 65 140 95 Q 200 125 130 155 Q 60 185 120 215" fill="none" stroke="var(--accent-blue)" stroke-width="3"/>
            <path d="M 220 35 Q 260 65 200 95 Q 140 125 210 155 Q 280 185 220 215" fill="none" stroke="var(--accent-red)" stroke-width="3"/>
            <line x1="130" y1="50" x2="210" y2="50" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="170" y="48" text-anchor="middle" font-size="7" fill="var(--accent-amber)">A</text>
            <text x="215" y="52" font-size="6" fill="var(--text-secondary)">T</text>
            <line x1="145" y1="80" x2="195" y2="80" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="170" y="78" text-anchor="middle" font-size="7" fill="var(--accent-green)">G</text>
            <text x="198" y="82" font-size="6" fill="var(--text-secondary)">C</text>
            <line x1="155" y1="110" x2="185" y2="110" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="170" y="108" text-anchor="middle" font-size="7" fill="var(--accent-amber)">T</text>
            <text x="188" y="112" font-size="6" fill="var(--text-secondary)">A</text>
            <line x1="150" y1="140" x2="190" y2="140" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="170" y="138" text-anchor="middle" font-size="7" fill="var(--accent-green)">C</text>
            <text x="193" y="142" font-size="6" fill="var(--text-secondary)">G</text>
            <line x1="145" y1="170" x2="195" y2="170" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="170" y="168" text-anchor="middle" font-size="7" fill="var(--accent-amber)">A</text>
            <text x="198" y="172" font-size="6" fill="var(--text-secondary)">T</text>
            <line x1="140" y1="195" x2="200" y2="195" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="170" y="193" text-anchor="middle" font-size="7" fill="var(--accent-green)">G</text>
            <text x="203" y="197" font-size="6" fill="var(--text-secondary)">C</text>
            <text x="170" y="250" text-anchor="middle" font-size="8" fill="var(--text-secondary)">A=T, G≡C base pairing in DNA</text>
        </svg>` },
        "electromagnetic spectrum": { title: "EM Spectrum", svg: `<svg viewBox="0 0 420 200" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Electromagnetic Spectrum</text>
            <rect x="20" y="60" width="380" height="30" rx="3" fill="url(#emGradient)"/>
            <defs><linearGradient id="emGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ff0000"/>
                <stop offset="20%" stop-color="#ff8c00"/>
                <stop offset="40%" stop-color="#ffd700"/>
                <stop offset="55%" stop-color="#00cc44"/>
                <stop offset="70%" stop-color="#0088ff"/>
                <stop offset="85%" stop-color="#4400cc"/>
                <stop offset="100%" stop-color="#8800aa"/>
            </linearGradient></defs>
            <text x="40" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">Radio</text>
            <text x="85" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">Microwave</text>
            <text x="135" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">Infrared</text>
            <text x="190" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">Visible</text>
            <text x="245" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">UV</text>
            <text x="295" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">X-ray</text>
            <text x="365" y="55" font-size="7" text-anchor="middle" fill="var(--text-secondary)">Gamma</text>
            <line x1="20" y1="110" x2="400" y2="110" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="30" y="125" font-size="7" fill="var(--text-secondary)">Low Freq</text>
            <text x="330" y="125" font-size="7" fill="var(--text-secondary)">High Freq</text>
            <line x1="20" y1="115" x2="20" y2="120" stroke="var(--text-secondary)" stroke-width="1"/>
            <line x1="400" y1="115" x2="400" y2="120" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="210" y="145" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Increasing Frequency →</text>
            <text x="210" y="160" text-anchor="middle" font-size="8" fill="var(--text-secondary)">← Increasing Wavelength</text>
            <text x="210" y="185" text-anchor="middle" font-size="8" fill="var(--text-secondary)">c = fλ, where c = 3 × 10⁸ m/s</text>
        </svg>` },
        "ohm's law": { title: "Ohm's Law Circuit", svg: `<svg viewBox="0 0 380 240" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Ohm's Law Circuit Diagram</text>
            <rect x="40" y="40" width="70" height="50" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="75" y="58" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Battery</text>
            <text x="75" y="72" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(V)</text>
            <line x1="40" y1="65" x2="10" y2="65" stroke="var(--text-primary)" stroke-width="2"/>
            <line x1="10" y1="65" x2="10" y2="180" stroke="var(--text-primary)" stroke-width="2"/>
            <line x1="110" y1="65" x2="300" y2="65" stroke="var(--text-primary)" stroke-width="2"/>
            <rect x="250" y="40" width="80" height="50" rx="5" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="290" y="58" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Resistor</text>
            <text x="290" y="72" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(R)</text>
            <line x1="330" y1="65" x2="370" y2="65" stroke="var(--text-primary)" stroke-width="2"/>
            <line x1="370" y1="65" x2="370" y2="180" stroke="var(--text-primary)" stroke-width="2"/>
            <line x1="10" y1="180" x2="370" y2="180" stroke="var(--text-primary)" stroke-width="2"/>
            <circle cx="290" cy="180" r="12" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="290" y="185" text-anchor="middle" font-size="8" font-weight="700" fill="var(--accent-green)">A</text>
            <text x="270" y="195" font-size="7" fill="var(--text-secondary)">Ammeter</text>
            <line x1="110" y1="180" x2="278" y2="180" stroke="var(--text-primary)" stroke-width="2"/>
            <line x1="302" y1="180" x2="370" y2="180" stroke="var(--text-primary)" stroke-width="2"/>
            <text x="190" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">V = IR &mdash; Ohm's Law</text>
        </svg>` },
        "food chain": { title: "Food Chain", svg: `<svg viewBox="0 0 400 240" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Food Chain & Energy Pyramid</text>
            <rect x="20" y="180" width="80" height="40" rx="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="60" y="205" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Producers</text>
            <rect x="130" y="145" width="80" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="170" y="170" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Primary</text>
            <text x="170" y="180" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Consumer</text>
            <rect x="240" y="110" width="80" height="40" rx="5" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <text x="280" y="135" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Secondary</text>
            <text x="280" y="145" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Consumer</text>
            <rect x="170" y="40" width="80" height="40" rx="5" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="210" y="65" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Tertiary</text>
            <text x="210" y="75" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Consumer</text>
            <line x1="100" y1="195" x2="130" y2="175" stroke="var(--text-secondary)" stroke-width="1.5" marker-end="url(#arrow)"/>
            <text x="110" y="180" font-size="7" fill="var(--text-secondary)">Eaten by</text>
            <line x1="210" y1="175" x2="240" y2="155" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <text x="215" y="160" font-size="7" fill="var(--text-secondary)">Eaten by</text>
            <line x1="280" y1="125" x2="250" y2="90" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <text x="260" y="100" font-size="7" fill="var(--text-secondary)">Eaten by</text>
            <text x="200" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Energy flows from producers to top consumers</text>
        </svg>` },
        "male reproductive system": { title: "Male Reproductive System", svg: `<svg viewBox="0 0 400 280" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Male Reproductive System</text>
            <rect x="240" y="40" width="60" height="40" rx="6" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="270" y="55" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Seminal</text>
            <text x="270" y="65" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Vesicle</text>
            <line x1="260" y1="80" x2="230" y2="100" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <rect x="190" y="100" width="50" height="30" rx="5" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="215" y="120" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Prostate</text>
            <line x1="215" y1="130" x2="215" y2="155" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="215" y1="155" x2="240" y2="170" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="245" y="175" font-size="7" fill="var(--text-secondary)">Urethra</text>
            <line x1="215" y1="155" x2="190" y2="170" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <rect x="150" y="170" width="90" height="20" rx="4" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1.5"/>
            <text x="195" y="184" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Penis</text>
            <ellipse cx="80" cy="130" rx="25" ry="30" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="80" y="120" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Testis</text>
            <text x="80" y="135" text-anchor="middle" font-size="6" fill="var(--text-secondary)">(Testes)</text>
            <ellipse cx="80" cy="175" rx="30" ry="12" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="80" y="178" text-anchor="middle" font-size="7" fill="var(--text-primary)">Scrotum</text>
            <line x1="105" y1="130" x2="145" y2="130" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="120" y="122" font-size="7" fill="var(--text-secondary)">Vas</text>
            <text x="120" y="132" font-size="7" fill="var(--text-secondary)">Deferens</text>
            <line x1="105" y1="130" x2="80" y2="100" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="65" y="95" font-size="7" fill="var(--text-secondary)">Epididymis</text>
            <text x="200" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Testes produce sperm & testosterone</text>
            <text x="200" y="248" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Vas deferens carries sperm to urethra</text>
            <text x="200" y="261" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Seminal vesicle & prostate add seminal fluid</text>
        </svg>` },
        "male reproductive": { title: "Male Reproductive System", svg: `<svg viewBox="0 0 400 280" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Male Reproductive System</text>
            <rect x="240" y="40" width="60" height="40" rx="6" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="270" y="55" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Seminal</text>
            <text x="270" y="65" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Vesicle</text>
            <line x1="260" y1="80" x2="230" y2="100" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <rect x="190" y="100" width="50" height="30" rx="5" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="215" y="120" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Prostate</text>
            <line x1="215" y1="130" x2="215" y2="155" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="215" y1="155" x2="240" y2="170" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="245" y="175" font-size="7" fill="var(--text-secondary)">Urethra</text>
            <line x1="215" y1="155" x2="190" y2="170" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <rect x="150" y="170" width="90" height="20" rx="4" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1.5"/>
            <text x="195" y="184" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Penis</text>
            <ellipse cx="80" cy="130" rx="25" ry="30" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="80" y="120" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Testis</text>
            <text x="80" y="135" text-anchor="middle" font-size="6" fill="var(--text-secondary)">(Testes)</text>
            <ellipse cx="80" cy="175" rx="30" ry="12" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="80" y="178" text-anchor="middle" font-size="7" fill="var(--text-primary)">Scrotum</text>
            <line x1="105" y1="130" x2="145" y2="130" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="120" y="122" font-size="7" fill="var(--text-secondary)">Vas</text>
            <text x="120" y="132" font-size="7" fill="var(--text-secondary)">Deferens</text>
            <line x1="105" y1="130" x2="80" y2="100" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="65" y="95" font-size="7" fill="var(--text-secondary)">Epididymis</text>
            <text x="200" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Testes produce sperm & testosterone</text>
            <text x="200" y="248" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Vas deferens carries sperm to urethra</text>
            <text x="200" y="261" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Seminal vesicle & prostate add seminal fluid</text>
         </svg>` },

        /* --- CHEMISTRY --- */
        "atomic structure": { title: "Atomic Structure", svg: `<svg viewBox="0 0 380 240" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Atomic Structure</text>
            <circle cx="190" cy="130" r="85" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <text x="280" y="50" font-size="7" fill="var(--text-secondary)">Electron Shell (K, L, M...)</text>
            <circle cx="190" cy="130" r="55" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle cx="190" cy="130" r="25" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2.5"/>
            <text x="190" y="135" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Nucleus</text>
            <circle cx="190" cy="125" r="5" fill="var(--accent-red)"/>
            <text x="178" y="122" font-size="6" fill="var(--accent-red)">p⁺</text>
            <circle cx="195" cy="132" r="5" fill="#666"/>
            <text x="198" y="135" font-size="6" fill="#666">n</text>
            <circle cx="145" cy="100" r="5" fill="var(--accent-violet)"/>
            <text x="138" y="97" font-size="6" fill="var(--accent-violet)">e⁻</text>
            <circle cx="235" cy="85" r="5" fill="var(--accent-violet)"/>
            <text x="228" y="82" font-size="6" fill="var(--accent-violet)">e⁻</text>
            <circle cx="145" cy="170" r="5" fill="var(--accent-violet)"/>
            <circle cx="230" cy="175" r="5" fill="var(--accent-violet)"/>
            <circle cx="260" cy="130" r="5" fill="var(--accent-violet)"/>
            <circle cx="120" cy="130" r="5" fill="var(--accent-violet)"/>
            <text x="190" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Atom: Nucleus (p⁺ + n) surrounded by electron shells</text>
        </svg>` },
        "ph scale": { title: "pH Scale", svg: `<svg viewBox="0 0 420 220" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">pH Scale</text>
            <defs><linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ff0000"/><stop offset="25%" stop-color="#ff6600"/>
                <stop offset="50%" stop-color="#00cc00"/><stop offset="75%" stop-color="#0066ff"/>
                <stop offset="100%" stop-color="#6600cc"/>
            </linearGradient></defs>
            <rect x="20" y="80" width="380" height="30" rx="5" fill="url(#phGrad)"/>
            <text x="40" y="70" font-size="9" font-weight="700" fill="var(--accent-red)">0</text>
            <text x="75" y="70" font-size="8" fill="var(--accent-red)">1</text>
            <text x="105" y="70" font-size="8" fill="var(--accent-red)">2</text>
            <text x="135" y="70" font-size="8" fill="var(--accent-saffron)">3</text>
            <text x="165" y="70" font-size="8" fill="var(--accent-saffron)">4</text>
            <text x="195" y="70" font-size="8" fill="var(--accent-saffron)">5</text>
            <text x="210" y="70" font-size="9" font-weight="700" fill="var(--accent-green)">6</text>
            <text x="225" y="65" font-size="9" font-weight="700" fill="var(--accent-green)">7</text>
            <text x="245" y="70" font-size="8" fill="var(--accent-blue)">8</text>
            <text x="275" y="70" font-size="8" fill="var(--accent-blue)">9</text>
            <text x="305" y="70" font-size="8" fill="var(--accent-blue)">10</text>
            <text x="335" y="70" font-size="8" fill="var(--accent-violet)">11</text>
            <text x="362" y="70" font-size="8" fill="var(--accent-violet)">12</text>
            <text x="390" y="70" font-size="9" font-weight="700" fill="var(--accent-violet)">14</text>
            <text x="60" y="135" font-size="9" font-weight="700" fill="var(--accent-red)">Acidic</text>
            <text x="210" y="135" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent-green)">Neutral</text>
            <text x="360" y="135" font-size="9" font-weight="700" fill="var(--accent-violet)">Basic</text>
            <line x1="20" y1="125" x2="175" y2="125" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="190" y1="125" x2="230" y2="125" stroke="var(--accent-green)" stroke-width="2"/>
            <line x1="245" y1="125" x2="400" y2="125" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="210" y="175" text-anchor="middle" font-size="8" fill="var(--text-secondary)">pH 7 = Neutral (pure water)</text>
            <text x="210" y="190" text-anchor="middle" font-size="8" fill="var(--text-secondary)">pH &lt; 7 = Acid, pH &gt; 7 = Base</text>
            <text x="210" y="205" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Lower pH = stronger acid</text>
        </svg>` },
        electrolysis: { title: "Electrolysis Setup", svg: `<svg viewBox="0 0 400 240" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Electrolysis of Water</text>
            <rect x="100" y="60" width="200" height="120" rx="10" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="200" y="100" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-blue)">Water + H₂SO₄</text>
            <text x="200" y="118" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-blue)">(Electrolyte)</text>
            <rect x="125" y="65" width="15" height="50" rx="3" fill="#555"/>
            <text x="130" y="135" font-size="7" fill="var(--text-secondary)">Anode (+)</text>
            <line x1="130" y1="115" x2="130" y2="160" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="130" cy="165" r="8" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="130" y="169" text-anchor="middle" font-size="7" font-weight="700" fill="var(--accent-blue)">O₂</text>
            <rect x="260" y="65" width="15" height="50" rx="3" fill="#555"/>
            <text x="270" y="135" font-size="7" fill="var(--text-secondary)">Cathode (-)</text>
            <line x1="270" y1="115" x2="270" y2="160" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="270" cy="165" r="8" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="270" y="169" text-anchor="middle" font-size="7" font-weight="700" fill="var(--accent-blue)">H₂</text>
            <line x1="130" y1="55" x2="130" y2="35" stroke="var(--accent-red)" stroke-width="2"/>
            <line x1="270" y1="55" x2="270" y2="35" stroke="var(--accent-green)" stroke-width="2"/>
            <line x1="130" y1="35" x2="270" y2="35" stroke="var(--text-primary)" stroke-width="2"/>
            <rect x="160" y="25" width="50" height="20" rx="4" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="185" y="38" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Battery</text>
            <text x="200" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">2H₂O → 2H₂ + O₂ (Electrolysis)</text>
        </svg>` },
        distillation: { title: "Distillation Apparatus", svg: `<svg viewBox="0 0 420 260" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Simple Distillation Setup</text>
            <ellipse cx="120" cy="175" rx="40" ry="55" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="120" y="155" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Distillation</text>
            <text x="120" y="168" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Flask</text>
            <text x="120" y="195" text-anchor="middle" font-size="7" fill="var(--accent-amber)">(Solution)</text>
            <line x1="160" y1="155" x2="240" y2="155" stroke="var(--text-secondary)" stroke-width="2.5"/>
            <text x="195" y="148" font-size="7" fill="var(--text-secondary)">Condenser</text>
            <rect x="200" y="135" width="8" height="40" rx="2" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1"/>
            <rect x="240" y="135" width="8" height="40" rx="2" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1"/>
            <text x="255" y="155" font-size="6" fill="var(--accent-blue)">Water in</text>
            <text x="175" y="170" font-size="6" fill="var(--accent-blue)">Water out</text>
            <rect x="205" y="175" width="40" height="12" rx="3" fill="none" stroke="var(--accent-blue)" stroke-width="1"/>
            <line x1="245" y1="155" x2="260" y2="155" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <line x1="160" y1="155" x2="145" y2="155" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <ellipse cx="300" cy="195" rx="25" ry="30" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="300" y="195" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Collection</text>
            <text x="300" y="207" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Flask</text>
            <line x1="280" y1="165" x2="300" y2="170" stroke="var(--text-secondary)" stroke-width="1"/>
            <line x1="120" y1="230" x2="120" y2="250" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="95" y="245" font-size="6" fill="var(--text-secondary)">Heat</text>
            <text x="210" y="258" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Separation based on boiling point difference</text>
        </svg>` },
        "bohr model": { title: "Bohr Model / Electron Configuration", svg: `<svg viewBox="0 0 380 240" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Bohr Model — Electron Configuration (2,8,8,2)</text>
            <circle cx="190" cy="130" r="75" fill="none" stroke="var(--accent-saffron)" stroke-width="2" stroke-dasharray="4,3"/>
            <text x="275" y="60" font-size="7" fill="var(--text-secondary)">Shell N (n=4)</text>
            <circle cx="190" cy="130" r="55" fill="none" stroke="var(--accent-green)" stroke-width="2" stroke-dasharray="4,3"/>
            <text x="255" y="80" font-size="7" fill="var(--text-secondary)">Shell M (n=3)</text>
            <circle cx="190" cy="130" r="35" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-dasharray="4,3"/>
            <text x="160" y="88" font-size="7" fill="var(--text-secondary)">L (n=2)</text>
            <circle cx="190" cy="130" r="15" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="190" y="134" text-anchor="middle" font-size="7" font-weight="700" fill="var(--text-primary)">K (n=1)</text>
            <circle cx="145" cy="80" r="4" fill="var(--accent-blue)"/>
            <circle cx="235" cy="80" r="4" fill="var(--accent-blue)"/>
            <circle cx="120" cy="130" r="4" fill="var(--accent-blue)"/>
            <circle cx="260" cy="130" r="4" fill="var(--accent-blue)"/>
            <circle cx="145" cy="180" r="4" fill="var(--accent-blue)"/>
            <circle cx="235" cy="180" r="4" fill="var(--accent-blue)"/>
            <circle cx="175" cy="60" r="4" fill="var(--accent-green)"/>
            <circle cx="205" cy="60" r="4" fill="var(--accent-green)"/>
            <circle cx="105" cy="100" r="4" fill="var(--accent-green)"/>
            <circle cx="105" cy="160" r="4" fill="var(--accent-green)"/>
            <circle cx="275" cy="100" r="4" fill="var(--accent-green)"/>
            <circle cx="275" cy="160" r="4" fill="var(--accent-green)"/>
            <circle cx="175" cy="200" r="4" fill="var(--accent-green)"/>
            <circle cx="205" cy="200" r="4" fill="var(--accent-green)"/>
            <text x="190" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">K=2, L=8, M=8, N=2 — Calcium electron configuration</text>
        </svg>` },

        /* --- PHYSICS --- */
        reflection: { title: "Reflection of Light", svg: `<svg viewBox="0 0 400 230" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Reflection of Light (Plane Mirror)</text>
            <rect x="260" y="40" width="8" height="160" fill="#888" stroke="#555" stroke-width="1"/>
            <text x="240" y="50" font-size="8" fill="var(--text-secondary)">Mirror</text>
            <line x1="200" y1="40" x2="200" y2="200" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="4,4"/>
            <text x="205" y="55" font-size="7" fill="var(--text-secondary)">Normal</text>
            <line x1="350" y1="80" x2="200" y2="120" stroke="var(--accent-amber)" stroke-width="2.5"/>
            <text x="340" y="75" font-size="8" fill="var(--accent-amber)">Incident Ray</text>
            <line x1="200" y1="120" x2="80" y2="160" stroke="var(--accent-green)" stroke-width="2.5"/>
            <text x="65" y="165" font-size="8" fill="var(--accent-green)">Reflected Ray</text>
            <path d="M 230 100 A 30 30 0 0 1 200 110" fill="none" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="222" y="98" font-size="7" fill="var(--text-secondary)">∠i</text>
            <path d="M 200 130 A 30 30 0 0 0 170 143" fill="none" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="178" y="148" font-size="7" fill="var(--text-secondary)">∠r</text>
            <text x="200" y="220" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Angle of incidence ∠i = Angle of reflection ∠r</text>
        </svg>` },
        "convex lens": { title: "Convex Lens Ray Diagram", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Convex Lens Ray Diagram</text>
            <path d="M 190 60 Q 210 70 230 60 L 230 180 Q 210 170 190 180 Z" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="240" y="125" font-size="7" fill="var(--text-secondary)">Lens</text>
            <line x1="60" y1="120" x2="380" y2="120" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="330" y="115" font-size="7" fill="var(--text-secondary)">Principal Axis</text>
            <circle cx="210" cy="120" r="3" fill="var(--accent-amber)"/>
            <text x="215" y="115" font-size="7" fill="var(--accent-amber)">Optical Centre</text>
            <line x1="40" y1="160" x2="190" y2="120" stroke="var(--accent-green)" stroke-width="2"/>
            <line x1="190" y1="120" x2="350" y2="180" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="15" y="165" font-size="7" fill="var(--accent-green)">Ray 1</text>
            <line x1="80" y1="180" x2="210" y2="120" stroke="var(--accent-blue)" stroke-width="2"/>
            <line x1="210" y1="120" x2="370" y2="160" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="65" y="195" font-size="7" fill="var(--accent-blue)">Ray 2</text>
            <text x="210" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Convex lens converges parallel light to focus</text>
        </svg>` },
        "electric motor": { title: "Electric Motor", svg: `<svg viewBox="0 0 400 260" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">DC Electric Motor Principle</text>
            <rect x="50" y="100" width="300" height="100" rx="10" fill="none" stroke="var(--text-secondary)" stroke-width="2"/>
            <text x="60" y="95" font-size="8" fill="var(--text-secondary)">Magnet (N)</text>
            <text x="340" y="95" font-size="8" fill="var(--text-secondary)">Magnet (S)</text>
            <rect x="300" y="60" width="40" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="320" y="75" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">North</text>
            <text x="320" y="87" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Pole</text>
            <rect x="60" y="60" width="40" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="80" y="75" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">South</text>
            <text x="80" y="87" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Pole</text>
            <rect x="155" y="120" width="90" height="50" rx="4" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="200" y="148" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Coil (Armature)</text>
            <line x1="155" y1="170" x2="110" y2="190" stroke="var(--text-primary)" stroke-width="2"/>
            <rect x="100" y="190" width="24" height="14" rx="2" fill="#888"/>
            <text x="112" y="200" text-anchor="middle" font-size="6" fill="white">B</text>
            <line x1="245" y1="170" x2="270" y2="190" stroke="var(--text-primary)" stroke-width="2"/>
            <rect x="260" y="190" width="24" height="14" rx="2" fill="#888"/>
            <text x="272" y="200" text-anchor="middle" font-size="6" fill="white">B</text>
            <text x="200" y="258" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Current-carrying coil rotates in magnetic field</text>
        </svg>` },
        pendulum: { title: "Simple Pendulum", svg: `<svg viewBox="0 0 380 240" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Simple Pendulum</text>
            <line x1="190" y1="5" x2="190" y2="15" stroke="var(--text-primary)" stroke-width="3"/>
            <line x1="20" y1="10" x2="360" y2="10" stroke="var(--text-secondary)" stroke-width="2"/>
            <text x="340" y="25" font-size="8" fill="var(--text-secondary)">Support / Pivot</text>
            <line x1="190" y1="15" x2="190" y2="140" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="160" y="80" font-size="8" fill="var(--accent-blue)">String (L)</text>
            <circle cx="190" cy="155" r="18" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="190" y="160" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Bob</text>
            <path d="M 190 15 A 125 125 0 0 1 100 100" fill="none" stroke="var(--text-secondary)" stroke-width="1" stroke-dasharray="4,3"/>
            <text x="85" y="90" font-size="7" fill="var(--text-secondary)">Amplitude</text>
            <line x1="120" y1="135" x2="140" y2="100" stroke="var(--accent-amber)" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="120" y="130" font-size="7" fill="var(--accent-amber)">θ</text>
            <text x="190" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">T = 2π√(L/g) — Time period of oscillation</text>
        </svg>` },
        transformer: { title: "Transformer", svg: `<svg viewBox="0 0 400 240" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Transformer — Step Up / Step Down</text>
            <rect x="120" y="70" width="160" height="100" rx="8" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="200" y="125" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-primary)">Iron Core</text>
            <text x="200" y="140" text-anchor="middle" font-size="8" fill="var(--text-secondary)">(Soft Iron)</text>
            <rect x="40" y="90" width="80" height="30" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="80" y="110" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Primary Coil</text>
            <text x="80" y="80" font-size="7" fill="var(--text-secondary)">N₁ turns</text>
            <rect x="280" y="90" width="80" height="30" rx="5" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="320" y="110" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Secondary</text>
            <text x="320" y="80" font-size="7" fill="var(--text-secondary)">N₂ turns</text>
            <line x1="40" y1="105" x2="20" y2="105" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="10" y="110" font-size="7" fill="var(--accent-amber)">V₁</text>
            <line x1="360" y1="105" x2="380" y2="105" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="375" y="110" font-size="7" fill="var(--accent-blue)">V₂</text>
            <text x="200" y="225" text-anchor="middle" font-size="8" fill="var(--text-secondary)">V₂/V₁ = N₂/N₁ — Voltage ratio equals turns ratio</text>
        </svg>` },

        /* --- MATHEMATICS --- */
        pythagoras: { title: "Pythagoras Theorem", svg: `<svg viewBox="0 0 400 240" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Pythagoras Theorem</text>
            <polygon points="50,180 250,180 50,50" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="135" y="200" text-anchor="middle" font-size="10" font-weight="700" fill="var(--accent-blue)">Base (A)</text>
            <text x="35" y="110" text-anchor="end" font-size="10" font-weight="700" fill="var(--accent-green)">Height (B)</text>
            <text x="160" y="105" text-anchor="end" font-size="10" font-weight="700" fill="var(--accent-amber)">Hypotenuse (C)</text>
            <rect x="50" y="160" width="12" height="12" fill="var(--accent-blue)" opacity="0.6"/>
            <text x="65" y="170" font-size="7" fill="var(--text-secondary)">90°</text>
            <text x="200" y="235" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">A² + B² = C²</text>
        </svg>` },
        triangles: { title: "Types of Triangles", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Types of Triangles</text>
            <polygon points="70,180 130,180 100,80" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="100" y="200" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-amber)">Equilateral</text>
            <text x="100" y="213" text-anchor="middle" font-size="7" fill="var(--text-secondary)">All sides equal</text>
            <line x1="85" y1="175" x2="85" y2="180" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <line x1="115" y1="175" x2="115" y2="180" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <polygon points="190,180 260,180 225,90" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="225" y="200" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-green)">Isosceles</text>
            <text x="225" y="213" text-anchor="middle" font-size="7" fill="var(--text-secondary)">2 sides equal</text>
            <line x1="210" y1="175" x2="210" y2="180" stroke="var(--accent-green)" stroke-width="1.5"/>
            <line x1="240" y1="175" x2="240" y2="180" stroke="var(--accent-green)" stroke-width="1.5"/>
            <polygon points="310,180 390,180 340,100" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="350" y="200" text-anchor="middle" font-size="9" font-weight="600" fill="var(--accent-red)">Scalene</text>
            <text x="350" y="213" text-anchor="middle" font-size="7" fill="var(--text-secondary)">No sides equal</text>
            <text x="210" y="238" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Triangles classified by side lengths</text>
        </svg>` },
        "coordinate geometry": { title: "Coordinate Geometry", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Coordinate Geometry (Cartesian Plane)</text>
            <line x1="50" y1="130" x2="390" y2="130" stroke="var(--text-primary)" stroke-width="2"/>
            <text x="395" y="135" font-size="9" font-weight="700" fill="var(--text-primary)">X</text>
            <line x1="220" y1="20" x2="220" y2="230" stroke="var(--text-primary)" stroke-width="2"/>
            <text x="225" y="18" font-size="9" font-weight="700" fill="var(--text-primary)">Y</text>
            <text x="215" y="135" font-size="8" font-weight="700" fill="var(--text-primary)">O</text>
            <text x="270" y="125" font-size="7" fill="var(--text-secondary)">+X</text>
            <text x="160" y="125" font-size="7" fill="var(--text-secondary)">-X</text>
            <text x="230" y="70" font-size="7" fill="var(--text-secondary)">+Y</text>
            <text x="230" y="200" font-size="7" fill="var(--text-secondary)">-Y</text>
            <circle cx="300" cy="80" r="5" fill="var(--accent-green)"/>
            <text x="308" y="77" font-size="7" fill="var(--accent-green)">(4,3)</text>
            <circle cx="140" cy="170" r="5" fill="var(--accent-red)"/>
            <text x="110" y="185" font-size="7" fill="var(--accent-red)">(-3,-2)</text>
            <circle cx="310" cy="180" r="5" fill="var(--accent-amber)"/>
            <text x="300" y="197" font-size="7" fill="var(--accent-amber)">(5,-2)</text>
            <circle cx="130" cy="80" r="5" fill="var(--accent-violet)"/>
            <text x="100" y="75" font-size="7" fill="var(--accent-violet)">(-4,3)</text>
            <text x="210" y="238" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Points represented as (x, y) coordinates</text>
        </svg>` },

        /* --- GEOGRAPHY --- */
        "earth layers": { title: "Earth's Layers", svg: `<svg viewBox="0 0 380 260" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Layers of the Earth</text>
            <circle cx="190" cy="150" r="110" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <circle cx="190" cy="150" r="85" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="2"/>
            <circle cx="190" cy="150" r="55" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <circle cx="190" cy="150" r="30" fill="var(--accent-amber)" stroke="var(--accent-amber)" stroke-width="2"/>
            <circle cx="190" cy="150" r="15" fill="var(--accent-blue)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="190" y="155" text-anchor="middle" font-size="6" font-weight="700" fill="white">Inner Core</text>
            <text x="160" y="120" font-size="7" fill="var(--accent-amber)">Outer Core</text>
            <line x1="160" y1="120" x2="160" y2="110" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="125" y="90" font-size="7" fill="var(--accent-red)">Mantle</text>
            <line x1="125" y1="90" x2="125" y2="80" stroke="var(--accent-red)" stroke-width="1"/>
            <text x="100" y="55" font-size="7" fill="var(--accent-amber)">Crust</text>
            <line x1="100" y1="55" x2="100" y2="48" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="190" y="30" font-size="7" fill="var(--text-secondary)">Earth's radius ~6371 km</text>
            <text x="190" y="255" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Crust → Mantle → Outer Core → Inner Core</text>
        </svg>` },
        volcano: { title: "Volcano Cross-section", svg: `<svg viewBox="0 0 400 260" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Volcano — Cross Section</text>
            <path d="M 30 240 L 120 100 L 200 220 L 280 100 L 370 240 Z" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="2"/>
            <path d="M 200 220 L 200 75 L 175 100 Z" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="210" y="200" font-size="8" fill="var(--accent-red)">Crater</text>
            <path d="M 200 95 Q 200 60 200 30" fill="none" stroke="var(--accent-red)" stroke-width="2.5" stroke-dasharray="3,3"/>
            <text x="185" y="35" font-size="8" fill="var(--accent-red)">Eruption</text>
            <text x="240" y="130" font-size="7" fill="var(--text-secondary)">Magma</text>
            <text x="240" y="142" font-size="7" fill="var(--text-secondary)">Chamber</text>
            <ellipse cx="270" cy="165" rx="30" ry="15" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="270" y="170" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Magma</text>
            <line x1="200" y1="95" x2="240" y2="155" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="60" y="130" font-size="7" fill="var(--text-secondary)">Volcanic</text>
            <text x="55" y="142" font-size="7" fill="var(--text-secondary)">Mountain</text>
            <text x="200" y="258" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Magma rises through vent, erupts at crater</text>
        </svg>` },
        atmosphere: { title: "Atmosphere Layers", svg: `<svg viewBox="0 0 380 270" width="100%" height="100%">
            <text x="190" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Layers of Atmosphere</text>
            <rect x="50" y="30" width="280" height="30" rx="3" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1"/>
            <text x="320" y="48" font-size="7" fill="var(--text-secondary)">Exosphere (400+ km)</text>
            <rect x="50" y="60" width="280" height="40" rx="3" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <text x="320" y="78" font-size="7" fill="var(--accent-violet)">Thermosphere (80-400 km)</text>
            <rect x="50" y="100" width="280" height="45" rx="3" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="320" y="125" font-size="7" fill="var(--accent-amber)">Mesosphere (50-80 km)</text>
            <rect x="50" y="145" width="280" height="45" rx="3" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <text x="320" y="170" font-size="7" fill="var(--accent-green)">Stratosphere (12-50 km)</text>
            <rect x="50" y="190" width="280" height="55" rx="3" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1"/>
            <text x="320" y="210" font-size="7" fill="var(--accent-red)">Troposphere (0-12 km)</text>
            <text x="50" y="260" font-size="7" fill="var(--text-secondary)">Earth's Surface</text>
            <line x1="50" y1="250" x2="330" y2="250" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="190" y="268" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Ozone layer in stratosphere absorbs UV radiation</text>
        </svg>` },

        /* --- COMPUTER SCIENCE --- */
        "block diagram": { title: "Computer Block Diagram", svg: `<svg viewBox="0 0 420 250" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Block Diagram of a Computer</text>
            <rect x="150" y="80" width="120" height="50" rx="6" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="210" y="100" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">CPU</text>
            <text x="210" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Control + ALU)</text>
            <rect x="150" y="160" width="120" height="40" rx="6" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="210" y="185" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Memory (RAM)</text>
            <line x1="210" y1="130" x2="210" y2="160" stroke="var(--text-secondary)" stroke-width="2"/>
            <rect x="20" y="90" width="80" height="40" rx="6" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="60" y="110" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Input</text>
            <text x="60" y="122" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Keyboard)</text>
            <line x1="100" y1="110" x2="150" y2="105" stroke="var(--text-secondary)" stroke-width="2"/>
            <rect x="320" y="90" width="80" height="40" rx="6" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="360" y="110" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Output</text>
            <text x="360" y="122" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Monitor)</text>
            <line x1="270" y1="105" x2="320" y2="110" stroke="var(--text-secondary)" stroke-width="2"/>
            <text x="210" y="245" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Input → CPU (processes) → Memory (stores) → Output</text>
        </svg>` },
        "network topology": { title: "Network Topologies", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Network Topologies</text>
            <text x="60" y="50" font-size="9" font-weight="600" fill="var(--accent-green)">Star</text>
            <circle cx="60" cy="65" r="4" fill="var(--accent-green)"/>
            <line x1="60" y1="65" x2="90" y2="85" stroke="var(--accent-green)" stroke-width="1"/>
            <line x1="60" y1="65" x2="40" y2="90" stroke="var(--accent-green)" stroke-width="1"/>
            <line x1="60" y1="65" x2="80" y2="100" stroke="var(--accent-green)" stroke-width="1"/>
            <circle cx="90" cy="85" r="3" fill="var(--accent-green-light)"/>
            <circle cx="40" cy="90" r="3" fill="var(--accent-green-light)"/>
            <circle cx="80" cy="100" r="3" fill="var(--accent-green-light)"/>
            <text x="195" y="50" font-size="9" font-weight="600" fill="var(--accent-blue)">Bus</text>
            <line x1="150" y1="70" x2="240" y2="70" stroke="var(--accent-blue)" stroke-width="2"/>
            <line x1="175" y1="70" x2="175" y2="85" stroke="var(--accent-blue)" stroke-width="1"/>
            <line x1="195" y1="70" x2="195" y2="85" stroke="var(--accent-blue)" stroke-width="1"/>
            <line x1="215" y1="70" x2="215" y2="85" stroke="var(--accent-blue)" stroke-width="1"/>
            <circle cx="175" cy="88" r="3" fill="var(--accent-blue-light)"/>
            <circle cx="195" cy="88" r="3" fill="var(--accent-blue-light)"/>
            <circle cx="215" cy="88" r="3" fill="var(--accent-blue-light)"/>
            <text x="350" y="50" font-size="9" font-weight="600" fill="var(--accent-amber)">Ring</text>
            <circle cx="370" cy="65" r="4" fill="var(--accent-amber)"/>
            <circle cx="340" cy="80" r="4" fill="var(--accent-amber)"/>
            <circle cx="355" cy="100" r="4" fill="var(--accent-amber)"/>
            <circle cx="380" cy="95" r="4" fill="var(--accent-amber)"/>
            <path d="M 370 65 Q 350 60 340 80" fill="none" stroke="var(--accent-amber)" stroke-width="1"/>
            <path d="M 340 80 Q 340 100 355 100" fill="none" stroke="var(--accent-amber)" stroke-width="1"/>
            <path d="M 355 100 Q 375 110 380 95" fill="none" stroke="var(--accent-amber)" stroke-width="1"/>
            <path d="M 380 95 Q 385 75 370 65" fill="none" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="210" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Star (central hub), Bus (shared line), Ring (circular)</text>
        </svg>` },

        /* --- ENVIRONMENTAL SCIENCE --- */
        "carbon cycle": { title: "Carbon Cycle", svg: `<svg viewBox="0 0 420 250" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Carbon Cycle</text>
            <text x="210" y="50" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-secondary)">Atmospheric CO₂</text>
            <ellipse cx="210" cy="50" rx="60" ry="15" fill="rgba(200,200,200,0.2)" stroke="var(--text-secondary)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <path d="M 170 60 Q 140 80 120 100" fill="none" stroke="var(--accent-green)" stroke-width="1.5" marker-end="url(#arrow)"/>
            <text x="130" y="78" font-size="7" fill="var(--accent-green)">Photosynthesis</text>
            <rect x="60" y="100" width="80" height="40" rx="5" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="100" y="123" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Plants</text>
            <path d="M 140 120 Q 160 120 170 140" fill="none" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <text x="155" y="138" font-size="6" fill="var(--accent-saffron)">Feeding</text>
            <rect x="170" y="145" width="80" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="210" y="168" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Animals</text>
            <path d="M 170 165 Q 140 170 120 160" fill="none" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="120" y="158" font-size="6" fill="var(--accent-red)">Respiration</text>
            <path d="M 250 165 Q 280 170 300 160" fill="none" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="280" y="158" font-size="6" fill="var(--accent-red)">Respiration</text>
            <rect x="300" y="100" width="80" height="40" rx="5" fill="var(--accent-amber-light)" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <text x="340" y="123" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Fossil Fuels</text>
            <path d="M 250 145 Q 280 130 300 120" fill="none" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <text x="265" y="132" font-size="6" fill="var(--accent-saffron)">Combustion</text>
            <path d="M 300 140 Q 270 80 240 55" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <text x="270" y="65" font-size="6" fill="var(--text-secondary)">CO₂ release</text>
            <text x="210" y="248" text-anchor="middle" font-size="8" fill="var(--text-secondary)">CO₂ cycles between atmosphere, plants, animals, and fossil fuels</text>
        </svg>` },
        "rainwater harvesting": { title: "Rainwater Harvesting", svg: `<svg viewBox="0 0 400 250" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Rainwater Harvesting System</text>
            <polygon points="80,50 160,10 240,10 320,50" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="200" y="30" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Rooftop</text>
            <line x1="320" y1="50" x2="340" y2="80" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <text x="340" y="68" font-size="7" fill="var(--accent-blue)">Downpipe</text>
            <rect x="100" y="65" width="200" height="15" rx="3" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <text x="200" y="76" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Gutter / Collection System</text>
            <line x1="120" y1="80" x2="120" y2="110" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <line x1="280" y1="80" x2="280" y2="110" stroke="var(--accent-blue)" stroke-width="2.5"/>
            <rect x="80" y="110" width="80" height="60" rx="4" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="120" y="135" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Storage</text>
            <text x="120" y="148" text-anchor="middle" font-size="8" font-weight="600" fill="var(--text-primary)">Tank</text>
            <text x="120" y="160" text-anchor="middle" font-size="7" fill="var(--accent-blue)">(Water)</text>
            <rect x="240" y="110" width="80" height="60" rx="4" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="280" y="135" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Filter</text>
            <text x="280" y="150" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Unit</text>
            <line x1="160" y1="140" x2="240" y2="140" stroke="var(--accent-blue)" stroke-width="2"/>
            <line x1="280" y1="170" x2="280" y2="190" stroke="var(--accent-green)" stroke-width="2"/>
            <rect x="180" y="190" width="200" height="15" rx="3" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="280" y="200" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Groundwater Recharge / Reuse</text>
            <text x="200" y="248" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Rainwater collected from roof, filtered, stored for reuse</text>
        </svg>` },

        /* --- ECONOMICS --- */
        "demand supply": { title: "Demand and Supply Curve", svg: `<svg viewBox="0 0 400 240" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Demand & Supply Curve</text>
            <line x1="50" y1="200" x2="380" y2="200" stroke="var(--text-primary)" stroke-width="2"/>
            <text x="380" y="215" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Quantity →</text>
            <line x1="80" y1="20" x2="80" y2="200" stroke="var(--text-primary)" stroke-width="2"/>
            <text x="80" y="15" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Price ↑</text>
            <line x1="80" y1="180" x2="350" y2="50" stroke="var(--accent-green)" stroke-width="2.5"/>
            <text x="320" y="90" font-size="9" font-weight="700" fill="var(--accent-green)">Supply</text>
            <line x1="350" y1="180" x2="80" y2="50" stroke="var(--accent-red)" stroke-width="2.5"/>
            <text x="110" y="65" font-size="9" font-weight="700" fill="var(--accent-red)">Demand</text>
            <circle cx="215" cy="115" r="5" fill="var(--accent-amber)"/>
            <text x="225" y="110" font-size="8" font-weight="700" fill="var(--accent-amber)">Equilibrium</text>
            <text x="200" y="238" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Equilibrium price where Demand = Supply</text>
        </svg>` },

        /* --- CIVICS --- */
        parliament: { title: "Indian Parliament Structure", svg: `<svg viewBox="0 0 420 260" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Indian Parliament Structure</text>
            <rect x="150" y="40" width="120" height="40" rx="6" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="2"/>
            <text x="210" y="60" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">President of India</text>
            <text x="210" y="72" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Head of State)</text>
            <line x1="170" y1="80" x2="120" y2="110" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <line x1="250" y1="80" x2="300" y2="110" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <rect x="30" y="110" width="130" height="50" rx="6" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="95" y="135" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-primary)">Rajya Sabha</text>
            <text x="95" y="150" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Council of States)</text>
            <rect x="260" y="110" width="130" height="50" rx="6" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="325" y="135" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-primary)">Lok Sabha</text>
            <text x="325" y="150" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(House of People)</text>
            <text x="210" y="205" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Parliament = President + Lok Sabha + Rajya Sabha</text>
            <text x="210" y="225" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Lok Sabha: directly elected (545 members max)</text>
            <text x="210" y="240" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Rajya Sabha: indirectly elected (245 members max)</text>
            <text x="210" y="255" text-anchor="middle" font-size="8" fill="var(--text-secondary)">President: constitutional head, gives assent to bills</text>
        </svg>` },

        /* --- SPACE & ASTRONOMY --- */
        "moon phases": { title: "Phases of the Moon", svg: `<svg viewBox="0 0 420 230" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Phases of the Moon</text>
            <text x="30" y="55" font-size="7" fill="var(--text-secondary)">Sunlight →</text>
            <line x1="50" y1="50" x2="370" y2="50" stroke="var(--accent-amber)" stroke-width="1" stroke-dasharray="4,3"/>
            <circle cx="60" cy="90" r="15" fill="#ddd" stroke="#999" stroke-width="1"/>
            <text x="60" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">New Moon</text>
            <circle cx="120" cy="90" r="15" fill="#ddd" stroke="#999" stroke-width="1"/>
            <rect x="120" y="75" width="8" height="30" fill="var(--bg-card)"/>
            <text x="120" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Crescent</text>
            <circle cx="180" cy="90" r="15" fill="#ddd" stroke="#999" stroke-width="1"/>
            <rect x="180" y="75" width="15" height="30" fill="var(--bg-card)"/>
            <text x="180" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">First Quarter</text>
            <circle cx="240" cy="90" r="15" fill="#ddd" stroke="#999" stroke-width="1"/>
            <rect x="233" y="75" width="15" height="30" fill="var(--bg-card)"/>
            <text x="240" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Gibbous</text>
            <circle cx="300" cy="90" r="15" fill="#eee" stroke="#999" stroke-width="2"/>
            <text x="300" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Full Moon</text>
            <circle cx="360" cy="90" r="15" fill="#ddd" stroke="#999" stroke-width="1"/>
            <rect x="353" y="75" width="15" height="30" fill="var(--bg-card)"/>
            <text x="360" y="115" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Waning</text>
            <text x="210" y="145" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Moon orbits Earth, Sun lights different portions</text>
            <text x="210" y="160" text-anchor="middle" font-size="8" fill="var(--text-secondary)">New Moon → Crescent → Quarter → Gibbous → Full → Waning</text>
            <line x1="60" y1="170" x2="60" y2="190" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="210" cy="190" r="12" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="210" y="194" text-anchor="middle" font-size="7" fill="var(--text-primary)">Earth</text>
            <line x1="222" y1="190" x2="280" y2="185" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="300" cy="183" r="6" fill="#ddd" stroke="#999" stroke-width="1"/>
            <text x="308" y="186" font-size="6" fill="var(--text-secondary)">Moon</text>
            <text x="210" y="225" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Earth between Sun and Moon causes lunar phases</text>
        </svg>` },
        eclipse: { title: "Solar and Lunar Eclipse", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Solar & Lunar Eclipse</text>
            <text x="60" y="60" font-size="9" font-weight="700" fill="var(--accent-red)">SUN</text>
            <circle cx="40" cy="50" r="20" fill="#ffd700" stroke="#ff8c00" stroke-width="2"/>
            <text x="210" y="55" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent-blue)">Solar Eclipse</text>
            <line x1="60" y1="50" x2="300" y2="80" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="5,3"/>
            <line x1="60" y1="50" x2="300" y2="120" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="5,3"/>
            <circle cx="150" cy="85" r="10" fill="#ddd" stroke="#999" stroke-width="1.5"/>
            <text x="150" y="78" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Moon</text>
            <circle cx="300" cy="100" r="15" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="300" y="105" text-anchor="middle" font-size="7" fill="var(--text-primary)">Earth</text>
            <text x="320" y="95" font-size="6" fill="var(--text-secondary)">Umbra</text>
            <rect x="160" y="70" width="10" height="25" fill="#333" opacity="0.3"/>
            <text x="210" y="145" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent-red)">Lunar Eclipse</text>
            <circle cx="40" cy="190" r="20" fill="#ffd700" stroke="#ff8c00" stroke-width="2"/>
            <text x="60" y="195" font-size="7" fill="var(--text-secondary)">Sun</text>
            <line x1="60" y1="190" x2="300" y2="175" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="5,3"/>
            <circle cx="300" cy="175" r="15" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1.5"/>
            <text x="300" y="180" text-anchor="middle" font-size="7" fill="var(--text-primary)">Earth</text>
            <circle cx="200" cy="180" r="10" fill="#ddd" stroke="#999" stroke-width="1"/>
            <text x="200" y="183" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Moon</text>
            <text x="210" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Solar: Moon between Sun & Earth. Lunar: Earth between Sun & Moon</text>
        </svg>` },
        "life cycle star": { title: "Life Cycle of a Star", svg: `<svg viewBox="0 0 450 260" width="100%" height="100%">
            <text x="225" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Life Cycle of a Star</text>
            <ellipse cx="70" cy="80" rx="25" ry="15" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="70" y="84" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Nebula</text>
            <path d="M 95 80 Q 120 80 130 80" fill="none" stroke="var(--text-secondary)" stroke-width="1.5" marker-end="url(#arrow)"/>
            <circle cx="145" cy="80" r="12" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="1.5"/>
            <text x="145" y="84" text-anchor="middle" font-size="6" fill="var(--text-primary)">Proto</text>
            <path d="M 157 80 Q 175 80 180 70" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <circle cx="195" cy="60" r="15" fill="#ffd700" stroke="#ff8c00" stroke-width="2"/>
            <text x="195" y="64" text-anchor="middle" font-size="7" font-weight="700" fill="#333">Main</text>
            <text x="195" y="73" text-anchor="middle" font-size="6" fill="#333">Sequence</text>
            <path d="M 210 60 Q 230 55 240 65" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <circle cx="255" cy="70" r="14" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="1.5"/>
            <text x="255" y="74" text-anchor="middle" font-size="6" fill="var(--text-primary)">Red</text>
            <text x="255" y="82" text-anchor="middle" font-size="6" fill="var(--text-primary)">Giant</text>
            <path d="M 269 70 Q 285 70 290 80" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <path d="M 269 70 Q 285 60 295 50" fill="none" stroke="var(--text-secondary)" stroke-width="1.5"/>
            <circle cx="305" cy="90" r="8" fill="#eee" stroke="#999" stroke-width="1"/>
            <text x="305" y="93" text-anchor="middle" font-size="5" fill="#333">WD</text>
            <text x="290" y="108" font-size="6" fill="var(--text-secondary)">White Dwarf</text>
            <circle cx="310" cy="40" r="10" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
            <text x="310" y="44" text-anchor="middle" font-size="6" fill="var(--text-primary)">Neutron</text>
            <circle cx="370" cy="50" r="12" fill="#1a1a2e" stroke="#888" stroke-width="2"/>
            <text x="370" y="54" text-anchor="middle" font-size="6" fill="#888">Black</text>
            <text x="370" y="62" text-anchor="middle" font-size="6" fill="#888">Hole</text>
            <text x="225" y="245" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Massive stars → Neutron Star / Black Hole. Small stars → White Dwarf</text>
        </svg>` },
        comet: { title: "Structure of a Comet", svg: `<svg viewBox="0 0 420 220" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Structure of a Comet</text>
            <circle cx="100" cy="110" r="15" fill="#ddd" stroke="#999" stroke-width="2"/>
            <text x="100" y="115" text-anchor="middle" font-size="7" font-weight="600" fill="#333">Nucleus</text>
            <circle cx="100" cy="110" r="25" fill="rgba(200,200,200,0.3)" stroke="#aaa" stroke-width="1" stroke-dasharray="3,2"/>
            <text x="100" y="140" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Coma</text>
            <line x1="115" y1="105" x2="350" y2="60" stroke="var(--accent-amber)" stroke-width="4" opacity="0.4"/>
            <line x1="115" y1="110" x2="370" y2="100" stroke="var(--accent-amber)" stroke-width="3" opacity="0.3"/>
            <line x1="115" y1="118" x2="340" y2="130" stroke="var(--accent-amber)" stroke-width="2" opacity="0.25"/>
            <text x="300" y="55" font-size="7" fill="var(--accent-amber)">Tail (Gas + Dust)</text>
            <text x="50" y="50" font-size="7" fill="var(--text-secondary)">← Sun</text>
            <line x1="40" y1="65" x2="85" y2="105" stroke="var(--accent-amber)" stroke-width="1" stroke-dasharray="3,2"/>
            <text x="210" y="175" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Comet: icy nucleus heats up near Sun, forms coma and tail</text>
            <text x="210" y="190" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Tail always points away from Sun due to solar wind</text>
        </svg>` },
        telescope: { title: "Refracting Telescope", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Refracting Telescope</text>
            <rect x="60" y="90" width="300" height="60" rx="8" fill="var(--bg-card)" stroke="var(--text-secondary)" stroke-width="2"/>
            <text x="210" y="145" text-anchor="middle" font-size="9" font-weight="600" fill="var(--text-primary)">Telescope Tube</text>
            <ellipse cx="80" cy="120" rx="12" ry="25" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="50" y="120" font-size="8" fill="var(--accent-blue)">Objective Lens</text>
            <text x="50" y="132" font-size="7" fill="var(--text-secondary)">(Large, converges light)</text>
            <ellipse cx="340" cy="120" rx="6" ry="15" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="2"/>
            <text x="370" y="115" font-size="8" fill="var(--accent-green)">Eyepiece</text>
            <text x="370" y="127" font-size="7" fill="var(--text-secondary)">(Magnifies image)</text>
            <line x1="60" y1="70" x2="80" y2="95" stroke="var(--accent-amber)" stroke-width="1.5" stroke-dasharray="4,2"/>
            <text x="30" y="68" font-size="7" fill="var(--accent-amber)">Distant object</text>
            <line x1="80" y1="95" x2="340" y2="110" stroke="var(--accent-red)" stroke-width="1.5" stroke-dasharray="3,2"/>
            <text x="200" y="100" font-size="7" fill="var(--accent-red)">Light path</text>
            <text x="210" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Objective collects light, eyepiece magnifies the image</text>
        </svg>` },
        "big bang": { title: "Big Bang Theory", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Big Bang Theory — Timeline of Universe</text>
            <circle cx="50" cy="120" r="8" fill="var(--accent-amber)" stroke="var(--accent-amber)" stroke-width="1"/>
            <text x="50" y="105" text-anchor="middle" font-size="6" fill="var(--accent-amber)">Bang</text>
            <line x1="58" y1="120" x2="380" y2="120" stroke="var(--text-secondary)" stroke-width="2"/>
            <line x1="58" y1="115" x2="58" y2="125" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="110" cy="120" r="6" fill="var(--accent-blue-light)" stroke="var(--accent-blue)" stroke-width="1"/>
            <line x1="110" y1="115" x2="110" y2="125" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="110" y="110" text-anchor="middle" font-size="5" fill="var(--accent-blue)">10⁻⁴³s</text>
            <circle cx="170" cy="120" r="7" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1"/>
            <line x1="170" y1="115" x2="170" y2="125" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="170" y="108" text-anchor="middle" font-size="5" fill="var(--accent-green)">Inflation</text>
            <circle cx="230" cy="120" r="8" fill="var(--accent-saffron-light)" stroke="var(--accent-saffron)" stroke-width="1"/>
            <line x1="230" y1="112" x2="230" y2="128" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="230" y="108" text-anchor="middle" font-size="5" fill="var(--accent-saffron)">Recombination</text>
            <circle cx="290" cy="120" r="8" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1"/>
            <line x1="290" y1="112" x2="290" y2="128" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="290" y="108" text-anchor="middle" font-size="5" fill="var(--accent-violet)">First Stars</text>
            <circle cx="350" cy="120" r="10" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <line x1="350" y1="110" x2="350" y2="130" stroke="var(--text-secondary)" stroke-width="1"/>
            <text x="350" y="100" text-anchor="middle" font-size="5" fill="var(--accent-amber)">Present Day</text>
            <text x="170" y="145" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Universe expands &amp; cools → atoms form → stars &amp; galaxies</text>
            <text x="210" y="230" text-anchor="middle" font-size="8" fill="var(--text-secondary)">13.8 billion years ago: universe began from a singularity</text>
        </svg>` },
        "black hole": { title: "Black Hole Structure", svg: `<svg viewBox="0 0 420 240" width="100%" height="100%">
            <text x="210" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Black Hole Structure</text>
            <circle cx="210" cy="130" r="60" fill="none" stroke="var(--accent-violet)" stroke-width="2" stroke-dasharray="6,3"/>
            <text x="280" y="65" font-size="7" fill="var(--text-secondary)">Event Horizon</text>
            <line x1="270" y1="70" x2="240" y2="80" stroke="var(--text-secondary)" stroke-width="1"/>
            <circle cx="210" cy="130" r="20" fill="#1a1a2e" stroke="#555" stroke-width="2"/>
            <text x="210" y="130" text-anchor="middle" font-size="8" font-weight="700" fill="#888">Singularity</text>
            <text x="210" y="145" text-anchor="middle" font-size="6" fill="#666">(Infinite density)</text>
            <ellipse cx="210" cy="130" rx="80" ry="25" fill="none" stroke="var(--accent-amber)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="290" y="145" font-size="7" fill="var(--accent-amber)">Accretion Disk</text>
            <path d="M 150 130 Q 130 100 140 70 Q 160 40 200 50" fill="none" stroke="var(--accent-amber)" stroke-width="1.5" opacity="0.5"/>
            <path d="M 270 130 Q 290 160 280 190 Q 260 220 220 210" fill="none" stroke="var(--accent-amber)" stroke-width="1.5" opacity="0.5"/>
            <text x="210" y="235" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Nothing escapes beyond event horizon — not even light</text>
        </svg>` },
        "female reproductive system": { title: "Female Reproductive System", svg: `<svg viewBox="0 0 400 280" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Female Reproductive System</text>
            <ellipse cx="130" cy="80" rx="30" ry="18" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="130" y="85" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Ovary</text>
            <ellipse cx="270" cy="80" rx="30" ry="18" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="270" y="85" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Ovary</text>
            <text x="200" y="65" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Ovaries produce eggs (ova)</text>
            <path d="M 130 98 Q 130 110 145 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="100" y="120" font-size="7" fill="var(--accent-blue)">Fallopian</text>
            <text x="100" y="130" font-size="7" fill="var(--accent-blue)">Tube</text>
            <path d="M 270 98 Q 270 110 255 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="280" y="120" font-size="7" fill="var(--accent-blue)">Fallopian</text>
            <text x="280" y="130" font-size="7" fill="var(--accent-blue)">Tube</text>
            <path d="M 145 120 L 160 130 L 240 130 L 255 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <path d="M 160 130 Q 160 140 200 140 Q 240 140 240 130" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <rect x="150" y="135" width="100" height="40" rx="6" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="200" y="155" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Uterus</text>
            <text x="200" y="168" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Womb)</text>
            <path d="M 175 175 Q 175 200 160 210" fill="none" stroke="var(--accent-violet)" stroke-width="2.5"/>
            <path d="M 225 175 Q 225 200 240 210" fill="none" stroke="var(--accent-violet)" stroke-width="2.5"/>
            <rect x="165" y="210" width="70" height="25" rx="4" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="200" y="227" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Cervix</text>
            <ellipse cx="200" cy="240" rx="30" ry="12" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1.5"/>
            <text x="200" y="244" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Vagina</text>
            <text x="200" y="270" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Ovary → Fallopian Tube → Uterus → Cervix → Vagina</text>
        </svg>` },
        "female reproductive": { title: "Female Reproductive System", svg: `<svg viewBox="0 0 400 280" width="100%" height="100%">
            <text x="200" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">Female Reproductive System</text>
            <ellipse cx="130" cy="80" rx="30" ry="18" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="130" y="85" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Ovary</text>
            <ellipse cx="270" cy="80" rx="30" ry="18" fill="var(--accent-amber-light)" stroke="var(--accent-amber)" stroke-width="1.5"/>
            <text x="270" y="85" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Ovary</text>
            <text x="200" y="65" text-anchor="middle" font-size="7" fill="var(--text-secondary)">Ovaries produce eggs (ova)</text>
            <path d="M 130 98 Q 130 110 145 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="100" y="120" font-size="7" fill="var(--accent-blue)">Fallopian</text>
            <text x="100" y="130" font-size="7" fill="var(--accent-blue)">Tube</text>
            <path d="M 270 98 Q 270 110 255 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <text x="280" y="120" font-size="7" fill="var(--accent-blue)">Fallopian</text>
            <text x="280" y="130" font-size="7" fill="var(--accent-blue)">Tube</text>
            <path d="M 145 120 L 160 130 L 240 130 L 255 120" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <path d="M 160 130 Q 160 140 200 140 Q 240 140 240 130" fill="none" stroke="var(--accent-blue)" stroke-width="2"/>
            <rect x="150" y="135" width="100" height="40" rx="6" fill="var(--accent-red-light)" stroke="var(--accent-red)" stroke-width="2"/>
            <text x="200" y="155" text-anchor="middle" font-size="9" font-weight="700" fill="var(--text-primary)">Uterus</text>
            <text x="200" y="168" text-anchor="middle" font-size="7" fill="var(--text-secondary)">(Womb)</text>
            <path d="M 175 175 Q 175 200 160 210" fill="none" stroke="var(--accent-violet)" stroke-width="2.5"/>
            <path d="M 225 175 Q 225 200 240 210" fill="none" stroke="var(--accent-violet)" stroke-width="2.5"/>
            <rect x="165" y="210" width="70" height="25" rx="4" fill="var(--accent-green-light)" stroke="var(--accent-green)" stroke-width="1.5"/>
            <text x="200" y="227" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Cervix</text>
            <ellipse cx="200" cy="240" rx="30" ry="12" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="1.5"/>
            <text x="200" y="244" text-anchor="middle" font-size="7" font-weight="600" fill="var(--text-primary)">Vagina</text>
            <text x="200" y="270" text-anchor="middle" font-size="8" fill="var(--text-secondary)">Ovary → Fallopian Tube → Uterus → Cervix → Vagina</text>
        </svg>` }
    },

    renderDiagramGenerator(el) {
        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-diagram-project" style="color:var(--accent-violet)"></i> Diagram Generator</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary);">Type a topic to generate an SVG study diagram with labeled parts:</p>
            
            <div style="display:flex; align-items:center; gap:8px;">
                <input class="settings-input" type="text" id="diagram-topic-input" placeholder="e.g. Photosynthesis, Human Heart, Water Cycle..." style="flex:1;">
                <button class="primary-btn" onclick="tools.generateDiagram()" style="width:auto; padding:8px 14px;"><i class="fa-solid fa-image"></i> Draw</button>
            </div>
            
            <div id="diagram-topic-suggestions" style="display:flex; flex-wrap:wrap; gap:6px; font-size:10px;">
                <span style="color:var(--text-secondary); margin-right:4px;">Try:</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Photosynthesis')">Photosynthesis</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Human Heart')">Heart</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Plant Cell')">Plant Cell</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Animal Cell')">Animal Cell</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Nephron')">Nephron</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('DNA')">DNA</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Atomic Structure')">Atom</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('pH Scale')">pH Scale</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Electrolysis')">Electrolysis</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Distillation')">Distillation</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('EM Spectrum')">EM Spectrum</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Reflection')">Reflection</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Convex Lens')">Convex Lens</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Electric Motor')">Motor</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Transformer')">Transformer</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Pendulum')">Pendulum</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Pythagoras')">Pythagoras</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Triangles')">Triangles</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Coordinate Geometry')">Coords</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Earth Layers')">Earth Layers</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Volcano')">Volcano</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Atmosphere')">Atmosphere</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Block Diagram')">Computer</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Network Topology')">Topology</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Carbon Cycle')">Carbon Cycle</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Rainwater Harvesting')">Rainwater</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Demand Supply')">Demand Supply</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Parliament')">Parliament</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Male Reproductive System')">Male Reproductive</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Water Cycle')">Water Cycle</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Neuron')">Neuron</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Flower')">Flower</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Eye')">Eye</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Refraction')">Refraction</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Solar System')">Solar System</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Respiratory System')">Respiratory</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Digestive System')">Digestive</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Moon Phases')">Moon Phases</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Eclipse')">Eclipse</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Life Cycle Star')">Star Life Cycle</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Comet')">Comet</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Telescope')">Telescope</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Big Bang')">Big Bang</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Black Hole')">Black Hole</span>
                <span class="challenge-opt" style="padding:4px 8px; cursor:pointer;" onclick="tools.diagramQuickTopic('Female Reproductive System')">Female Reproductive</span>
            </div>
            
            <div id="diagram-output" style="display:none; margin-top:10px;">
                <div style="font-size:12px; font-weight:700; margin-bottom:6px;" id="diagram-title"></div>
                <div class="svg-diagram-canvas" id="diagram-canvas" style="background:var(--bg-surface); border-radius:var(--radius-md); padding:10px;"></div>
            </div>
        `;
    },

    diagramQuickTopic(topic) {
        document.getElementById('diagram-topic-input').value = topic;
        this.generateDiagram();
    },

    async generateDiagram() {
        const topic = document.getElementById('diagram-topic-input').value.trim().toLowerCase();
        if (!topic) return;

        const output = document.getElementById('diagram-output');
        const title = document.getElementById('diagram-title');
        const canvas = document.getElementById('diagram-canvas');
        const btn = document.querySelector('#modal-content-area .primary-btn');
        
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Drawing...`;

        try {
            // Find best matching diagram (exact match → word match → longest key)
            let match = null;
            let bestScore = -1;
            for (const key in this.diagramDb) {
                const lowerKey = key.toLowerCase();
                if (topic === lowerKey) {
                    match = this.diagramDb[key];
                    break;
                }
                if (topic.includes(lowerKey) || lowerKey.includes(topic)) {
                    let score = lowerKey.length;
                    // Big bonus if user's input is a whole word inside the key
                    const wordPat = new RegExp('\\b' + topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
                    if (wordPat.test(lowerKey)) score += 1000;
                    if (score > bestScore) {
                        bestScore = score;
                        match = this.diagramDb[key];
                    }
                }
            }

            if (match) {
                title.textContent = match.title;
                canvas.innerHTML = match.svg;
                output.style.display = 'block';
                gamification.addXP(30, btn);
            } else {
                // Generic diagram fallback
                const capTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
                title.textContent = capTopic + ' Diagram';
                canvas.innerHTML = `<svg viewBox="0 0 340 200" width="100%" height="100%">
                    <text x="170" y="30" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text-primary)">${capTopic}</text>
                    <rect x="50" y="50" width="240" height="120" rx="10" fill="var(--accent-violet-light)" stroke="var(--accent-violet)" stroke-width="2"/>
                    <text x="170" y="100" text-anchor="middle" font-size="18" font-weight="700" fill="var(--accent-violet)">${capTopic}</text>
                    <text x="170" y="125" text-anchor="middle" font-size="10" fill="var(--text-secondary)">Study Diagram — Labeled Parts</text>
                    <text x="170" y="145" text-anchor="middle" font-size="9" fill="var(--text-secondary)">Review your ${topic} chapter for detailed</text>
                    <text x="170" y="158" text-anchor="middle" font-size="9" fill="var(--text-secondary)">diagrams with labeled parts and functions.</text>
                </svg>`;
                output.style.display = 'block';
                gamification.addXP(15, btn);
            }
        } catch (error) {
            console.error(error);
            alert("Could not generate diagram. Try a different topic.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-image"></i> Draw`;
        }
    },

    /* --- 5. GAMIFIED LEADERBOARD --- */
    renderLeaderboard(el) {
        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-trophy" style="color:var(--accent-blue)"></i> Live Leaderboard</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary);">Real-time ranking of all registered scholars based on Study XP.</p>
            <div class="leaderboard-list" id="leaderboard-live" style="margin-top:12px;">
                <p style="text-align:center; color:var(--text-secondary); font-size:11px;">Loading...</p>
            </div>
        `;

        var userId = typeof app !== 'undefined' ? app.userId : 'guest';
        var container = document.getElementById('leaderboard-live');
        if (!container) return;

        // Remove old listener before adding new one
        if (this._leaderboardRef) this._leaderboardRef.off();
        this._leaderboardRef = database.ref('leaderboard');
        this._leaderboardRef.orderByChild('xp').limitToLast(50).on('value', function(snap) {
            var entries = [];
            snap.forEach(function(child) {
                entries.push({ id: child.key, name: child.val().name, xp: child.val().xp });
            });
            entries.reverse();

            if (entries.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:11px;">No scholars yet. Be the first!</p>';
                return;
            }

            var medals = ['🥇', '🥈', '🥉'];
            container.innerHTML = entries.map(function(l, i) {
                var isYou = l.id === userId;
                var medal = i < 3 ? medals[i] : (i + 1);
                return '<div class="leaderboard-row" style="' + (isYou ? 'border-color:var(--accent-violet); background:var(--accent-violet-light)' : '') + '">' +
                    '<div class="leaderboard-rank-col">' +
                        '<span class="rank-number">' + medal + '</span>' +
                        '<span class="topper-name">' + l.name + (isYou ? ' (You)' : '') + '</span>' +
                    '</div>' +
                    '<span class="leaderboard-xp-col">' + l.xp + ' XP</span>' +
                '</div>';
            }).join('');
        });
    },

    /* --- 6. STANDALONE AI CHALLENGE MODE --- */
    challengesDb: [
        /* ===== STANDARD MODE (All Subjects) ===== */
        // Biology
        {
            mode: "standard",
            subject: "Biology",
            q: "Which element is essential for the synthesis of thyroxine hormone in the human body?",
            o: ["Iron", "Iodine", "Sodium", "Calcium"],
            c: 1,
            desc: "Iodine is required by the thyroid gland to construct thyroxine."
        },
        {
            mode: "standard",
            subject: "Biology",
            q: "What is the powerhouse of the cell?",
            o: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"],
            c: 2,
            desc: "Mitochondria generate most of the cell's ATP through oxidative phosphorylation."
        },
        // Physics
        {
            mode: "standard",
            subject: "Physics",
            q: "What is the unit of electrical potential difference?",
            o: ["Ampere", "Ohm", "Watt", "Volt"],
            c: 3,
            desc: "Volt is the SI unit of potential difference, named after Alessandro Volta."
        },
        {
            mode: "standard",
            subject: "Physics",
            q: "Which law states that energy cannot be created or destroyed?",
            o: ["Newton's First Law", "Law of Conservation of Energy", "Ohm's Law", "Hooke's Law"],
            c: 1,
            desc: "Energy can only be converted from one form to another, never created or destroyed."
        },
        // Mathematics
        {
            mode: "standard",
            subject: "Mathematics",
            q: "What is the value of the discriminant of the quadratic equation x² - 6x + 9 = 0?",
            o: ["9", "0", "-18", "36"],
            c: 1,
            desc: "D = b² - 4ac = (-6)² - 4(1)(9) = 36 - 36 = 0, indicating real and equal roots."
        },
        {
            mode: "standard",
            subject: "Mathematics",
            q: "What is the sum of angles in a triangle?",
            o: ["180°", "360°", "270°", "90°"],
            c: 0,
            desc: "The interior angles of any triangle always add up to 180 degrees."
        },
        // Chemistry
        {
            mode: "standard",
            subject: "Chemistry",
            q: "Which gas turns lime water milky when passed through it?",
            o: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen Dioxide"],
            c: 2,
            desc: "Carbon dioxide reacts with calcium hydroxide (lime water) to form insoluble calcium carbonate, causing milkiness."
        },
        {
            mode: "standard",
            subject: "Chemistry",
            q: "What is the chemical symbol for gold?",
            o: ["Go", "Gd", "Au", "Ag"],
            c: 2,
            desc: "Au comes from the Latin word 'aurum', meaning gold."
        },
        // History
        {
            mode: "standard",
            subject: "History",
            q: "In which year was the Indian National Congress (INC) founded?",
            o: ["1857", "1885", "1905", "1915"],
            c: 1,
            desc: "The Indian National Congress was founded in December 1885 by retired civil servant Allan Octavian Hume."
        },
        {
            mode: "standard",
            subject: "History",
            q: "Who was the first emperor of the Maurya dynasty?",
            o: ["Ashoka", "Bindusara", "Chandragupta Maurya", "Harshavardhana"],
            c: 2,
            desc: "Chandragupta Maurya founded the Maurya Empire around 322 BCE with guidance from Chanakya."
        },
        // Geography
        {
            mode: "standard",
            subject: "Geography",
            q: "What is the largest continent by area?",
            o: ["Africa", "North America", "Asia", "Europe"],
            c: 2,
            desc: "Asia covers about 44.58 million sq km, making it the largest continent."
        },
        {
            mode: "standard",
            subject: "Geography",
            q: "Which is the longest river in the world?",
            o: ["Amazon", "Nile", "Ganges", "Yangtze"],
            c: 1,
            desc: "The Nile River stretches approximately 6,650 km through northeastern Africa."
        },
        // Civics
        {
            mode: "standard",
            subject: "Civics",
            q: "What is the supreme law of India?",
            o: ["Indian Penal Code", "Constitution of India", "Civil Procedure Code", "Criminal Procedure Code"],
            c: 1,
            desc: "The Constitution of India, adopted on 26 January 1950, is the supreme legal document."
        },
        {
            mode: "standard",
            subject: "Civics",
            q: "How many fundamental duties are listed in the Indian Constitution?",
            o: ["10", "11", "9", "12"],
            c: 1,
            desc: "There are 11 fundamental duties listed under Article 51A of the Indian Constitution."
        },
        // Economics
        {
            mode: "standard",
            subject: "Economics",
            q: "What does GDP stand for?",
            o: ["Gross Domestic Product", "General Development Plan", "Gross Demand Price", "Government Deposit Policy"],
            c: 0,
            desc: "GDP is the total monetary value of all finished goods and services produced within a country."
        },
        {
            mode: "standard",
            subject: "Economics",
            q: "What is the law of demand?",
            o: ["Price and quantity supplied are directly related", "Price and quantity demanded are inversely related", "Demand always exceeds supply", "Supply always exceeds demand"],
            c: 1,
            desc: "As price increases, quantity demanded decreases, and vice versa, assuming other factors remain constant."
        },
        // English
        {
            mode: "standard",
            subject: "English",
            q: "Identify the figure of speech: 'The world is a stage.'",
            o: ["Simile", "Metaphor", "Personification", "Hyperbole"],
            c: 1,
            desc: "A metaphor directly compares two unlike things without using 'like' or 'as'."
        },
        {
            mode: "standard",
            subject: "English",
            q: "What is the past tense of 'go'?",
            o: ["Goed", "Gone", "Went", "Going"],
            c: 2,
            desc: "'Went' is the irregular past tense form of the verb 'go'."
        },
        // Computer Science
        {
            mode: "standard",
            subject: "Computer Science",
            q: "What does CPU stand for?",
            o: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"],
            c: 0,
            desc: "The CPU is the primary component that executes instructions in a computer."
        },
        {
            mode: "standard",
            subject: "Computer Science",
            q: "Which data structure uses FIFO (First In First Out) principle?",
            o: ["Stack", "Queue", "Array", "Tree"],
            c: 1,
            desc: "A queue follows the First In First Out principle, like a line of people."
        },
        // Environmental Science
        {
            mode: "standard",
            subject: "Environmental Science",
            q: "What is the primary cause of the greenhouse effect?",
            o: ["Ozone depletion", "Carbon dioxide emissions", "Deforestation", "Volcanic eruptions"],
            c: 1,
            desc: "CO₂ and other greenhouse gases trap heat in the atmosphere, leading to global warming."
        },
        {
            mode: "standard",
            subject: "Environmental Science",
            q: "What percentage of Earth's water is freshwater?",
            o: ["0.5%", "2.5%", "10%", "25%"],
            c: 1,
            desc: "Only about 2.5% of Earth's water is freshwater, and most is locked in glaciers."
        },

        /* ===== CBSE & ICSE MODE (All Subjects) ===== */
        // Chemistry
        {
            mode: "cbse",
            subject: "Chemistry",
            q: "Under CBSE criteria, which type of chemical equation represents the reaction of iron with steam?",
            o: ["Combination", "Redox & Displacement", "Decomposition", "Double Displacement"],
            c: 1,
            desc: "3Fe + 4H₂O → Fe₃O₄ + 4H₂ is a redox reaction where iron is oxidized and steam is reduced."
        },
        {
            mode: "cbse",
            subject: "Chemistry",
            q: "What is the pH of a neutral solution at 25°C?",
            o: ["0", "7", "14", "1"],
            c: 1,
            desc: "A pH of 7 is neutral at standard temperature. Values below 7 are acidic, above 7 are basic."
        },
        // Physics
        {
            mode: "cbse",
            subject: "Physics",
            q: "A student traces the path of a ray of light through a glass slab. What is the relation between angle of incidence (i) and angle of emergence (e)?",
            o: ["i > e", "i < e", "i = e", "i + e = 90°"],
            c: 2,
            desc: "For a rectangular glass slab with parallel refracting faces, the angle of incidence equals the angle of emergence."
        },
        {
            mode: "cbse",
            subject: "Physics",
            q: "What is the power of a convex lens of focal length 50 cm?",
            o: ["+2 D", "-2 D", "+0.5 D", "-0.5 D"],
            c: 0,
            desc: "Power P = 1/f (in meters) = 1/0.5 = +2 Dioptres. Convex lenses have positive power."
        },
        // Biology
        {
            mode: "cbse",
            subject: "Biology",
            q: "Which chamber of the human heart has the thickest muscular wall to pump blood to the entire body?",
            o: ["Right Atrium", "Left Atrium", "Right Ventricle", "Left Ventricle"],
            c: 3,
            desc: "The left ventricle pumps oxygenated blood throughout the systemic circulation, requiring the highest pressure."
        },
        {
            mode: "cbse",
            subject: "Biology",
            q: "What process in plants produces oxygen as a byproduct?",
            o: ["Respiration", "Transpiration", "Photosynthesis", "Fermentation"],
            c: 2,
            desc: "During photosynthesis, plants convert CO₂ and water into glucose and oxygen using sunlight."
        },
        // Mathematics
        {
            mode: "cbse",
            subject: "Mathematics",
            q: "If the HCF of two numbers is 15 and their product is 3375, what is their LCM?",
            o: ["150", "225", "335", "50625"],
            c: 1,
            desc: "Product of HCF and LCM equals the product of the two numbers. LCM = 3375 / 15 = 225."
        },
        {
            mode: "cbse",
            subject: "Mathematics",
            q: "What is the value of sin²θ + cos²θ?",
            o: ["0", "1", "-1", "sec²θ"],
            c: 1,
            desc: "The Pythagorean identity states that sin²θ + cos²θ = 1 for any angle θ."
        },
        // History
        {
            mode: "cbse",
            subject: "History",
            q: "Who wrote the famous book 'Hind Swaraj' in 1909?",
            o: ["Jawaharlal Nehru", "Subhas Chandra Bose", "Mahatma Gandhi", "Bal Gangadhar Tilak"],
            c: 2,
            desc: "Mahatma Gandhi wrote Hind Swaraj in Gujarati, outlining his theory of self-rule and non-cooperation."
        },
        {
            mode: "cbse",
            subject: "History",
            q: "The Quit India Movement was launched in which year?",
            o: ["1930", "1942", "1945", "1920"],
            c: 1,
            desc: "Mahatma Gandhi launched the Quit India Movement on 8 August 1942, demanding an end to British rule."
        },
        // Geography
        {
            mode: "cbse",
            subject: "Geography",
            q: "Which type of soil is most suitable for cotton cultivation in India?",
            o: ["Alluvial", "Laterite", "Black", "Red"],
            c: 2,
            desc: "Black soil (Regur) is rich in clay and retains moisture, making it ideal for cotton."
        },
        {
            mode: "cbse",
            subject: "Geography",
            q: "Which is the largest freshwater lake in India?",
            o: ["Chilika Lake", "Wular Lake", "Sambhar Lake", "Loktak Lake"],
            c: 1,
            desc: "Wular Lake in Jammu and Kashmir is the largest freshwater lake in India."
        },
        // Civics
        {
            mode: "cbse",
            subject: "Civics",
            q: "How many members can the President of India nominate to the Rajya Sabha?",
            o: ["10", "12", "14", "16"],
            c: 1,
            desc: "The President nominates 12 members to the Rajya Sabha from fields like art, literature, science, and social service."
        },
        {
            mode: "cbse",
            subject: "Civics",
            q: "What is the minimum age required to become the Prime Minister of India?",
            o: ["18 years", "25 years", "30 years", "35 years"],
            c: 1,
            desc: "A candidate must be at least 25 years old to become the Prime Minister of India."
        },
        // Economics
        {
            mode: "cbse",
            subject: "Economics",
            q: "What is the primary objective of the Reserve Bank of India's monetary policy?",
            o: ["Profit maximization", "Price stability", "Employment generation", "Export promotion"],
            c: 1,
            desc: "The RBI's primary goal is maintaining price stability while keeping growth in mind."
        },
        {
            mode: "cbse",
            subject: "Economics",
            q: "What does 'disposable income' mean?",
            o: ["Income before tax", "Income after tax deductions", "Total savings", "Government subsidy amount"],
            c: 1,
            desc: "Disposable income is the amount left after paying direct taxes, available for spending or saving."
        },
        // English
        {
            mode: "cbse",
            subject: "English",
            q: "What poetic device is used in 'the trees seem to clap their hands'?",
            o: ["Simile", "Personification", "Alliteration", "Onomatopoeia"],
            c: 1,
            desc: "Personification gives human qualities (clapping) to non-human things (trees)."
        },
        {
            mode: "cbse",
            subject: "English",
            q: "Who wrote the poem 'The Road Not Taken'?",
            o: ["William Wordsworth", "Robert Frost", "John Keats", "T.S. Eliot"],
            c: 1,
            desc: "Robert Frost wrote this iconic poem about choices and their impact on life."
        },
        // Computer Science
        {
            mode: "cbse",
            subject: "Computer Science",
            q: "What is the full form of HTML?",
            o: ["HyperText Markup Language", "High Tech Modern Language", "HyperTransfer Markup Language", "Home Tool Markup Language"],
            c: 0,
            desc: "HTML is the standard markup language used to create and structure content on the web."
        },
        {
            mode: "cbse",
            subject: "Computer Science",
            q: "Which of the following is an example of a DBMS?",
            o: ["HTML", "MySQL", "Python", "Windows"],
            c: 1,
            desc: "MySQL is a relational database management system used for storing and managing data."
        },
        // Environmental Science
        {
            mode: "cbse",
            subject: "Environmental Science",
            q: "What is the primary cause of ozone layer depletion?",
            o: ["Carbon dioxide", "Chlorofluorocarbons (CFCs)", "Sulfur dioxide", "Nitrogen oxides"],
            c: 1,
            desc: "CFCs released from refrigerants, aerosols, and foams break down ozone molecules in the stratosphere."
        },
        {
            mode: "cbse",
            subject: "Environmental Science",
            q: "What is the term for the variety of life forms in an ecosystem?",
            o: ["Biomass", "Biodiversity", "Population density", "Carrying capacity"],
            c: 1,
            desc: "Biodiversity encompasses the variety of species, genes, and ecosystems in a region."
        },

        /* ===== JEE & NEET MODE (Science / Math) ===== */
        // Physics
        {
            mode: "jee",
            subject: "Physics",
            q: "For a particle executing simple harmonic motion (SHM), what is the phase difference between velocity and acceleration?",
            o: ["Zero", "π/2 rad", "π rad", "π/4 rad"],
            c: 1,
            desc: "Acceleration leads velocity by a phase angle of π/2 radians (90 degrees) in SHM."
        },
        {
            mode: "jee",
            subject: "Physics",
            q: "What is the ratio of speed of light in vacuum to the speed of light in a medium of refractive index 1.5?",
            o: ["1.5", "0.67", "1.0", "2.25"],
            c: 0,
            desc: "Refractive index n = c/v. Therefore, the ratio of c to v is exactly n = 1.5."
        },
        {
            mode: "jee",
            subject: "Physics",
            q: "What is the dimensional formula of Planck's constant?",
            o: ["[ML²T⁻¹]", "[ML²T⁻²]", "[ML²T⁻³]", "[MLT⁻¹]"],
            c: 0,
            desc: "Planck's constant (h) has dimensions of action = energy × time = [ML²T⁻²]×[T] = [ML²T⁻¹]."
        },
        // Mathematics
        {
            mode: "jee",
            subject: "Mathematics",
            q: "What is the coordinates of the focus of the parabola y² = -16x?",
            o: ["(4, 0)", "(-4, 0)", "(0, 4)", "(0, -4)"],
            c: 1,
            desc: "y² = -4ax gives 4a = 16 → a = 4. Since coefficient is negative, the focus is at (-a, 0) = (-4, 0)."
        },
        {
            mode: "jee",
            subject: "Mathematics",
            q: "What is the value of ∫₀¹ x² dx?",
            o: ["1/3", "1/2", "1", "2/3"],
            c: 0,
            desc: "∫₀¹ x² dx = [x³/3]₀¹ = 1/3."
        },
        // Chemistry
        {
            mode: "jee",
            subject: "Chemistry",
            q: "Which of the following organic compounds will undergo aldol condensation?",
            o: ["Formaldehyde", "Benzaldehyde", "Acetaldehyde", "Trimethylacetaldehyde"],
            c: 2,
            desc: "Aldol condensation requires at least one alpha-hydrogen. Acetaldehyde (CH₃CHO) has three alpha-hydrogens."
        },
        {
            mode: "jee",
            subject: "Chemistry",
            q: "What is the hybridization of carbon in methane (CH₄)?",
            o: ["sp", "sp²", "sp³", "dsp²"],
            c: 2,
            desc: "Methane has tetrahedral geometry with sp³ hybridization and bond angles of 109.5°."
        },
        // Biology
        {
            mode: "jee",
            subject: "Biology",
            q: "Which plant hormone is primarily responsible for apical dominance in vascular plants?",
            o: ["Gibberellin", "Auxin", "Cytokinin", "Abscisic Acid"],
            c: 1,
            desc: "Auxin, synthesized in the shoot apex, moves basipetally to inhibit the growth of lateral buds."
        },
        {
            mode: "jee",
            subject: "Biology",
            q: "Which of the following Mendelian ratios represents a dihybrid cross?",
            o: ["3:1", "1:2:1", "9:3:3:1", "1:1:1:1"],
            c: 2,
            desc: "The classic dihybrid cross phenotypic ratio is 9:3:3:1 for two heterozygous traits."
        },
        // Additional JEE subjects
        {
            mode: "jee",
            subject: "Computer Science",
            q: "What is the time complexity of binary search in a sorted array of n elements?",
            o: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            c: 1,
            desc: "Binary search repeatedly divides the search interval in half, giving logarithmic time O(log n)."
        },
        {
            mode: "jee",
            subject: "Environmental Science",
            q: "What is BOD in environmental chemistry?",
            o: ["Biological Oxygen Demand", "Biochemical Oxidation Degree", "Bacterial Oxidation Duration", "Base Oxygen Depletion"],
            c: 0,
            desc: "BOD measures the amount of dissolved oxygen needed by aerobic microorganisms to break down organic matter."
        },

        /* ===== JEE - Chemistry ===== */
        {
            mode: "jee", subject: "Chemistry",
            q: "Which compound shows geometrical isomerism?",
            o: ["2-Butene", "Ethene", "Methane", "Ethane"],
            c: 0, desc: "2-Butene has restricted rotation around the C=C double bond, giving cis and trans forms."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "The IUPAC name of CH₃CH(OH)CH₃ is:",
            o: ["Propan-2-ol", "Propan-1-ol", "Ethanol", "Butan-2-ol"],
            c: 0, desc: "The -OH group is on carbon 2 of a 3-carbon chain, hence propan-2-ol."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "Which acid is present in vinegar?",
            o: ["Acetic acid", "Citric acid", "Lactic acid", "Formic acid"],
            c: 0, desc: "Vinegar contains 5-8% acetic acid (CH₃COOH) in water."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "What is the hybridization of carbon in diamond?",
            o: ["sp³", "sp²", "sp", "p"],
            c: 0, desc: "Each carbon in diamond forms 4 sigma bonds in a tetrahedral arrangement — sp³ hybridized."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "Which is the strongest oxidizing agent?",
            o: ["Fluorine", "Chlorine", "Oxygen", "Nitrogen"],
            c: 0, desc: "Fluorine is the most electronegative element and the strongest known oxidizing agent."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "pH of human blood is approximately:",
            o: ["7.4", "6.4", "8.4", "5.4"],
            c: 0, desc: "Normal human blood pH is maintained between 7.35 and 7.45 by the bicarbonate buffer system."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "Which bond has the highest bond energy?",
            o: ["C≡C", "C=C", "C−C", "C−H"],
            c: 0, desc: "Triple bonds are shorter and stronger than double or single bonds."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "The functional group in alcohol is:",
            o: ["-OH", "-COOH", "-CHO", "-CO-"],
            c: 0, desc: "The hydroxyl group (-OH) attached to a carbon chain defines alcohols."
        },
        {
            mode: "jee", subject: "Chemistry",
            q: "Which metal is liquid at room temperature?",
            o: ["Mercury", "Sodium", "Iron", "Zinc"],
            c: 0, desc: "Mercury (Hg) has a melting point of −38.8°C, making it liquid at room temperature."
        },

        /* ===== JEE - Physics ===== */
        {
            mode: "jee", subject: "Physics",
            q: "Dimension of force is:",
            o: ["MLT⁻²", "ML²T⁻²", "MLT⁻¹", "ML²T⁻¹"],
            c: 0, desc: "From F = ma, dimension = M × LT⁻² = MLT⁻²."
        },
        {
            mode: "jee", subject: "Physics",
            q: "Escape velocity from Earth is approximately:",
            o: ["11.2 km/s", "7.1 km/s", "15.3 km/s", "3.2 km/s"],
            c: 0, desc: "vₑ = √(2gR) ≈ 11.2 km/s for Earth."
        },
        {
            mode: "jee", subject: "Physics",
            q: "Which law explains the working of a hydraulic press?",
            o: ["Pascal's law", "Bernoulli's principle", "Archimedes' principle", "Newton's third law"],
            c: 0, desc: "Pascal's law states pressure applied to an enclosed fluid is transmitted equally in all directions."
        },
        {
            mode: "jee", subject: "Physics",
            q: "The SI unit of magnetic flux is:",
            o: ["Weber", "Tesla", "Henry", "Gauss"],
            c: 0, desc: "Weber (Wb) is the SI unit of magnetic flux. 1 Wb = 1 T·m²."
        },
        {
            mode: "jee", subject: "Physics",
            q: "In which process is temperature kept constant?",
            o: ["Isothermal", "Adiabatic", "Isobaric", "Isochoric"],
            c: 0, desc: "In an isothermal process, the system temperature remains constant throughout."
        },
        {
            mode: "jee", subject: "Physics",
            q: "The time period of a simple pendulum depends on:",
            o: ["Length and gravity", "Mass of bob", "Amplitude only", "Weight of bob"],
            c: 0, desc: "T = 2π√(L/g), so period depends only on length and gravitational acceleration."
        },
        {
            mode: "jee", subject: "Physics",
            q: "Photoelectric effect was explained by:",
            o: ["Einstein", "Newton", "Maxwell", "Bohr"],
            c: 0, desc: "Einstein explained the photoelectric effect using light quanta (photons) in 1905."
        },

        /* ===== NEET - Biology ===== */
        {
            mode: "neet", subject: "Biology",
            q: "Which organelle is called the powerhouse of the cell?",
            o: ["Mitochondria", "Ribosome", "Lysosome", "Golgi body"],
            c: 0, desc: "Mitochondria produce ATP through oxidative phosphorylation — the cell's main energy currency."
        },
        {
            mode: "neet", subject: "Biology",
            q: "DNA replication occurs during which phase?",
            o: ["S phase", "G1 phase", "G2 phase", "M phase"],
            c: 0, desc: "S phase (Synthesis) of interphase is when DNA is replicated."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Which vitamin is produced when skin is exposed to sunlight?",
            o: ["Vitamin D", "Vitamin A", "Vitamin C", "Vitamin B12"],
            c: 0, desc: "UVB rays convert 7-dehydrocholesterol in skin to pre-vitamin D₃."
        },
        {
            mode: "neet", subject: "Biology",
            q: "The normal blood sugar level in humans is:",
            o: ["80-120 mg/dL", "50-80 mg/dL", "150-200 mg/dL", "200-250 mg/dL"],
            c: 0, desc: "Fasting blood glucose of 80-120 mg/dL is considered normal for healthy adults."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Which is the largest gland in the human body?",
            o: ["Liver", "Pancreas", "Thyroid", "Salivary gland"],
            c: 0, desc: "The liver weighs about 1.5 kg and performs over 500 metabolic functions."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Haemoglobin contains which metal ion?",
            o: ["Iron", "Copper", "Zinc", "Magnesium"],
            c: 0, desc: "Each haem group contains an Fe²⁺ ion that reversibly binds oxygen."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Which disease is caused by the deficiency of Vitamin C?",
            o: ["Scurvy", "Rickets", "Beriberi", "Pellagra"],
            c: 0, desc: "Scurvy results from collagen breakdown due to lack of vitamin C (ascorbic acid)."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Double fertilization is characteristic of:",
            o: ["Angiosperms", "Gymnosperms", "Bryophytes", "Pteridophytes"],
            c: 0, desc: "In angiosperms, one sperm fertilizes the egg and another fuses with polar nuclei."
        },
        {
            mode: "neet", subject: "Biology",
            q: "The enzyme that digests proteins in the stomach is:",
            o: ["Pepsin", "Trypsin", "Amylase", "Lipase"],
            c: 0, desc: "Pepsin works at pH ~2 in the stomach, breaking proteins into peptides."
        },
        {
            mode: "neet", subject: "Biology",
            q: "Rh factor was discovered in which organism?",
            o: ["Rhesus monkey", "Human", "Rabbit", "Rat"],
            c: 0, desc: "The Rh factor was first found in Rhesus macaque monkeys in 1940."
        },

        /* ===== NEET - Chemistry ===== */
        {
            mode: "neet", subject: "Chemistry",
            q: "Which gas is used in the preservation of food?",
            o: ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"],
            c: 0, desc: "Nitrogen is inert and displaces oxygen, preventing oxidation and bacterial growth."
        },
        {
            mode: "neet", subject: "Chemistry",
            q: "The number of moles in 36g of water is:",
            o: ["2", "1", "3", "18"],
            c: 0, desc: "Molar mass of water = 18 g/mol. 36g ÷ 18 = 2 moles."
        },
        {
            mode: "neet", subject: "Chemistry",
            q: "Which element has the highest electronegativity?",
            o: ["Fluorine", "Oxygen", "Chlorine", "Nitrogen"],
            c: 0, desc: "Fluorine has the highest electronegativity (3.98) on the Pauling scale."
        },
        {
            mode: "neet", subject: "Chemistry",
            q: "Soap is chemically a:",
            o: ["Sodium salt of fatty acid", "Potassium salt of fatty acid", "Calcium salt", "Magnesium salt"],
            c: 0, desc: "Soaps are sodium or potassium salts of long-chain fatty acids (e.g., sodium stearate)."
        },

        /* ===== CBSE - Mathematics ===== */
        {
            mode: "cbse", subject: "Mathematics",
            q: "Value of sin²30° + cos²30° is:",
            o: ["1", "0", "1/2", "√3/2"],
            c: 0, desc: "This is the Pythagorean identity: sin²θ + cos²θ = 1 for any angle θ."
        },
        {
            mode: "cbse", subject: "Mathematics",
            q: "The derivative of x³ is:",
            o: ["3x²", "x²", "3x", "x³"],
            c: 0, desc: "Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹, so d/dx(x³) = 3x²."
        },
        {
            mode: "cbse", subject: "Mathematics",
            q: "What is the value of log₁₀100?",
            o: ["2", "10", "100", "1"],
            c: 0, desc: "log₁₀100 = log₁₀(10²) = 2, since 10² = 100."
        },
        {
            mode: "cbse", subject: "Mathematics",
            q: "The sum of first n natural numbers is:",
            o: ["n(n+1)/2", "n²/2", "n(n-1)/2", "n²+n"],
            c: 0, desc: "This is the arithmetic series formula: 1+2+3+...+n = n(n+1)/2."
        },
        {
            mode: "cbse", subject: "Mathematics",
            q: "Area of a circle with radius r is:",
            o: ["πr²", "2πr", "πd", "πr³"],
            c: 0, desc: "A = πr² where r is the radius. 2πr is the circumference."
        },
        {
            mode: "cbse", subject: "Mathematics",
            q: "The matrix transpose of [1 2; 3 4] is:",
            o: ["[1 3; 2 4]", "[2 1; 4 3]", "[4 3; 2 1]", "[3 4; 1 2]"],
            c: 0, desc: "Transpose swaps rows and columns: rows become columns."
        },

        /* ===== CBSE - Physics ===== */
        {
            mode: "cbse", subject: "Physics",
            q: "SI unit of electric current is:",
            o: ["Ampere", "Volt", "Watt", "Ohm"],
            c: 0, desc: "Ampere (A) is one of the seven SI base units."
        },
        {
            mode: "cbse", subject: "Physics",
            q: "Newton's first law is also called the law of:",
            o: ["Inertia", "Action-reaction", "Gravitation", "Motion"],
            c: 0, desc: "An object at rest stays at rest and an object in motion stays in motion unless acted upon by a force."
        },
        {
            mode: "cbse", subject: "Physics",
            q: "The speed of light in vacuum is:",
            o: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁵ m/s"],
            c: 0, desc: "The speed of light c ≈ 3 × 10⁸ m/s in vacuum — a fundamental constant."
        },
        {
            mode: "cbse", subject: "Physics",
            q: "Ohm's law relates which quantities?",
            o: ["Voltage, current, resistance", "Power, voltage, current", "Force, mass, acceleration", "Energy, work, time"],
            c: 0, desc: "V = IR — voltage equals current times resistance."
        },
        {
            mode: "cbse", subject: "Physics",
            q: "Which type of lens is used to correct myopia?",
            o: ["Concave", "Convex", "Bifocal", "Cylindrical"],
            c: 0, desc: "Myopia (nearsightedness) is corrected with a concave (diverging) lens."
        },

        /* ===== CBSE - Biology ===== */
        {
            mode: "cbse", subject: "Biology",
            q: "Which organ filters blood in the human body?",
            o: ["Kidney", "Liver", "Heart", "Lungs"],
            c: 0, desc: "Kidneys filter about 180 liters of blood daily, producing urine."
        },
        {
            mode: "cbse", subject: "Biology",
            q: "Photosynthesis takes place in which cell organelle?",
            o: ["Chloroplast", "Mitochondria", "Ribosome", "Nucleus"],
            c: 0, desc: "Chloroplasts contain chlorophyll which captures light energy for photosynthesis."
        },
        {
            mode: "cbse", subject: "Biology",
            q: "Which blood group is the universal donor?",
            o: ["O negative", "AB positive", "A positive", "B negative"],
            c: 0, desc: "O⁻ has no A, B, or Rh antigens, so it can be given to anyone."
        },
        {
            mode: "cbse", subject: "Biology",
            q: "The smallest bone in the human body is:",
            o: ["Stapes", "Femur", "Coccyx", "Phalanx"],
            c: 0, desc: "The stapes (stirrup bone) in the middle ear is just 3mm long."
        },
        {
            mode: "cbse", subject: "Biology",
            q: "Which gas do plants absorb from the atmosphere?",
            o: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
            c: 0, desc: "Plants absorb CO₂ for photosynthesis: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂."
        }
    ],

    getSubjectColor(subject) {
        const colors = {
            Biology: { main: "var(--accent-green)", light: "var(--accent-green-light)" },
            Physics: { main: "var(--accent-blue)", light: "var(--accent-blue-light)" },
            Mathematics: { main: "var(--accent-amber)", light: "var(--accent-amber-light)" },
            Chemistry: { main: "var(--accent-red)", light: "var(--accent-red-light)" },
            History: { main: "var(--accent-saffron)", light: "var(--accent-saffron-light)" },
            Geography: { main: "var(--accent-green)", light: "var(--accent-green-light)" },
            Civics: { main: "var(--accent-violet)", light: "var(--accent-violet-light)" },
            Economics: { main: "var(--accent-blue)", light: "var(--accent-blue-light)" },
            English: { main: "var(--accent-amber)", light: "var(--accent-amber-light)" },
            "Computer Science": { main: "var(--accent-violet)", light: "var(--accent-violet-light)" },
            "Environmental Science": { main: "var(--accent-green)", light: "var(--accent-green-light)" }
        };
        return colors[subject] || { main: "var(--accent-violet)", light: "var(--accent-violet-light)" };
    },

    renderChallengeMode(el) {
        const boardMode = document.body.className;
        let targetMode = "standard";
        if (boardMode.includes("cbse")) targetMode = "cbse";
        if (boardMode.includes("jee")) targetMode = "jee";

        // Filter questions by mode, fallback to standard if none found
        let candidates = this.challengesDb.filter(c => c.mode === targetMode);
        if (candidates.length === 0 && targetMode !== 'standard') {
            candidates = this.challengesDb.filter(c => c.mode === 'standard');
        }
        const q = candidates[Math.floor(Math.random() * candidates.length)] || this.challengesDb[0];

        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-gamepad" style="color:var(--accent-saffron)"></i> AI Challenge Mode</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">Test your concept speed! Correct answers award study coins and boost XP.</p>
            
            <div class="settings-group-box" style="border: 1.5px dashed var(--accent-violet); background: var(--accent-violet-light); font-size:13px; display:flex; flex-direction:column; gap:12px;">
                <div style="font-weight:700; color:var(--accent-violet); display:flex; justify-content:space-between; align-items:center;">
                   <span><span style="display:inline-block; padding:2px 10px; border-radius:10px; font-size:10px; font-weight:800; text-transform:uppercase; background:${this.getSubjectColor(q.subject).light}; color:${this.getSubjectColor(q.subject).main};">${studySnapUtils.escapeHtml(q.subject || 'General')}</span></span>
                   <span style="font-size:10px; font-weight:800; text-transform:uppercase;">${studySnapUtils.escapeHtml(q.mode.toUpperCase())}</span>
                </div>
                <p style="font-weight:600; line-height:1.4;">${studySnapUtils.escapeHtml(q.q)}</p>
                
                <div class="challenge-options" style="display:flex; flex-direction:column; gap:8px;" id="popup-challenge-options">
                    ${q.o.map((opt, i) => `
                        <button class="challenge-opt" style="padding:10px; font-size:12px;" data-correct="${i === q.c}" data-question="${studySnapUtils.escapeHtml(q.q)}" data-correctanswer="${studySnapUtils.escapeHtml(q.o[q.c])}" data-description="${studySnapUtils.escapeHtml(q.desc)}" onclick="tools.submitChallengeAnswer(this)">${studySnapUtils.escapeHtml(opt)}</button>
                    `).join('')}
                </div>
            </div>

            <button class="primary-btn" onclick="tools.openTool('challenge')" style="display:none; margin-top:12px;" id="challenge-next-btn">Next Challenge</button>
        `;
    },

    submitChallengeAnswer(btn) {
        const isCorrect = btn.dataset.correct === 'true';
        const question = btn.dataset.question || '';
        const correctVal = btn.dataset.correctanswer || '';
        const descriptionText = btn.dataset.description || '';
        const holder = document.getElementById('popup-challenge-options');
        const buttons = holder.querySelectorAll('.challenge-opt');
        
        buttons.forEach(b => b.disabled = true);

        if (isCorrect) {
            btn.style.cssText = 'background:var(--accent-green-light); border-color:var(--accent-green); color:var(--accent-green);';
            gamification.addXP(50, btn);
            gamification.addCoins(15);
            gamification.triggerConfetti();

            const c = document.createElement('div');
            c.style.cssText = 'font-size:11.5px; color:var(--accent-green); font-weight:700; margin-top:10px; padding:8px; border-radius:8px; background:var(--accent-green-light);';
            c.innerHTML = `Correct! +50 XP & +15 Coins.<br><span style="font-weight:400; font-style:italic; margin-top:4px; display:inline-block;">${studySnapUtils.escapeHtml(descriptionText)}</span>`;
            holder.appendChild(c);
        } else {
            btn.style.cssText = 'background:var(--accent-red-light); border-color:var(--accent-red); color:var(--accent-red);';
            
            // Highlight correct button
            buttons.forEach(b => {
                if (b.textContent === correctVal) {
                    b.style.cssText = 'background:var(--accent-green-light); border-color:var(--accent-green); color:var(--accent-green);';
                }
            });

            // Log error to Mistake Book
            this.logMistake(question, `Correct: ${correctVal}`);

            const f = document.createElement('div');
            f.style.cssText = 'font-size:11.5px; color:var(--accent-red); font-weight:700; margin-top:10px; padding:8px; border-radius:8px; background:var(--accent-red-light);';
            f.innerHTML = `Incorrect. Added to Mistake Book for future revision.<br><span style="font-weight:400; font-style:italic; margin-top:4px; display:inline-block;">${studySnapUtils.escapeHtml(descriptionText)}</span>`;
            holder.appendChild(f);
        }

        // Show Next Challenge button
        document.getElementById('challenge-next-btn').style.display = 'block';
    },

    /* --- 7. FORMULA / CHEAT SHEET --- */
    formulaDb: {
        Mathematics: [
            { topic: "Sets, Relations & Functions", items: [
                "A ∪ B = {x | x ∈ A or x ∈ B} (Union)",
                "A ∩ B = {x | x ∈ A and x ∈ B} (Intersection)",
                "A − B = {x | x ∈ A and x ∉ B} (Difference)",
                "A ⊆ B: every element of A is in B (Subset)",
                "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)",
                "De Morgan's: (A ∪ B)' = A' ∩ B'",
                "De Morgan's: (A ∩ B)' = A' ∪ B'",
                "Relation: subset of A × B (Cartesian product)",
                "Function: each x maps to exactly one y",
                "Domain: set of all inputs; Range: set of all outputs",
                "Injective (one-one): f(x₁)=f(x₂) ⇒ x₁=x₂",
                "Surjective (onto): every y has a pre-image x",
                "Bijective: both injective and surjective",
                "f∘g(x) = f(g(x)) (Composite function)",
                "f⁻¹(y) = x ⇔ f(x) = y (Inverse function)"
            ]},
            { topic: "Number Systems", items: [
                "Natural numbers N = {1, 2, 3, ...}",
                "Integers Z = {..., −2, −1, 0, 1, 2, ...}",
                "Rational numbers Q = p/q, q ≠ 0",
                "Irrational numbers: non-terminating, non-repeating",
                "Real numbers R = Rational ∪ Irrational",
                "Complex numbers: z = a + ib, i² = −1",
                "|z| = √(a² + b²), arg(z) = tan⁻¹(b/a)",
                "z₁z₂ = r₁r₂[cos(θ₁+θ₂) + i sin(θ₁+θ₂)]",
                "z₁/z₂ = (r₁/r₂)[cos(θ₁−θ₂) + i sin(θ₁−θ₂)]",
                "De Moivre: (cosθ + i sinθ)ⁿ = cos nθ + i sin nθ",
                "Cube roots of unity: 1, ω, ω²; 1+ω+ω²=0",
                "|z₁ + z₂| ≤ |z₁| + |z₂| (Triangle inequality)"
            ]},
            { topic: "Algebra", items: [
                "(a + b)² = a² + 2ab + b²",
                "(a − b)² = a² − 2ab + b²",
                "a² − b² = (a − b)(a + b)",
                "(a + b)³ = a³ + 3a²b + 3ab² + b³",
                "(a − b)³ = a³ − 3a²b + 3ab² − b³",
                "a³ + b³ = (a + b)(a² − ab + b²)",
                "a³ − b³ = (a − b)(a² + ab + b²)",
                "a⁴ − b⁴ = (a − b)(a + b)(a² + b²)",
                "(a + b + c)² = a² + b² + c² + 2(ab + bc + ca)",
                "aⁿ − bⁿ = (a − b)(aⁿ⁻¹ + aⁿ⁻²b + ... + bⁿ⁻¹)",
                "Quadratic: ax² + bx + c = 0",
                "x = [−b ± √(b² − 4ac)] / 2a",
                "D = b² − 4ac (Discriminant)",
                "D > 0: real & distinct, D = 0: real & equal, D < 0: imaginary",
                "Sum of roots = −b/a, Product = c/a",
                "Cubic with roots α,β,γ: α+β+γ = −b/a",
                "αβ+βγ+γα = c/a, αβγ = −d/a",
                "xᵐ × xⁿ = xᵐ⁺ⁿ",
                "xᵐ ÷ xⁿ = xᵐ⁻ⁿ",
                "(xᵐ)ⁿ = xᵐⁿ",
                "x⁻ᵐ = 1/xᵐ",
                "x⁰ = 1 (x ≠ 0)",
                "logₐ(mn) = logₐm + logₐn",
                "logₐ(m/n) = logₐm − logₐn",
                "logₐ(mⁿ) = n logₐm",
                "logₐb = logₓb / logₓa (base change)",
                "logₐa = 1, logₐ1 = 0",
                "AP: a, a+d, a+2d, ... Tₙ = a + (n−1)d",
                "AP sum: Sₙ = n/2[2a + (n−1)d]",
                "GP: a, ar, ar², ... Tₙ = arⁿ⁻¹",
                "GP sum: Sₙ = a(1−rⁿ)/(1−r) [r≠1]",
                "Infinite GP sum: S∞ = a/(1−r), |r|<1",
                "HP: 1/a, 1/(a+d), 1/(a+2d), ... (Harmonic Progression)"
            ]},
            { topic: "Binomial Theorem", items: [
                "(a+b)ⁿ = Σ ₖ₌₀ⁿ ⁿCₖ aⁿ⁻ᵏ bᵏ",
                "General term Tᵣ₊₁ = ⁿCᵣ aⁿ⁻ʳ bʳ",
                "Middle term(s): if n even → one middle (n/2+1)",
                "If n odd → two middle terms at (n+1)/2 and (n+3)/2",
                "Sum of binomial coefficients: Σ ⁿCᵣ = 2ⁿ",
                "Sum of odd terms = Sum of even terms = 2ⁿ⁻¹",
                "(1+x)ⁿ ≈ 1 + nx (for |x| ≪ 1, linear approx)"
            ]},
            { topic: "Trigonometry", items: [
                "sin²θ + cos²θ = 1",
                "sec²θ − tan²θ = 1",
                "cosec²θ − cot²θ = 1",
                "sin(A ± B) = sinA cosB ± cosA sinB",
                "cos(A ± B) = cosA cosB ∓ sinA sinB",
                "tan(A ± B) = (tanA ± tanB) / (1 ∓ tanA tanB)",
                "sin 2θ = 2 sinθ cosθ",
                "cos 2θ = cos²θ − sin²θ = 2cos²θ − 1 = 1 − 2sin²θ",
                "tan 2θ = 2tanθ / (1 − tan²θ)",
                "sin 3θ = 3sinθ − 4sin³θ",
                "cos 3θ = 4cos³θ − 3cosθ",
                "2 sinA cosB = sin(A+B) + sin(A−B)",
                "2 cosA sinB = sin(A+B) − sin(A−B)",
                "2 cosA cosB = cos(A+B) + cos(A−B)",
                "2 sinA sinB = cos(A−B) − cos(A+B)",
                "sinC + sinD = 2 sin(C+D)/2 cos(C−D)/2",
                "sinC − sinD = 2 cos(C+D)/2 sin(C−D)/2",
                "cosC + cosD = 2 cos(C+D)/2 cos(C−D)/2",
                "cosC − cosD = −2 sin(C+D)/2 sin(C−D)/2",
                "Sine rule: a/sinA = b/sinB = c/sinC = 2R",
                "Cosine rule: c² = a² + b² − 2ab cosC",
                "Area = ½ab sinC",
                "0°: 0, 1, 0; 30°: ½, √3/2, 1/√3",
                "45°: 1/√2, 1/√2, 1; 60°: √3/2, ½, √3",
                "90°: 1, 0, ∞ (sin, cos, tan)",
                "sin⁻¹x + cos⁻¹x = π/2",
                "tan⁻¹x + cot⁻¹x = π/2",
                "sec⁻¹x + cosec⁻¹x = π/2",
                "tan⁻¹x + tan⁻¹y = tan⁻¹((x+y)/(1−xy))"
            ]},
            { topic: "Coordinate Geometry", items: [
                "Distance: d = √[(x₂−x₁)² + (y₂−y₁)²]",
                "Midpoint: ((x₁+x₂)/2, (y₁+y₂)/2)",
                "Section formula: (mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n)",
                "Centroid: ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3)",
                "Incenter: (ax₁+bx₂+cx₃)/(a+b+c), ... (a,b,c = side lengths)",
                "Area of triangle: ½|x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)|",
                "Slope m = (y₂−y₁)/(x₂−x₁) = tanθ",
                "Line: y = mx + c (slope-intercept)",
                "Line: y − y₁ = m(x − x₁) (point-slope)",
                "Line: (y−y₁)/(y₂−y₁) = (x−x₁)/(x₂−x₁) (two-point)",
                "Line: x/a + y/b = 1 (intercept form)",
                "Parallel lines: m₁ = m₂",
                "Perpendicular lines: m₁·m₂ = −1",
                "Distance from (x₁,y₁) to ax+by+c=0: |ax₁+by₁+c|/√(a²+b²)",
                "Circle center (h,k): (x−h)² + (y−k)² = r²",
                "Circle x² + y² + 2gx + 2fy + c = 0",
                "Center (−g, −f), radius r = √(g²+f²−c)",
                "Parabola y² = 4ax: focus (a,0), directrix x = −a",
                "Ellipse x²/a² + y²/b² = 1: foci (±c,0)", 
                "Hyperbola x²/a² − y²/b² = 1: foci (±c,0), c² = a²+b²"
            ]},
            { topic: "Mensuration", items: [
                "Area of circle = πr²",
                "Circumference = 2πr",
                "Area of sector = (θ/360°) × πr²",
                "Arc length = (θ/360°) × 2πr",
                "Area of triangle = ½ × base × height",
                "Heron's formula: √[s(s−a)(s−b)(s−c)]",
                "Area of trapezium = ½(a + b)h",
                "Area of parallelogram = base × height",
                "Area of rhombus = ½ × d₁ × d₂",
                "Volume of cube = a³",
                "Volume of cuboid = l × b × h",
                "Volume of cylinder = πr²h",
                "CSA of cylinder = 2πrh",
                "TSA of cylinder = 2πr(r + h)",
                "Volume of cone = ⅓πr²h",
                "CSA of cone = πrl (l = slant height)",
                "TSA of cone = πr(l + r)",
                "Volume of sphere = ⁴⁄₃πr³",
                "Surface area of sphere = 4πr²",
                "Volume of hemisphere = ⅔πr³",
                "TSA of hemisphere = 3πr²",
                "Volume of frustum = ⅓πh(R² + Rr + r²)",
                "CSA of frustum = πl(R + r), TSA = πl(R+r) + πR² + πr²"
            ]},
            { topic: "Matrices & Determinants", items: [
                "Matrix: rectangular array of numbers [aᵢⱼ]",
                "Addition: A + B = [aᵢⱼ + bᵢⱼ] (same order)",
                "Multiplication: (AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ",
                "|A| for 2×2: ad − bc",
                "|A| for 3×3: a₁₁(a₂₂a₃₃−a₂₃a₃₂) − ...",
                "A⁻¹ = adj(A) / |A| (|A| ≠ 0)",
                "adj(A) = Cᵀ (cofactor matrix transpose)",
                "A(adj A) = (adj A)A = |A| I",
                "|AB| = |A|·|B|",
                "|Aᵀ| = |A|, |kA| = kⁿ|A| (n = order)",
                "System AX = B: X = A⁻¹B (if |A| ≠ 0)",
                "Cramer's rule: xᵢ = |Aᵢ|/|A|",
                "Properties: row/column swap changes sign"
            ]},
            { topic: "Vectors & 3D Geometry", items: [
                "a·b = |a||b|cosθ = a₁b₁ + a₂b₂ + a₃b₃ (dot)",
                "a×b = |a||b|sinθ n̂ (cross product)",
                "|a×b| = area of parallelogram",
                "Scalar triple product: [a b c] = a·(b×c)",
                "Volume of parallelepiped = |[a b c]|",
                "Condition for coplanarity: [a b c] = 0",
                "Direction cosines: l² + m² + n² = 1",
                "Distance between points in 3D: √[(Δx)²+(Δy)²+(Δz)²]",
                "Line: (x−x₁)/a = (y−y₁)/b = (z−z₁)/c",
                "Plane: ax + by + cz + d = 0",
                "Angle between planes: cosθ = |n₁·n₂|/|n₁||n₂|",
                "Distance from point to plane: |ax₁+by₁+cz₁+d|/√(a²+b²+c²)"
            ]},
            { topic: "Statistics & Probability", items: [
                "Mean = Σx / n",
                "Median = middle value (sorted data)",
                "Mode = most frequent value",
                "Range = max − min",
                "Variance σ² = Σ(x−x̄)² / n",
                "Std deviation σ = √(variance)",
                "P(A) = favorable outcomes / total outcomes",
                "P(A ∪ B) = P(A) + P(B) − P(A ∩ B)",
                "P(A ∩ B) = P(A) × P(B) (independent)",
                "P(A|B) = P(A ∩ B) / P(B) (conditional)",
                "Bayes: P(A|B) = P(B|A)P(A) / P(B)",
                "nPr = n! / (n−r)! (permutations)",
                "nCr = n! / r!(n−r)! (combinations)",
                "Binomial distribution: P(X=r) = ⁿCᵣ pʳ qⁿ⁻ʳ",
                "Mean of binomial = np, Variance = npq",
                "Poisson: P(X=r) = e⁻ᵐ mʳ / r!"
            ]},
            { topic: "Calculus", items: [
                "d/dx (xⁿ) = nxⁿ⁻¹",
                "d/dx (sin x) = cos x",
                "d/dx (cos x) = −sin x",
                "d/dx (tan x) = sec²x",
                "d/dx (cot x) = −cosec²x",
                "d/dx (sec x) = sec x tan x",
                "d/dx (cosec x) = −cosec x cot x",
                "d/dx (eˣ) = eˣ",
                "d/dx (aˣ) = aˣ ln a",
                "d/dx (ln x) = 1/x",
                "d/dx (sin⁻¹x) = 1/√(1−x²)",
                "d/dx (cos⁻¹x) = −1/√(1−x²)",
                "d/dx (tan⁻¹x) = 1/(1+x²)",
                "d/dx (|x|) = x/|x| (x ≠ 0)",
                "∫xⁿ dx = xⁿ⁺¹/(n+1) + C, n ≠ −1",
                "∫1/x dx = ln|x| + C",
                "∫sin x dx = −cos x + C",
                "∫cos x dx = sin x + C",
                "∫sec²x dx = tan x + C",
                "∫cosec²x dx = −cot x + C",
                "∫sec x tan x dx = sec x + C",
                "∫cosec x cot x dx = −cosec x + C",
                "∫tan x dx = −ln|cos x| + C",
                "∫cot x dx = ln|sin x| + C",
                "∫eˣ dx = eˣ + C",
                "∫1/(x²+a²) dx = (1/a) tan⁻¹(x/a) + C",
                "∫1/√(a²−x²) dx = sin⁻¹(x/a) + C",
                "∫ₐᵇ f(x) dx = F(b) − F(a) (definite integral)",
                "∫ₐᵇ f(x) dx = ∫ₐᵇ f(a+b−x) dx (property)",
                "Chain rule: dy/dx = dy/du × du/dx",
                "Product rule: (uv)' = u'v + uv'",
                "Quotient rule: (u/v)' = (u'v − uv')/v²",
                "Integration by parts: ∫u dv = uv − ∫v du"
            ]},
            { topic: "Differential Equations", items: [
                "Order: highest derivative in the equation",
                "Degree: power of highest derivative (after removing radicals)",
                "Variable separable: dy/dx = f(x)g(y)",
                "Solution: ∫ dy/g(y) = ∫ f(x) dx + C",
                "Homogeneous: dy/dx = f(y/x), put y = vx",
                "Linear: dy/dx + Py = Q; IF = e^{∫P dx}",
                "Solution: y·IF = ∫Q·IF dx + C",
                "Bernoulli: dy/dx + Py = Qyⁿ, put v = y¹⁻ⁿ"
            ]},
            { topic: "Linear Programming", items: [
                "Objective function: Z = ax + by (max/min)",
                "Constraints: linear inequalities in x, y",
                "Feasible region: intersection of all constraints",
                "Corner point method: evaluate Z at each vertex",
                "Optimal solution occurs at a corner point",
                "If unbounded region, check whether max/min exists",
                "If two corners give same Z, entire edge is optimal"
            ]}
        ],
        Physics: [
            { topic: "Kinematics", items: [
                "v = u + at",
                "s = ut + ½at²",
                "v² = u² + 2as",
                "s = ½(u + v)t",
                "sₙ = u + a(2n−1)/2 (nth second)",
                "Relative velocity vAB = vA − vB",
                "Projectile: max height H = u²sin²θ/2g",
                "Projectile: range R = u²sin2θ/g",
                "Projectile: time of flight T = 2usinθ/g",
                "Circular motion: a꜀ = v²/r = ω²r",
                "Centripetal force F꜀ = mv²/r",
                "ω = 2π/T = 2πf",
                "Banking of road: tanθ = v²/rg (no friction)"
            ]},
            { topic: "Dynamics & Forces", items: [
                "F = ma (Newton's 2nd Law)",
                "Momentum p = mv",
                "Impulse = F × t = Δp",
                "Newton's 1st: inertia — body at rest stays at rest",
                "Newton's 3rd: action = −reaction",
                "Friction f = μN (μ = coefficient)",
                "Spring force F = −kx (Hooke's law)",
                "Torque τ = r × F = rF sinθ",
                "Moment of inertia I = Σmr²",
                "τ = Iα (Rotational analog of F=ma)",
                "Angular momentum L = Iω",
                "Conservation: if Στ = 0, L = constant",
                "KE_rot = ½Iω²",
                "Parallel axis theorem: I = I_cm + Mh²",
                "Perpendicular axis theorem: I_z = I_x + I_y (lamina)"
            ]},
            { topic: "Work, Energy & Power", items: [
                "W = F × d × cosθ",
                "KE = ½mv²",
                "PE = mgh (gravitational)",
                "PE = ½kx² (spring)",
                "Power = W / t",
                "P = F × v (instantaneous power)",
                "Conservation of energy: KEᵢ + PEᵢ = KE_f + PE_f",
                "Efficiency η = (output/input) × 100%",
                "Work-energy theorem: W = ΔKE",
                "Collision: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ (momentum conserved)",
                "Elastic: KE conserved; Inelastic: KE lost",
                "Coefficient of restitution e = (v₂−v₁)/(u₁−u₂)"
            ]},
            { topic: "Thermodynamics", items: [
                "ΔQ = ΔU + ΔW (1st Law)",
                "ΔU = nCᵥΔT (internal energy)",
                "W = PΔV (work done at constant pressure)",
                "ε = 1 − T₂/T₁ (Carnot efficiency)",
                "ΔS = ΔQ/T (entropy change)",
                "Boyle's law: P₁V₁ = P₂V₂",
                "Charles's law: V₁/T₁ = V₂/T₂",
                "Gay-Lussac's: P₁/T₁ = P₂/T₂",
                "PV = nRT (Ideal gas equation)",
                "R = 8.314 J/mol·K",
                "Cᵥ = (f/2)R, Cₚ = ((f+2)/2)R (f = degrees of freedom)",
                "γ = Cₚ/Cᵥ = 1 + 2/f",
                "Adiabatic: PV^γ = constant"
            ]},
            { topic: "Waves & Sound", items: [
                "v = fλ (wave speed)",
                "T = 1/f (time period)",
                "v = √(T/μ) (wave on string)",
                "v = √(B/ρ) (sound in fluid)",
                "f' = f(v ± v₀)/(v ∓ vₛ) (Doppler effect)",
                "Beat frequency f_beat = |f₁ − f₂|",
                "Fundamental f = v/2L (open pipe)",
                "Fundamental f = v/4L (closed pipe)",
                "Intensity I ∝ A² (amplitude squared)",
                "I = P/4πr² (inverse square law)",
                "Loudness β = 10 log₁₀(I/I₀) dB",
                "Standing wave: y = 2A sin(kx) cos(ωt)"
            ]},
            { topic: "Light & Optics", items: [
                "1/f = 1/u + 1/v (Lens formula)",
                "m = v / u (Magnification)",
                "n = sin i / sin r (Snell's law)",
                "n = c / v (Refractive index)",
                "Power P = 1/f (D = m⁻¹)",
                "1/f = (n−1)(1/R₁ − 1/R₂) (Lens maker)",
                "Critical angle: sin C = 1/n",
                "λ_medium = λ_vacuum / n",
                "Young's: fringe width β = λD/d",
                "Diffraction: a sinθ = nλ (minima)",
                "Resolving power of telescope = 1/θ = D/1.22λ",
                "Brewster's angle: tan i_B = n (polarization)",
                "Malus law: I = I₀ cos²θ (polarizer)"
            ]},
            { topic: "Electrostatics", items: [
                "F = kq₁q₂/r² (Coulomb's law), k = 1/4πε₀",
                "ε₀ = 8.85 × 10⁻¹² C²/N·m²",
                "Electric field E = F/q = kQ/r²",
                "Potential V = kQ/r (point charge)",
                "V = W/q (potential difference)",
                "E = −dV/dr (relation between field and potential)",
                "Capacitance C = Q/V",
                "Parallel plate: C = ε₀A/d",
                "Capacitors series: 1/Cₛ = 1/C₁ + 1/C₂ + ...",
                "Capacitors parallel: Cₚ = C₁ + C₂ + ...",
                "Energy stored: U = ½CV² = ½QV = Q²/2C",
                "Dielectric: C' = κC, E' = E₀/κ",
                "Dipole moment p = qd"
            ]},
            { topic: "Electricity", items: [
                "V = IR (Ohm's law)",
                "P = VI = I²R = V²/R",
                "R = ρ L / A (Resistivity)",
                "R = R₀(1 + αΔT) (temp dependence)",
                "Resistors series: Rₛ = R₁ + R₂ + ...",
                "Resistors parallel: 1/Rₚ = 1/R₁ + 1/R₂ + ...",
                "Kirchhoff's junction: ΣI_in = ΣI_out",
                "Kirchhoff's loop: ΣV = 0",
                "H = I²Rt (Joule heating)",
                "E = V + Ir (EMF of cell)",
                "Wheatstone bridge: R₁/R₂ = R₃/R₄ (balanced)",
                "Meter bridge: R₁/R₂ = l₁/(100−l₁)",
                "Drift velocity v_d = I/neA",
                "σ = 1/ρ (conductivity)"
            ]},
            { topic: "Magnetism & Electromagnetism", items: [
                "F = q(v × B) (Lorentz force)",
                "F = BIL sinθ (wire in field)",
                "B = μ₀I/2πr (long wire)",
                "B = μ₀nI (solenoid)",
                "φ = BA cosθ (magnetic flux)",
                "ε = −dφ/dt (Faraday's law)",
                "ε = −L dI/dt (self-induction)",
                "L = μ₀n²Al (solenoid inductance)",
                "Mutual inductance: M = ε₂/(dI₁/dt)",
                "Transformer: Vₛ/Vₚ = Nₛ/Nₚ",
                "AC: V_rms = V₀/√2, I_rms = I₀/√2",
                "Impedance Z = √(R² + (X_L − X_C)²)",
                "Resonance: f₀ = 1/2π√(LC)",
                "Power factor cosφ = R/Z",
                "Moving coil galvanometer: I = (C/NBA)θ"
            ]},
            { topic: "Gravitation & SHM", items: [
                "F = Gm₁m₂ / r² (Newton's law)",
                "g = GM / R² (surface gravity)",
                "g_h = g(1 − 2h/R) (height variation)",
                "g_d = g(1 − d/R) (depth variation)",
                "Orbital velocity v₀ = √(GM/r)",
                "Escape velocity vₑ = √(2GM/R) = √(2gR)",
                "T² ∝ r³ (Kepler's 3rd law)",
                "T = 2π√(L/g) (Pendulum)",
                "T = 2π√(m/k) (Spring-mass)",
                "x = A sin(ωt + φ) (SHM equation)",
                "v = ω√(A² − x²), a = −ω²x",
                "KE = ½mω²(A²−x²), PE = ½mω²x²",
                "Total energy in SHM = ½mω²A² = ½kA²",
                "Springs series: 1/kₛ = 1/k₁ + 1/k₂ + ...",
                "Springs parallel: kₚ = k₁ + k₂ + ..."
            ]},
            { topic: "Electromagnetic Waves", items: [
                "c = 3 × 10⁸ m/s (speed of EM waves in vacuum)",
                "c = 1/√(μ₀ε₀)",
                "E₀/B₀ = c (ratio of amplitudes)",
                "EM spectrum: γ → X → UV → Visible → IR → μ → Radio",
                "Energy density u = ½ε₀E² + ½B²/μ₀",
                "Intensity I = ½ε₀E₀²c = cB₀²/2μ₀",
                "Maxwell's equations: ∇·E = ρ/ε₀, ∇·B = 0",
                "∇×E = −∂B/∂t, ∇×B = μ₀J + μ₀ε₀∂E/∂t"
            ]},
            { topic: "Modern Physics", items: [
                "E = hf = hc/λ (Photon energy)",
                "h = 6.626 × 10⁻³⁴ J·s (Planck's constant)",
                "E = mc² (Mass-energy equivalence)",
                "KE_max = hf − φ (Photoelectric effect)",
                "V₀ = (h/e)f − φ/e (stopping potential)",
                "λ = h/p = h/mv (De Broglie wavelength)",
                "ΔE = hf = E₂ − E₁ (Bohr's model)",
                "rₙ = n²r₀, r₀ = 0.529 Å",
                "Eₙ = −13.6/n² eV (H-atom energy)",
                "N = N₀e⁻λᵗ (Radioactive decay)",
                "t½ = ln2/λ = 0.693/λ (half-life)",
                "Binding energy BE = Δm·c²",
                "Nuclear fission: heavy nucleus splits, releases energy",
                "Nuclear fusion: light nuclei combine, releases energy",
                "X-ray: λ_min = hc/eV (cutoff wavelength)"
            ]},
            { topic: "Semiconductors & Electronics", items: [
                "Intrinsic: pure Si/Ge; Extrinsic: doped with impurities",
                "n-type: pentavalent dopant (P, As); majority: e⁻",
                "p-type: trivalent dopant (B, Al); majority: holes",
                "Diode: forward bias (V>0) conducts; reverse bias blocks",
                "Zener diode: operates in reverse breakdown (voltage regulator)",
                "Rectifier: AC → DC (half-wave or full-wave)",
                "LED: emits light when forward biased",
                "Transistor: npn/pnp, three terminals (B, C, E)",
                "β = I_C/I_B (current gain)",
                "Logic gates: AND, OR, NOT, NAND, NOR, XOR",
                "Truth table: AND (both 1→1), OR (any 1→1), NOT (inverts)",
                "NAND and NOR are universal gates"
            ]},
            { topic: "Fluid Mechanics", items: [
                "P = ρgh (fluid pressure)",
                "F_b = ρVg (Buoyancy / Archimedes)",
                "A₁v₁ = A₂v₂ (Continuity equation)",
                "P + ½ρv² + ρgh = constant (Bernoulli)",
                "v = √(2gh) (Torricelli efflux)",
                "Viscous force F = ηA(dv/dy)",
                "Re = ρvd/η (Reynolds number)",
                "Re < 2000: laminar; Re > 4000: turbulent",
                "Poiseuille: Q = πr⁴ΔP/8ηL (volumetric flow rate)",
                "Surface tension: S = F/L",
                "Excess pressure: sphere (2S/r), bubble (4S/r)"
            ]},
            { topic: "Communication Systems", items: [
                "Modulation: message signal superimposed on carrier",
                "Amplitude modulation (AM): varies amplitude of carrier",
                "Frequency modulation (FM): varies frequency of carrier",
                "Modulation index m = A_m/A_c (AM)",
                "Bandwidth: AM = 2f_m, FM = 2(Δf + f_m)",
                "Demodulation: recovery of original signal",
                "Transmitter antenna height: d = √(2Rh) (line of sight)",
                "Satellite communication: geostationary orbit (36000 km)"
            ]}
        ],
        Chemistry: [
            { topic: "Atomic Structure", items: [
                "Atomic number Z = number of protons",
                "Mass number A = p⁺ + n",
                "Number of neutrons = A − Z",
                "Electronic configuration: 2, 8, 8, 2...",
                "Max electrons per shell = 2n²",
                "λ = h/mv (De Broglie wavelength)",
                "Δx·Δp ≥ h/4π (Heisenberg uncertainty)",
                "Eₙ = −13.6 Z²/n² eV (H-like atom)",
                "1/λ = R(1/n₁² − 1/n₂²) (Rydberg formula)",
                "R = 1.097 × 10⁷ m⁻¹",
                "Magnetic quantum number mₗ = −l to +l",
                "Spin quantum number mₛ = ±½",
                "Pauli exclusion: no 2 electrons same 4 QNs",
                "Hund's rule: fill orbitals singly first",
                "Aufbau: fill lowest energy orbitals first",
                "s orbital: spherical; p orbital: dumb-bell; d: clover"
            ]},
            { topic: "Periodic Table", items: [
                "Group = vertical column (same valence e⁻)",
                "Period = horizontal row (same shells)",
                "Atomic radius ↓ across period, ↑ down group",
                "Ionization enthalpy ↑ across period, ↓ down group",
                "Electronegativity ↑ across period, ↓ down group",
                "Electron affinity ↑ across period, ↓ down group",
                "Metallic character ↓ across period, ↑ down group",
                "s-block: alkali & alkaline earth metals",
                "p-block: non-metals, metalloids, noble gases",
                "d-block: transition elements (variable oxidation)",
                "f-block: lanthanides & actinides",
                "Zigzag line: separates metals from non-metals",
                "Periodic Law: properties are periodic function of Z"
            ]},
            { topic: "Chemical Bonding", items: [
                "Ionic bond: metal + non-metal (e⁻ transfer)",
                "Covalent bond: non-metal + non-metal (e⁻ sharing)",
                "Coordinate bond: one atom donates both e⁻",
                "Metallic bond: delocalized e⁻ 'sea' model",
                "Bond order = ½(bonding − antibonding e⁻)",
                "VSEPR: lone pairs repel more than bond pairs",
                "sp³: tetrahedral (109.5°), sp²: trigonal (120°)",
                "sp: linear (180°), dsp²: square planar",
                "Electronegativity difference > 1.7 = ionic",
                "Dipole moment μ = q × d",
                "Resonance: delocalization of π electrons",
                "Fajan's rules: polarization depends on charge & size",
                "σ bond: head-on overlap; π bond: lateral overlap",
                "Bond length ∝ 1/Bond order"
            ]},
            { topic: "Chemical Reactions & Stoichiometry", items: [
                "A + B → AB (Combination)",
                "AB → A + B (Decomposition)",
                "AB + C → AC + B (Displacement)",
                "AB + CD → AD + CB (Double displacement)",
                "Oxidation: loss of electrons / gain of O",
                "Reduction: gain of electrons / loss of O",
                "OIL RIG: Oxidation Is Loss, Reduction Is Gain",
                "Mole = given mass / molar mass",
                "Number of particles = n × 6.022 × 10²³",
                "Volume at STP = n × 22.4 L",
                "Percentage yield = (actual/theoretical) × 100",
                "Limiting reagent: reactant that runs out first",
                "N-factor: equivalent mass = molar mass / n-factor",
                "Normality N = n-factor × Molarity"
            ]},
            { topic: "Solutions & Concentration", items: [
                "Molarity M = moles of solute / L of solution",
                "Molality m = moles of solute / kg of solvent",
                "Mole fraction Xₐ = nₐ / (nₐ + nᵦ)",
                "Mass% = (mass solute / mass solution) × 100",
                "ppm = (mass solute / mass solution) × 10⁶",
                "Dilution: M₁V₁ = M₂V₂",
                "Raoult's law: P = XₐP°ₐ (ideal solutions)",
                "ΔT_b = i·K_b·m (boiling point elevation)",
                "ΔT_f = i·K_f·m (freezing point depression)",
                "π = iCRT (osmotic pressure)",
                "van't Hoff factor i = actual particles / formula units",
                "Azeotrope: constant boiling mixture (non-ideal)"
            ]},
            { topic: "Acids, Bases & pH", items: [
                "pH = −log[H⁺]",
                "pOH = −log[OH⁻]",
                "pH + pOH = 14 (at 25°C)",
                "[H⁺] = 10⁻ᵖᴴ, [OH⁻] = 10⁻ᵖᴼᴴ",
                "K_w = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴",
                "Strong acid: completely dissociates",
                "Weak acid: partially dissociates (Kₐ)",
                "Kₐ = [H⁺][A⁻]/[HA]",
                "K_b = [BH⁺][OH⁻]/[B]",
                "pKₐ = −log Kₐ, pK_b = −log K_b",
                "pKₐ + pK_b = 14 (conjugate pair)",
                "Buffer: pH = pKₐ + log[salt]/[acid] (Henderson)",
                "Indicator changes color at pH = pKᵢₙ ± 1",
                "Titration: n₁V₁ = n₂V₂ (equivalence point)"
            ]},
            { topic: "Thermodynamics & Energetics", items: [
                "ΔH = ΔU + ΔnRT (enthalpy & internal energy)",
                "ΔH_reaction = ΣΔH_f(products) − ΣΔH_f(reactants)",
                "Hess's law: ΔH independent of path",
                "ΔS = ΣS(products) − ΣS(reactants) (entropy)",
                "ΔG = ΔH − TΔS (Gibbs free energy)",
                "ΔG < 0: spontaneous, ΔG = 0: equilibrium",
                "ΔG > 0: non-spontaneous",
                "ΔG° = −RT ln K (equilibrium constant)",
                "Bond energy: avg energy to break 1 mol bonds",
                "Specific heat: q = mcΔT",
                "Calorimetry: q_system + q_surroundings = 0",
                "Standard enthalpy: formation, combustion, neutralization"
            ]},
            { topic: "Chemical Kinetics", items: [
                "Rate = Δ[C]/Δt (reaction rate)",
                "Rate law: Rate = k[A]ᵐ[B]ⁿ",
                "Order: sum of exponents m + n",
                "Zero order: [A]ₜ = [A]₀ − kt",
                "First order: ln[A]ₜ = ln[A]₀ − kt",
                "Half-life: t½ = 0.693/k (first order)",
                "t½ = [A]₀/2k (zero order)",
                "t½ ∝ 1/[A]₀ (second order)",
                "Arrhenius: k = A·e⁻ᴱᵃ/ᴿᵀ",
                "ln(k₂/k₁) = Eₐ/R(1/T₁ − 1/T₂)",
                "Activation energy Eₐ: min energy for reaction",
                "Rate-determining step: slowest step in mechanism"
            ]},
            { topic: "Equilibrium", items: [
                "K_c = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ (equilibrium constant)",
                "K_p = K_c(RT)^Δⁿ",
                "Q < K: forward, Q = K: equilibrium, Q > K: reverse",
                "Le Chatelier: stress shifts equilibrium to oppose it",
                "Temperature ↑: endothermic direction favored",
                "Pressure ↑: side with fewer moles favored",
                "Catalyst: speeds both directions, no shift in equilibrium",
                "K_c (gas) = K_p / (RT)^Δⁿ",
                "Degree of dissociation α = dissociated moles / initial moles"
            ]},
            { topic: "Electrochemistry", items: [
                "E°_cell = E°_cathode − E°_anode",
                "ΔG° = −nFE°_cell",
                "Nernst: E = E° − (RT/nF) ln Q",
                "Nernst (298K): E = E° − (0.059/n) log Q",
                "F = 96500 C/mol (Faraday constant)",
                "Electrolysis: m = ZIt (mass deposited)",
                "Z = M/nF (electrochemical equivalent)",
                "Conductivity κ = 1/ρ (siemens/m)",
                "Molar conductivity Λₘ = κ/c",
                "Kohlrausch: Λₘ° = λ₊° + λ₋°",
                "Electrochemical series: metals arranged by E°",
                "Corrosion: Fe → Fe²⁺ + 2e⁻ (anodic reaction)"
            ]},
            { topic: "Organic Chemistry", items: [
                "CₙH₂ₙ₊₂ (Alkanes — single bonds, saturated)",
                "CₙH₂ₙ (Alkenes — C=C double bond)",
                "CₙH₂ₙ₋₂ (Alkynes — C≡C triple bond)",
                "CₙH₂ₙ₊₁OH (Alcohols — −OH group)",
                "CₙH₂ₙ₊₁CHO (Aldehydes — −CHO)",
                "CₙH₂ₙ₊₁COOH (Carboxylic acids — −COOH)",
                "CₙH₂ₙ₊₁NH₂ (Amines — −NH₂)",
                "R−X (Alkyl halides — X = F, Cl, Br, I)",
                "IUPAC: longest carbon chain = parent name",
                "Functional group priority: acid > aldehyde > alcohol > alkene > alkane",
                "Substitution: alkane + halogen → alkyl halide",
                "Addition: alkene + H₂O → alcohol (hydration)",
                "Elimination: alcohol → alkene + H₂O (dehydration)",
                "Markovnikov: H adds to C with more H's",
                "Saytzeff: more substituted alkene is major product",
                "Oxidation: primary → aldehyde → acid; secondary → ketone",
                "Reduction: aldehyde → primary alcohol; ketone → secondary",
                "Esterification: acid + alcohol → ester + H₂O"
            ]},
            { topic: "s-Block Elements", items: [
                "Group 1: Alkali metals (Li, Na, K, Rb, Cs, Fr)",
                "Group 2: Alkaline earth metals (Be, Mg, Ca, Sr, Ba, Ra)",
                "ns¹ and ns² valence configurations",
                "Reactivity increases down the group",
                "Na + H₂O → NaOH + ½H₂ (vigorous)",
                "2Na + O₂ → Na₂O₂ (peroxide)",
                "Mg + O₂ → 2MgO (bright white flame)",
                "CaO + H₂O → Ca(OH)₂ (slaked lime)",
                "NaOH: strong base, used in soap making",
                "NaHCO₃: baking soda; Na₂CO₃: washing soda"
            ]},
            { topic: "p-Block Elements", items: [
                "Boron family (13): B, Al, Ga, In, Tl — 3 valence e⁻",
                "Carbon family (14): C, Si, Ge, Sn, Pb — 4 valence e⁻",
                "Nitrogen family (15): N, P, As, Sb, Bi — 5 valence e⁻",
                "Oxygen family (16): O, S, Se, Te, Po — 6 valence e⁻",
                "Halogen family (17): F, Cl, Br, I, At — 7 valence e⁻",
                "Noble gases (18): He, Ne, Ar, Kr, Xe, Rn — full octet",
                "Inert pair effect: lower oxidation states down a group",
                "Allotropes of carbon: diamond, graphite, fullerene",
                "O₃: ozone layer protects from UV",
                "Cl₂ + H₂O → HCl + HOCl (water disinfection)"
            ]},
            { topic: "d & f-Block Elements", items: [
                "Transition metals: groups 3–12, partially filled d-orbitals",
                "Variable oxidation states (e.g., Fe²⁺, Fe³⁺)",
                "Form colored compounds (d-d transitions)",
                "Catalytic properties (e.g., Fe in Haber process)",
                "Lanthanoids (Ce–Lu): 4f orbitals, similar properties",
                "Actinoids (Th–Lr): 5f orbitals, radioactive",
                "Lanthanoid contraction: gradual size decrease across series",
                "K₂Cr₂O₇: orange oxidant; KMnO₄: purple oxidant",
                "Ferromagnetism: Fe, Co, Ni (strongly attracted)"
            ]},
            { topic: "Coordination Compounds", items: [
                "Complex: [M(L)ₙ] where M = metal, L = ligand",
                "Coordination number = number of ligand donor atoms",
                "Ligand types: monodentate (1 bond), polydentate (multiple)",
                "Chelate: polydentate ligand forms ring with metal",
                "Werner's theory: primary (ionizable) and secondary (fixed) valency",
                "IUPAC naming: ligands alphabetically, then metal (oxidation state)",
                "Isomerism: geometrical (cis-trans), optical (d/l), structural",
                "Crystal field theory: d-orbital splitting in complexes",
                "High spin: weak field ligands; Low spin: strong field ligands",
                "EDTA: hexadentate ligand used in water softening",
                "Spectrochemical series: I⁻ < Br⁻ < Cl⁻ < H₂O < NH₃ < CN⁻ < CO"
            ]},
            { topic: "Polymers & Biomolecules", items: [
                "Addition polymers: polyethene, PVC, Teflon, polystyrene",
                "Condensation polymers: nylon, PET, bakelite",
                "Natural polymers: cellulose, starch, proteins, rubber",
                "Glucose C₆H₁₂O₆: monosaccharide, provides energy",
                "Proteins: polymers of amino acids (peptide bonds)",
                "Primary structure: sequence of amino acids",
                "Secondary: α-helix, β-sheet (H-bonding)",
                "Enzymes: biological catalysts (lock and key model)",
                "Vitamins: organic compounds essential in small amounts",
                "DNA: double helix, encodes genetic information",
                "RNA: single strand, involved in protein synthesis"
            ]},
            { topic: "Environmental & Nuclear Chemistry", items: [
                "Greenhouse gases: CO₂, CH₄, H₂O vapor, CFCs",
                "Global warming: ↑ CO₂ traps infrared radiation",
                "Ozone depletion: CFCs → Cl radicals destroy O₃",
                "Acid rain: SO₂ + NOₓ → H₂SO₄, HNO₃ (pH < 5.6)",
                "BOD: oxygen consumed by microbes to decompose organics",
                "Hard water: Ca²⁺, Mg²⁺; removed by boiling or ion exchange",
                "α particle: He²⁺ (low penetration, +2 charge)",
                "β particle: e⁻ (medium penetration, −1 charge)",
                "γ rays: high energy photons (high penetration, neutral)",
                "Nuclear fission: ²³⁵U + n → fission products + energy",
                "Nuclear fusion: ²H + ³H → ⁴He + n + energy"
            ]},
            { topic: "Metallurgy", items: [
                "Ore: mineral from which metal is extracted",
                "Gangue: unwanted impurities in ore",
                "Concentration: gravity, magnetic, froth flotation",
                "Calcination: ore heated in limited air (carbonates)",
                "Roasting: ore heated in excess air (sulfides)",
                "Reduction: metal oxide + reducing agent → metal",
                "Electrolytic reduction: used for highly reactive metals",
                "Alloy: mixture of metal with other elements",
                "Amalgam: alloy with mercury",
                "Steel: Fe + 0.1–2% C",
                "Thermite: Fe₂O₃ + 2Al → 2Fe + Al₂O₃ + heat"
            ]}
        ]
    },

    renderFormulaSheet(el) {
        let currentSubject = 'Mathematics';
        const renderFormulas = (subject) => {
            const groups = this.formulaDb[subject] || [];
            return `
                <div style="margin-top:12px; display:flex; flex-direction:column; gap:16px; max-height:380px; overflow-y:auto;">
                    ${groups.map(g => `
                        <div class="settings-group-box" style="font-size:12px; border-left:3px solid ${this.getSubjectColor(subject).main};">
                            <div style="font-weight:700; font-size:13px; color:${this.getSubjectColor(subject).main}; margin-bottom:6px;">${g.topic}</div>
                            <ul style="list-style:none; padding:0; margin:0;">
                                ${g.items.map(f => `<li style="padding:3px 0; border-bottom:1px solid var(--border); font-family:'Courier New',monospace; font-size:11px;">${f}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const subjects = Object.keys(this.formulaDb);
        const subjectColors = { Mathematics: 'var(--accent-amber)', Physics: 'var(--accent-blue)', Chemistry: 'var(--accent-red)' };

        el.innerHTML = `
            <div class="modal-header">
                <h3 style="font-size:16px; font-family:var(--font-heading);"><i class="fa-solid fa-square-root-variable" style="color:var(--accent-violet)"></i> Formula & Cheat Sheet</h3>
                <span class="modal-close" onclick="app.closeModal()">&times;</span>
            </div>
            <p style="font-size:11px; color:var(--text-secondary);">Quick reference of key formulas across Math, Physics, and Chemistry.</p>
            
            <div style="display:flex; gap:8px; margin-top:10px;" id="formula-subject-tabs">
                ${subjects.map(s => `
                    <button class="challenge-opt" data-subject="${s}" style="flex:1; text-align:center; font-size:11px; font-weight:700; padding:8px; border:2px solid transparent; ${s === currentSubject ? `border-color:${subjectColors[s]}; background:var(--${s.toLowerCase() === 'mathematics' ? 'accent-amber' : s.toLowerCase() === 'physics' ? 'accent-blue' : 'accent-red'}-light)` : ''}" onclick="tools.switchFormulaTab('${s}')">${s}</button>
                `).join('')}
            </div>
            
            <div id="formula-content">
                ${renderFormulas(currentSubject)}
            </div>
        `;
    },

    switchFormulaTab(subject) {
        const tabs = document.querySelectorAll('#formula-subject-tabs .challenge-opt');
        const subjectColors = { Mathematics: 'var(--accent-amber)', Physics: 'var(--accent-blue)', Chemistry: 'var(--accent-red)' };
        tabs.forEach(t => {
            const s = t.dataset.subject;
            if (s === subject) {
                t.style.borderColor = subjectColors[s];
                t.style.background = `var(--${s === 'Mathematics' ? 'accent-amber' : s === 'Physics' ? 'accent-blue' : 'accent-red'}-light)`;
            } else {
                t.style.borderColor = 'transparent';
                t.style.background = '';
            }
        });
        const groups = this.formulaDb[subject] || [];
        const el = document.getElementById('formula-content');
        const color = this.getSubjectColor(subject).main;
        el.innerHTML = `
            <div style="margin-top:12px; display:flex; flex-direction:column; gap:16px; max-height:380px; overflow-y:auto;">
                ${groups.map(g => `
                    <div class="settings-group-box" style="font-size:12px; border-left:3px solid ${color};">
                        <div style="font-weight:700; font-size:13px; color:${color}; margin-bottom:6px;">${g.topic}</div>
                        <ul style="list-style:none; padding:0; margin:0;">
                            ${g.items.map(f => `<li style="padding:3px 0; border-bottom:1px solid var(--border); font-family:'Courier New',monospace; font-size:11px;">${f}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
