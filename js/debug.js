/**
 * On-Screen Debug Console for iPad
 * Shows logs, errors, and system info on screen for devices without inspect
 */

class OnScreenDebugger {
    constructor() {
        this.logs = [];
        this.maxLogs = 50;
        this.isVisible = true;
        this.isMinimized = false;
        
        this.init();
        this.hijackConsole();
        this.monitorErrors();
        
        // Auto-log initial info
        this.logSystemInfo();
    }
    
    init() {
        // Create debug panel
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.innerHTML = `
            <div class="debug-header">
                <span class="debug-title">🐛 Debug Console</span>
                <div class="debug-controls">
                    <button id="debugMinimize" class="debug-btn">_</button>
                    <button id="debugClear" class="debug-btn">Clear</button>
                    <button id="debugToggle" class="debug-btn">Hide</button>
                </div>
            </div>
            <div id="debugContent" class="debug-content"></div>
            <div class="debug-footer">
                <span id="debugCount">0 logs</span>
                <span id="debugCache">Cache: --</span>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #debugPanel {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                max-height: 40vh;
                background: rgba(0, 0, 0, 0.95);
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                z-index: 99999;
                border-top: 2px solid #00ff00;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
            }
            
            #debugPanel.minimized {
                max-height: 40px;
            }
            
            #debugPanel.hidden {
                display: none;
            }
            
            .debug-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(0, 255, 0, 0.1);
                border-bottom: 1px solid #00ff00;
            }
            
            .debug-title {
                font-weight: bold;
                font-size: 13px;
            }
            
            .debug-controls {
                display: flex;
                gap: 8px;
            }
            
            .debug-btn {
                background: rgba(0, 255, 0, 0.2);
                color: #00ff00;
                border: 1px solid #00ff00;
                padding: 4px 12px;
                font-size: 11px;
                cursor: pointer;
                border-radius: 3px;
                font-family: inherit;
            }
            
            .debug-btn:active {
                background: rgba(0, 255, 0, 0.4);
            }
            
            .debug-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px 12px;
                line-height: 1.4;
            }
            
            #debugPanel.minimized .debug-content {
                display: none;
            }
            
            #debugPanel.minimized .debug-footer {
                display: none;
            }
            
            .debug-log {
                margin: 2px 0;
                padding: 4px 8px;
                border-radius: 3px;
                word-wrap: break-word;
            }
            
            .debug-log.info {
                background: rgba(0, 128, 255, 0.1);
                color: #00ccff;
            }
            
            .debug-log.success {
                background: rgba(0, 255, 0, 0.1);
                color: #00ff00;
            }
            
            .debug-log.warn {
                background: rgba(255, 165, 0, 0.1);
                color: #ffaa00;
            }
            
            .debug-log.error {
                background: rgba(255, 0, 0, 0.1);
                color: #ff4444;
                font-weight: bold;
            }
            
            .debug-footer {
                display: flex;
                justify-content: space-between;
                padding: 6px 12px;
                background: rgba(0, 255, 0, 0.05);
                border-top: 1px solid rgba(0, 255, 0, 0.3);
                font-size: 10px;
            }
            
            .debug-timestamp {
                color: #888;
                margin-right: 8px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(panel);
        
        // Event listeners
        document.getElementById('debugMinimize').addEventListener('click', () => {
            this.isMinimized = !this.isMinimized;
            panel.classList.toggle('minimized');
        });
        
        document.getElementById('debugClear').addEventListener('click', () => {
            this.clear();
        });
        
        document.getElementById('debugToggle').addEventListener('click', () => {
            this.isVisible = !this.isVisible;
            panel.classList.toggle('hidden');
        });
        
        this.panel = panel;
        this.content = document.getElementById('debugContent');
        this.countEl = document.getElementById('debugCount');
        this.cacheEl = document.getElementById('debugCache');
        
        // Update cache info every 5s
        this.updateCacheInfo();
        setInterval(() => this.updateCacheInfo(), 5000);
    }
    
    hijackConsole() {
        const self = this;
        const original = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };
        
        console.log = function(...args) {
            original.log.apply(console, args);
            self.addLog('info', args);
        };
        
        console.info = function(...args) {
            original.info.apply(console, args);
            self.addLog('info', args);
        };
        
        console.warn = function(...args) {
            original.warn.apply(console, args);
            self.addLog('warn', args);
        };
        
        console.error = function(...args) {
            original.error.apply(console, args);
            self.addLog('error', args);
        };
    }
    
    monitorErrors() {
        window.addEventListener('error', (e) => {
            this.addLog('error', [`ERROR: ${e.message}`, `at ${e.filename}:${e.lineno}`]);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.addLog('error', [`UNHANDLED PROMISE: ${e.reason}`]);
        });
    }
    
    addLog(type, args) {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        const logEntry = { type, message, timestamp };
        this.logs.push(logEntry);
        
        // Keep only last maxLogs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Render
        this.render();
    }
    
    render() {
        const html = this.logs.map(log => `
            <div class="debug-log ${log.type}">
                <span class="debug-timestamp">${log.timestamp}</span>
                ${log.message}
            </div>
        `).join('');
        
        this.content.innerHTML = html;
        this.content.scrollTop = this.content.scrollHeight;
        this.countEl.textContent = `${this.logs.length} logs`;
    }
    
    clear() {
        this.logs = [];
        this.render();
    }
    
    async updateCacheInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const {usage, quota} = await navigator.storage.estimate();
                const usageMB = (usage / 1024 / 1024).toFixed(2);
                const quotaMB = (quota / 1024 / 1024).toFixed(0);
                const percent = (usage / quota * 100).toFixed(1);
                
                this.cacheEl.textContent = `Cache: ${usageMB}MB / ${quotaMB}MB (${percent}%)`;
                
                // Warning if approaching iOS limit
                if (usage > 40 * 1024 * 1024) {
                    this.cacheEl.style.color = '#ff4444';
                } else {
                    this.cacheEl.style.color = '#00ff00';
                }
            } catch (e) {
                this.cacheEl.textContent = 'Cache: N/A';
            }
        }
    }
    
    logSystemInfo() {
        console.log('=== SYSTEM INFO ===');
        console.log(`User Agent: ${navigator.userAgent}`);
        console.log(`Platform: ${navigator.platform}`);
        console.log(`Online: ${navigator.onLine}`);
        console.log(`Standalone: ${window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches}`);
        console.log(`Screen: ${window.screen.width}x${window.screen.height}`);
        console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
        console.log(`Service Worker: ${'serviceWorker' in navigator ? 'Supported' : 'NOT SUPPORTED'}`);
        
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        console.log(`iOS Device: ${isIOS ? 'YES' : 'NO'}`);
        
        if (isIOS) {
            const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
            if (match) {
                console.log(`iOS Version: ${match[1]}.${match[2]}`);
            }
        }
        
        console.log('==================');
    }
}

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.debugger = new OnScreenDebugger();
    });
} else {
    window.debugger = new OnScreenDebugger();
}
