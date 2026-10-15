// Copy code block to clipboard
function copyCode(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('code');
  if (!codeEl) return;
  
  const text = codeEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓';
    setTimeout(() => {
      btn.textContent = 'copy';
    }, 1500);
  }).catch((err) => {
    console.error('Failed to copy text: ', err);
  });
}

// Theme toggle
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
    } catch (e) {
      console.error('Failed to save theme in localStorage', e);
    }
  });
}

// Spotify Current Track Widget
function initSpotify() {
  const widget = document.getElementById('spotify-widget');
  if (!widget) return;

  const artEl = document.getElementById('spotify-art');
  const trackEl = document.getElementById('spotify-track');
  const artistEl = document.getElementById('spotify-artist');
  const timeEl = document.getElementById('spotify-time');
  const eqEl = document.getElementById('spotify-eq');
  const progressEl = document.getElementById('spotify-progress-bar');

  const API_URL = 'https://api.berikai.dev/spotify/current';
  const POLL_INTERVAL = 20000;

  let tickTimer = null;
  let pollTimer = null;
  let currentProgressMs = 0;
  let currentDurationMs = 0;
  let isPlaying = false;

  function formatTime(ms) {
    if (!ms || isNaN(ms)) return '0:00';
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateProgressUI() {
    if (currentDurationMs > 0) {
      const pct = Math.min(100, Math.max(0, (currentProgressMs / currentDurationMs) * 100));
      if (progressEl) progressEl.style.width = `${pct}%`;
      if (timeEl) timeEl.textContent = `${formatTime(currentProgressMs)} / ${formatTime(currentDurationMs)}`;
    } else {
      if (progressEl) progressEl.style.width = '0%';
      if (timeEl) timeEl.textContent = '';
    }
  }

  function hideWidget() {
    widget.classList.remove('is-visible');
    if (eqEl) eqEl.classList.remove('is-animating');
    clearInterval(tickTimer);
  }

  function fetchCurrentSong() {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data || data.error || !data.item || !data.is_playing) {
          hideWidget();
          return;
        }

        const item = data.item;
        isPlaying = !!data.is_playing;
        currentDurationMs = item.duration_ms || 0;
        currentProgressMs = data.progress_ms || 0;

        if (trackEl) trackEl.textContent = item.name || 'Unknown Track';
        if (artistEl) artistEl.textContent = (item.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist';

        const imgUrl = item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || '';
        if (artEl && imgUrl) {
          if (artEl.src !== imgUrl) artEl.src = imgUrl;
          artEl.alt = `${item.name} album artwork`;
        }

        const headingEl = document.getElementById('spotify-heading');
        const headingText = headingEl?.textContent?.trim() || "Eren's listening";

        const spotifyUrl = item.external_urls?.spotify || 'https://open.spotify.com';
        widget.href = spotifyUrl;
        widget.setAttribute('title', `${headingText}: "${item.name}" by ${(item.artists || []).map((a) => a.name).join(', ')} on Spotify`);
        widget.setAttribute('aria-label', `${headingText}: "${item.name}" by ${(item.artists || []).map((a) => a.name).join(', ')}`);

        updateProgressUI();

        if (eqEl) {
          eqEl.classList.toggle('is-animating', isPlaying);
        }

        widget.classList.add('is-visible');

        // Restart local second timer for smooth progress display
        clearInterval(tickTimer);
        if (isPlaying) {
          tickTimer = setInterval(() => {
            currentProgressMs += 1000;
            if (currentProgressMs >= currentDurationMs) {
              clearInterval(tickTimer);
              fetchCurrentSong();
            } else {
              updateProgressUI();
            }
          }, 1000);
        }
      })
      .catch(() => {
        hideWidget();
      });
  }

  function scheduleNextPoll() {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => {
      fetchCurrentSong();
      scheduleNextPoll();
    }, POLL_INTERVAL);
  }

  fetchCurrentSong();
  scheduleNextPoll();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(pollTimer);
      clearInterval(tickTimer);
      if (eqEl) eqEl.classList.remove('is-animating');
    } else {
      fetchCurrentSong();
      scheduleNextPoll();
    }
  });
}

function initAll() {
  initThemeToggle();
  initSpotify();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}


