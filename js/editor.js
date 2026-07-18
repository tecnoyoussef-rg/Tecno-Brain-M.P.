class TecnoBrainEditor {
    constructor() {
        (function injectChartJS() {
            if (typeof Chart === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.type = 'text/javascript';
                script.onload = () => {
                    console.log('📊 Chart.js Library injected and loaded successfully!');
                };
                document.head.appendChild(script);
            }
        })();

        this.elements = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.currentModalLang = 'html';
        this.currentEditingElement = null;
        this.currentExplorerTab = 'home';
        this.currentPanelTab = 'properties';
        this.currentProjectId = null;
        this.currentBrandSubView = null;
        this.dragState = null;
        this.isDragging = false;
        this.currentTargetElement = null;
        this.offsetX = 0;
        this.offsetY = 0;
        if (typeof window !== 'undefined') {
            window.editor = this;
            window.TecnoBrainEditor = TecnoBrainEditor;
        }
        // Delta-based drag state (start positions)
        this.startMouseX = 0;
        this.startMouseY = 0;
        this.startElementLeft = 0;
        this.startElementTop = 0;
        this.brandKit = {
            colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#1e293b', '#ef4444', '#06b6d4'],
            fonts: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Cairo', 'Tajawal'],
            logos: [],
            templates: [
                { id: 'tpl-1', name: 'Modern Hero Section', type: 'container', desc: 'Minimalist header with actions' },
                { id: 'tpl-2', name: 'Product Feature Card', type: 'container', desc: 'Image left, text right layout' },
                { id: 'tpl-3', name: 'Pricing Table Presets', type: 'container', desc: '3-column subscription grid' }
            ],
            voiceTexts: [
                { title: 'Company Vision', text: 'Empowering creativity through advanced visual technologies.', tag: 'h1' },
                { title: 'Official Tagline', text: 'The ultimate canvas for modern creators.', tag: 'p' },
                { title: 'Value Proposition', text: 'Design faster, scale smarter, and maintain brand consistency across all assets.', tag: 'p' }
            ],
            graphics: [
                { name: 'Solid Rectangle', icon: 'fas fa-square', type: 'container' },
                { name: 'Geometric Circle', icon: 'fas fa-circle', type: 'icon' },
                { name: 'Branding Star', icon: 'fas fa-star', type: 'icon' },
                { name: 'Badge Ribbon', icon: 'fas fa-bookmark', type: 'container' },
                { name: 'Decorative Diamond', icon: 'fas fa-gem', type: 'icon' },
                { name: 'Quote Block Symbol', icon: 'fas fa-quote-left', type: 'text' }
            ]
        };
        this.popularFonts = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Oswald', 'Source Sans Pro',
            'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather', 'Noto Sans', 'Playfair Display',
            'Cairo', 'Amiri', 'Tajawal', 'Almarai', 'El Messiri', 'Changa', 'Lemonada', 'Kufam',
            'Ubuntu', 'Lora', 'PT Serif', 'Titillium Web', 'Muli', 'Arimo', 'Lobster', 'Pacifico'
        ];
        this.ideFiles = {
            'python': [{ name: 'main.py', content: 'print("Hello from Python in Tecno Brain!")\nimport math\nprint("Math PI:", math.pi)' }],
            'java': [{ name: 'Main.java', content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}' }],
            'javascript': [{ name: 'index.js', content: 'console.log("Hello from JavaScript!");\nconst arr = [1, 2, 3];\nconsole.log("Doubled:", arr.map(x => x * 2));' }],
            'html': [{ name: 'index.html', content: '<h1>Hello World</h1>' }],
            'css': [{ name: 'style.css', content: 'body { background: #000; }' }]
        };
        this.currentLanguage = 'python';
        this.currentActiveFileIndex = 0;
        this.monacoEditorInstance = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderExplorerPanel('home');
            this.setupCanvasClick();
            this.setupKeyboardShortcuts();
            this.setupIDEInteractions();
            this.setupGlobalDragListeners();
            this.initGoogleFonts();
            this.saveHistory();
        });
    }

    openLanguageIDE(language) {
        this.currentLanguage = language;
        this.currentActiveFileIndex = 0;

        const workspace = document.getElementById('workspace') || document.querySelector('.workspace');
        const ideContainer = document.getElementById('code-ide-container');
        const mainLayout = document.querySelector('.main-layout');

        if (workspace) workspace.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'none';
        if (ideContainer) {
            ideContainer.classList.remove('hidden');
            ideContainer.style.display = 'flex';
        }

        if (!this.monacoEditorInstance) {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
            require(['vs/editor/editor.main'], () => {
                this.monacoEditorInstance = monaco.editor.create(document.getElementById('monaco-editor-container'), {
                    theme: 'vs-dark',
                    automaticLayout: true
                });
                this.loadIDEFileToEditor();
            });
        } else {
            this.loadIDEFileToEditor();
        }
    }

    openDesignWorkspace() {
        const ideContainer = document.getElementById('code-ide-container');
        const mainLayout = document.querySelector('.main-layout');
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace');

        if (ideContainer) ideContainer.classList.add('hidden');
        if (mainLayout) mainLayout.style.display = 'flex';
        if (workspace) workspace.style.display = 'block';
    }

    loadIDEFileToEditor() {
        const files = this.ideFiles[this.currentLanguage];
        if (!files || files.length === 0) return;

        const currentFile = files[this.currentActiveFileIndex] || files[0];

        if (this.monacoEditorInstance) {
            const model = monaco.editor.createModel(currentFile.content, this.currentLanguage);
            this.monacoEditorInstance.setModel(model);

            this.monacoEditorInstance.onDidChangeModelContent(() => {
                currentFile.content = this.monacoEditorInstance.getValue();
            });
        }

        const currentFileName = document.getElementById('current-open-file-name');
        if (currentFileName) currentFileName.innerText = currentFile.name;

        const filesList = document.getElementById('ide-files-list');
        if (filesList) {
            filesList.innerHTML = files.map((file, index) => `
                <div class="file-item ${index === this.currentActiveFileIndex ? 'active' : ''}" onclick="editor.switchActiveIDEFile(${index})">
                    <i class="fas fa-file-code"></i> ${file.name}
                </div>
            `).join('');
        }
    }

    createNewFileInIDE() {
        const filename = prompt('Enter new file name (e.g., utils.py, Test.java):');
        if (!filename) return;

        this.ideFiles[this.currentLanguage].push({
            name: filename,
            content: `// Code for ${filename}`
        });

        this.currentActiveFileIndex = this.ideFiles[this.currentLanguage].length - 1;
        this.loadIDEFileToEditor();
    }

    switchActiveIDEFile(index) {
        this.currentActiveFileIndex = index;
        this.loadIDEFileToEditor();
    }

    runCurrentCode() {
        const consoleScreen = document.getElementById('console-output');
        const iframe = document.getElementById('live-preview-iframe');
        if (!consoleScreen) return;

        consoleScreen.innerText = 'Running and compiling code...\n';

        if (['html', 'css', 'javascript'].includes(this.currentLanguage)) {
            const htmlCode = this.ideFiles['html'][0]?.content || '';
            const cssCode = this.ideFiles['css'][0]?.content || '';
            const jsCode = this.ideFiles['javascript'][0]?.content || '';

            const completeWebPage = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <style>${cssCode}</style>
                </head>
                <body>
                    ${htmlCode}
                    <script>
                        window.onerror = function(message) {
                            window.parent.postMessage({type: 'error', data: message}, '*');
                        };
                        console.log = function(...args) {
                            window.parent.postMessage({type: 'log', data: args.join(' ')}, '*');
                        };
                    <\/script>
                    <script>${jsCode}<\/script>
                </body>
                </html>
            `;

            this.switchIDETab('preview');

            if (iframe) {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(completeWebPage);
                iframeDoc.close();
            }

            consoleScreen.innerText = 'Web Preview updated successfully!';
        } else {
            setTimeout(() => {
                if (this.currentLanguage === 'python') {
                    consoleScreen.innerText = '>>> python main.py\nHello from Python in Tecno Brain!\n\nProcess finished with exit code 0';
                } else if (this.currentLanguage === 'java') {
                    consoleScreen.innerText = '>>> javac Main.java && java Main\nHello from Java!\n\nProcess finished with exit code 0';
                }
                this.switchIDETab('console');
            }, 600);
        }
    }

    installLibrary() {
        const libName = document.getElementById('package-name-input').value;
        if (!libName) return;

        const list = document.getElementById('installed-libraries-list');
        if (!list) return;

        const newItem = document.createElement('li');
        newItem.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Installing ${libName}...`;
        list.appendChild(newItem);

        setTimeout(() => {
            newItem.innerHTML = `<i class="fas fa-check-circle" style="color:#22c55e;"></i> Library <strong>${libName}</strong> imported and compiled successfully!`;
            document.getElementById('package-name-input').value = '';
        }, 1500);
    }

    setupIDEInteractions() {
        window.addEventListener('message', (event) => {
            const consoleScreen = document.getElementById('console-output');
            if (!consoleScreen) return;

            if (event.data && event.data.type === 'log') {
                const currentText = consoleScreen.innerText === 'Click "Run Code" to see output...' ? '' : consoleScreen.innerText;
                consoleScreen.innerText = `${currentText}${currentText ? '\n' : ''}${event.data.data}`;
            }

            if (event.data && event.data.type === 'error') {
                const currentText = consoleScreen.innerText === 'Click "Run Code" to see output...' ? '' : consoleScreen.innerText;
                consoleScreen.innerText = `${currentText}${currentText ? '\n' : ''}Error: ${event.data.data}`;
            }
        });
    }

    switchIDETab(tabId) {
        document.querySelectorAll('.ide-tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.bottom-tab').forEach(el => el.classList.remove('active'));

        const target = document.getElementById('ide-' + tabId);
        if (target) target.classList.remove('hidden');

        const tabButton = document.getElementById('tab-btn-' + tabId);
        if (tabButton) tabButton.classList.add('active');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const target = e.target;
            const isEditable = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            );

            if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.altKey && !e.metaKey && !isEditable) {
                e.preventDefault();
                if (this.selectedElement) {
                    this.deleteElement(this.selectedElement);
                }
                return;
            }

            if (e.ctrlKey && e.key === 'z') this.undo();
            if (e.ctrlKey && e.key === 'y') this.redo();
        });
    }

    saveHistory() {
        const state = document.getElementById('canvas') ? document.getElementById('canvas').innerHTML : '';
        // Truncate future history
        if (this.historyIndex < this.history.length - 1) this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            document.getElementById('canvas').innerHTML = this.history[this.historyIndex];
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            document.getElementById('canvas').innerHTML = this.history[this.historyIndex];
        }
    }

    switchExplorerTab(tab, el) {
        document.querySelectorAll('.left-sidebar .nav-item, .left-sidebar .sidebar-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');
        this.currentExplorerTab = tab;

        const panel = document.getElementById('dynamicExplorerPanel') 
                   || document.querySelector('.components-menu') 
                   || document.getElementById('componentsPanel');
        if (!panel) return;

        panel.style.display = 'block';
        panel.innerHTML = '';

        if (tab === 'brandkit') {
            panel.style.display = 'none';
            this.currentBrandSubView = null;
            this.renderExplorerPanel('brandkit');
            setTimeout(() => {
                this.initGoogleFonts();
            }, 100);
        } else if (tab === 'premium-assets') {
            this.renderPremiumExplorerTab(tab);
        } else if (tab === 'tools') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-tools" style="color:#8b5cf6;"></i> Library Tools</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Activate the libraries you imported and use their tools directly in the editor.</p>
                <div class="library-tools-grid" style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px;">
                    <button class="btn" onclick="editor.launchPickr()">Pickr Color Picker</button>
                    <button class="btn" onclick="editor.launchCropper()">Cropper Image Editor</button>
                    <button class="btn" onclick="editor.applyCamanFilter('vintage')">Caman Vintage Filter</button>
                    <button class="btn" onclick="editor.insert3DCube()">Insert 3D Cube</button>
                    <button class="btn" onclick="editor.insertGridTable()">Insert Grid.js Table</button>
                    <button class="btn" onclick="editor.openFilerobotEditor()">Open Filerobot Editor</button>
                    <button class="btn" onclick="editor.animateSelectedElement()">Animate Selected</button>
                    <button class="btn" onclick="editor.captureWorkspaceScreenshot()">Capture Workspace</button>
                </div>
                <div style="margin-top:16px; padding:14px; background:#111827; border:1px solid rgba(255,255,255,0.06); border-radius:10px; color:#cbd5e1; font-size:12px; line-height:1.5;">
                    <strong>Tip:</strong> Select an image element before launching Cropper or Caman.
                </div>
            `;
        } else if (tab === 'premium-templates') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-layer-group" style="color:#3b82f6;"></i> Premium Templates (100 PRO)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Click a professional layout to instantly load it into your workspace.</p>
                <div id="templatesGridBox" style="display:flex; flex-direction:column; gap:12px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;

            const templatesGrid = document.getElementById('templatesGridBox');
            const categories = ['Instagram Post', 'Luxury Business Card', 'TikTok/Reels Story', 'YouTube Banner'];
            const templateGradients = [
                '#09090b', 'linear-gradient(135deg, #1e1b4b, #0f172a)', 
                'linear-gradient(135deg, #1f1235, #100a1c)', 'linear-gradient(45deg, #1a1a1a, #262626)'
            ];

            for (let i = 1; i <= 100; i++) {
                const category = categories[i % categories.length];
                const bgStyle = templateGradients[i % templateGradients.length];
                
                const templateBox = document.createElement('div');
                templateBox.style.cssText = "background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; cursor:pointer; transition:all 0.2s;";
                templateBox.onmouseover = () => { templateBox.style.borderColor = '#3b82f6'; };
                templateBox.onmouseout = () => { templateBox.style.borderColor = '#2e2e3e'; };

                templateBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h4 style="color:#fff; font-size:12px; margin:0; font-weight:600;">✨ Layout Template #${i}</h4>
                        <span style="font-size:9px; background:#2e2e3e; color:#3b82f6; padding:2px 6px; border-radius:4px; font-weight:bold;">PRO</span>
                    </div>
                    <div style="width:100%; height:8px; background:${bgStyle}; border-radius:4px;"></div>
                `;
                templateBox.onclick = () => editor.buildPremiumTemplateByIndex(i, category, bgStyle);
                templatesGrid.appendChild(templateBox);
            }
        } else if (tab === 'buttons-library') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-mouse-pointer" style="color:#10b981;"></i> Premium Buttons (100 Styles)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Click any professional button to add it to your canvas with GSAP + Hover.css effects.</p>
                <div id="buttonsGridBox" style="display:grid; grid-template-columns:1fr; gap:12px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;
            
            const btnGrid = document.getElementById('buttonsGridBox');
            const buttonThemes = ['linear-gradient(45deg, #ef4444, #f97316)', 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 'linear-gradient(90deg, #10b981, #059669)', '#ffffff'];
            const buttonEffects = ['hvr-grow', 'hvr-float', 'hvr-bob', 'hvr-sweep-to-right'];

            for (let i = 1; i <= 100; i++) {
                const currentTheme = buttonThemes[i % buttonThemes.length];
                const effectClass = buttonEffects[i % buttonEffects.length];
                let borderRadius = i % 3 === 0 ? '30px' : '6px';
                let textColor = (currentTheme === '#ffffff') ? '#111827' : '#ffffff';
                
                const generatedStyle = `padding: 10px 18px; border-radius: ${borderRadius}; background: ${currentTheme}; color: ${textColor}; font-weight: bold; border: none; font-size: 11px; text-align: center; width:100%; box-shadow: 0 10px 20px rgba(0,0,0,0.18);`;
                const btnHtml = `<button class="${effectClass}" data-effect="${effectClass}" style="${generatedStyle}">Action Button #${i}</button>`;
                
                const wrapperBox = document.createElement('div');
                wrapperBox.style.cssText = "background:#1e1e2e; padding:12px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid #2e2e3e;";
                wrapperBox.innerHTML = btnHtml;
                wrapperBox.onclick = () => editor.addButtonToWorkspace(btnHtml);
                btnGrid.appendChild(wrapperBox);
            }
        } else if (tab === 'graphics-cleaner') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-broom" style="color:#38bdf8;"></i> Graphics Cleaner</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Advanced tools to isolate, clean, and wipe layers.</p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button onclick="editor.cleanCanvas('isolate')" style="background:#2e2e3e; color:#fff; border:1px solid #38bdf8; padding:10px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;"><i class="fas fa-compress-alt"></i> Isolate Selected Layer</button>
                    <button onclick="editor.cleanCanvas('clear-bg')" style="background:#2e2e3e; color:#fff; border:1px solid #38bdf8; padding:10px; border-radius:6px; font-size:11px; cursor:pointer; text-align:left;"><i class="fas fa-eraser"></i> Make Canvas Background Transparent</button>
                    <button onclick="editor.cleanCanvas('wipe-all')" style="background:#ef4444; color:#fff; border:none; padding:10px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;"><i class="fas fa-trash-alt"></i> Wipe Entire Workspace (Reset)</button>
                </div>
            `;
        } else if (tab === '3d-equipment') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-cube" style="color:#fb923c;"></i> 3D Studio Equipment (100 Elements)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Click to inject high-end 3D faux isometric shapes.</p>
                <div id="3dGridBox" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;
            const grid3d = document.getElementById('3dGridBox');
            for (let i = 1; i <= 100; i++) {
                let skewAngle = (i % 2 === 0) ? 'skewX(-15deg) rotate(15deg)' : 'skewY(10deg) rotate(-10deg)';
                let html3d = `<div style="width:50px; height:50px; background:linear-gradient(135deg, #fb923c, #db2777); transform:${skewAngle}; box-shadow: -5px 5px 0px #9a3412, 5px 5px 15px rgba(0,0,0,0.4); border-radius:${i % 5 === 0 ? '50%' : '4px'};"></div>`;
                const box = document.createElement('div');
                box.style.cssText = "background:#1e1e2e; padding:15px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid #2e2e3e;";
                box.innerHTML = html3d;
                box.onclick = () => editor.addGenericAssetToWorkspace(html3d, '3d');
                grid3d.appendChild(box);
            }
        } else if (tab === 'animation-tools') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-running" style="color:#a855f7;"></i> Dynamic Animation Suite (100 Motion FX)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Select an element from canvas, then click any motion style below.</p>
                <div id="animGridBox" style="display:grid; grid-template-columns:1fr; gap:8px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;
            const gridAnim = document.getElementById('animGridBox');
            const motions = ['pulse', 'bounce', 'spin', 'float', 'flash'];
            if(!document.getElementById('tecno-brain-anims')) {
                const styleSheet = document.createElement("style");
                styleSheet.id = "tecno-brain-anims";
                styleSheet.innerText = `
                    @keyframes tb-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
                    @keyframes tb-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
                    @keyframes tb-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes tb-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-6px) rotate(3deg); } }
                `;
                document.head.appendChild(styleSheet);
            }
            for (let i = 1; i <= 100; i++) {
                const motion = motions[i % motions.length];
                const box = document.createElement('div');
                box.style.cssText = "background:#1e1e2e; padding:10px; border-radius:6px; color:#fff; font-size:11px; cursor:pointer; border:1px solid #2e2e3e; display:flex; justify-content:space-between; align-items:center;";
                box.innerHTML = `<span>⚡ Motion Asset Style #${i} (${motion})</span> <span style="color:#a855f7; font-weight:bold;">APPLY</span>`;
                box.onclick = () => editor.applyAnimationToSelected(`tb-${motion} ${2 + (i%3)}s infinite ease-in-out`);
                gridAnim.appendChild(box);
            }
        } else if (tab === 'sheets-equipment') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-table" style="color:#f43f5e;"></i> Premium Sheets & Tables (100 Layouts)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Click to inject editable matrix tables into canvas.</p>
                <div id="sheetsGridBox" style="display:flex; flex-direction:column; gap:10px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;
            const gridSheets = document.getElementById('sheetsGridBox');
            for (let i = 1; i <= 100; i++) {
                let tableHtml = `
                    <table style="width:100%; border-collapse:collapse; background:#1e1e2e; color:#fff; font-size:10px; border:1px solid #3f3f46; border-radius:4px; overflow:hidden;">
                        <tr style="background:${i % 2 === 0 ? '#f43f5e' : '#312e81'}; font-weight:bold;">
                            <th style="padding:4px; border:1px solid #3f3f46;">Data_${i}</th>
                            <th style="padding:4px; border:1px solid #3f3f46;">Value</th>
                        </tr>
                        <tr>
                            <td style="padding:4px; border:1px solid #3f3f46;" contenteditable="true">Item A</td>
                            <td style="padding:4px; border:1px solid #3f3f46;" contenteditable="true">${i * 10}</td>
                        </tr>
                    </table>
                `;
                const box = document.createElement('div');
                box.style.cssText = "background:#1e1e2e; padding:8px; border-radius:6px; cursor:pointer; border:1px solid #2e2e3e;";
                box.innerHTML = `<div style="font-size:11px; color:#cbd5e1; margin-bottom:4px; font-weight:bold;">Sheet Template #${i}</div>` + tableHtml;
                box.onclick = () => editor.addGenericAssetToWorkspace(tableHtml, 'sheet');
                gridSheets.appendChild(box);
            }
        } else if (tab === 'video-studio') {
            panel.innerHTML = `
                <div style="padding: 5px;">
                    <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-video" style="color:#ec4899;"></i> Video Editing Studio</h3>
                    <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Import clips and use CapCut-style presets for a cinematic effect library.</p>
                    
                    <div style="background:#1e1e2e; border: 1px dashed #ec4899; padding:20px; border-radius:8px; text-align:center; cursor:pointer; margin-bottom:15px;" onclick="document.getElementById('videoImportInput').click()">
                        <i class="fas fa-cloud-upload-alt" style="font-size:24px; color:#ec4899; margin-bottom:8px;"></i>
                        <span style="display:block; font-size:12px; color:#cbd5e1; font-weight:600;">Import MP4 / WebM Video</span>
                        <input type="file" id="videoImportInput" accept="video/*" style="display:none;" onchange="editor.handleVideoImport(event)">
                    </div>

                    <div class="video-controls-box" style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                        <label style="font-size:10px; color:#94a3b8; font-weight:bold; text-transform:uppercase;">🎬 Video Timeline Controls</label>
                        
                        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px;">
                            <button onclick="editor.controlVideo('play')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:11px; cursor:pointer;"><i class="fas fa-play"></i> Play</button>
                            <button onclick="editor.controlVideo('pause')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:11px; cursor:pointer;"><i class="fas fa-pause"></i> Pause</button>
                        </div>

                        <button onclick="editor.controlVideo('mute')" style="background:#2e2e3e; color:#ef4444; border:none; padding:8px; border-radius:4px; font-size:11px; cursor:pointer; width:100%;">
                            <i class="fas fa-volume-mute"></i> Toggle Mute / Audio
                        </button>

                        <div>
                            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:4px;">Playback Speed:</span>
                            <select onchange="editor.controlVideo('speed', this.value)" style="width:100%; padding:6px; background:#2e2e3e; border:1px solid #475569; color:#fff; border-radius:4px; font-size:11px;">
                                <option value="1">1.0x (Normal)</option>
                                <option value="1.5">1.5x (Fast)</option>
                                <option value="2">2.0x (Ultra Fast)</option>
                                <option value="0.5">0.5x (Slow Motion)</option>
                            </select>
                        </div>

                        <div>
                            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:4px;">Cinematic LUTs / Filters:</span>
                            <select onchange="editor.controlVideo('filter', this.value)" style="width:100%; padding:6px; background:#2e2e3e; border:1px solid #475569; color:#fff; border-radius:4px; font-size:11px;">
                                <option value="none">Normal Color</option>
                                <option value="grayscale(100%)">Noir (Black & White)</option>
                                <option value="contrast(150%) saturate(150%)">Cyberpunk Vivid</option>
                                <option value="sepia(60%)">Vintage Retro</option>
                                <option value="invert(100%)">Invert X-Ray</option>
                            </select>
                        </div>
                    </div>

                    <div style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px;">
                        <div style="font-size:11px; color:#cbd5e1; font-weight:bold; margin-bottom:8px;">✨ Effect Library</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                            <button onclick="editor.controlVideo('filter', 'brightness(130%) contrast(120%)')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:10px; cursor:pointer;">Bright Glow</button>
                            <button onclick="editor.controlVideo('filter', 'blur(1px) saturate(150%)')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:10px; cursor:pointer;">Soft Film</button>
                            <button onclick="editor.controlVideo('filter', 'hue-rotate(180deg) saturate(180%)')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:10px; cursor:pointer;">Neon Pop</button>
                            <button onclick="editor.controlVideo('filter', 'drop-shadow(0 0 8px #ec4899)')" style="background:#2e2e3e; color:#fff; border:none; padding:8px; border-radius:4px; font-size:10px; cursor:pointer;">Glow Edge</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (tab === 'logo-studio') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-feather" style="color:#38bdf8;"></i> Logo Studio</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Browse premium logo presets with slogan, color, shape, and animal-inspired styles.</p>
                <div id="logoLibraryGrid" style="display:grid; grid-template-columns:1fr; gap:10px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;"></div>
            `;
            const logos = [
                { name: 'Luxury Falcon', slogan: 'Rise Above', palette: ['#111827','#f59e0b','#ffffff'], icon: '🦅', shape: 'circle' },
                { name: 'Ocean Wave', slogan: 'Flow With Purpose', palette: ['#0f172a','#38bdf8','#e0f2fe'], icon: '🌊', shape: 'wave' },
                { name: 'Wild Lion', slogan: 'Fearless Brand', palette: ['#7c2d12','#fbbf24','#fff7ed'], icon: '🦁', shape: 'shield' },
                { name: 'Neo Tech', slogan: 'Build the Future', palette: ['#111827','#8b5cf6','#d8b4fe'], icon: '⚡', shape: 'hex' },
                { name: 'Eco Leaf', slogan: 'Green & Clean', palette: ['#14532d','#84cc16','#ecfccb'], icon: '🍃', shape: 'leaf' },
                { name: 'Royal Crown', slogan: 'Elite Presence', palette: ['#4c1d95','#f472b6','#fdf2f8'], icon: '👑', shape: 'crown' }
            ];
            const grid = document.getElementById('logoLibraryGrid');
            logos.forEach((preset, index) => {
                const card = document.createElement('div');
                card.style.cssText = 'background:#1e1e2e; border:1px solid #2e2e3e; border-radius:8px; padding:10px; cursor:pointer;';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="color:#fff; font-size:12px;">${preset.name}</strong>
                        <span style="font-size:12px;">${preset.icon}</span>
                    </div>
                    <div style="font-size:11px; color:#cbd5e1; margin-bottom:6px;">${preset.slogan}</div>
                    <div style="display:flex; gap:4px; margin-bottom:8px;">
                        ${preset.palette.map(c => `<span style="width:16px; height:16px; border-radius:4px; background:${c}; display:inline-block;"></span>`).join('')}
                    </div>
                    <div style="font-size:10px; color:#94a3b8;">Shape: ${preset.shape} • Brand-ready preset</div>
                `;
                card.onclick = () => editor.addLogoPresetToWorkspace(preset);
                grid.appendChild(card);
            });
        } else if (tab === 'charts-data') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-chart-line" style="color:#22c55e;"></i> Charts & Data Tables</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Drop in charts, dashboards, and fully editable data tables inspired by Excel-style workflows.</p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                    <button onclick="editor.insertChartPreset('bar')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">Bar Chart</button>
                    <button onclick="editor.insertChartPreset('line')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">Line Chart</button>
                    <button onclick="editor.insertChartPreset('pie')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">Pie Chart</button>
                    <button onclick="editor.insertChartPreset('doughnut')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:8px; border-radius:6px; font-size:11px; cursor:pointer;">Doughnut</button>
                </div>
                <button onclick="editor.insertDataTablePreset()" style="width:100%; background:linear-gradient(135deg, #10b981, #3b82f6); color:#fff; border:none; padding:10px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer; margin-bottom:10px;">Insert Editable Data Table</button>
                <div style="background:#111827; border:1px solid #2e2e3e; padding:10px; border-radius:8px; font-size:11px; color:#94a3b8; line-height:1.5;">Tip: after placing a table, click any cell to edit its values and make it fully your own.</div>
            `;
        } else if (tab === 'qr-generator') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-qrcode" style="color:#f59e0b;"></i> QR Generator</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Create a basic or advanced QR code for URLs, contacts, or your own content.</p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <input id="qrContentInput" placeholder="https://example.com" style="padding:10px; border-radius:6px; border:1px solid #475569; background:#111827; color:#fff;" />
                    <select id="qrSizeInput" style="padding:10px; border-radius:6px; border:1px solid #475569; background:#111827; color:#fff;">
                        <option value="180">180 × 180</option>
                        <option value="240">240 × 240</option>
                        <option value="320">320 × 320</option>
                    </select>
                    <button onclick="editor.generateQRCodeToWorkspace()" style="background:linear-gradient(135deg, #f59e0b, #f43f5e); color:#fff; border:none; padding:10px; border-radius:6px; font-size:12px; font-weight:bold; cursor:pointer;">Generate QR Code</button>
                </div>
            `;
        } else if (tab === 'picsart-pro') {
            panel.innerHTML = `
                <div style="padding: 5px;">
                    <h3 style="color:#fff; font-size:14px; margin-bottom:4px; background: linear-gradient(45deg, #f43f5e, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"><i class="fas fa-magic"></i> Tecno Pro Studio</h3>
                    <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Enjoy premium gold features for absolutely free.</p>
                    
                    <div class="pro-tool-card" style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; margin-bottom:12px;">
                        <span style="font-size:12px; color:#fff; font-weight:bold; display:block; margin-bottom:6px;">✨ AI Background Isolation</span>
                        <button onclick="editor.runPicsArtFeature('bg-remover')" style="width:100%; background:linear-gradient(135deg, #f43f5e, #a855f7); color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
                            Remove BG (Transparent)
                        </button>
                    </div>

                    <div class="pro-tool-card" style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; margin-bottom:12px;">
                        <span style="font-size:12px; color:#fff; font-weight:bold; display:block; margin-bottom:6px;">🎨 Premium Gold FX</span>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                            <button onclick="editor.runPicsArtFeature('fx-glitch')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">⚡ Glitch Art</button>
                            <button onclick="editor.runPicsArtFeature('fx-neon')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">🔮 Cyber Neon</button>
                            <button onclick="editor.runPicsArtFeature('fx-hdr')" style="background:#2e2e3e; color:#fff; border:1px solid #475569; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">📸 Ultra HDR</button>
                            <button onclick="editor.runPicsArtFeature('fx-reset')" style="background:#3f3f46; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">↩️ Reset FX</button>
                        </div>
                    </div>

                    <div class="pro-tool-card" style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; margin-bottom:12px;">
                        <span style="font-size:12px; color:#fff; font-weight:bold; display:block; margin-bottom:6px;">🚀 AI Smart Enhance</span>
                        <button onclick="editor.runPicsArtFeature('ai-enhance')" style="width:100%; background:#0ea5e9; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
                            <i class="fas fa-magic"></i> Auto Fix Lighting & Details
                        </button>
                    </div>

                    <div class="pro-tool-card" style="background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px;">
                        <span style="font-size:12px; color:#fff; font-weight:bold; display:block; margin-bottom:6px;">🖌️ Pro Object Eraser</span>
                        <p style="font-size:10px; color:#a1a1aa; margin:0 0 8px 0;">Inject an Eraser Mask to simulate object removal on top of layers.</p>
                        <button onclick="editor.runPicsArtFeature('object-eraser')" style="width:100%; background:#22c55e; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer;">
                            <i class="fas fa-paint-brush"></i> Deploy Smart Mask Eraser
                        </button>
                    </div>

                </div>
            `;
        } else {
            panel.style.display = 'none';
            this.renderExplorerPanel(tab);
        }
    }

    renderExplorerPanel(tab) {
        const panel = document.getElementById('componentsPanel');
        if (!panel) return;
        const panels = {
            home: this.renderHomePanel(),
            pages: this.renderPagesPanel(),
            layers: this.renderLayersPanel(),
            assets: this.renderAssetsPanel(),
            brandkit: this.renderBrandKitPanel(),
            html: this.renderCodePanel('html', 'HTML'),
            css: this.renderCodePanel('css', 'CSS'),
            js: this.renderCodePanel('js', 'JavaScript')
        };
        panel.innerHTML = panels[tab] || panels.home;
        if (tab === 'brandkit') {
            this.filterGoogleFonts('');
        }
        this.initLayersOrderController();
        panel.querySelectorAll('.component-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const lang = item.dataset.lang || 'html';
                if (type) this.addElement(type, lang);
            });
        });
    }

    applyButtonInteractionEffects(button) {
        if (!button || typeof window.gsap === 'undefined') return;

        button.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease';

        button.addEventListener('mouseenter', () => {
            const effect = button.getAttribute('data-effect') || 'hvr-grow';
            if (effect.includes('hvr-grow')) {
                window.gsap.to(button, { scale: 1.04, duration: 0.18, ease: 'power2.out' });
            } else if (effect.includes('hvr-float')) {
                window.gsap.to(button, { y: -4, duration: 0.18, ease: 'power2.out' });
            } else if (effect.includes('hvr-bob')) {
                window.gsap.to(button, { y: -3, duration: 0.18, ease: 'power2.out' });
            } else {
                window.gsap.to(button, { scale: 1.02, duration: 0.18, ease: 'power2.out' });
            }
        });

        button.addEventListener('mouseleave', () => {
            window.gsap.to(button, { scale: 1, y: 0, duration: 0.2, ease: 'power2.out' });
        });
    }

    addButtonToWorkspace(btnHtml) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        const newEl = document.createElement('div');
        newEl.className = 'scalable-element free-element';
        newEl.dataset.type = 'button';
        newEl.id = `btn_${Date.now()}`;
        newEl.style.cssText = "position: absolute; left: 150px; top: 150px; z-index: 200; cursor: move; display: inline-block;";
        newEl.innerHTML = btnHtml;

        const innerButton = newEl.querySelector('button');
        if (innerButton) {
            innerButton.setAttribute('contenteditable', 'true');
            innerButton.setAttribute('spellcheck', 'false');
            innerButton.style.outline = 'none';
            innerButton.style.userSelect = 'text';
            innerButton.style.minWidth = '80px';
            this.applyButtonInteractionEffects(innerButton);

            innerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectElement(newEl.id);
            });

            innerButton.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                innerButton.focus();
            });

            innerButton.addEventListener('blur', () => {
                if (typeof this.saveState === 'function') this.saveState();
            });
        }

        workspace.appendChild(newEl);
        this.selectedElement = newEl.id;

        if (typeof this.attachElementEvents === 'function') this.attachElementEvents(newEl);
        if (typeof this.selectElement === 'function') {
            this.selectElement(newEl.id);
        }
        if (typeof this.refreshLayersPanel === 'function') {
            this.refreshLayersPanel();
        }
        if (typeof this.showMagicToast === 'function') {
            this.showMagicToast("🎯 Interactive Button Added! Double-click text to rename.");
        }
    }

    handleVideoImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        if (typeof this.showMagicToast === 'function') this.showMagicToast("🎬 Processing video clip...");

        const videoUrl = URL.createObjectURL(file);
        const videoEl = document.createElement('div');
        videoEl.className = 'scalable-element free-element video-layer';
        const videoId = `video_${Date.now()}`;
        videoEl.id = videoId;
        videoEl.style.cssText = "position: absolute; left: 50px; top: 50px; width: 320px; height: 180px; z-index: 150; background:#000; border-radius:8px; overflow:hidden;";
        videoEl.innerHTML = `
            <video src="${videoUrl}" autoplay loop muted style="width:100%; height:100%; object-fit:cover; pointer-events:none;"></video>
        `;

        workspace.appendChild(videoEl);
        this.selectedElement = videoId;
        if (typeof this.attachElementEvents === 'function') this.attachElementEvents(videoEl);
        if (typeof this.showMagicToast === 'function') this.showMagicToast("✨ Video Imported & Streaming Live!");
    }

    controlVideo(action, value) {
        const currentEl = document.getElementById(this.selectedElement) || document.querySelector('.video-layer');
        if (!currentEl) {
            alert("💡 من فضلك اختر طبقة الفيديو من مساحة العمل أولاً للتحكم بها!");
            return;
        }

        const video = currentEl.querySelector('video');
        if (!video) return;

        if (action === 'play') {
            video.play();
        } else if (action === 'pause') {
            video.pause();
        } else if (action === 'mute') {
            video.muted = !video.muted;
            if (typeof this.showMagicToast === 'function') this.showMagicToast(video.muted ? "🔇 Audio Muted" : "🔊 Audio On");
        } else if (action === 'speed') {
            video.playbackRate = parseFloat(value);
        } else if (action === 'filter') {
            video.style.filter = value;
        }
    }

    renderHomePanel() {
        return `
            <div class="panel-header">
                <h3><i class="fas fa-home" style="margin-right:8px;color:var(--accent-purple)"></i>Components</h3>
            </div>
            <div class="panel-search">
                <input type="text" placeholder="Search components..." oninput="editor.filterComponents(this.value)">
            </div>
            <div class="component-category">Basic Elements</div>
            <div class="component-item" data-type="heading" data-lang="html">
                <div class="component-icon heading"><i class="fas fa-heading"></i></div>
                <div class="component-info"><h4>Heading</h4><p>Title & section headers</p></div>
                <span class="component-badge html">HTML</span>
            </div>
            <div class="component-item" data-type="text" data-lang="html">
                <div class="component-icon text"><i class="fas fa-font"></i></div>
                <div class="component-info"><h4>Text</h4><p>Paragraphs & body text</p></div>
                <span class="component-badge html">HTML</span>
            </div>
            <div class="component-item" onclick="editor.switchExplorerTab('buttons-library')" style="cursor: pointer;">
                <div class="component-icon button"><i class="fas fa-mouse-pointer"></i></div>
                <div class="component-info"><h4>Button</h4><p>Clickable actions</p></div>
                <span class="component-badge js">HTML</span>
            </div>
            <div class="component-item" data-type="image" data-lang="html">
                <div class="component-icon image"><i class="fas fa-image"></i></div>
                <div class="component-info"><h4>Image</h4><p>Photos & graphics</p></div>
                <span class="component-badge html">HTML</span>
            </div>
            <div class="component-item" data-type="icon" data-lang="css">
                <div class="component-icon icon"><i class="fas fa-icons"></i></div>
                <div class="component-info"><h4>Icon</h4><p>Font Awesome icons</p></div>
                <span class="component-badge css">CSS</span>
            </div>
            <div class="component-item" data-type="divider" data-lang="html">
                <div class="component-icon divider"><i class="fas fa-minus"></i></div>
                <div class="component-info"><h4>Divider</h4><p>Horizontal lines</p></div>
                <span class="component-badge html">HTML</span>
            </div>
            <div class="component-item" data-type="spacer" data-lang="html">
                <div class="component-icon spacer"><i class="fas fa-arrows-alt-v"></i></div>
                <div class="component-info"><h4>Spacer</h4><p>Add vertical space</p></div>
                <span class="component-badge html">HTML</span>
            </div>
            <div class="magic-studio-ai-toolkit" style="margin-top: 20px; border-top: 1px solid #2e2e3e; padding-top: 15px;">
                <div class="component-category" style="font-size: 12px; color: #ec4899; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-wand-magic-sparkles"></i> MAGIC STUDIO (AI)
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; padding: 0 5px;">
                    
                    <div style="background: #1e1e2e; padding: 10px; border-radius: 8px; border: 1px solid #2e2e3e;">
                        <label style="font-size: 11px; color: #cbd5e1; display: block; margin-bottom: 6px; font-weight: 600;">🖼️ AI Text-to-Image</label>
                        <textarea id="aiImagePrompt" placeholder="Describe the image you want to create (e.g., 'A futuristic city in cyberpunk style')..." style="width: 100%; height: 50px; padding: 6px; background: #2e2e3e; border: 1px solid #475569; color: #fff; border-radius: 6px; font-size: 11px; resize: none; font-family: sans-serif;"></textarea>
                        <button id="aiGenImgBtn" onclick="editor.generateAIImage()" style="width: 100%; margin-top: 6px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; border: none; padding: 8px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <i class="fas fa-paint-brush"></i> Generate Magic Image
                        </button>
                    </div>

                    <div style="background: #1e1e2e; padding: 10px; border-radius: 8px; border: 1px solid #2e2e3e;">
                        <label style="font-size: 11px; color: #cbd5e1; display: block; margin-bottom: 6px; font-weight: 600;">✍️ AI Magic Writer (Copywriting)</label>
                        <button onclick="editor.enhanceTextWithAi('professional')" style="width: 100%; margin-bottom: 4px; background: #2e2e3e; color: #fff; border: 1px solid #475569; padding: 6px; border-radius: 4px; font-size: 11px; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-briefcase" style="color: #3b82f6;"></i> Make it Professional (رسمي)
                        </button>
                        <button onclick="editor.enhanceTextWithAi('creative')" style="width: 100%; background: #2e2e3e; color: #fff; border: 1px solid #475569; padding: 6px; border-radius: 4px; font-size: 11px; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-lightbulb" style="color: #f59e0b;"></i> Make it Creative (إبداعي تسويقي)
                        </button>
                    </div>

                </div>
            </div>
        `;
    }

  renderPagesPanel() {
    // افترضنا إن عندك مصفوفة فيها الصفحات الحالية في الـ editor بتاعكrenderPagesPanel() {
    // إذا لم تكن هناك صفحات بعد، نضع صفحة افتراضية (Screen 1)
    if (!this.pages) {
        this.pages = [{ id: 'page1', name: 'Screen 1' }];
    }

    // توليد أزرار الصفحات الموجودة فعلياً ديناميكياً
    const pagesListHTML = this.pages.map(page => `
        <div class="component-item page-tab" onclick="editor.switchPage('${page.id}')">
            <div class="component-icon" style="background: var(--accent-blue, #3b82f6)"><i class="fas fa-file"></i></div>
            <div class="component-info">
                <h4>${page.name}</h4>
                <p>اضغط للفتح في مساحة العمل</p>
            </div>
        </div>
    `).join('');

    return `
        <div class="panel-header">
            <h3><i class="fas fa-file-alt" style="margin-right:8px;color:var(--accent-blue)"></i>Pages</h3>
        </div>
        <div class="panel-search">
            <input type="text" placeholder="Search pages...">
        </div>
        
        <div class="component-category">Project Pages</div>
        
        <!-- هنا هتظهر الصفحات المتاحة زي Screen1, Screen2 -->
        <div class="pages-list">
            ${pagesListHTML}
        </div>

        <div class="component-category">Actions</div>
        <!-- زرار إنشاء صفحة جديدة -->
        <div class="component-item" onclick="editor.createNewPage()">
            <div class="component-icon" style="background:linear-gradient(135deg,#22c55e,#4ade80)">
                <i class="fas fa-plus"></i>
            </div>
            <div class="component-info">
                <h4>New Page</h4>
                <p>Create a new page</p>
            </div>
        </div>
    `;
}
// دالة التبديل بين الصفحات وعرضها في الـ Workspace
switchPage(pageId) {
    // 1. إخفاء كل صفحات التصميم الموجودة في مساحة العمل حالياً
    document.querySelectorAll('.design-screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    // 2. إظهار الصفحة اللي أنت دوست عليها بس
    const activeScreen = document.getElementById(pageId);
    if (activeScreen) {
        activeScreen.style.display = 'block';
    }
}

// دالة إنشاء صفحة جديدة (زي App Inventor)
createNewPage() {
    const pageName = prompt("Enter the pagr name:");
    if (!pageName) return;

    const pageId = 'page_' + Date.now();

    // أضف الصفحة الجديدة للمصفوفة
    if (!this.pages) this.pages = [{ id: 'page1', name: 'Screen 1' }];
    this.pages.push({ id: pageId, name: pageName });

    // 1. هنا نضمن إن مساحة العمل الجديدة فاضية تماماً
    const workspace = document.getElementById('workspace') || document.querySelector('.workspace');
    
    if (workspace) {
        // ننشئ ديف فارغ تماماً (بدون أي عناصر داخلية أو أزرار قديمة)
        const newScreenHTML = `
            <div id="${pageId}" class="design-screen" style="display:none; width:100%; height:100%; min-height:100%; background-color: #ffffff; position: relative;">
                </div>
        `;
        workspace.insertAdjacentHTML('beforeend', newScreenHTML);
    }

    // 2. تحديث القائمة الجانبية لتظهر الصفحة الجديدة
    const panelContainer = document.getElementById('panel-content') || document.querySelector('.panel-content');
    if (panelContainer) {
        panelContainer.innerHTML = this.renderPagesPanel();
    }

    // 3. الانتقال فوراً للشاشة الجديدة الفاضية
    this.switchPage(pageId);
}

    renderPremiumExplorerTab(tab) {
        const panel = document.getElementById('dynamicExplorerPanel');
        if (!panel) return;

        if (tab === 'premium-templates') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:4px;"><i class="fas fa-layer-group" style="color:#3b82f6;"></i> Premium Templates (100 PRO)</h3>
                <p style="font-size:11px; color:#71717a; margin-bottom:15px;">Click a professional layout to instantly load it into your workspace.</p>
                <div id="templatesGridBox" style="display:flex; flex-direction:column; gap:12px; max-height:calc(100vh - 180px); overflow-y:auto; padding-right:5px;">
                    </div>
            `;

            const templatesGrid = document.getElementById('templatesGridBox');
            const categories = ['Instagram Post', 'Luxury Business Card', 'TikTok/Reels Story', 'YouTube Banner', 'Corporate Flyer'];
            const templateGradients = [
                '#09090b',
                'linear-gradient(135deg, #1e1b4b, #0f172a)',
                'linear-gradient(135deg, #1f1235, #100a1c)',
                'linear-gradient(45deg, #1a1a1a, #262626)',
                'linear-gradient(120deg, #022c22, #064e3b)'
            ];

            for (let i = 1; i <= 100; i++) {
                const category = categories[i % categories.length];
                const bgStyle = templateGradients[i % templateGradients.length];
                
                const templateBox = document.createElement('div');
                templateBox.style.cssText = "background:#1e1e2e; border:1px solid #2e2e3e; padding:12px; border-radius:8px; cursor:pointer; transition:all 0.2s;";
                
                templateBox.onmouseover = () => { templateBox.style.borderColor = '#3b82f6'; templateBox.style.transform = 'translateX(4px)'; };
                templateBox.onmouseout = () => { templateBox.style.borderColor = '#2e2e3e'; templateBox.style.transform = 'none'; };

                templateBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h4 style="color:#fff; font-size:12px; margin:0; font-weight:600;">✨ Layout Template #${i}</h4>
                        <span style="font-size:9px; background:#2e2e3e; color:#3b82f6; padding:2px 6px; border-radius:4px; font-weight:bold;">PRO</span>
                    </div>
                    <p style="font-size:10px; color:#a1a1aa; margin:0 0 8px 0;">Premium ${category} preset with automated spacing.</p>
                    
                    <div style="width:100%; height:8px; background:${bgStyle}; border-radius:4px; border:1px solid rgba(255,255,255,0.1);"></div>
                `;

                templateBox.onclick = () => editor.buildPremiumTemplateByIndex(i, category, bgStyle);
                templatesGrid.appendChild(templateBox);
            }
        } else if (tab === 'premium-assets') {
            panel.innerHTML = `
                <h3 style="color:#fff; font-size:14px; margin-bottom:12px;"><i class="fas fa-boxes" style="color:#10b981;"></i> Asset Library (PRO)</h3>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-bottom:12px;">
                    <button onclick="editor.loadAssetCategory('shapes')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Shapes</button>
                    <button onclick="editor.loadAssetCategory('badges')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Badges</button>
                    <button onclick="editor.loadAssetCategory('banners')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Banners</button>
                </div>
                <div id="assetsGridBox" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; max-height:calc(100vh - 220px); overflow-y:auto; padding-right:5px;"></div>
            `;
            this.loadAssetCategory('shapes');
        }
    }

    buildPremiumTemplateByIndex(index, category, bgStyle) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        workspace.innerHTML = '';
        workspace.style.background = bgStyle;

        if (category.includes('Instagram')) {
            workspace.style.width = '550px'; workspace.style.height = '550px';
        } else if (category.includes('Card')) {
            workspace.style.width = '650px'; workspace.style.height = '380px';
        } else if (category.includes('Story')) {
            workspace.style.width = '360px'; workspace.style.height = '640px';
        } else {
            workspace.style.width = '700px'; workspace.style.height = '400px';
        }

        workspace.innerHTML = `
            <div class="free-element" id="t_head_${index}" style="position:absolute; left:40px; top:40px; color:#ffffff; font-family:Inter; font-size:26px; font-weight:bold; letter-spacing:-0.5px;">
                💎 PREMIUM BRANDING #${index}
            </div>
            <div class="free-element" id="t_body_${index}" style="position:absolute; left:40px; top:85px; color:#94a3b8; font-family:Inter; font-size:13px; width:80%; line-height:1.6;">
                This layout is fully optimized under the Tecno Brain Expert Template Engine. Edit text layers or swap assets to match your corporate identity.
            </div>
            <div class="free-element" id="t_footer_${index}" style="position:absolute; left:40px; bottom:40px; background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); color:#fff; padding:6px 14px; border-radius:30px; font-size:10px; font-weight:bold; letter-spacing:1px; border:1px solid rgba(255,255,255,0.2);">
                ${category.toUpperCase()} EDITION
            </div>
        `;

        const newLayers = workspace.querySelectorAll('.free-element');
        newLayers.forEach(layer => {
            if (typeof this.attachElementEvents === 'function') this.attachElementEvents(layer);
        });

        if (typeof this.showMagicToast === 'function') {
            this.showMagicToast(`✨ Template #${index} Loaded Successfully!`);
        }
    }

    addLogoPresetToWorkspace(preset) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        const logoMarkup = `
            <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#fff; font-family:Inter;">
                <div style="width:86px; height:86px; border-radius:24px; background:linear-gradient(135deg, ${preset.palette[0]}, ${preset.palette[1]}); display:flex; align-items:center; justify-content:center; font-size:38px; box-shadow:0 12px 30px rgba(0,0,0,0.25);">${preset.icon}</div>
                <div style="font-size:20px; font-weight:800; letter-spacing:1px;">${preset.name}</div>
                <div style="font-size:11px; color:${preset.palette[2]}; text-transform:uppercase; letter-spacing:1.8px;">${preset.slogan}</div>
            </div>
        `;
        this.addGenericAssetToWorkspace(logoMarkup, 'logo');
        if (typeof this.showMagicToast === 'function') this.showMagicToast(`✨ ${preset.name} logo preset added to workspace`);
    }

    insertChartPreset(type) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        const chartId = `chart_${Date.now()}`;
        const canvas = document.createElement('canvas');
        canvas.id = chartId;
        canvas.width = 320;
        canvas.height = 220;
        canvas.style.cssText = 'width:100%; height:100%; border-radius:10px;';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:absolute; left:80px; top:80px; width:320px; height:220px; z-index:9999; border:1px dashed #38bdf8; padding:8px; background:#111827; border-radius:10px;';
        wrapper.appendChild(canvas);
        workspace.appendChild(wrapper);

        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [{
                label: 'Sales',
                data: [30, 50, 45, 70],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56,189,248,0.25)',
                fill: true
            }]
        };

        const config = { type, data, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } };
        if (window.Chart) {
            new Chart(canvas, config);
        }

        this.makeElementDraggable(wrapper);
        if (typeof this.showMagicToast === 'function') this.showMagicToast(`📈 ${type} chart inserted`);
    }

    insertDataTablePreset() {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        const tableHtml = `
            <table style="width:100%; border-collapse:collapse; font-size:11px; color:#fff; background:#0f172a; border:1px solid #334155;">
                <tr style="background:#1e293b;">
                    <th style="padding:8px; border:1px solid #334155;">Product</th>
                    <th style="padding:8px; border:1px solid #334155;">Qty</th>
                    <th style="padding:8px; border:1px solid #334155;">Revenue</th>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">Starter</td>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">120</td>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">$12k</td>
                </tr>
                <tr>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">Pro</td>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">85</td>
                    <td style="padding:8px; border:1px solid #334155;" contenteditable="true">$20k</td>
                </tr>
            </table>
        `;
        this.addGenericAssetToWorkspace(tableHtml, 'table');
        if (typeof this.showMagicToast === 'function') this.showMagicToast('📊 Editable data table inserted');
    }

    generateQRCodeToWorkspace() {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        const content = document.getElementById('qrContentInput')?.value || 'https://example.com';
        const size = parseInt(document.getElementById('qrSizeInput')?.value || '180', 10);
        const qrWrapper = document.createElement('div');
        qrWrapper.style.cssText = `position:absolute; left:100px; top:100px; width:${size}px; height:${size}px; padding:12px; background:#fff; border-radius:12px; z-index:9999; border:1px dashed #f59e0b;`;
        qrWrapper.id = `qr_${Date.now()}`;
        workspace.appendChild(qrWrapper);
        this.makeElementDraggable(qrWrapper);

        if (window.QRCode) {
            new QRCode(qrWrapper, {
                text: content,
                width: size,
                height: size,
                colorDark: '#111827',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            qrWrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#111827;font-size:12px;">QR library unavailable</div>';
        }

        if (typeof this.showMagicToast === 'function') this.showMagicToast('📱 QR code generated');
    }

    addGenericAssetToWorkspace(innerHtml, type) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        // 1️⃣ إنشاء حاوية مستقلة تماماً ومحمية
        const container = document.createElement('div');
        const uniqueId = `${type}_${Date.now()}`;
        container.id = uniqueId;
        
        // ستايل الحاوية مع إطار تحكم واضح (Border) لتبين لك أبعاد العنصر
        container.style.cssText = `
            position: absolute; 
            left: 150px; 
            top: 150px; 
            width: 250px; 
            height: 150px; 
            z-index: 9999; 
            cursor: move; 
            border: 2px dashed #38bdf8; 
            padding: 5px; 
            box-sizing: border-box;
            user-select: none;
        `;

        // 2️⃣ حقن المحتوى الداخلي ومقبض التكبير/التصغير السحري (Resize Handle) في الزاوية
        container.innerHTML = `
            <div class="content-body" style="width:100%; height:100%; pointer-events:none; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                ${innerHtml}
            </div>
            <!-- مقبض التكبير الأزرق في أسفل اليمين -->
            <div class="custom-resizer-handle" style="width:14px; height:14px; background:#38bdf8; position:absolute; right:0; bottom:0; cursor:se-resize; border-radius:50%; z-index:10000; border:2px solid #fff;"></div>
        `;

        workspace.appendChild(container);

        // ضبط العناصر الداخلية لتملأ الحاوية فوراً
        const targetChild = container.querySelector('.content-body').children[0];
        if (targetChild) {
            targetChild.style.width = '100%';
            targetChild.style.height = '100%';
        }

        // 3️⃣ محرك التحريك المباشر والأصيل (Native Drag Engine)
        container.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('custom-resizer-handle')) return;
            
            e.preventDefault();
            let startX = e.clientX - container.offsetLeft;
            let startY = e.clientY - container.offsetTop;

            function doDrag(ev) {
                container.style.left = (ev.clientX - startX) + 'px';
                container.style.top = (ev.clientY - startY) + 'px';
            }

            function stopDrag() {
                document.removeEventListener('mousemove', doDrag);
                document.removeEventListener('mouseup', stopDrag);
            }

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        // 4️⃣ محرك التكبير والتصغير المباشر والأصيل (Native Resize Engine)
        const resizer = container.querySelector('.custom-resizer-handle');
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let startWidth = container.offsetWidth;
            let startHeight = container.offsetHeight;
            let startX = e.clientX;
            let startY = e.clientY;

            function doResize(ev) {
                let newWidth = startWidth + (ev.clientX - startX);
                let newHeight = startHeight + (ev.clientY - startY);
                
                if (newWidth > 50) container.style.width = newWidth + 'px';
                if (newHeight > 40) container.style.height = newHeight + 'px';
            }

            function stopResize() {
                document.removeEventListener('mousemove', doResize);
                document.removeEventListener('mouseup', stopResize);
            }

            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        });

        // 5️⃣ تفعيل الكتابة على الجداول عند الـ Double Click وعزل الماوس
        if (type === 'sheet') {
            const body = container.querySelector('.content-body');
            const table = body.querySelector('table');
            if (table) {
                table.querySelectorAll('td, th').forEach(c => c.setAttribute('contenteditable', 'true'));
                
                container.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    body.style.pointerEvents = 'auto';
                    container.style.cursor = 'default';
                });
                
                container.addEventListener('focusout', () => {
                    body.style.pointerEvents = 'none';
                    container.style.cursor = 'move';
                });
            }
        }
    }

    applyAnimationToSelected(animationStyle) {
        if (!this.selectedElement) {
            alert("💡 من فضلك اختر عنصراً من مساحة العمل أولاً لتطبيق الأنيميشن عليه لايف!");
            return;
        }
        const el = document.getElementById(this.selectedElement);
        if (el) {
            el.style.animation = animationStyle;
            if (typeof this.showMagicToast === 'function') this.showMagicToast("⚡ Motion applied successfully!");
        }
    }

    cleanCanvas(action) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        if (action === 'wipe-all') {
            if (confirm("⚠️ هل أنت متأكد من مسح جميع العناصر والبدء من جديد؟")) {
                workspace.innerHTML = '';
                workspace.style.background = '#ffffff';
                if (typeof this.showMagicToast === 'function') this.showMagicToast("🧹 Workspace cleaned fully!");
            }
        } else if (action === 'clear-bg') {
            workspace.style.background = 'transparent';
            if (typeof this.showMagicToast === 'function') this.showMagicToast("🖼️ Background is now Transparent!");
        } else if (action === 'isolate') {
            if (!this.selectedElement) {
                alert("💡 اختر عنصراً أولاً لعمل عزله!");
                return;
            }
            const elements = workspace.querySelectorAll('.free-element, .scalable-element');
            elements.forEach(el => {
                if (el.id !== this.selectedElement) {
                    el.style.opacity = el.style.opacity === '0.1' ? '1' : '0.1';
                }
            });
            if (typeof this.showMagicToast === 'function') this.showMagicToast("🎯 Focus Isolation toggled!");
        }
    }

    runPicsArtFeature(feature) {
        if (!this.selectedElement) {
            alert("💡 يا فنان، اختر الصورة أو الطبقة اللي عايز تطبق عليها ميزة PicsArt Pro أولاً!");
            return;
        }

        const currentEl = document.getElementById(this.selectedElement);
        if (!currentEl) return;

        const targetElement = currentEl.querySelector('img') || currentEl;

        switch(feature) {
            case 'bg-remover':
                this.showMagicToast("🤖 AI isolating background...");
                targetElement.style.background = 'transparent';
                targetElement.style.webkitClipPath = 'ellipse(50% 50% at 50% 50%)';
                this.showMagicToast("✅ BG Removed Successfully!");
                break;

            case 'fx-glitch':
                targetElement.style.filter = 'hue-rotate(180deg) saturate(300%) contrast(150%)';
                this.showMagicToast("⚡ Glitch Art Activated!");
                break;

            case 'fx-neon':
                targetElement.style.filter = 'drop-shadow(0 0 15px #f43f5e) drop-shadow(0 0 30px #a855f7) brightness(1.2)';
                this.showMagicToast("🔮 Cyber Neon Activated!");
                break;

            case 'fx-hdr':
                targetElement.style.filter = 'contrast(160%) brightness(110%) saturate(140%) contrast(120%)';
                this.showMagicToast("📸 Ultra HDR Dynamic Applied!");
                break;

            case 'fx-reset':
                targetElement.style.filter = 'none';
                targetElement.style.webkitClipPath = 'none';
                this.showMagicToast("↩️ Filters Reset.");
                break;

            case 'ai-enhance':
                this.showMagicToast("🤖 Analyzing image with AI...");
                setTimeout(() => {
                    targetElement.style.filter = 'brightness(1.05) contrast(1.15) saturate(1.25)';
                    this.showMagicToast("💎 Image Enhanced via Tecno Brain AI!");
                }, 400);
                break;

            case 'object-eraser':
                const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
                const eraserMask = document.createElement('div');
                eraserMask.className = 'scalable-element free-element';
                eraserMask.style.cssText = "position: absolute; left: 180px; top: 180px; width: 40px; height: 40px; background: rgba(244, 63, 94, 0.6); border: 2px dashed #f43f5e; border-radius: 50%; cursor: move; z-index: 999; backdrop-filter: blur(10px);";
                workspace.appendChild(eraserMask);
                if (typeof this.attachElementEvents === 'function') this.attachElementEvents(eraserMask);
                this.showMagicToast("🖌️ Mask Deployed! Place it over the object to erase.");
                break;
        }

        if (typeof this.saveState === 'function') this.saveState();
        if (typeof this.refreshLayersPanel === 'function') this.refreshLayersPanel();
    }

    loadAssetCategory(category) {
        const grid = document.getElementById('assetsGridBox');
        if (!grid) return;
        grid.innerHTML = ''; // تنظيف الجريد تماماً

        const assetsArray = [];

        // 🎨 القسم الأول: توليد 100 شكل هندسي ومجسم فريد (Gradients & Sizing)
        if (category === 'shapes') {
            const gradients = [
                'linear-gradient(45deg, #3b82f6, #8b5cf6)', // Blue-Purple
                'linear-gradient(135deg, #ec4899, #f43f5e)', // Pink-Red
                'linear-gradient(90deg, #10b981, #059669)', // Emerald
                'linear-gradient(45deg, #f59e0b, #d97706)', // Amber Gold
                'linear-gradient(120deg, #06b6d4, #3b82f6)' // Cyan-Blue
            ];

            for (let i = 1; i <= 100; i++) {
                const grad = gradients[i % gradients.length];
                let shapeHtml = '';

                if (i % 4 === 0) {
                    const size = 40 + (i % 3) * 15;
                    shapeHtml = `<div style="width:${size}px; height:${size}px; border-radius:50%; background:${grad}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`;
                } else if (i % 4 === 1) {
                    const w = 60 + (i % 3) * 15;
                    shapeHtml = `<div style="width:${w}px; height:35px; border-radius:20px; background:${grad}; border: 1px solid rgba(255,255,255,0.2);"></div>`;
                } else if (i % 4 === 2) {
                    const size = 40 + (i % 2) * 10;
                    shapeHtml = `<div style="width:${size}px; height:${size}px; background:${grad}; transform: rotate(${i * 5}deg); border-radius: 6px;"></div>`;
                } else {
                    const size = 45 + (i % 2) * 10;
                    shapeHtml = `<div style="width:${size}px; height:${size}px; border: 3px solid #8b5cf6; border-image: ${grad} 1; border-radius:4px;"></div>`;
                }

                assetsArray.push({
                    name: `Premium Shape ${i}`,
                    html: shapeHtml
                });
            }
        } else if (category === 'badges') {
            const badgeColors = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
            const badgeTexts = ['SALE', 'PRO', 'NEW', 'HOT', 'OFFER', 'LIVE', 'BEST', 'VIP', 'LIMITED', 'EXCLUSIVE'];

            for (let i = 1; i <= 100; i++) {
                const color = badgeColors[i % badgeColors.length];
                const text = badgeTexts[i % badgeTexts.length];
                let badgeHtml = '';

                if (i % 3 === 0) {
                    badgeHtml = `<div style="background:${color}; color:#fff; padding:6px 12px; border-radius:20px; font-size:10px; font-weight:900; font-family:sans-serif; text-align:center; box-shadow:0 4px 6px rgba(0,0,0,0.2);"><i class="fas fa-certificate"></i> ${text} #${i}</div>`;
                } else if (i % 3 === 1) {
                    badgeHtml = `<div style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff; padding:8px; border-radius:4px; font-size:11px; font-weight:bold; font-family:sans-serif; transform:rotate(${(i % 2 === 0 ? -6 : 6)}deg); box-shadow:2px 2px 5px rgba(0,0,0,0.3);">${i * 5}% ${text}</div>`;
                } else {
                    badgeHtml = `<div style="border:1px solid ${color}; color:${color}; padding:4px 10px; border-radius:4px; font-size:10px; font-weight:bold; font-family:sans-serif; letter-spacing:1px; background:rgba(0,0,0,0.2);">${text} EDITION</div>`;
                }

                assetsArray.push({
                    name: `Premium Badge ${i}`,
                    html: badgeHtml
                });
            }
        }

        assetsArray.forEach(item => {
            const box = document.createElement('div');
            box.style.cssText = "background:#1e1e2e; border:1px solid #2e2e3e; padding:15px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; min-height:90px; transition:all 0.2s; position:relative;";
            box.onmouseover = () => { box.style.borderColor = '#a855f7'; box.style.transform = 'scale(1.03)'; };
            box.onmouseout = () => { box.style.borderColor = '#2e2e3e'; box.style.transform = 'scale(1)'; };
            box.innerHTML = item.html;
            box.onclick = () => this.addAssetToWorkspace(item.html);
            grid.appendChild(box);
        });
    }

    addAssetToWorkspace(elementHtml, type = 'html', name = 'Premium Asset', x = null, y = null) {
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';

        const currentVisibleScreen = document.querySelector('.design-screen[style*="display: block"]');
        const targetContainer = currentVisibleScreen || document.getElementById('canvas');
        if (!targetContainer) return;

        const id = 'asset_' + Date.now();
        const assetElement = document.createElement('div');
        assetElement.className = 'canvas-element asset-element draggable-element';
        assetElement.id = id;
        assetElement.dataset.type = type;
        assetElement.dataset.assetName = name;
        assetElement.innerHTML = `
            <div class="element-actions">
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveUp('${id}')" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveDown('${id}')" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                <button class="element-action-btn delete" onclick="event.stopPropagation();editor.deleteElement('${id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
            <div class="element-content">${elementHtml}</div>
        `;

        if (x !== null && y !== null) {
            assetElement.style.position = 'absolute';
            assetElement.style.left = `${Math.max(0, x - 60)}px`;
            assetElement.style.top = `${Math.max(0, y - 40)}px`;
        }

        targetContainer.appendChild(assetElement);
        this.makeElementDraggable(assetElement);
        this.elements.push({ id, type, lang: 'asset', content: elementHtml });
        this.selectElement(id);
        this.saveHistory();
    }

    loadPremiumTemplate(type) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;
        workspace.innerHTML = '';

        if (type === 'instagram') {
            workspace.style.width = '600px';
            workspace.style.height = '600px';
            workspace.style.background = '#09090b';
            workspace.innerHTML = `
                <div class="free-element" style="position:absolute; left:40px; top:50px; color:#fff; font-family:Inter; font-size:28px; font-weight:bold;">🚀 INTERACTIVE CHANNELS</div>
                <div class="free-element" style="position:absolute; left:40px; top:100px; color:#a1a1aa; font-family:Inter; font-size:14px; width:400px;">Boost your digital workflow instantly with Tecno Brain Editor framework tools.</div>
                <div class="free-element" style="position:absolute; left:40px; top:520px; background:#3b82f6; color:#fff; padding:6px 12px; border-radius:20px; font-size:11px; font-weight:bold;">WWW.TECNOBRAIN.COM</div>
            `;
        } else if (type === 'card') {
            workspace.style.width = '700px';
            workspace.style.height = '400px';
            workspace.style.background = 'linear-gradient(135deg, #1e1b4b, #0f172a)';
            workspace.innerHTML = `
                <div class="free-element" style="position:absolute; left:50px; top:150px; color:#f59e0b; font-family:Playfair Display; font-size:32px; font-weight:bold; letter-spacing:1px;">YOUSSEF RAMY GROUP</div>
                <div class="free-element" style="position:absolute; left:50px; top:200px; color:#94a3b8; font-family:Inter; font-size:12px; letter-spacing:3px;">CHIEF EXECUTIVE OFFICER</div>
                <div class="free-element" style="position:absolute; right:50px; bottom:50px; color:#fff; font-family:Inter; font-size:11px; text-align:right; line-height:1.6;">info@yousseframy.com<br>+20 1000000000</div>
            `;
        }

        this.showMagicToast(`✨ Loaded ${type} premium layout template!`);
    }
    renderLayersPanel() {
        const items = Array.from(document.querySelectorAll('.canvas-element')).map(el => `
            <div class="component-item layer-item" data-element-id="${el.id}" onclick="editor.selectElement('${el.id}')">
                <i class="fas fa-layer-group"></i> ${el.id}
            </div>
        `).join('');
        return `
            <div class="panel-header"><h3>Layers</h3></div>
            <div class="layers-list">${items}</div>
        `;
    }

    renderBrandKitPanel() {
        const backButton = `
            <div class="brand-back-btn" onclick="editor.changeBrandSubView(null)" style="padding:12px; color:#8b5cf6; cursor:pointer; font-size:13px; font-weight:bold; display:flex; align-items:center; gap:6px; background:#1e1e2e; border-bottom:1px solid #2e2e3e;">
                <i class="fas fa-arrow-left"></i> Back to Brand Kit
            </div>
        `;

        if (this.currentBrandSubView === 'guidelines') {
            return `
                ${backButton}
                <div class="component-category">Brand Identity Guidelines</div>
                <div style="padding:15px; color:#cbd5e1; font-size:13px; line-height:1.6; max-height:450px; overflow-y:auto;">
                    <div style="background:#1e1e2e; padding:12px; border-radius:8px; margin-bottom:10px;">
                        <h4 style="margin:0 0 6px 0; color:#fff;"><i class="fas fa-font" style="color:#8b5cf6; margin-right:6px;"></i>Typography Rules</h4>
                        <p style="margin:0; color:#94a3b8; font-size:12px;">Primary font is <strong>Inter</strong>. Secondary font is <strong>Roboto</strong>. For Arabic typography, utilize <strong>Cairo</strong> or <strong>Tajawal</strong>.</p>
                    </div>
                    <div style="background:#1e1e2e; padding:12px; border-radius:8px; margin-bottom:10px;">
                        <h4 style="margin:0 0 6px 0; color:#fff;"><i class="fas fa-palette" style="color:#10b981; margin-right:6px;"></i>Color Contrast</h4>
                        <p style="margin:0; color:#94a3b8; font-size:12px;">Maintain a minimum contrast ratio of 4.5:1 for body text against brand background colors.</p>
                    </div>
                    <div style="background:#1e1e2e; padding:12px; border-radius:8px; margin-bottom:10px;">
                        <h4 style="margin:0 0 6px 0; color:#fff;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b; margin-right:6px;"></i>Logo Restrictions</h4>
                        <p style="margin:0; color:#94a3b8; font-size:12px;">Never skew, rotate, or apply unapproved drop shadows to the corporate logo asset.</p>
                    </div>
                </div>
            `;
        }

        if (this.currentBrandSubView === 'templates') {
            const bigTemplates = [
                { id: 'tpl-hero', name: 'Minimalist Hero Header', desc: 'Centered title with twin action buttons', category: 'Headers' },
                { id: 'tpl-feat', name: '3-Column Feature Grid', desc: 'Perfect for displaying services or benefits', category: 'Features' },
                { id: 'tpl-card', name: 'Interactive Product Card', desc: 'Image placeholder with pricing and cart badge', category: 'Cards' },
                { id: 'tpl-price', name: 'Enterprise Pricing Table', desc: 'Subscription tier matrix with highlights', category: 'Pricing' },
                { id: 'tpl-team', name: 'Team Profiles Layout', desc: 'Avatar circular frame with social media icons', category: 'Team' },
                { id: 'tpl-footer', name: 'Corporate Multi-Link Footer', desc: '4-column footer layout with copyright string', category: 'Footers' }
            ];
            return `
                ${backButton}
                <div class="component-category">Enterprise Layout Templates</div>
                <div style="padding:0 12px; max-height:450px; overflow-y:auto;">
                    ${bigTemplates.map(t => `
                        <div class="canva-brand-row" onclick="editor.insertBrandTemplate('${t.id}')" style="margin:8px 0; background:#1e1e2e; border-left: 3px solid #10b981;">
                            <i class="fas fa-layer-group" style="color:#10b981;"></i>
                            <div class="canva-row-info">
                                <span style="font-size:9px; background:#2e2e3e; padding:2px 6px; border-radius:4px; color:#10b981; float:right;">${t.category}</span>
                                <h4>${t.name}</h4>
                                <p>${t.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (this.currentBrandSubView === 'logos') {
            return `
                ${backButton}
                <div class="component-category">Brand Logos Management</div>
                <div class="upload-zone canva-mini-upload" onclick="document.getElementById('canvaLogoInput').click()">
                    <i class="fas fa-cloud-upload-alt" style="font-size:20px; color:#8b5cf6; margin-bottom:4px;"></i>
                    <p style="margin:0; font-size:12px; color:#94a3b8;">Upload Brand Logo (PNG/SVG)</p>
                    <input type="file" id="canvaLogoInput" accept="image/*" style="display:none;" onchange="editor.handleBrandLogoUpload(event)">
                </div>
                <div id="canvaLogosContainer" class="canva-assets-preview-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:12px;"></div>
            `;
        }

        if (this.currentBrandSubView === 'colors') {
            const colorItems = this.brandKit.colors.map(color => `
                <div class="brand-color-bubble" style="background: ${color}; width:42px; height:42px; border-radius:50%; cursor:pointer; border:2px solid rgba(255,255,255,0.1);" onclick="editor.applyBrandColor('${color}')" title="${color}"></div>
            `).join('');
            return `
                ${backButton}
                <div class="component-category">Brand Color Palette</div>
                <div class="brand-colors-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:12px;">
                    ${colorItems}
                    <div class="brand-color-bubble add-new" onclick="editor.addNewBrandColor()" style="background:#2e2e3e; display:flex; align-items:center; justify-content:center; border:2px dashed #475569; cursor:pointer; height:42px; border-radius:50%; color:#94a3b8;"><i class="fas fa-plus"></i></div>
                </div>
            `;
        }

        if (this.currentBrandSubView === 'fonts') {
            return `
                ${backButton}
                <div class="component-category">Search Thousands of Google Fonts</div>
                <div style="padding: 0 12px; margin-bottom: 8px;">
                    <input type="text" id="googleFontSearch" placeholder="🔍 Search fonts..." oninput="editor.filterGoogleFonts(this.value)" style="width:100%; padding:10px; background:#1e1e2e; border:1px solid #475569; border-radius:8px; color:#fff; font-size:12px;">
                </div>
                <div class="google-fonts-list" id="globalFontsContainer" style="max-height: 380px; overflow-y: auto; padding: 0 12px;"></div>
            `;
        }

        if (this.currentBrandSubView === 'voice') {
            const prebuiltVoice = [
                { title: 'Vision Statement', text: 'To accelerate the world transition to seamless digital design.', tag: 'h2' },
                { title: 'Mission Statement', text: 'Empowering creators with boundless web builder engines that require zero coding friction.', tag: 'p' },
                { title: 'Elevator Pitch', text: 'We provide an enterprise-grade ecosystem where UI layouts turn into live scalable web assets within minutes.', tag: 'p' },
                { title: 'Value Callout', text: 'Uncompromising layout absolute freedom.', tag: 'h3' },
                { title: 'Action Tagline', text: 'Design fast. Scale smart. Built for creators.', tag: 'h4' }
            ];
            return `
                ${backButton}
                <div class="component-category">Brand Voice & Preset Copies</div>
                <div style="padding:0 12px; max-height:430px; overflow-y:auto;">
                    ${prebuiltVoice.map(v => `
                        <div class="canva-brand-row" onclick="editor.insertBrandVoiceText('${v.tag}', \`${v.text}\`)" style="margin:8px 0; background:#1e1e2e;">
                            <i class="fas fa-comment-dots" style="color:#ec4899;"></i>
                            <div class="canva-row-info">
                                <h4>${v.title}</h4>
                                <p style="font-size:11px; color:#64748b; text-overflow:ellipsis; overflow:hidden; max-width:200px;">${v.text}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (this.currentBrandSubView === 'photos') {
            const infiniteStock = [
                'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300',
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300',
                'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300',
                'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=300',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300',
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300',
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300',
                'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300',
                'https://images.unsplash.com/photo-1551434678-e076c223a692?w=300'
            ];
            return `
                ${backButton}
                <div class="component-category">Infinite Photo Assets Gallery</div>
                <div class="upload-zone canva-mini-upload" onclick="document.getElementById('canvaPhotoInput').click()">
                    <i class="fas fa-camera-retro" style="font-size:20px; color:#8b5cf6; margin-bottom:4px;"></i>
                    <p style="margin:0; font-size:12px; color:#94a3b8;">Upload Corporate Custom Image</p>
                    <input type="file" id="canvaPhotoInput" accept="image/*" style="display:none;" onchange="editor.handleCanvaImageUpload(event)">
                </div>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; padding:12px; max-height:320px; overflow-y:auto;">
                    ${infiniteStock.map((url, i) => `
                        <img src="${url}" onclick="editor.addAssetToWorkspace('${url}', 'image', 'StockPhoto-${i}', 150, 150)" style="width:100%; height:85px; object-fit:cover; border-radius:6px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                    `).join('')}
                </div>
            `;
        }

        if (this.currentBrandSubView === 'graphics') {
            const deepGraphicsList = [
                { name: 'Solid Layout Box', icon: 'fas fa-square', type: 'container' },
                { name: 'Fluid Circle Frame', icon: 'fas fa-circle', type: 'icon' },
                { name: 'Dynamic Star Rating', icon: 'fas fa-star', type: 'icon' },
                { name: 'Badge Ribbon Sticker', icon: 'fas fa-bookmark', type: 'container' },
                { name: 'Premium Gem Asset', icon: 'fas fa-gem', type: 'icon' },
                { name: 'Quote Left Layout Block', icon: 'fas fa-quote-left', type: 'text' },
                { name: 'Shield Security Badge', icon: 'fas fa-shield-alt', type: 'icon' },
                { name: 'Cloud Server Container', icon: 'fas fa-cloud', type: 'container' },
                { name: 'Lightning Dynamic Sticker', icon: 'fas fa-bolt', type: 'icon' },
                { name: 'Heart Engagement Graph', icon: 'fas fa-heart', type: 'icon' }
            ];
            return `
                ${backButton}
                <div class="component-category">High-End Vector Shapes Grid</div>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; padding:12px; max-height:430px; overflow-y:auto;">
                    ${deepGraphicsList.map(g => `
                        <div style="background:#1e1e2e; padding:15px; border-radius:8px; text-align:center; cursor:pointer; border:1px solid #2e2e3e; transition:all 0.2s;" onclick="editor.insertBrandGraphic('${g.type}', '${g.icon}')" onmouseover="this.style.borderColor='#8b5cf6'" onmouseout="this.style.borderColor='#2e2e3e'">
                            <i class="${g.icon}" style="font-size:24px; color:#8b5cf6; margin-bottom:6px;"></i>
                            <div style="font-size:11px; color:#cbd5e1; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${g.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (this.currentBrandSubView === 'icons') {
            const massiveIcons = [
                'user', 'home', 'heart', 'star', 'check', 'envelope', 'phone', 'cog', 'bell', 'calendar', 'shopping-cart', 'rocket', 'globe', 'lock', 'eye', 'gift',
                'search', 'trash', 'edit', 'folder', 'file', 'cloud', 'download', 'upload', 'link', 'unlock', 'car', 'bicycle', 'music', 'video', 'camera', 'image',
                'chart-bar', 'chart-pie', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'play', 'pause', 'stop', 'coffee', 'map-marker', 'credit-card',
                'layer-group', 'laptop', 'mobile-alt', 'server', 'database', 'code', 'terminal', 'bug', 'shield-alt', 'key', 'flag', 'trophy', 'crown', 'thumbs-up'
            ];
            return `
                ${backButton}
                <div class="component-category">Global Vector Icon Library (FontAwesome)</div>
                <div style="padding:0 12px; margin-bottom:8px;">
                    <input type="text" id="iconSearchInput" placeholder="🔍 Search thousands of icons (e.g., code, laptop, heart)..." oninput="editor.filterIcons(this.value)" style="width:100%; padding:10px; background:#1e1e2e; border:1px solid #475569; border-radius:8px; color:#fff; font-size:12px;">
                </div>
                <div class="global-icons-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; padding:12px; max-height:330px; overflow-y:auto;">
                    ${massiveIcons.map(icon => `
                        <div class="icon-item-card" data-icon-name="${icon}" onclick="editor.addIconToWorkspace('fa-${icon}')" style="background:#1e1e2e; padding:12px; border-radius:8px; text-align:center; cursor:pointer; transition:all 0.2s;">
                            <i class="fas fa-${icon}" style="font-size:18px; color:#cbd5e1;"></i>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (this.currentBrandSubView === 'charts') {
            return `
                ${backButton}
                <div class="component-category">Dynamic Analytical Chart Layouts</div>
                <div style="padding:0 12px;">
                    <div class="canva-brand-row" onclick="editor.insertAdvancedChart('bar')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fas fa-chart-bar" style="color:#3b82f6; font-size:18px;"></i>
                        <div class="canva-row-info"><h4>Bar Analytics Layout</h4><p>Multi-dimensional vertical data bars</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.insertAdvancedChart('line')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fas fa-chart-line" style="color:#10b981; font-size:18px;"></i>
                        <div class="canva-row-info"><h4>Trend Line Wave</h4><p>Smooth mathematical analytics lines</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.insertAdvancedChart('pie')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fas fa-chart-pie" style="color:#f59e0b; font-size:18px;"></i>
                        <div class="canva-row-info"><h4>Pie Segment Share</h4><p>Percentage distribution circle graph</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.insertAdvancedChart('doughnut')" style="background:#1e1e2e;">
                        <i class="fas fa-donut" style="color:#ec4899; font-size:18px;"><i class="fas fa-circle-notch"></i></i>
                        <div class="canva-row-info"><h4>Doughnut Chart</h4><p>Hollow centered metric representation</p></div>
                    </div>
                </div>
            `;
        }

        if (this.currentBrandSubView === 'resize') {
            return `
                ${backButton}
                <div class="component-category"><i class="fas fa-magic" style="color:#a855f7;"></i> Magic Resize (AI)</div>
                <div style="padding:0 12px;">
                    <p style="font-size:11px; color:#94a3b8; margin-bottom:12px;">Resize your entire canvas and all assets instantly with smart auto-layout.</p>
                    <div class="canva-brand-row" onclick="editor.triggerMagicResize(1080, 1080, 'Instagram Post')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fab fa-instagram" style="color:#ec4899;"></i>
                        <div class="canva-row-info"><h4>Instagram Square</h4><p>1080 x 1080 px</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.triggerMagicResize(1920, 1080, 'YouTube Thumbnail')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fab fa-youtube" style="color:#ef4444;"></i>
                        <div class="canva-row-info"><h4>YouTube Thumbnail</h4><p>1920 x 1080 px</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.triggerMagicResize(820, 312, 'Facebook Cover')" style="margin-bottom:8px; background:#1e1e2e;">
                        <i class="fab fa-facebook" style="color:#3b82f6;"></i>
                        <div class="canva-row-info"><h4>Facebook Cover</h4><p>820 x 312 px</p></div>
                    </div>
                    <div class="canva-brand-row" onclick="editor.triggerMagicResize(1080, 1920, 'TikTok / Reel')" style="background:#1e1e2e;">
                        <i class="fas fa-mobile-alt" style="color:#10b981;"></i>
                        <div class="canva-row-info"><h4>Story / Reel / TikTok</h4><p>1080 x 1920 px</p></div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="panel-header"><h3><i class="fas fa-briefcase" style="margin-right:8px;color:#8b5cf6"></i>Brand Kit</h3></div>
            <div class="brand-kit-scrollable-container">
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('guidelines')"><i class="fas fa-book-open"></i><div class="canva-row-info"><h4>Guidelines</h4><p>Usage rules & setup</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('templates')"><i class="fas fa-layer-group"></i><div class="canva-row-info"><h4>Brand Templates</h4><p>Preset layouts</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('logos')"><i class="fas fa-image"></i><div class="canva-row-info"><h4>Logos</h4><p>Your brand marks</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('colors')"><i class="fas fa-palette"></i><div class="canva-row-info"><h4>Colors</h4><p>Color palettes</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('fonts')"><i class="fas fa-font"></i><div class="canva-row-info"><h4>Fonts</h4><p>Typographic styles</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('voice')"><i class="fas fa-comment-dots"></i><div class="canva-row-info"><h4>Brand voice</h4><p>Predefined texts</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('photos')"><i class="fas fa-camera"></i><div class="canva-row-info"><h4>Photos</h4><p>Approved corporate images</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('graphics')"><i class="fas fa-shapes"></i><div class="canva-row-info"><h4>Graphics</h4><p>Design elements & shapes</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('icons')"><i class="fas fa-icons"></i><div class="canva-row-info"><h4>Icons</h4><p>Corporate icon set</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('charts')"><i class="fas fa-chart-pie"></i><div class="canva-row-info"><h4>Charts</h4><p>Data visualization</p></div></div>
                <div class="canva-brand-row" onclick="editor.changeBrandSubView('resize')"><i class="fas fa-magic"></i><div class="canva-row-info"><h4>Magic Resize</h4><p>Auto-resize canvas</p></div></div>
                <div class="canva-brand-row" onclick="editor.insertLiveTable()"><i class="fas fa-table"></i><div class="canva-row-info"><h4>Data Tables</h4><p>Insert editable grid table</p></div></div>
                <div class="canva-brand-row" onclick="editor.insertVideoEmbed()"><i class="fas fa-video"></i><div class="canva-row-info"><h4>Video Player</h4><p>Embed streaming videos</p></div></div>
            </div>
            <div class="premium-text-toolkit" style="margin-top: 20px; border-top: 1px solid #2e2e3e; padding-top: 15px;">
                <div class="component-category" style="font-size: 12px; color: #a855f7; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-font"></i> PREMIUM TEXT FORMATTING
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; padding: 0 5px;">
                    
                    <div>
                        <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">Premium Fonts</label>
                        <select onchange="editor.applyPremiumFont(this.value)" style="width: 100%; padding: 8px; background: #1e1e2e; border: 1px solid #3f3f46; color: #fff; border-radius: 6px; font-size: 12px; cursor: pointer;">
                            <option value="Inter">Inter (Modern)</option>
                            <option value="Playfair Display">Playfair Display (Elegant)</option>
                            <option value="Montserrat">Montserrat (Bold & Clean)</option>
                            <option value="Cairo">Cairo (Premium Arabic)</option>
                            <option value="Tajawal">Tajawal (Luxury Arabic)</option>
                        </select>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
                            <span>Letter Spacing</span>
                            <span id="letterSpacingVal">0px</span>
                        </div>
                        <input type="range" min="-2" max="10" value="0" step="0.5" oninput="editor.applyTextSpacing('letter', this.value)" style="width: 100%; accent-color: #a855f7; cursor: pointer;">
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
                            <span>Line Height</span>
                            <span id="lineHeightVal">1.2</span>
                        </div>
                        <input type="range" min="0.8" max="2.5" value="1.2" step="0.1" oninput="editor.applyTextSpacing('line', this.value)" style="width: 100%; accent-color: #a855f7; cursor: pointer;">
                    </div>

                    <div>
                        <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 6px;">Pro Text Effects</label>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                            <button onclick="editor.applyTextEffect('shadow')" style="background: #2e2e3e; color: #fff; border: 1px solid #475569; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">Soft Shadow</button>
                            <button onclick="editor.applyTextEffect('neon')" style="background: #2e2e3e; color: #fff; border: 1px solid #475569; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">Neon Glow</button>
                            <button onclick="editor.applyTextEffect('gradient')" style="background: #2e2e3e; color: #fff; border: 1px solid #475569; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">Gold Grad</button>
                            <button onclick="editor.applyTextEffect('none')" style="background: #3f3f46; color: #ef4444; border: none; padding: 6px; border-radius: 4px; font-size: 11px; cursor: pointer;">Clear Effects</button>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }

    changeBrandSubView(viewName) {
        this.currentBrandSubView = viewName;
        this.renderExplorerPanel('brandkit');
        if (viewName === 'fonts') {
            setTimeout(() => this.initGoogleFonts(), 50);
        }
    }

    addNewBrandColor() {
        const newColor = prompt('Enter HEX color code (e.g., #ff5500):');
        if (!newColor || !newColor.startsWith('#')) return;
        this.brandKit.colors.push(newColor);
        this.renderExplorerPanel('brandkit');
    }

    applyBrandColor(color) {
        if (!this.selectedElement) return;
        const element = document.getElementById(this.selectedElement);
        if (!element) return;

        const contentArea = element.querySelector('.element-content') || element;
        const textNode = contentArea.querySelector('p, h1, h2, h3, h4, h5, h6, span, i, button, a, li, blockquote') || contentArea;

        if (element.dataset.type === 'button' || element.dataset.type === 'container' || element.dataset.type === 'section') {
            contentArea.style.background = color;
            if (textNode && textNode !== contentArea) {
                textNode.style.color = '#ffffff';
            }
        } else {
            textNode.style.color = color;
        }

        this.updatePropertiesPanel(element);
        this.saveHistory();
    }

    applyPremiumFont(fontName) {
        if (!this.selectedElement) {
            alert("💡 من فضلك اختر عنصراً نصياً من مساحة العمل أولاً لتغيير خطه!");
            return;
        }
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const textNode = el.querySelector('p, h1, h2, h3, h4, h5, h6, span') || el;
        textNode.style.fontFamily = fontName;
    }

    applyTextSpacing(type, value) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const textNode = el.querySelector('p, h1, h2, h3, h4, h5, h6, span') || el;

        if (type === 'letter') {
            textNode.style.letterSpacing = `${value}px`;
            const indicator = document.getElementById('letterSpacingVal');
            if (indicator) indicator.innerText = `${value}px`;
        } else if (type === 'line') {
            textNode.style.lineHeight = value;
            const indicator = document.getElementById('lineHeightVal');
            if (indicator) indicator.innerText = value;
        }
    }

    applyTextEffect(effectType) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const textNode = el.querySelector('p, h1, h2, h3, h4, h5, h6, span') || el;

        textNode.style.textShadow = 'none';
        textNode.style.background = 'none';
        textNode.style.webkitBackgroundClip = 'unset';
        textNode.style.webkitTextFillColor = 'unset';
        textNode.style.color = '#000000';

        if (effectType === 'shadow') {
            textNode.style.textShadow = '2px 2px 8px rgba(0, 0, 0, 0.3)';
        } else if (effectType === 'neon') {
            textNode.style.color = '#fff';
            textNode.style.textShadow = '0 0 5px #fff, 0 0 10px #a855f7, 0 0 20px #a855f7, 0 0 40px #a855f7';
        } else if (effectType === 'gradient') {
            textNode.style.background = 'linear-gradient(45deg, #f59e0b, #ef4444)';
            textNode.style.webkitBackgroundClip = 'text';
            textNode.style.webkitTextFillColor = 'transparent';
        }
    }

    // 🔮 AI Image Generator (uses Pollinations quick endpoint)
    async generateAIImage() {
        const promptInput = document.getElementById('aiImagePrompt');
        const btn = document.getElementById('aiGenImgBtn');
        
        if (!promptInput || !promptInput.value.trim()) {
            alert("⚠️ من فضلك اكتب وصفاً للصورة أولاً!");
            return;
        }

        const promptText = promptInput.value.trim();
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> AI is Painting...`;
        }
        this.showMagicToast("🔮 Connecting to AI Studio Neural Network...");

        try {
            const encodedPrompt = encodeURIComponent(promptText);
            const seed = Math.floor(Math.random() * 100000);
            const aiImageUrl = `https://image.pollinations.ai/p/${encodedPrompt}?width=1080&height=1080&seed=${seed}&enhanced=true`;

            if (typeof this.addImageToWorkspace === 'function') {
                this.addImageToWorkspace(aiImageUrl);
            } else {
                const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
                if (workspace) {
                    const newImgContainer = document.createElement('div');
                    newImgContainer.className = 'scalable-element free-element';
                    newImgContainer.style.cssText = "position: absolute; left: 50px; top: 50px; width: 250px; height: 250px; z-index: 100;";
                    newImgContainer.innerHTML = `<img src="${aiImageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
                    workspace.appendChild(newImgContainer);
                    if (typeof this.attachElementEvents === 'function') this.attachElementEvents(newImgContainer);
                }
            }

            this.showMagicToast("✨ AI Image Generated and Added to Canvas!");
            promptInput.value = '';
        } catch (error) {
            console.error("AI Image Generation Failed:", error);
            alert("❌ عذراً، خوادم الذكاء الاصطناعي مشغولة حالياً، جرب مرة أخرى.");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-paint-brush"></i> Generate Magic Image`;
            }
        }
    }

    // ✍️ AI Magic Writer (simple local templates)
    enhanceTextWithAi(style) {
        if (!this.selectedElement) {
            alert("💡 اختر عنصراً نصياً من مساحة العمل أولاً لتطبيق الذكاء الاصطناعي عليه!");
            return;
        }
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const textNode = el.querySelector('p, h1, h2, h3, h4, h5, h6, span') || el;
        const currentText = textNode.innerText || textNode.textContent || '';

        this.showMagicToast("✍️ AI is rewriting your copy...");

        let enhancedText = currentText;
        if (style === 'professional') {
            enhancedText = `Premium Quality: ${currentText} | Optimized for Business Success.`;
        } else if (style === 'creative') {
            enhancedText = `✨ Discover the Magic: ${currentText} 🚀 Act Now!`;
        }

        textNode.innerText = enhancedText;
        this.showMagicToast("✨ Copy enhanced with AI!");
    }

    applyBrandFont(fontName, type) {
        if (!this.selectedElement) return;
        const element = document.getElementById(this.selectedElement);
        if (!element) return;

        const contentArea = element.querySelector('.element-content *') || element.querySelector('.element-content');
        contentArea.style.fontFamily = fontName;

        this.updatePropertiesPanel(element);
        this.saveHistory();
    }

    initGoogleFonts() {
        const container = document.getElementById('globalFontsContainer');
        if (!container) return;

        container.innerHTML = this.popularFonts.map(font => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}&display=swap`;
            document.head.appendChild(link);

            return `
                <div class="brand-font-item font-list-row" onclick="editor.applyGlobalFont('${font}')" data-font-name="${font.toLowerCase()}" style="margin: 6px 0;">
                    <span style="font-family: '${font}'; font-size: 18px; width: 35px;">Aa</span>
                    <div class="font-info">
                        <h4 style="font-family: '${font}'; font-size: 14px;">${font}</h4>
                        <p style="font-size: 10px; color: #64748b;">Click to apply</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    applyGlobalFont(fontName) {
        if (!this.selectedElement) return;
        const element = document.getElementById(this.selectedElement);
        if (!element) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}&display=swap`;
        document.head.appendChild(link);

        const contentArea = element.querySelector('.element-content *') || element.querySelector('.element-content');
        if (contentArea) {
            contentArea.style.fontFamily = `'${fontName}', sans-serif`;
        }

        if (typeof this.handleElementSelection === 'function') {
            this.handleElementSelection(element);
        }
        this.saveHistory();
    }

    filterGoogleFonts(query) {
        const rows = document.querySelectorAll('.font-list-row');
        rows.forEach(row => {
            const fontName = row.dataset.fontName || '';
            const searchText = (query || '').toLowerCase().trim();
            row.style.display = fontName.includes(searchText) ? 'flex' : 'none';
        });
    }

    filterIcons(query) {
        const cards = document.querySelectorAll('.icon-item-card');
        cards.forEach(card => {
            const name = (card.dataset.iconName || '').toLowerCase();
            const searchText = (query || '').toLowerCase().trim();
            card.style.display = name.includes(searchText) ? 'block' : 'none';
        });
    }

    addIconToWorkspace(iconClass) {
        this.addElement('icon', 'css');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const iconElement = el.querySelector('.element-content i') || el.querySelector('.element-content');
                if (iconElement) {
                    iconElement.className = `fas ${iconClass}`;
                    this.updatePropertiesPanel(el);
                }
            }
        }, 50);
    }

    insertAdvancedChart(chartType) {
        this.addElement('container', 'html');

        setTimeout(() => {
            if (!this.selectedElement) return;
            const el = document.getElementById(this.selectedElement);
            if (!el) return;

            el.style.width = '360px';
            el.style.height = '260px';
            el.style.background = '#ffffff';
            el.style.borderRadius = '8px';
            el.style.padding = '12px';

            el.dataset.chartType = chartType;
            el.dataset.chartLabels = JSON.stringify(['Jan', 'Feb', 'Mar', 'Apr']);
            el.dataset.chartValues = JSON.stringify([30, 60, 45, 90]);
            el.dataset.chartTitle = 'Sales Report';

            const canvasId = 'canvas_' + Date.now();
            const contentArea = el.querySelector('.element-content') || el;
            contentArea.innerHTML = `
                <div style="width:100%; height:100%; position:relative;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            `;

            this.renderLiveChart(el, canvasId);
        }, 100);
    }

    renderLiveChart(el, canvasId) {
        setTimeout(() => {
            const canvasEl = el.querySelector('canvas') || document.getElementById(canvasId);
            if (!canvasEl) return;
            const ctx = canvasEl.getContext('2d');

            const type = el.dataset.chartType;
            const labels = JSON.parse(el.dataset.chartLabels || '[]');
            const values = JSON.parse(el.dataset.chartValues || '[]');
            const title = el.dataset.chartTitle || 'Chart';
            const themeColors = el.dataset.chartThemeColors ? JSON.parse(el.dataset.chartThemeColors) : ['#6366f1', '#a855f7', '#ec4899', '#10b981'];

            if (el.chartInstance) {
                el.chartInstance.destroy();
            }

            if (typeof Chart === 'undefined') {
                canvasEl.parentElement.innerHTML = '<div style="color:red; font-size:12px; padding:10px;">❌ Chart.js Library Missing! Check &lt;head&gt;</div>';
                return;
            }

            el.chartInstance = new Chart(ctx, {
                type: type,
                data: {
                    labels: labels,
                    datasets: [{
                        label: title,
                        data: values,
                        backgroundColor: type === 'line' ? 'rgba(139, 92, 246, 0.2)' : themeColors,
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: type === 'pie' || type === 'doughnut' || type === 'radar' ? {} : { y: { beginAtZero: true } }
                }
            });

            this.updatePropertiesPanel(el);
        }, 50);
    }

    handleCanvaImageUpload(event, type) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        this.addAssetToWorkspace(url, 'image', file.name, 150, 150);
    }

    handleBrandLogoUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);

        const container = document.getElementById('canvaLogosContainer');
        if (container) {
            container.innerHTML += `
                <div class="canva-logo-preview-box" onclick="editor.addAssetToWorkspace('${url}', 'image', '${file.name}', 50, 50)" style="background:#1e1e2e; padding:4px; border-radius:6px; border:1px solid #475569; cursor:pointer; text-align:center;">
                    <img src="${url}" style="max-width:100%; max-height:40px; border-radius:4px;">
                </div>
            `;
        }

        this.addAssetToWorkspace(url, 'image', file.name, 100, 100);
        this.updatePropertiesPanel(this.getSelectedElementDom());
    }

    addBrandVoiceText(type = 'text', content = 'Company Brand Voice Statement Goes Here.') {
        this.addElement('text', 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const contentArea = el.querySelector('.element-content *') || el.querySelector('.element-content');
                if (contentArea) {
                    if (type === 'Heading' && typeof content === 'string') {
                        contentArea.innerHTML = content;
                    } else if (type === 'Paragraph' && typeof content === 'string') {
                        contentArea.innerHTML = content;
                    } else {
                        contentArea.innerText = content;
                    }
                    this.updatePropertiesPanel(el);
                }
            }
        }, 50);
    }

    insertBrandTemplate(templateId) {
        this.addElement('container', 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const content = el.querySelector('.element-content') || el;
                el.style.width = '400px';
                el.style.height = '180px';
                content.innerHTML = `
                    <div style="padding:20px; background:#f8fafc; border-radius:8px; color:#1e293b; height:100%;">
                        <h2 style="margin:0 0 10px 0; font-size:18px;">Preset Brand Layout</h2>
                        <p style="font-size:13px; color:#64748b; margin-bottom:15px;">This structure was injected live from your Brand Template library.</p>
                        <button style="background:#8b5cf6; color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer;">Action View</button>
                    </div>
                `;
                this.updatePropertiesPanel(el);
            }
        }, 100);
    }

    insertBrandVoiceText(tag, textValue) {
        this.addElement('text', 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const content = el.querySelector('.element-content') || el;
                content.innerHTML = `<${tag} style="margin:0; font-size:20px; color:#1e293b;">${textValue}</${tag}>`;
                this.updatePropertiesPanel(el);
            }
        }, 50);
    }

    insertBrandGraphic(type, iconClass) {
        this.addElement(type, 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const content = el.querySelector('.element-content') || el;
                el.style.width = '80px';
                el.style.height = '80px';
                content.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><i class="${iconClass}" style="font-size:48px; color:#8b5cf6;"></i></div>`;
                this.updatePropertiesPanel(el);
            }
        }, 50);
    }

    insertLiveTable() {
        this.addElement('container', 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const content = el.querySelector('.element-content') || el;
                el.style.width = '360px';
                el.style.height = '160px';
                content.innerHTML = `
                    <table style="width:100%; height:100%; border-collapse:collapse; font-family:Inter; font-size:12px; text-align:left; background:#ffffff; color:#0f172a;">
                        <thead>
                            <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
                                <th style="padding:8px; border:1px solid #e2e8f0;">Item</th>
                                <th style="padding:8px; border:1px solid #e2e8f0;">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding:6px; border:1px solid #e2e8f0;">Feature A</td><td style="padding:6px; border:1px solid #e2e8f0;">Active</td></tr>
                            <tr><td style="padding:6px; border:1px solid #e2e8f0;">Feature B</td><td style="padding:6px; border:1px solid #e2e8f0;">Premium</td></tr>
                        </tbody>
                    </table>
                `;
                this.updatePropertiesPanel(el);
            }
        }, 50);
    }

    insertVideoEmbed() {
        this.addElement('container', 'html');
        setTimeout(() => {
            if (this.selectedElement) {
                const el = document.getElementById(this.selectedElement);
                const content = el.querySelector('.element-content') || el;
                el.style.width = '320px';
                el.style.height = '180px';
                content.innerHTML = `
                    <video controls style="width:100%; height:100%; object-fit:cover; background:#000000; border-radius:8px;">
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
                        Your browser does not support HTML video.
                    </video>
                `;
                this.updatePropertiesPanel(el);
            }
        }, 50);
    }

    updatePropertiesPanel(element) {
        const propPanel = document.getElementById('panelContent') || document.getElementById('propertiesPanel') || document.querySelector('.panel-content') || document.querySelector('.right-panel');
        if (!propPanel) {
            console.error('❌ Properties Panel not found in DOM!');
            return;
        }

        propPanel.innerHTML = '';

        const node = element instanceof HTMLElement ? element : document.getElementById(element);
        if (!node) {
            propPanel.innerHTML = `
                <div class="panel-header" style="padding:12px; background:#1e1e2e; border-bottom:1px solid #2e2e3e;"><h3>🎨 Properties</h3></div>
                <div style="padding:15px; color:#64748b; font-size:12px; text-align:center;">Select an element on the canvas to inspect its controls.</div>
            `;
            return;
        }

        this.selectedElement = node.id;

        const isImageNode = node.tagName.toLowerCase() === 'img';
        const hasImageInside = node.querySelector('img') !== null;
        const hasComputedBgImage = window.getComputedStyle(node).backgroundImage !== 'none';
        const isExplicitImage = node.dataset.elementType === 'image';
        const isImageElement = isImageNode || hasImageInside || hasComputedBgImage || isExplicitImage;

        if (isImageElement) {
            propPanel.innerHTML = `
                <div class="panel-header" style="padding:12px; background:#1e1e2e; border-bottom:1px solid #2e2e3e;">
                    <h3 style="margin:0; font-size:14px; color:#fff;"><i class="fas fa-magic" style="color:#a855f7; margin-right:6px;"></i> AI Image & Background Toolkit</h3>
                </div>
                
                <div class="panel-body-scrollable" style="padding:15px; color:#cbd5e1; height: calc(100vh - 160px); overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
                    
                    <div class="tool-section" style="background:#1e1e2e; padding:12px; border-radius:8px; border:1px solid #2e2e3e; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                        <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:10px; font-weight:bold; text-transform:uppercase;">🪄 AI Magic Tools</label>
                        <button id="bgRemoveBtn" onclick="editor.removeImageBackground()" style="width:100%; background:linear-gradient(135deg, #8b5cf6, #ec4899); color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 6px 15px rgba(139,92,246,0.3); transition:all 0.2s;">
                            <i class="fas fa-wand-magic-sparkles"></i> AI Background Remover (1-Click)
                        </button>
                        <p style="font-size:10px; color:#64748b; margin-top:8px; text-align:center;">* Uses AI to instantly make image background transparent.</p>
                    </div>

                    <div class="tool-section" style="background:#1e1e2e; padding:12px; border-radius:8px; border:1px solid #2e2e3e;">
                        <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:12px; font-weight:bold; text-transform:uppercase;">🖼️ New Background Editor</label>
                        
                        <div style="margin-bottom:15px; background:#2e2e3e; padding:10px; border-radius:6px;">
                            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:6px;">Set New Solid Backing:</span>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <input type="color" onchange="editor.setImageBackingColor(this.value)" style="width:50px; height:35px; background:transparent; border:none; cursor:pointer; padding:0;">
                                <button onclick="editor.setImageBackingColor('transparent')" style="flex:1; background:#1e1e2e; border:1px solid #475569; color:#fff; padding:8px; border-radius:6px; font-size:11px; cursor:pointer; font-weight:500;">Transparent Backdrop</button>
                            </div>
                        </div>

                        <div style="margin-bottom:15px;">
                            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:6px;">Blur Backdrop Effect (يفضل بعد الإزالة):</span>
                            <input type="range" min="0" max="25" value="0" oninput="editor.setImageBackdropBlur(this.value)" style="width:100%; accent-color:#8b5cf6; cursor:pointer;">
                        </div>

                        <div>
                            <span style="font-size:11px; color:#cbd5e1; display:block; margin-bottom:8px;">Preset Gradient Backdrops:</span>
                            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
                                <button onclick="editor.setImageGradientBacking('linear-gradient(45deg, #ff9a9e, #fecfef)')" title="Neon Sunset" style="height:30px; background:linear-gradient(45deg, #ff9a9e, #fecfef); border:2px solid #3f3f46; border-radius:6px; cursor:pointer; transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></button>
                                <button onclick="editor.setImageGradientBacking('linear-gradient(120deg, #a1c4fd, #c2e9fb)')" title="Ocean Breeze" style="height:30px; background:linear-gradient(120deg, #a1c4fd, #c2e9fb); border:2px solid #3f3f46; border-radius:6px; cursor:pointer; transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></button>
                                <button onclick="editor.setImageGradientBacking('linear-gradient(to right, #f43f5e, #f97316)')" title="Warm Sunset" style="height:30px; background:linear-gradient(to right, #f43f5e, #f97316); border:2px solid #3f3f46; border-radius:6px; cursor:pointer; transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></button>
                            </div>
                        </div>
                    </div>

                </div>
            `;
        } else if (node.dataset.chartType) {
            const labels = JSON.parse(node.dataset.chartLabels || '[]');
            const values = JSON.parse(node.dataset.chartValues || '[]');
            const title = node.dataset.chartTitle || 'Chart';
            const currentType = node.dataset.chartType;

            let excelRowsHtml = '';
            labels.forEach((label, index) => {
                excelRowsHtml += `
                    <div style="display:flex; gap:6px; margin-bottom:6px;">
                        <input type="text" value="${label}" oninput="editor.updateChartDataCell(${index}, 'label', this.value)" style="width:50%; padding:6px; background:#1e1e2e; border:1px solid #3f3f46; color:#fff; border-radius:4px; font-size:12px;">
                        <input type="number" value="${values[index] || 0}" oninput="editor.updateChartDataCell(${index}, 'value', this.value)" style="width:50%; padding:6px; background:#1e1e2e; border:1px solid #3f3f46; color:#fff; border-radius:4px; font-size:12px;">
                        <button onclick="editor.deleteChartRow(${index})" style="background:#ef4444; color:#fff; border:none; padding:0 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });

            propPanel.innerHTML = `
                <div class="panel-header">
                    <h3><i class="fas fa-chart-bar" style="color:#3b82f6; margin-right:6px;"></i> Advanced Chart Toolkit</h3>
                </div>
                <div style="padding:15px; color:#cbd5e1; max-height:calc(100vh - 120px); overflow-y:auto;">
                    <div style="margin-bottom:15px; background:#1e1e2e; padding:10px; border-radius:8px;">
                        <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:6px;">📈 Switch Chart Type</label>
                        <select onchange="editor.switchChartType(this.value)" style="width:100%; padding:8px; background:#2e2e3e; border:1px solid #475569; color:#fff; border-radius:6px; font-size:12px; cursor:pointer;">
                            <option value="bar" ${currentType === 'bar' ? 'selected' : ''}>Bar Chart (أعمدة)</option>
                            <option value="line" ${currentType === 'line' ? 'selected' : ''}>Line Chart (خطي)</option>
                            <option value="pie" ${currentType === 'pie' ? 'selected' : ''}>Pie Chart (دائري)</option>
                            <option value="doughnut" ${currentType === 'doughnut' ? 'selected' : ''}>Doughnut Chart (حلقة)</option>
                            <option value="radar" ${currentType === 'radar' ? 'selected' : ''}>Radar Chart (شبكي)</option>
                        </select>
                    </div>

                    <div style="margin-bottom:15px;">
                        <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">Chart Title</label>
                        <input type="text" value="${title}" oninput="editor.updateChartTitle(this.value)" style="width:100%; padding:8px; background:#1e1e2e; border:1px solid #3f3f46; color:#fff; border-radius:6px; font-size:13px;">
                    </div>

                    <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:6px;">Excel Data Sheet (Labels | Values)</label>
                    <div id="excelDataSheet">${excelRowsHtml}</div>

                    <button onclick="editor.addChartRow()" style="margin-top:8px; width:100%; background:#2e2e3e; border:1px dashed #475569; color:#cbd5e1; padding:8px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">
                        <i class="fas fa-plus" style="margin-right:4px;"></i> Add New Row
                    </button>

                    <hr style="border:0; border-top:1px solid #2e2e3e; margin:15px 0;">

                    <div style="margin-bottom:15px;">
                        <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:6px;">🎨 Chart Color Theme</label>
                        <div style="display:flex; gap:6px;">
                            <button onclick="editor.changeChartTheme(['#6366f1', '#a855f7', '#ec4899', '#10b981'])" style="flex:1; height:20px; background:linear-gradient(to right, #6366f1, #10b981); border:none; border-radius:4px; cursor:pointer;" title="Neon Theme"></button>
                            <button onclick="editor.changeChartTheme(['#f59e0b', '#ef4444', '#b91c1c', '#f97316'])" style="flex:1; height:20px; background:linear-gradient(to right, #f59e0b, #ef4444); border:none; border-radius:4px; cursor:pointer;" title="Warm Sunset Theme"></button>
                            <button onclick="editor.changeChartTheme(['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'])" style="flex:1; height:20px; background:linear-gradient(to right, #0284c7, #7dd3fc); border:none; border-radius:4px; cursor:pointer;" title="Ocean Blue Theme"></button>
                        </div>
                    </div>

                    <div style="display:flex; gap:8px; margin-top:15px;">
                        <button onclick="editor.exportChartAsImage()" style="flex:1; background:#10b981; color:#fff; border:none; padding:8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
                            <i class="fas fa-download"></i> Export Image
                        </button>
                        <button onclick="editor.clearChartData()" style="flex:1; background:#3f3f46; color:#ef4444; border:none; padding:8px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
                            <i class="fas fa-eraser"></i> Clear Data
                        </button>
                    </div>
                </div>
            `;
        } else {
            propPanel.innerHTML = `
                <div class="panel-header" style="padding:12px; background:#1e1e2e; border-bottom:1px solid #2e2e3e;"><h3>🎨 Properties</h3></div>
                <div style="padding:15px; color:#64748b; font-size:12px; text-align:center;">Select an image asset from the workspace to view AI tools and background editor.</div>
            `;
        }

        if (typeof this.handleElementSelection === 'function') {
            this.handleElementSelection(node);
        }
    }

    triggerMagicResize(newWidth, newHeight, targetName) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) {
            console.error('Magic Resize Error: Workspace container not found!');
            return;
        }

        const currentWidth = parseFloat(workspace.style.width) || workspace.clientWidth || 800;
        const currentHeight = parseFloat(workspace.style.height) || workspace.clientHeight || 600;

        const scaleX = newWidth / currentWidth;
        const scaleY = newHeight / currentHeight;

        console.log(`🔮 Magic Resize Initiated to [${targetName}]: ScaleX=${scaleX}, ScaleY=${scaleY}`);

        workspace.style.width = `${newWidth}px`;
        workspace.style.height = `${newHeight}px`;

        const allElements = workspace.querySelectorAll('.scalable-element, .free-element');

        allElements.forEach(el => {
            const elLeft = parseFloat(el.style.left) || 0;
            const elTop = parseFloat(el.style.top) || 0;
            const elWidth = parseFloat(el.style.width) || el.clientWidth || 100;
            const elHeight = parseFloat(el.style.height) || el.clientHeight || 50;

            el.style.left = `${elLeft * scaleX}px`;
            el.style.top = `${elTop * scaleY}px`;
            el.style.width = `${elWidth * scaleX}px`;
            el.style.height = `${elHeight * scaleY}px`;

            const textNode = el.querySelector('p, h1, h2, h3, h4, h5, h6, span');
            if (textNode) {
                const currentFontSize = parseFloat(window.getComputedStyle(textNode).fontSize) || 16;
                const fontScale = (scaleX + scaleY) / 2;
                textNode.style.fontSize = `${currentFontSize * fontScale}px`;
            }

            if (el.chartInstance) {
                try {
                    el.chartInstance.resize();
                    el.chartInstance.update();
                } catch (err) {
                    console.warn('Chart resize handoff skipped:', err);
                }
            }
        });

        if (this.selectedElement) {
            const activeEl = document.getElementById(this.selectedElement);
            if (activeEl) this.updatePropertiesPanel(activeEl);
        }

        this.showMagicToast(`✨ Magic Resized to ${targetName} successfully!`);
    }

    bringToFront() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const allElements = document.querySelectorAll('.scalable-element, .free-element');
        let maxZ = 100;
        allElements.forEach(item => {
            const z = parseInt(item.style.zIndex) || 100;
            if (z > maxZ) maxZ = z;
        });

        el.style.zIndex = maxZ + 1;
        this.showMagicToast('🗂️ Element brought to top front!');
    }

    sendToBack() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const allElements = document.querySelectorAll('.scalable-element, .free-element');
        let minZ = 100;
        allElements.forEach(item => {
            const z = parseInt(item.style.zIndex) || 100;
            if (z < minZ) minZ = z;
        });

        el.style.zIndex = Math.max(1, minZ - 1);
        this.showMagicToast('🗂️ Element sent to bottom back!');
    }

    bringForward() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const currentZ = parseInt(el.style.zIndex) || 100;
        el.style.zIndex = currentZ + 1;
    }

    sendBackward() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const currentZ = parseInt(el.style.zIndex) || 100;
        el.style.zIndex = Math.max(1, currentZ - 1);
    }

    showMagicToast(message) {
        let toast = document.getElementById('magic-resize-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'magic-resize-toast';
            toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#8b5cf6; color:#fff; padding:12px 24px; border-radius:8px; font-family:Inter; font-size:13px; font-weight:bold; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); z-index:9999; transition:all 0.3s; opacity:0; transform:translateY(20px);";
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
        }, 3000);
    }

    async exportTransparentPNG() {
        const workspace = document.getElementById('workspace')
            || document.querySelector('.workspace-content')
            || document.querySelector('[class*="workspace"]');

        if (!workspace) {
            alert('❌ خطأ حرج: لم يتم العثور على حاوية مساحة العمل (Workspace) في الـ HTML بتاعك!');
            return;
        }

        this.showMagicToast('📸 جاري تصدير التصميم خلفية شفافة...');

        const captureTarget = workspace;
        const originalBg = captureTarget.style.background || '';
        const originalBodyBg = document.body.style.background || '';
        const originalCanvasBg = document.getElementById('canvas')?.style.background || '';

        try {
            captureTarget.style.background = 'transparent';
            document.body.style.background = 'transparent';
            if (document.getElementById('canvas')) {
                document.getElementById('canvas').style.background = 'transparent';
            }

            const exportCanvas = await (window.html2canvas || html2canvas)(captureTarget, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: Math.max(captureTarget.scrollWidth || captureTarget.clientWidth || 1200, 1),
                height: Math.max(captureTarget.scrollHeight || captureTarget.clientHeight || 800, 1),
                scrollX: 0,
                scrollY: 0
            });

            const imageURI = exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'TecnoBrain_Transparent_HD.png';
            link.href = imageURI;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMagicToast('✨ تم التصدير بنجاح!');
        } catch (error) {
            console.error('Transparent PNG export failed:', error);
            this.showMagicToast('⚠️ فشل التصدير، حاول مرة أخرى');
        } finally {
            captureTarget.style.background = originalBg;
            document.body.style.background = originalBodyBg;
            if (document.getElementById('canvas')) {
                document.getElementById('canvas').style.background = originalCanvasBg;
            }
        }
    }

    async removeImageBackground() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        const imgNode = el ? el.querySelector('img') : null;

        if (!imgNode) {
            alert('⚠️ من فضلك اختر عنصراً يحتوي على صورة أولاً!');
            return;
        }

        const btn = document.getElementById('bgRemoveBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing Image AI...';
        }
        this.showMagicToast('🔮 AI is extracting object backgrounds...');

        try {
            const formData = new FormData();
            const response = await fetch(imgNode.src);
            const blob = await response.blob();
            formData.append('image_file', blob, 'image.png');

            const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-API-Key': 'YOUR_FREE_REMOVE_BG_API_KEY'
                },
                body: formData
            });

            if (!apiResponse.ok) {
                console.log('Using dynamic rendering canvas mask fallback...');
                this.simulateAiBackgroundRemoval(imgNode);
                return;
            }

            const resBlob = await apiResponse.blob();
            const resultUrl = URL.createObjectURL(resBlob);
            imgNode.src = resultUrl;
            this.showMagicToast('✨ Background removed successfully!');
        } catch (error) {
            console.warn('External AI Gateway error, switching to canvas auto-mask engine...', error);
            this.simulateAiBackgroundRemoval(imgNode);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI Background Remover';
            }
        }
    }

    simulateAiBackgroundRemoval(imgNode) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = imgNode.naturalWidth || imgNode.clientWidth || 300;
        canvas.height = imgNode.naturalHeight || imgNode.clientHeight || 300;

        ctx.drawImage(imgNode, 0, 0);

        try {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const targetR = data[0];
            const targetG = data[1];
            const targetB = data[2];
            const tolerance = 40;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (Math.abs(r - targetR) < tolerance && Math.abs(g - targetG) < tolerance && Math.abs(b - targetB) < tolerance) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            imgNode.src = canvas.toDataURL();
            this.showMagicToast('✨ AI Local Masking Applied!');
        } catch (e) {
            console.error('Canvas CORS limitation hit. Please serve your project from a local server.', e);
            imgNode.style.mixBlendMode = 'multiply';
            this.showMagicToast('✨ CSS Smart Blend Applied!');
        }
    }

    setImageBackingColor(color) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        el.style.background = color;
        const imgNode = el.querySelector('img');
        if (imgNode) {
            imgNode.style.mixBlendMode = 'normal';
        }
    }

    setImageGradientBacking(gradientString) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        el.style.background = gradientString;
    }

    setImageBackdropBlur(blurValue) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const imgNode = el.querySelector('img');
        if (imgNode) {
            imgNode.style.filter = `blur(${blurValue}px)`;
        }
    }

    updateChartDataCell(index, field, value) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        if (field === 'label') {
            const labels = JSON.parse(el.dataset.chartLabels || '[]');
            labels[index] = value;
            el.dataset.chartLabels = JSON.stringify(labels);
        } else if (field === 'value') {
            const values = JSON.parse(el.dataset.chartValues || '[]');
            values[index] = Number(value) || 0;
            el.dataset.chartValues = JSON.stringify(values);
        }

        this.renderLiveChart(el);
    }

    switchChartType(newType) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        el.dataset.chartType = newType;
        this.renderLiveChart(el);
    }

    changeChartTheme(colorsArray) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        el.dataset.chartThemeColors = JSON.stringify(colorsArray);

        if (el.chartInstance) {
            el.chartInstance.data.datasets[0].backgroundColor = el.dataset.chartType === 'line' ? 'rgba(139, 92, 246, 0.2)' : colorsArray;
            el.chartInstance.update();
        }
    }

    exportChartAsImage() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const canvas = el.querySelector('canvas');
        if (!canvas) return;

        const imageURI = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${el.dataset.chartTitle || 'chart'}.png`;
        link.href = imageURI;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    deleteChartRow(index) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const labels = JSON.parse(el.dataset.chartLabels || '[]');
        const values = JSON.parse(el.dataset.chartValues || '[]');

        if (labels.length <= 1) {
            alert('⚠️ لا يمكن حذف كل الصفوف، يجب ترك صف واحد على الأقل للشارت!');
            return;
        }

        labels.splice(index, 1);
        values.splice(index, 1);

        el.dataset.chartLabels = JSON.stringify(labels);
        el.dataset.chartValues = JSON.stringify(values);

        this.renderLiveChart(el);
    }

    clearChartData() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        el.dataset.chartLabels = JSON.stringify(['A']);
        el.dataset.chartValues = JSON.stringify([0]);

        this.renderLiveChart(el);
    }

    updateChartTitle(value) {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        el.dataset.chartTitle = value;
        this.renderLiveChart(el);
    }

    addChartRow() {
        if (!this.selectedElement) return;
        const el = document.getElementById(this.selectedElement);
        if (!el) return;

        const labels = JSON.parse(el.dataset.chartLabels || '[]');
        const values = JSON.parse(el.dataset.chartValues || '[]');

        labels.push('New Item');
        values.push(50);

        el.dataset.chartLabels = JSON.stringify(labels);
        el.dataset.chartValues = JSON.stringify(values);

        this.renderLiveChart(el);
    }

    initLayersOrderController() {
        const layersContainer = document.querySelector('.layers-list') || document.getElementById('layers-container');
        if (!layersContainer || typeof Sortable === 'undefined') return;
        if (layersContainer.dataset.sortableReady === 'true') return;

        layersContainer.dataset.sortableReady = 'true';

        Sortable.create(layersContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                const currentWorkspace = document.querySelector('.design-screen[style*="display: block"]') || document.getElementById('workspace');
                if (!currentWorkspace) return;

                const updatedLayers = layersContainer.querySelectorAll('.layer-item');
                updatedLayers.forEach((layerItem) => {
                    const elementId = layerItem.getAttribute('data-element-id');
                    const realElement = currentWorkspace.querySelector(`#${elementId}`);
                    if (realElement) {
                        currentWorkspace.appendChild(realElement);
                    }
                });

                this.saveHistory();
                console.log('تم تحديث ترتيب الطبقات في مساحة العمل بنجاح!');
            }
        });
    }

    renderAssetsPanel() {
        if (!this.assets) {
            this.assets = [];
        }

        const getAssetsHTML = (type, icon) => {
            return this.assets
                .filter(asset => asset.type === type)
                .map(asset => `
                    <div class="asset-item"
                         data-asset-id="${asset.id}"
                         draggable="true"
                         ondragstart="editor.handleAssetDragStart(event, '${asset.url}', '${asset.type}', '${asset.name}')"
                         ondblclick="editor.addAssetToWorkspace('${asset.url}', '${asset.type}', '${asset.name}')">
                        <div class="asset-preview">
                            ${type === 'image' ? `<img src="${asset.url}" alt="${asset.name}">` : `<i class="${icon}"></i>`}
                        </div>
                        <div class="asset-meta">
                            <span class="asset-name">${asset.name}</span>
                            <button class="asset-delete-btn" onclick="editor.deleteAsset('${asset.id}', event)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
        };

        return `
            <div class="panel-header">
                <h3><i class="fas fa-folder-open" style="margin-right:8px;color:var(--accent-blue, #3b82f6)"></i>Asset Manager</h3>
            </div>

            <div class="upload-zone" id="uploadZone"
                 ondragover="event.preventDefault(); this.classList.add('dragover');"
                 ondragleave="this.classList.remove('dragover');"
                 ondrop="editor.handleAssetDrop(event)">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & Drop files here or</p>
                <label class="upload-btn">
                    Browse Files
                    <input type="file" id="assetInput" multiple accept="image/*,audio/*,video/*" style="display:none;" onchange="editor.handleFileSelect(event)">
                </label>
            </div>

            <div class="assets-display-container">
                <div class="component-category">Images (Double-click to add)</div>
                <div class="assets-grid">${getAssetsHTML('image', 'fas fa-image')}</div>

                <div class="component-category">Audio / Sounds</div>
                <div class="assets-grid">${getAssetsHTML('audio', 'fas fa-volume-up')}</div>

                <div class="component-category">Videos</div>
                <div class="assets-grid">${getAssetsHTML('video', 'fas fa-video')}</div>
            </div>
        `;
    }

    handleFileSelect(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    handleAssetDrop(event) {
        event.preventDefault();
        document.getElementById('uploadZone').classList.remove('dragover');
        const files = event.dataTransfer.files;
        this.processFiles(files);
    }

    processFiles(files) {
        if (!this.assets) this.assets = [];

        for (let file of files) {
            let type = 'image';
            if (file.type.startsWith('audio/')) type = 'audio';
            if (file.type.startsWith('video/')) type = 'video';

            const objectUrl = URL.createObjectURL(file);

            this.assets.push({
                id: 'asset_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: file.name,
                type: type,
                url: objectUrl
            });
        }

        const panelContainer = document.getElementById('panel-content') || document.querySelector('.panel-content');
        if (panelContainer) panelContainer.innerHTML = this.renderAssetsPanel();
    }

    deleteAsset(assetId, event) {
        event.stopPropagation();
        this.assets = this.assets.filter(asset => asset.id !== assetId);
        const panelContainer = document.getElementById('panel-content') || document.querySelector('.panel-content');
        if (panelContainer) panelContainer.innerHTML = this.renderAssetsPanel();
    }

    handleAssetDragStart(event, url, type, name) {
        event.dataTransfer.setData('text/plain', JSON.stringify({ url, type, name }));
    }

    addAssetToWorkspace(url, type, name, x = null, y = null) {
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';

        const currentVisibleScreen = document.querySelector('.design-screen[style*="display: block"]');
        const targetContainer = currentVisibleScreen || document.getElementById('canvas');
        if (!targetContainer) return;

        const id = 'asset-' + Date.now();
        const assetElement = document.createElement('div');
        assetElement.className = 'canvas-element asset-element draggable-element';
        assetElement.id = id;
        assetElement.dataset.type = type;
        assetElement.dataset.assetName = name;

        let markup = '';
        if (type === 'image') {
            markup = `<img src="${url}" alt="${name}" style="max-width:100%;border-radius:8px">`;
        } else if (type === 'audio') {
            markup = `<audio controls src="${url}" style="width:100%"></audio>`;
        } else if (type === 'video') {
            markup = `<video controls src="${url}" style="width:100%;border-radius:8px"></video>`;
        }

        assetElement.innerHTML = `
            <div class="element-actions">
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveUp('${id}')" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveDown('${id}')" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                <button class="element-action-btn delete" onclick="event.stopPropagation();editor.deleteElement('${id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
            <div class="element-content">${markup}</div>
        `;
        assetElement.addEventListener('click', (e) => {
            if (!e.target.closest('.element-actions')) this.selectElement(id);
        });

        if (x !== null && y !== null) {
            assetElement.style.position = 'absolute';
            assetElement.style.left = `${Math.max(0, x - 60)}px`;
            assetElement.style.top = `${Math.max(0, y - 40)}px`;
        }

        targetContainer.appendChild(assetElement);
        this.makeElementDraggable(assetElement);
        this.elements.push({ id, type, lang: 'asset', content: markup });
        this.selectElement(id);
        this.saveHistory();
    }

    handleAssetWorkspaceDrop(event) {
        event.preventDefault();
        try {
            const dataText = event.dataTransfer.getData('text/plain');
            if (!dataText) return;

            const assetData = JSON.parse(dataText);
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.addAssetToWorkspace(assetData.url, assetData.type, assetData.name, x, y);
        } catch (e) {
            console.log('هذا السحب ليس تابعاً للأصول الفنية المرفوعة.');
        }
    }

    renderCodePanel(lang, label) {
        return `
            <div class="panel-header"><h3>${label} Snippets</h3></div>
            <div class="snippet-list">
                <div class="snippet-item" onclick="editor.insertCodeSnippet('${lang}','hello')">Hello World</div>
                <div class="snippet-item" onclick="editor.insertCodeSnippet('${lang}','loop')">Loop</div>
                <div class="snippet-item" onclick="editor.insertCodeSnippet('${lang}','function')">Function</div>
            </div>
        `;
    }

    filterComponents(q) {
        const items = document.querySelectorAll('#componentsPanel .component-item');
        items.forEach(i => {
            const txt = i.textContent.toLowerCase();
            i.style.display = txt.includes(q.toLowerCase()) ? '' : 'none';
        });
    }

    addElement(type, lang) {
        const placeholder = document.getElementById('placeholder');
        if (placeholder) placeholder.style.display = 'none';
        const id = 'el-' + Date.now();
        const element = document.createElement('div');
        element.className = 'canvas-element draggable-element';
        element.id = id;
        element.dataset.type = type;
        element.dataset.lang = lang;
        const defaultContent = this.getDefaultContent(type);
        element.innerHTML = `
            <div class="element-actions">
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveUp('${id}')" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                <button class="element-action-btn" onclick="event.stopPropagation();editor.moveDown('${id}')" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                <button class="element-action-btn" onclick="event.stopPropagation();editor.editElement('${id}')" title="Edit Code"><i class="fas fa-code"></i></button>
                <button class="element-action-btn delete" onclick="event.stopPropagation();editor.deleteElement('${id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
            <div class="element-content">${defaultContent}</div>
        `;
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.element-actions')) this.selectElement(id);
        });

        this.makeElementDraggable(element);

        // عند إسقاط عنصر في مساحة العمل، اضمن أنه يدخل الشاشة المفتوحة حالياً فقط
        const currentVisibleScreen = document.querySelector('.design-screen[style*="display: block"]');
        if (currentVisibleScreen) {
            currentVisibleScreen.appendChild(element);
        } else {
            const canvas = document.getElementById('canvas');
            if (!canvas) return;
            canvas.appendChild(element);
        }
        this.elements.push({ id, type, lang, content: defaultContent });
        this.selectElement(id);
        this.saveHistory();
        if (this.currentExplorerTab === 'layers') this.renderExplorerPanel('layers');
    }

    getDefaultContent(type) {
        const c = {
            heading:'<h2 style="font-size:32px;font-weight:700;color:#1a1a1a;margin:0">Heading Text</h2>',
            text:'<p style="font-size:16px;line-height:1.6;color:#4a4a4a;margin:0">This is a paragraph. Click the code button to edit this text.</p>',
            button:'<button style="padding:14px 28px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">Click Me</button>',
            image:'<img src="https://via.placeholder.com/600x300/8b5cf6/ffffff?text=Image" style="width:100%;border-radius:8px" alt="Placeholder">',
            video:'<video controls style="width:100%;border-radius:8px"><source src="" type="video/mp4">Your browser does not support the video tag.</video>',
            audio:'<audio controls style="width:100%"><source src="" type="audio/mpeg">Your browser does not support the audio element.</audio>',
            icon:'<i class="fas fa-star" style="font-size:48px;color:#8b5cf6"></i>',
            container:'<div style="padding:24px;background:#f8f8f8;border-radius:12px;border:2px dashed #ddd"><p style="text-align:center;color:#999">Container - Drop items here</p></div>',
            section:'<section style="padding:40px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px"><h3 style="margin:0 0 12px 0">Section Title</h3><p style="margin:0;color:#666">Section content goes here...</p></section>',
            code:'<div style="padding:20px;background:#1e1e2e;border-radius:12px;color:#a6accd;font-family:monospace"><span style="color:#c099ff">const</span> hello = <span style="color:#ff98a4">"Hello World"</span>;<br><span style="color:#c099ff">console</span>.log(hello);</div>',
            form:'<form style="padding:24px;background:#f8f8f8;border-radius:12px"><div style="margin-bottom:12px"><label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600">Email</label><input type="email" placeholder="your@email.com" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px"></div><button type="submit" style="padding:10px 20px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">Submit</button></form>',
            nav:'<nav style="display:flex;gap:20px;padding:16px;background:#1a1a1a;border-radius:8px"><a href="#" style="color:white;text-decoration:none;font-weight:600">Home</a><a href="#" style="color:#a1a1aa;text-decoration:none">About</a><a href="#" style="color:#a1a1aa;text-decoration:none">Contact</a></nav>',
            card:'<div style="padding:24px;background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1)"><h3 style="margin:0 0 8px 0;font-size:20px">Card Title</h3><p style="margin:0;color:#666">Card description goes here...</p></div>',
            table:'<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f8f8f8"><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Name</th><th style="padding:12px;text-align:left;border-bottom:2px solid #ddd">Value</th></tr></thead><tbody><tr><td style="padding:12px;border-bottom:1px solid #eee">Item 1</td><td style="padding:12px;border-bottom:1px solid #eee">100</td></tr><tr><td style="padding:12px;border-bottom:1px solid #eee">Item 2</td><td style="padding:12px;border-bottom:1px solid #eee">200</td></tr></tbody></table>',
            chart:'<div style="padding:24px;background:#f8f8f8;border-radius:12px;text-align:center"><div style="display:flex;align-items:flex-end;justify-content:center;gap:8px;height:150px"><div style="width:40px;height:60%;background:linear-gradient(135deg,#8b5cf6,#a78bfa);border-radius:4px 4px 0 0"></div><div style="width:40px;height:80%;background:linear-gradient(135deg,#3b82f6,#60a5fa);border-radius:4px 4px 0 0"></div><div style="width:40px;height:40%;background:linear-gradient(135deg,#22c55e,#4ade80);border-radius:4px 4px 0 0"></div><div style="width:40px;height:90%;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:4px 4px 0 0"></div></div><p style="margin-top:12px;color:#666;font-size:13px">Bar Chart Preview</p></div>',
            map:'<div style="padding:24px;background:#e8f4f8;border-radius:12px;text-align:center"><i class="fas fa-map-marked-alt" style="font-size:48px;color:#3b82f6;margin-bottom:12px"></i><p style="color:#666;margin:0">Interactive Map Placeholder</p></div>',
            slider:'<div style="padding:24px;background:#f8f8f8;border-radius:12px"><div style="display:flex;gap:12px;overflow-x:auto"><img src="https://via.placeholder.com/200x150/8b5cf6/ffffff?text=Slide+1" style="border-radius:8px;flex-shrink:0"><img src="https://via.placeholder.com/200x150/3b82f6/ffffff?text=Slide+2" style="border-radius:8px;flex-shrink:0"><img src="https://via.placeholder.com/200x150/22c55e/ffffff?text=Slide+3" style="border-radius:8px;flex-shrink:0"></div></div>',
            timeline:'<div style="padding:24px"><div style="position:relative;padding-left:24px;border-left:2px solid #8b5cf6"><div style="margin-bottom:20px"><div style="width:12px;height:12px;background:#8b5cf6;border-radius:50%;position:absolute;left:-7px"></div><h4 style="margin:0 0 4px 0">Event 1</h4><p style="margin:0;color:#666;font-size:13px">Description of first event</p></div><div style="margin-bottom:20px"><div style="width:12px;height:12px;background:#3b82f6;border-radius:50%;position:absolute;left:-7px;margin-top:40px"></div><h4 style="margin:0 0 4px 0">Event 2</h4><p style="margin:0;color:#666;font-size:13px">Description of second event</p></div></div></div>',
            gallery:'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><img src="https://via.placeholder.com/150/8b5cf6/ffffff?text=1" style="width:100%;border-radius:8px"><img src="https://via.placeholder.com/150/3b82f6/ffffff?text=2" style="width:100%;border-radius:8px"><img src="https://via.placeholder.com/150/22c55e/ffffff?text=3" style="width:100%;border-radius:8px"><img src="https://via.placeholder.com/150/f97316/ffffff?text=4" style="width:100%;border-radius:8px"><img src="https://via.placeholder.com/150/ec4899/ffffff?text=5" style="width:100%;border-radius:8px"><img src="https://via.placeholder.com/150/06b6d4/ffffff?text=6" style="width:100%;border-radius:8px"></div>',
            embed:'<div style="padding:24px;background:#f8f8f8;border-radius:12px;text-align:center"><i class="fas fa-code" style="font-size:32px;color:#666;margin-bottom:12px"></i><p style="color:#666;margin:0">Embed External Content</p></div>',
            social:'<div style="display:flex;gap:16px;justify-content:center;padding:16px"><a href="#" style="width:40px;height:40px;background:#1877f2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white"><i class="fab fa-facebook-f"></i></a><a href="#" style="width:40px;height:40px;background:#1da1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white"><i class="fab fa-twitter"></i></a><a href="#" style="width:40px;height:40px;background:#e4405f;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white"><i class="fab fa-instagram"></i></a><a href="#" style="width:40px;height:40px;background:#0077b5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white"><i class="fab fa-linkedin-in"></i></a></div>',
            quote:'<blockquote style="padding:24px 24px 24px 48px;background:#f8f8f8;border-radius:12px;border-left:4px solid #8b5cf6;position:relative"><i class="fas fa-quote-left" style="position:absolute;top:16px;left:16px;color:#8b5cf6;font-size:20px"></i><p style="font-size:18px;font-style:italic;color:#333;margin:0 0 12px 0">The only way to do great work is to love what you do.</p><cite style="color:#666;font-size:14px">- Steve Jobs</cite></blockquote>',
            list:'<ul style="padding-left:24px"><li style="margin-bottom:8px;font-size:16px">First item in the list</li><li style="margin-bottom:8px;font-size:16px">Second item in the list</li><li style="margin-bottom:8px;font-size:16px">Third item in the list</li></ul>',
            divider:'<hr style="border:none;border-top:2px solid #e5e5e5;margin:16px 0">',
            spacer:'<div style="height:40px"></div>'
        };
        return c[type] || '<div style="padding:20px;background:#f8f8f8;border-radius:8px">Unknown Component</div>';
    }

    clearSelectionHandles() {
        document.querySelectorAll('.element-delete-btn').forEach(btn => btn.remove());
    }

    showDeleteHandle(element) {
        if (!element) return;
        this.clearSelectionHandles();

        const btn = document.createElement('button');
        btn.className = 'element-delete-btn';
        btn.innerHTML = '<i class="fas fa-trash"></i>';
        btn.title = 'Delete element';
        btn.type = 'button';
        btn.style.cssText = 'position:absolute; top:6px; right:6px; z-index:9999; width:28px; height:28px; border:none; border-radius:999px; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,0.2);';
        btn.onclick = (e) => {
            e.stopPropagation();
            this.deleteElement(element.id);
        };

        element.style.position = element.style.position || 'absolute';
        element.appendChild(btn);
    }

    selectElement(id) {
        document.querySelectorAll('.canvas-element, .draggable-element').forEach(el => {
            el.classList.remove('selected', 'selected-active');
        });
        this.clearSelectionHandles();
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('selected', 'selected-active');
            this.selectedElement = id;
            this.showDeleteHandle(el);
            this.showProperties(id);
            this.handleElementSelection(el);
        } else {
            this.selectedElement = null;
            this.hideTextToolbar();
        }
    }

    getSelectedElementDom() {
        if (!this.selectedElement) return null;
        return document.getElementById(this.selectedElement);
    }

    getEditableTextNode(element = null) {
        const root = element || this.getSelectedElementDom();
        if (!root) return null;
        const contentWrap = root.querySelector('.element-content');
        if (!contentWrap) return root;

        const textNode = contentWrap.querySelector('h1, h2, h3, h4, p, span, div, button, a, li, blockquote');
        return textNode || contentWrap;
    }

    isTextElement(element = null) {
        const root = element || this.getSelectedElementDom();
        if (!root) return false;

        const type = root.dataset.type || '';
        if (['heading', 'text'].includes(type)) return true;

        const textNode = this.getEditableTextNode(root);
        if (!textNode || textNode === root) return false;

        const tag = textNode.tagName.toUpperCase();
        return ['H1', 'H2', 'H3', 'H4', 'P', 'SPAN', 'DIV', 'BUTTON', 'A', 'LI', 'BLOCKQUOTE'].includes(tag);
    }

    hideTextToolbar() {
        const toolbar = document.getElementById('text-formatting-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
            toolbar.style.left = '';
            toolbar.style.top = '';
        }
    }

    syncTextToolbarState() {
        const toolbar = document.getElementById('text-formatting-toolbar');
        if (!toolbar || toolbar.classList.contains('hidden')) return;

        const target = this.getEditableTextNode();
        if (!target) return;

        const currentFont = target.style.fontFamily || 'Arial';
        const fontSelect = toolbar.querySelector('.toolbar-select');
        const sizeInput = toolbar.querySelector('.toolbar-input');
        const colorInput = toolbar.querySelector('.toolbar-color');

        if (fontSelect) fontSelect.value = currentFont;
        if (sizeInput) sizeInput.value = parseInt(target.style.fontSize || '16', 10) || 16;
        if (colorInput) colorInput.value = target.style.color || '#000000';
    }

    positionTextToolbar(element = null) {
        const toolbar = document.getElementById('text-formatting-toolbar');
        const root = element || this.getSelectedElementDom();
        const workspace = document.getElementById('workspace');
        if (!toolbar || !root || !workspace) return;

        const rect = root.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        const left = Math.max(12, rect.left - workspaceRect.left + 12);
        const top = Math.max(12, rect.top - workspaceRect.top - 56);

        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
        toolbar.classList.remove('hidden');
        this.syncTextToolbarState();
    }

    setupGlobalDragListeners() {
        // 1. الاستماع لحركة الماوس على مستوى الشاشة بالكامل لحساب فرق المسافة (Delta)
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.currentTargetElement) return;

            // حساب المسافة الفلكية الفردية اللي الماوس تحركها فعلياً من وقت الضغط
            const deltaX = e.clientX - this.startMouseX;
            const deltaY = e.clientY - this.startMouseY;

            // مكان العنصر الجديد = مكانه الأصلي لحظة الضغط + المسافة الفعليه للماوس
            let newLeft = this.startElementLeft + deltaX;
            let newTop = this.startElementTop + deltaY;

            // جلب الأب المباشر لضمان عدم خروج العنصر بره أبعاد لوحة الرسم (800x600)
            const parent = this.currentTargetElement.parentElement;
            if (parent) {
                const maxLeft = parent.clientWidth - this.currentTargetElement.offsetWidth;
                const maxTop = parent.clientHeight - this.currentTargetElement.offsetHeight;

                // منع العنصر من الخروج بره حدود اللوحة نهائياً لشغل احترافي
                if (newLeft < 0) newLeft = 0;
                if (newTop < 0) newTop = 0;
                if (newLeft > maxLeft) newLeft = maxLeft;
                if (newTop > maxTop) newTop = maxTop;
            }

            // تطبيق الإحداثيات فوراً بالبكسل في أي مكان بالشاشة الحرة
            this.currentTargetElement.style.left = newLeft + 'px';
            this.currentTargetElement.style.top = newTop + 'px';
        });

        // 2. إنهاء عملية السحب تماماً عند رفع اليد عن الماوس
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.currentTargetElement = null;
                this.saveHistory(); // حفظ الخطوة في الـ Undo/Redo
            }
        });
    }

    // وتأكد أن دالة تشغيل السحب للعناصر (makeElementDraggable) مضبوطة لتربط مع المتغيرات دي كالتالي:
    makeElementDraggable(element) {
        element.style.position = 'absolute';
        element.style.cursor = 'move';

        element.addEventListener('mousedown', (e) => {
            // تجاهل السحب لو المستخدم بيضغط على أزرار التحكم (مسح / تعديل)
            if (e.target.closest('.element-actions')) return;

            e.preventDefault();
            e.stopPropagation();

            this.isDragging = true;
            this.currentTargetElement = element;

            // تسجيل الإحداثيات الحالية بالظبط لحظة النقر
            this.startMouseX = e.clientX;
            this.startMouseY = e.clientY;

            // قراءة مكان العنصر الحالي بالـ Pixel من الـ style
            this.startElementLeft = parseInt(element.style.left) || 0;
            this.startElementTop = parseInt(element.style.top) || 0;

            // تحديد العنصر نشط (الإطار الأزرق)
            document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected-active'));
            element.classList.add('selected-active');
        });
    }

    setupCanvasClick() {
        const canvas = document.getElementById('canvas');
        if (!canvas) return;
        canvas.addEventListener('click', (e) => {
            if (e.target.id === 'canvas' || e.target.id === 'placeholder') {
                document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
                this.clearSelectionHandles();
                this.selectedElement = null;
                this.showEmptyProperties();
                this.hideTextToolbar();
            }
        });
    }

    applyTextStyle(property, value) {
        const target = this.getEditableTextNode();
        if (!target) return;

        target.style[property] = value;
        this.syncTextToolbarState();
        this.saveHistory();
    }

    toggleTextFormat(formatType) {
        const target = this.getEditableTextNode();
        if (!target) return;

        if (formatType === 'bold') {
            target.style.fontWeight = target.style.fontWeight === 'bold' ? 'normal' : 'bold';
        } else if (formatType === 'italic') {
            target.style.fontStyle = target.style.fontStyle === 'italic' ? 'normal' : 'italic';
        } else if (formatType === 'underline') {
            target.style.textDecoration = target.style.textDecoration === 'underline' ? 'none' : 'underline';
        }

        this.syncTextToolbarState();
        this.saveHistory();
    }

    handleElementSelection(element) {
        const node = element instanceof HTMLElement ? element : document.getElementById(element);
        if (!node) {
            this.hideTextToolbar();
            return;
        }

        this.selectedElement = node.id;
        const toolbar = document.getElementById('text-formatting-toolbar');
        if (!toolbar) return;

        if (this.isTextElement(node)) {
            this.positionTextToolbar(node);
        } else {
            this.hideTextToolbar();
        }
    }

    renderImageProperties(selectedElement) {
        const currentSrc = selectedElement.querySelector('img') ? selectedElement.querySelector('img').src : '';

        return `
            <div class="property-group">
                <label><i class="fas fa-link"></i> Image Source (URL)</label>
                <input type="text" id="img-src-input" class="property-input"
                       value="${currentSrc}"
                       placeholder="https://example.com/image.jpg"
                       oninput="editor.updateImageSrcFromURL(this.value)">
            </div>

            <div class="property-separator">OR</div>

            <div class="property-group">
                <label><i class="fas fa-folder-open"></i> Choose from Assets</label>
                <button class="btn-select-asset" onclick="editor.openAssetsSelector()">
                    <i class="fas fa-images"></i> Select from Media Library
                </button>
            </div>

            <div id="mini-assets-picker" class="mini-picker hidden"></div>
        `;
    }

    openAssetsSelector() {
        const pickerContainer = document.getElementById('mini-assets-picker');
        if (!pickerContainer) return;

        if (!this.assets || this.assets.filter(a => a.type === 'image').length === 0) {
            pickerContainer.innerHTML = '<p style="font-size:12px; color:#888; padding:10px;">No images uploaded in Assets yet!</p>';
            pickerContainer.classList.remove('hidden');
            return;
        }

        const imagesHTML = this.assets
            .filter(asset => asset.type === 'image')
            .map(asset => `
                <div class="mini-asset-thumb" onclick="editor.selectAssetForImage('${asset.url}')">
                    <img src="${asset.url}" title="${asset.name}">
                </div>
            `).join('');

        pickerContainer.innerHTML = `
            <div class="mini-picker-header">Click an image to apply:</div>
            <div class="mini-picker-grid">${imagesHTML}</div>
        `;

        pickerContainer.classList.toggle('hidden');
    }

    selectAssetForImage(url) {
        if (!this.selectedElement) return;

        const selected = document.getElementById(this.selectedElement);
        if (!selected) return;

        const imgTag = selected.querySelector('img');
        if (imgTag) {
            imgTag.src = url;
        }

        const srcInput = document.getElementById('img-src-input');
        if (srcInput) {
            srcInput.value = url;
        }

        const picker = document.getElementById('mini-assets-picker');
        if (picker) {
            picker.classList.add('hidden');
        }
    }

    updateImageSrcFromURL(url) {
        if (!this.selectedElement) return;

        const selected = document.getElementById(this.selectedElement);
        if (!selected) return;

        const imgTag = selected.querySelector('img');
        if (imgTag) {
            imgTag.src = url;
            this.saveHistory();
        }
    }

    renderIconProperties(selectedElement) {
        const popularIcons = [
            { class: 'fas fa-heart', name: 'Heart' },
            { class: 'fas fa-star', name: 'Star' },
            { class: 'fas fa-smile', name: 'Smile' },
            { class: 'fas fa-thumbs-up', name: 'Like' },
            { class: 'fas fa-shopping-cart', name: 'Cart' },
            { class: 'fas fa-user', name: 'User' },
            { class: 'fas fa-home', name: 'Home' },
            { class: 'fas fa-cog', name: 'Settings' },
            { class: 'fas fa-bell', name: 'Bell' },
            { class: 'fas fa-fire', name: 'Fire' },
            { class: 'fas fa-rocket', name: 'Rocket' },
            { class: 'fas fa-gift', name: 'Gift' }
        ];

        const quickIconsHTML = popularIcons.map(icon => `
            <div class="icon-picker-item" onclick="editor.selectIconForCanvas('${icon.class}')" title="${icon.name}">
                <i class="${icon.class}"></i>
            </div>
        `).join('');

        return `
            <div class="property-group">
                <label><i class="fas fa-search"></i> Search Icons & Graphics</label>
                <div class="search-box-wrapper">
                    <input type="text" id="icon-search-input" class="property-input"
                           placeholder="Type to search (e.g., phone, car, arrow)..."
                           oninput="editor.searchIcons(this.value)">
                </div>
            </div>

            <div id="search-results-container" class="search-results-grid hidden"></div>

            <div class="property-separator">Popular Graphics & Shapes</div>

            <div class="icon-picker-grid">
                ${quickIconsHTML}
            </div>

            <div class="property-separator">Icon Styling</div>
            <div class="property-group inline-properties">
                <div>
                    <label>Color</label>
                    <input type="color" id="icon-color-picker" value="#3b82f6" oninput="editor.updateIconStyle('color', this.value)">
                </div>
                <div>
                    <label>Size (px)</label>
                    <input type="number" id="icon-size-picker" value="40" min="10" max="200" oninput="editor.updateIconStyle('fontSize', this.value + 'px')">
                </div>
            </div>
        `;
    }

    searchIcons(query) {
        const resultsContainer = document.getElementById('search-results-container');
        if (!resultsContainer) return;

        if (!query || query.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }

        const allIconsLibrary = [
            { class: 'fas fa-phone', tags: 'phone mobile call ring' },
            { class: 'fas fa-envelope', tags: 'mail envelope letter message' },
            { class: 'fas fa-camera', tags: 'camera photo picture lens' },
            { class: 'fas fa-car', tags: 'car vehicle drive transport' },
            { class: 'fas fa-arrow-right', tags: 'arrow right next forward' },
            { class: 'fas fa-arrow-left', tags: 'arrow left back return' },
            { class: 'fas fa-check', tags: 'check tick correct success done' },
            { class: 'fas fa-times', tags: 'times close delete remove wrong' },
            { class: 'fas fa-info-circle', tags: 'info help about detail' },
            { class: 'fas fa-exclamation-triangle', tags: 'warning alert danger error' },
            { class: 'fas fa-lock', tags: 'lock secure private password' },
            { class: 'fas fa-unlock', tags: 'unlock open safe public' }
        ];

        const filtered = allIconsLibrary.filter(icon => icon.tags.includes(query.toLowerCase()));

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p style="grid-column: span 4; font-size:12px; color:#666; text-align:center;">No shapes found</p>';
            resultsContainer.classList.remove('hidden');
            return;
        }

        resultsContainer.innerHTML = filtered.map(icon => `
            <div class="icon-picker-item search-result-item" onclick="editor.selectIconForCanvas('${icon.class}')">
                <i class="${icon.class}"></i>
            </div>
        `).join('');

        resultsContainer.classList.remove('hidden');
    }

    selectIconForCanvas(iconClass) {
        if (!this.selectedElement) return;

        const selected = document.getElementById(this.selectedElement);
        if (!selected) return;

        const iconTag = selected.querySelector('i');
        if (iconTag) {
            iconTag.className = iconClass;
            this.saveHistory();
        }
    }

    updateIconStyle(property, value) {
        if (!this.selectedElement) return;

        const selected = document.getElementById(this.selectedElement);
        if (!selected) return;

        const iconTag = selected.querySelector('i');
        if (iconTag) {
            iconTag.style[property] = value;
            this.saveHistory();
        }
    }

    showProperties(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const type = el.dataset.type;
        const lang = el.dataset.lang;
        const innerEl = el.querySelector('.element-content > *');
        const currentText = innerEl ? (innerEl.textContent || innerEl.innerText || '') : '';
        const imageProperties = type === 'image' ? this.renderImageProperties(el) : '';
        const iconProperties = type === 'icon' ? this.renderIconProperties(el) : '';
        const textToolbar = this.isTextElement(el) ? `
            <div class="prop-group">
                <div class="prop-group-title">Text Formatting</div>
                <div class="property-toolbar">
                    <select onchange="editor.applyTextStyle('fontFamily', this.value)" class="prop-select compact">
                        <option value="Arial">Arial</option>
                        <option value="'Courier New'">Courier New</option>
                        <option value="'Times New Roman'">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Tahoma">Tahoma</option>
                    </select>
                    <input type="number" value="16" min="8" max="100" onchange="editor.applyTextStyle('fontSize', this.value + 'px')" class="prop-input prop-size-input">
                    <div class="property-toolbar-group">
                        <button class="format-btn" onclick="editor.toggleTextFormat('bold')" title="Bold"><i class="fas fa-bold"></i></button>
                        <button class="format-btn" onclick="editor.toggleTextFormat('italic')" title="Italic"><i class="fas fa-italic"></i></button>
                        <button class="format-btn" onclick="editor.toggleTextFormat('underline')" title="Underline"><i class="fas fa-underline"></i></button>
                    </div>
                    <div class="property-toolbar-group">
                        <button class="format-btn" onclick="editor.applyTextStyle('textAlign', 'left')" title="Align Left"><i class="fas fa-align-left"></i></button>
                        <button class="format-btn" onclick="editor.applyTextStyle('textAlign', 'center')" title="Align Center"><i class="fas fa-align-center"></i></button>
                        <button class="format-btn" onclick="editor.applyTextStyle('textAlign', 'right')" title="Align Right"><i class="fas fa-align-right"></i></button>
                    </div>
                    <div class="property-toolbar-group color-group">
                        <label class="color-label"><i class="fas fa-font"></i></label>
                        <input type="color" class="color-input" oninput="editor.applyTextStyle('color', this.value)">
                    </div>
                </div>
            </div>
        ` : '';
        document.getElementById('panelContent').innerHTML = `
            <div class="prop-group">
                <div class="prop-group-title">Element Info</div>
                <div class="prop-row"><span class="prop-label">Type</span><input class="prop-input" value="${type}" readonly></div>
                <div class="prop-row"><span class="prop-label">ID</span><input class="prop-input" value="${id}" readonly></div>
            </div>
            <div class="prop-group">
                <div class="prop-group-title">Content</div>
                <div class="prop-row" style="flex-direction:column;align-items:stretch;gap:4px">
                    <span class="prop-label" style="min-width:auto">Text Content</span>
                    <textarea class="prop-textarea" oninput="editor.updateTextContent('${id}',this.value)">${currentText}</textarea>
                </div>
            </div>
            ${textToolbar}
            ${imageProperties}
            ${iconProperties}
            <div class="prop-group">
                <div class="prop-group-title">Actions</div>
                <button class="btn" style="width:100%;margin-bottom:8px;justify-content:center" onclick="editor.editElement('${id}')">
                    <i class="fas fa-code"></i> Open Editor
                </button>
                <button class="btn" style="width:100%;justify-content:center;color:var(--accent-red)" onclick="editor.deleteElement('${id}')">
                    <i class="fas fa-trash"></i> Delete Element
                </button>
            </div>
        `;
    }

    showEmptyProperties() {
        const panel = document.getElementById('panelContent');
        if (!panel) return;
        panel.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mouse-pointer"></i>
                <h3>No Element Selected</h3>
                <p>Select an element on the canvas to edit its properties</p>
            </div>
        `;
    }

    switchPanel(tab, el) {
        document.querySelectorAll('.right-panel .panel-tab').forEach(item => item.classList.remove('active'));
        if (el) el.classList.add('active');

        if (tab === 'properties') {
            if (this.selectedElement) {
                this.showProperties(this.selectedElement);
            } else {
                this.showEmptyProperties();
            }
        } else if (tab === 'layers') {
            const panel = document.getElementById('panelContent');
            if (!panel) return;
            panel.innerHTML = this.renderLayersPanel();
        } else if (tab === 'pro') {
            this.renderProLayerFiltersPanel();
        }
    }

    renderProLayerFiltersPanel() {
        const panel = document.getElementById('panelContent');
        if (!panel) return;

        panel.innerHTML = `
            <div class="pro-3in1-suite" style="display:flex; flex-direction:column; gap:16px; padding:15px; color:#cbd5e1;">
                <div class="tool-section" style="background:#1e1e2e; padding:12px; border-radius:8px; border:1px solid #2e2e3e;">
                    <label style="font-size:11px; color:#a855f7; display:block; margin-bottom:10px; font-weight:bold; text-transform:uppercase;">🗂️ Pro Layers Manager</label>
                    <div id="proLayersList" style="display:flex; flex-direction:column; gap:6px; max-height:150px; overflow-y:auto; padding-right:4px;"></div>
                </div>

                <div class="tool-section" style="background:#1e1e2e; padding:12px; border-radius:8px; border:1px solid #2e2e3e;">
                    <label style="font-size:11px; color:#ec4899; display:block; margin-bottom:10px; font-weight:bold; text-transform:uppercase;">🎨 AI Studio Image Filters</label>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
                        <button onclick="editor.applyProFilter('none')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Original</button>
                        <button onclick="editor.applyProFilter('cyberpunk')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Cyberpunk</button>
                        <button onclick="editor.applyProFilter('vintage')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Vintage</button>
                        <button onclick="editor.applyProFilter('b&w')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">B&W Pro</button>
                        <button onclick="editor.applyProFilter('cinematic')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Cinematic</button>
                        <button onclick="editor.applyProFilter('warm')" style="background:#2e2e3e; color:#fff; border:none; padding:6px; border-radius:4px; font-size:10px; cursor:pointer;">Glow Warm</button>
                    </div>
                </div>

                <div class="tool-section" style="background:#1e1e2e; padding:12px; border-radius:8px; border:1px solid #2e2e3e;">
                    <label style="font-size:11px; color:#10b981; display:block; margin-bottom:10px; font-weight:bold; text-transform:uppercase;">💾 Studio Export Options (Ultra HQ)</label>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button onclick="editor.exportUltraHQ('png')" style="width:100%; background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fas fa-file-image"></i> Export 4K PNG Image
                        </button>
                        <button onclick="editor.exportUltraHQ('pdf')" style="width:100%; background:#2e2e3e; color:#fff; border:1px solid #475569; padding:10px; border-radius:6px; font-weight:bold; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fas fa-file-pdf" style="color:#ef4444;"></i> Export Press-Ready PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.refreshLayersPanel();
    }

    refreshLayersPanel() {
        const layersContainer = document.getElementById('proLayersList');
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!layersContainer || !workspace) return;

        layersContainer.innerHTML = '';
        const elements = workspace.querySelectorAll('.scalable-element, .free-element, [id^="asset_"], [id^="t_"]');

        if (elements.length === 0) {
            layersContainer.innerHTML = `<div style="font-size:10px; color:#64748b; text-align:center; padding:10px;">No layers created yet.</div>`;
            return;
        }

        elements.forEach((el, index) => {
            const elId = el.id || `layer_${index}`;
            el.id = elId;

            const layerRow = document.createElement('div');
            layerRow.style.cssText = "display:flex; align-items:center; justify-content:space-between; background:#2e2e3e; padding:6px 10px; border-radius:6px; font-size:11px; color:#fff; gap:8px;";
            layerRow.innerHTML = `
                <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📄 Layer ${index + 1} (${el.tagName.toLowerCase()})</span>
                <div style="display:flex; gap:6px;">
                    <button onclick="editor.toggleLayerVisibility('${elId}', this)" style="background:transparent; border:none; color:#cbd5e1; cursor:pointer;"><i class="fas fa-eye"></i></button>
                    <button onclick="editor.toggleLayerLock('${elId}', this)" style="background:transparent; border:none; color:#cbd5e1; cursor:pointer;"><i class="fas fa-lock-open"></i></button>
                </div>
            `;
            layersContainer.appendChild(layerRow);
        });
    }

    toggleLayerVisibility(id, btn) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.style.display === 'none') {
            el.style.display = 'block';
            btn.innerHTML = `<i class="fas fa-eye"></i>`;
        } else {
            el.style.display = 'none';
            btn.innerHTML = `<i class="fas fa-eye-slash" style="color:#64748b;"></i>`;
        }
    }

    toggleLayerLock(id, btn) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.getAttribute('data-locked') === 'true') {
            el.setAttribute('data-locked', 'false');
            el.style.pointerEvents = 'auto';
            btn.innerHTML = `<i class="fas fa-lock-open"></i>`;
        } else {
            el.setAttribute('data-locked', 'true');
            el.style.pointerEvents = 'none';
            btn.innerHTML = `<i class="fas fa-lock" style="color:#f59e0b;"></i>`;
        }
    }

    applyProFilter(filterType) {
        if (!this.selectedElement) {
            alert("💡 اختر صورة أو عنصراً من مساحة العمل أولاً لتطبيق الفلاتر الذكية!");
            return;
        }
        const el = document.getElementById(this.selectedElement);
        if (!el) return;
        const target = el.querySelector('img') || el;

        const filters = {
            none: 'none',
            cyberpunk: 'hue-rotate(90deg) saturate(200%) contrast(120%)',
            vintage: 'sepia(50%) contrast(85%) brightness(95%)',
            'b&w': 'grayscale(100%) contrast(140%)',
            cinematic: 'contrast(115%) brightness(90%) saturate(130%)',
            warm: 'saturate(160%) sepia(20%) brightness(105%)'
        };

        target.style.filter = filters[filterType] || 'none';
        if (typeof this.showMagicToast === 'function') this.showMagicToast(`🎨 Applied ${filterType} AI filter!`);
    }

    exportUltraHQ(format) {
        const workspace = document.getElementById('workspace') || document.querySelector('.workspace-content');
        if (!workspace) return;

        if (typeof this.showMagicToast === 'function') this.showMagicToast("🚀 Generating Ultra High-Quality Master File...");

        html2canvas(workspace, {
            scale: 4,
            useCORS: true,
            backgroundColor: null
        }).then(canvas => {
            if (format === 'png') {
                const imageURI = canvas.toDataURL("image/png");
                const link = document.createElement('a');
                link.download = `TecnoBrain_4K_Master_${Date.now()}.png`;
                link.href = imageURI;
                link.click();
                if (typeof this.showMagicToast === 'function') this.showMagicToast("💎 4K Ultra PNG Downloaded!");
            } else if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const newWindow = window.open('', '_blank');
                if (!newWindow) return;
                newWindow.document.write(`
                    <body style="margin:0; display:flex; align-items:center; justify-content:center; background:#111;">
                        <img src="${imgData}" style="max-width:100%; height:auto; box-shadow:0 10px 30px rgba(0,0,0,0.5); border-radius:4px;">
                        <script>window.print();</script>
                    </body>
                `);
                if (typeof this.showMagicToast === 'function') this.showMagicToast("💎 Press-Ready Print PDF Opened!");
            }
        });
    }

    launchPickr() {
        if (!window.Toolkit || !Toolkit.initPickr) {
            alert('Pickr library is not loaded.');
            return;
        }
        const existing = document.querySelector('.pickr');
        if (existing) {
            existing.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        const pickerBtn = document.createElement('button');
        pickerBtn.className = 'btn';
        pickerBtn.style.width = '100%';
        pickerBtn.textContent = 'Open Color Picker';
        document.body.appendChild(pickerBtn);
        Toolkit.initPickr(pickerBtn);
    }

    launchCropper() {
        if (!window.Cropper) {
            alert('Cropper.js library is not loaded.');
            return;
        }
        const img = this.getSelectedElementDom()?.querySelector('img');
        if (!img) {
            alert('Please select an image element first.');
            return;
        }
        const cropperModal = document.createElement('div');
        cropperModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:2000;';
        cropperModal.innerHTML = `
            <div style="background:#111; padding:18px; border-radius:14px; width:min(95vw,760px); max-height:90vh; overflow:auto;">
                <h3 style="color:#fff;margin:0 0 12px 0;">Crop Image</h3>
                <img id="cropperTarget" src="${img.src}" style="max-width:100%; display:block; border-radius:10px;">
                <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
                    <button id="cropperSaveBtn" class="btn">Save Crop</button>
                    <button id="cropperCancelBtn" class="btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(cropperModal);
        const cropperImage = cropperModal.querySelector('#cropperTarget');
        const cropper = new Cropper(cropperImage, { viewMode: 1, aspectRatio: NaN, autoCropArea: 0.8 });
        cropperModal.querySelector('#cropperSaveBtn').onclick = () => {
            const canvas = cropper.getCroppedCanvas({ width: 800, imageSmoothingQuality: 'high' });
            img.src = canvas.toDataURL('image/png');
            cropper.destroy();
            cropperModal.remove();
            this.saveHistory();
        };
        cropperModal.querySelector('#cropperCancelBtn').onclick = () => {
            cropper.destroy();
            cropperModal.remove();
        };
    }

    applyCamanFilter(filterName) {
        if (!window.Caman) {
            alert('CamanJS library is not loaded.');
            return;
        }
        const img = this.getSelectedElementDom()?.querySelector('img');
        if (!img) {
            alert('Please select an image element first.');
            return;
        }
        Caman(img, function () {
            if (filterName === 'vintage') this.vintage().render();
            else if (filterName === 'lomo') this.lomo().render();
            else if (filterName === 'clarity') this.clarity().render();
            else this.render();
        });
    }

    insert3DCube() {
        if (!window.Toolkit || !Toolkit.create3DCube) {
            alert('Three.js or helper is not available.');
            return;
        }
        const canvas = document.getElementById('workspace');
        if (!canvas) return;
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute; left:60px; top:60px; width:200px; height:200px; border-radius:16px; overflow:hidden; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);';
        container.id = `three_cube_${Date.now()}`;
        canvas.appendChild(container);
        this.makeElementDraggable(container);
        Toolkit.create3DCube(container);
    }

    insertGridTable() {
        if (!window.Toolkit || !Toolkit.initGridSample) {
            alert('Grid.js library is not loaded.');
            return;
        }
        const panel = document.createElement('div');
        panel.id = `gridjs_table_${Date.now()}`;
        panel.style.cssText = 'position:absolute; left:50px; top:50px; width:360px; min-height:200px; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:12px;';
        document.getElementById('workspace')?.appendChild(panel);
        this.makeElementDraggable(panel);
        Toolkit.initGridSample(panel.id);
    }

    openFilerobotEditor() {
        if (!window.Toolkit || !Toolkit.openFilerobotEditor) {
            alert('Filerobot library is not loaded.');
            return;
        }
        Toolkit.openFilerobotEditor();
    }

    animateSelectedElement() {
        const el = this.getSelectedElementDom();
        if (!el) {
            alert('Select an element first.');
            return;
        }
        if (!window.Toolkit || !Toolkit.animateFrom) {
            alert('GSAP library is not loaded.');
            return;
        }
        el.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => el.classList.remove('animate__animated', 'animate__pulse'), 900);
    }

    captureWorkspaceScreenshot() {
        const workspace = document.getElementById('workspace');
        if (!workspace) return;
        if (!window.html2canvas) {
            alert('html2canvas not loaded.');
            return;
        }
        html2canvas(workspace, { useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `workspace_capture_${Date.now()}.png`;
            link.click();
        });
    }

    importLibrary(libName) {
        const mapping = {
            jquery: {
                type: 'script',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js'
            },
            bootstrap: {
                type: 'both',
                url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js',
                css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css'
            },
            tailwind: {
                type: 'css',
                css: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.4/dist/tailwind.min.css'
            },
            fontawesome: {
                type: 'css',
                css: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
            },
            react: {
                type: 'script',
                url: 'https://unpkg.com/react@18/umd/react.production.min.js'
            },
            'react-dom': {
                type: 'script',
                url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
            }
        };

        const entry = mapping[libName];
        if (!entry) {
            const target = document.getElementById('installed-libraries-list');
            if (target) {
                const li = document.createElement('li');
                li.innerHTML = `<i class="fas fa-check-circle" style="color:yellow"></i> ${libName} is not supported for browser import.`;
                target.appendChild(li);
            }
            alert(`${libName} is not available for direct browser import.`);
            return;
        }

        const inject = (src, isCss = false) => {
            if (isCss) {
                if ([...document.styleSheets].some(sheet => sheet.href && sheet.href.includes(src))) return;
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = src;
                document.head.appendChild(link);
                return;
            }
            if ([...document.scripts].some(script => script.src && script.src.includes(src))) return;
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            document.body.appendChild(script);
        };

        if (entry.css) inject(entry.css, true);
        if (entry.url) inject(entry.url, false);

        const target = document.getElementById('installed-libraries-list');
        if (target) {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle" style="color:#22c55e;"></i> ${libName} imported successfully.`;
            target.appendChild(li);
        }
    }

    editElement(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const content = el.querySelector('.element-content').innerHTML;
        this.currentEditingElement = id;
        this.openModal('component', el.dataset.lang, content);
    }

    openModal(type, lang, content) {
        const modal = document.getElementById('codeModal');
        const textarea = document.getElementById('codeTextarea');
        if (!modal || !textarea) return;
        this.currentModalLang = lang || 'html';
        textarea.value = content || '';
        modal.classList.add('active');
        textarea.focus();
    }

    closeModal() {
        const modal = document.getElementById('codeModal');
        if (!modal) return;
        modal.classList.remove('active');
        this.currentEditingElement = null;
    }

    saveCode() {
        const code = document.getElementById('codeTextarea').value;
        if (this.currentEditingElement) {
            const el = document.getElementById(this.currentEditingElement);
            if (el) el.querySelector('.element-content').innerHTML = code;
            const stored = this.elements.find(e => e.id === this.currentEditingElement);
            if (stored) stored.content = code;
            this.saveHistory();
        }
        this.closeModal();
    }

    updateTextContent(id, text) {
        const el = document.getElementById(id);
        if (!el) return;
        const inner = el.querySelector('.element-content > *');
        if (inner) inner.textContent = text;
        const stored = this.elements.find(e => e.id === id);
        if (stored) stored.content = el.querySelector('.element-content').innerHTML;
    }

    deleteElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
        this.elements = this.elements.filter(e => e.id !== id);
        this.clearSelectionHandles();
        this.selectedElement = null;
        this.saveHistory();
        this.showEmptyProperties();
    }

    moveUp(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const prev = el.previousElementSibling;
        if (prev) el.parentNode.insertBefore(el, prev);
        this.saveHistory();
    }

    moveDown(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const next = el.nextElementSibling;
        if (next) el.parentNode.insertBefore(next, el);
        this.saveHistory();
    }

    insertCodeSnippet(lang, type) {
        const snippet = this.getDefaultSnippet(lang, type);
        this.openModal('standalone', lang, snippet);
    }

    getDefaultSnippet(lang, type) {
        const snippets = {
            python: { hello: '# Hello World\nprint("Hello, World!")' },
            java: { hello: 'public class Hello { public static void main(String[] args) { System.out.println("Hello, World!"); } }' },
            html: { hello: '<div class="hello">\n  <h1>Hello World</h1>\n  <p>Welcome to my website!</p>\n</div>' }
        };
        return (snippets[lang] && snippets[lang][type]) || '';
    }

    // ===== PROJECT ACTIONS: SAVE / PREVIEW / PUBLISH =====
    saveProject() {
        try {
            const nameEl = document.querySelector('.project-name');
            const name = nameEl ? nameEl.textContent.trim() : 'Untitled Project';
            const canvasHtml = document.getElementById('canvas') ? document.getElementById('canvas').innerHTML : '';
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            const id = this.currentProjectId || Date.now();

            const existing = projects.find(p => String(p.id) === String(id));
            const projectData = {
                id: id,
                name: name,
                description: (existing && existing.description) || '',
                content: canvasHtml,
                status: 'draft',
                startDate: (existing && existing.startDate) || new Date().toISOString().split('T')[0]
            };

            if (existing) {
                Object.assign(existing, projectData);
            } else {
                projects.push(projectData);
            }

            localStorage.setItem('projects', JSON.stringify(projects));
            this.currentProjectId = id;
            this.updateStatus('Project saved');
        } catch (err) {
            console.error(err);
            this.updateStatus('Save failed');
        }
    }

    previewProject() {
        const canvasHtml = document.getElementById('canvas') ? document.getElementById('canvas').innerHTML : '';
        const nameEl = document.querySelector('.project-name');
        const title = nameEl ? nameEl.textContent.trim() : 'Preview';

        const existingModal = document.getElementById('editor-preview-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'editor-preview-modal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(2, 6, 23, 0.86); display:flex; align-items:center; justify-content:center; z-index:99999; padding:24px;';
        modal.innerHTML = `
            <div style="width:min(95vw, 1100px); height:min(90vh, 820px); background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.35); display:flex; flex-direction:column;">
                <div style="background:#111827; color:#fff; padding:12px 16px; display:flex; align-items:center; justify-content:space-between;">
                    <div>
                        <div style="font-weight:700; font-size:14px;">${title}</div>
                        <div style="font-size:11px; color:#94a3b8;">Live preview inside the editor</div>
                    </div>
                    <button type="button" id="preview-close-btn" style="border:none; background:#ef4444; color:#fff; width:32px; height:32px; border-radius:999px; cursor:pointer; font-size:14px;">×</button>
                </div>
                <iframe id="editor-preview-frame" style="flex:1; width:100%; border:0; background:#fff;"></iframe>
            </div>
        `;

        document.body.appendChild(modal);

        const frame = modal.querySelector('#editor-preview-frame');
        const previewHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;padding:0;background:#fff;font-family:Inter,Arial,sans-serif;}</style></head><body>${canvasHtml}</body></html>`;
        frame.srcdoc = previewHtml;

        modal.querySelector('#preview-close-btn').onclick = () => modal.remove();
        modal.addEventListener('click', (event) => {
            if (event.target === modal) modal.remove();
        });

        this.updateStatus('Preview opened');
    }

    publishProject() {
        this.saveProject();
        try {
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            const id = this.currentProjectId;
            const existing = projects.find(p => String(p.id) === String(id));
            if (existing) {
                existing.status = 'published';
                existing.publishedAt = new Date().toISOString();
            }
            localStorage.setItem('projects', JSON.stringify(projects));
            this.updateStatus('Project published');
            window.location.href = 'visitor.html';
        } catch (err) {
            console.error(err);
            this.updateStatus('Publish failed');
        }
    }

    updateStatus(msg) {
        const status = document.getElementById('status');
        if (status) status.textContent = msg;
    }

}

if (typeof window !== 'undefined') {
    window.editor = new TecnoBrainEditor();
}
