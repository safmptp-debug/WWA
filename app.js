if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('ServiceWorker registration failed: ', err);
    });
}

const urlInput = document.getElementById('urlInput');
const openBtn = document.getElementById('openBtn');
const recentList = document.getElementById('recentList');
const clearBtn = document.getElementById('clearBtn');
const shortcutsList = document.getElementById('shortcutsList');
const installBtn = document.getElementById('installBtn');

const STORAGE_KEY = 'wwa_recent_urls';
const MAX_RECENT = 10;

document.addEventListener('DOMContentLoaded', () => {
    loadRecent();
    setupEventListeners();
    setupInstallPrompt();
});

function setupEventListeners() {
    openBtn.addEventListener('click', openUrl);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') openUrl();
    });
    clearBtn.addEventListener('click', clearHistory);

    document.querySelectorAll('.shortcut-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            openUrlDirect(url);
        });
    });
}

function openUrl() {
    let url = urlInput.value.trim();

    if (!url) {
        alert('Please enter a URL');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    openUrlDirect(url);
}

function openUrlDirect(url) {
    try {
        new URL(url);
        addToRecent(url);
        window.open(url, '_blank');
        urlInput.value = '';
    } catch (e) {
        alert('Invalid URL');
    }
}

function addToRecent(url) {
    let recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    recent = recent.filter(item => item !== url);
    recent.unshift(url);
    recent = recent.slice(0, MAX_RECENT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    loadRecent();
}

function loadRecent() {
    const recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (recent.length === 0) {
        recentList.innerHTML = '<p class="empty-state">No recent URLs yet</p>';
        clearBtn.style.display = 'none';
        return;
    }

    clearBtn.style.display = 'block';
    recentList.innerHTML = recent.map(url => `
        <div class="recent-item">
            <a href="${url}" target="_blank" title="${url}">
                ${url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 40)}...
            </a>
            <button onclick="removeRecent('${url}')">✕</button>
        </div>
    `).join('');
}

function removeRecent(url) {
    let recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    recent = recent.filter(item => item !== url);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    loadRecent();
}

function clearHistory() {
    if (confirm('Clear all history?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadRecent();
    }
}

let deferredPrompt;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        installBtn.style.display = 'none';
    });
}

window.addEventListener('load', () => {
    urlInput.focus();
});
