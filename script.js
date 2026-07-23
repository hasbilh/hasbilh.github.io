// ====== PROGRESS BAR ======
window.addEventListener('scroll', () => {
  const el = document.documentElement;
  const pct = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
});

// ====== PARTICLES ======
(function() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*15+8}s;
      animation-delay:${Math.random()*10}s;
      opacity:${Math.random()*0.5+0.1};
    `;
    container.appendChild(p);
  }
})();

// ====== SCROLL REVEAL ======
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ====== TRANSLATION HELPERS ======
function getText(key) {
  const lang = localStorage.getItem('site_lang') || 'id';
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['id'][key] || key;
}

const backToTopButton = document.getElementById('back-to-top');
const contactFab = document.getElementById('contact-fab');
const navContactButton = document.getElementById('nav-contact-btn');
const contactDialogOverlay = document.getElementById('contact-dialog-overlay');
const contactDialog = document.getElementById('contact-dialog');
const contactDialogClose = document.getElementById('contact-dialog-close');

function updateBackToTopLabel() {
  if (!backToTopButton) return;
  const label = getText('back_to_top');
  backToTopButton.setAttribute('aria-label', label);
  backToTopButton.title = label;
}

function updateContactLabels() {
  if (contactFab) {
    const buttonLabel = getText('contact.button');
    contactFab.setAttribute('aria-label', buttonLabel);
    contactFab.title = buttonLabel;
  }
  if (contactDialogClose) {
    contactDialogClose.setAttribute('aria-label', getText('contact.close'));
  }
}

function updateModalLabels() {
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.setAttribute('aria-label', getText('modal.close'));
}

// ====== THEME ======
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.getElementById('theme-color-meta');

function getCurrentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function updateThemeButton() {
  if (!themeToggle) return;
  const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  const label = getText(nextTheme === 'light' ? 'theme.enable_light' : 'theme.enable_dark');
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
  themeToggle.setAttribute('aria-pressed', getCurrentTheme() === 'light' ? 'true' : 'false');
  if (themeColorMeta) {
    themeColorMeta.content = getCurrentTheme() === 'light' ? '#f4f7fc' : '#070b16';
  }
}

function applyTheme(theme, persist = false) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  if (persist) localStorage.setItem('site_theme', normalizedTheme);
  updateThemeButton();
}

applyTheme(getCurrentTheme());

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    applyTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark', true);
  });
}

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['id'];
  document.documentElement.lang = lang === 'ja' ? 'ja' : lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      const tag = el.tagName && el.tagName.toLowerCase();
      if (tag === 'input') {
        el.placeholder = dict[key];
      } else {
        el.innerHTML = dict[key];
      }
    }
  });
  updateThemeButton();
  updateBackToTopLabel();
  updateContactLabels();
  updateModalLabels();
}

function refreshDiscographyView() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput || typeof renderDisco !== 'function') return;
  renderDisco(currentYear, currentCategory, searchInput.value.toLowerCase().trim(), currentSort, currentPage);
}

const langSelectEl = document.getElementById('lang-select');
function setActiveLangButton(container, lang) {
  container.querySelectorAll('.lang-btn').forEach(btn => {
    const is = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', is);
    btn.setAttribute('aria-pressed', is ? 'true' : 'false');
  });
}

if (langSelectEl) {
  const saved = localStorage.getItem('site_lang') || 'id';
  // if it's a native select element (legacy), handle value
  if (langSelectEl.tagName && langSelectEl.tagName.toLowerCase() === 'select') {
    langSelectEl.value = saved;
    applyTranslations(saved);
    langSelectEl.addEventListener('change', (e) => {
      const v = e.target.value;
      localStorage.setItem('site_lang', v);
      applyTranslations(v);
      refreshDiscographyView();
    });
  } else {
    // assume button group
    setActiveLangButton(langSelectEl, saved);
    applyTranslations(saved);
    langSelectEl.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = btn.getAttribute('data-lang');
        localStorage.setItem('site_lang', v);
        setActiveLangButton(langSelectEl, v);
        applyTranslations(v);
        refreshDiscographyView();
      });
    });
  }
}

// Color gradients for placeholders
const gradients = [
  ['#0d1528','#1a3a6e'], ['#0f2044','#1e4a8a'], ['#0a1a3a','#1040aa'],
  ['#071530','#163f72'], ['#0c1e3e','#0e3a6b'], ['#08142e','#1a3560'],
  ['#0e1e40','#234080'], ['#06101e','#1a2e55'],
];

function getGradient(i) { return gradients[i % gradients.length]; }

function makeInitials(title) {
  return title.split(' ').slice(0,2).map(w => w[0]||'').join('').toUpperCase() || 'HL';
}

function createCoverPlaceholder(initials, c1, c2) {
  const placeholder = document.createElement('div');
  placeholder.className = 'disco-cover-placeholder';
  placeholder.style.background = `linear-gradient(135deg,${c1},${c2})`;
  placeholder.textContent = initials;
  return placeholder;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function safeExternalUrl(value, fallback = '#') {
  try {
    const url = new URL(String(value || ''), window.location.href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : fallback;
  } catch (_) {
    return fallback;
  }
}

function getReleaseSlug(item) {
  return `${item?.title || ''}-${item?.artist || ''}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'release';
}

function getReleaseShortCode(item) {
  const input = getReleaseSlug(item);
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 6);
}

function getSmartlinkUrl(item) {
  const url = new URL('link/', window.location.href);
  url.searchParams.set('id', getReleaseShortCode(item));
  return url.href;
}

function normalizeYouTubeId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
}

function formatReleaseDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const localeMap = { id: 'id-ID', en: 'en-US', ja: 'ja-JP' };
  const locale = localeMap[localStorage.getItem('site_lang') || 'id'] || 'id-ID';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getSpotifyOembedUrl(item) {
  const id = item.spotifyTrackId;
  if (!id || !/^[A-Za-z0-9]{22}$/.test(id)) return null;
  return `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${id}`;
}

const spotifyCoverCache = new Map();

async function resolveCoverFromSpotify(item) {
  const oembedUrl = getSpotifyOembedUrl(item);
  if (!oembedUrl) return null;
  if (!spotifyCoverCache.has(item.spotifyTrackId)) {
    spotifyCoverCache.set(item.spotifyTrackId, (async () => {
      try {
        const response = await fetch(oembedUrl);
        if (!response.ok) return null;
        const json = await response.json();
        return safeExternalUrl(json.thumbnail_url, '') || null;
      } catch (error) {
        return null;
      }
    })());
  }
  return spotifyCoverCache.get(item.spotifyTrackId);
}

function buildCard(item, index, isProduced) {
  const card = document.createElement('div');
  card.className = 'disco-card';
  const yearLabel = item.year || '—';
  card.dataset.year = item.year || '';
  card.dataset.title = (item.title + ' ' + (item.artist||'')).toLowerCase();

  const [c1, c2] = getGradient(index);
  const initials = makeInitials(item.title);
  const normalizedType = (item.type || '').toString().trim().toLowerCase();
  const typeClassMap = {
    'solo': 'disco-type solo',
    'kolaborasi': 'disco-type collab',
    'grup musik hasbi lh': 'disco-type group',
    'artis lain': 'disco-type other',
    'video': 'disco-type video',
  };
  const typeClass = typeClassMap[normalizedType] || 'disco-type';
  const typeKeyMap = {
    'solo': 'filter.category.Solo',
    'kolaborasi': 'filter.category.Kolaborasi',
    'grup musik hasbi lh': 'filter.category.grup',
    'artis lain': 'filter.category.artis'
  };
  const typeLabel = (typeKeyMap[normalizedType] ? getText(typeKeyMap[normalizedType]) : (item.type || 'Single'));
  const safeTitle = escapeHtml(item.title);
  const safeArtist = escapeHtml(item.artist);
  const safeCover = safeExternalUrl(item.cover, '');
  const artistLine = item.artist ? `<br><span style="font-size:11px;color:var(--muted2);">${safeArtist}</span>` : '';

  card.innerHTML = `
    <div class="disco-cover">
      ${safeCover
        ? `<img class="disco-img" src="${escapeHtml(safeCover)}" alt="${safeTitle}" loading="lazy">`
        : `<div class="disco-cover-placeholder" style="background:linear-gradient(135deg,${c1},${c2})">${escapeHtml(initials)}</div>`
      }
      ${item.spotifyTrackId ? `<button class="disco-play-overlay" type="button" aria-label="Putar ${safeTitle}">
        <div class="play-icon">
          <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="4,2 16,9 4,16"/></svg>
        </div>
      </button>` : ''}
    </div>
    <div class="disco-info">
      <div class="disco-title">${safeTitle}${artistLine}</div>
      <div class="disco-meta">
          <span class="disco-year">${escapeHtml(yearLabel)}</span>
          <span class="${typeClass}">${escapeHtml(typeLabel)}</span>
        </div>
    </div>
  `;

  const initialCoverImage = card.querySelector('.disco-img');
  if (initialCoverImage) {
    initialCoverImage.onerror = () => initialCoverImage.replaceWith(createCoverPlaceholder(initials, c1, c2));
  }

  card.addEventListener('click', () => openModal(item, c1, c2, isProduced));
  card.querySelector('.disco-play-overlay')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    playDiscographyItem(item);
  });

  if (item.spotifyTrackId) {
    resolveCoverFromSpotify(item).then(url => {
      if (!url) return;
      item.cover = url;
      const currentCover = card.querySelector('.disco-img, .disco-cover-placeholder');
      if (!currentCover) return;
      const img = document.createElement('img');
      img.className = 'disco-img';
      img.src = url;
      img.alt = item.title;
      img.loading = 'lazy';
      img.onerror = () => img.replaceWith(createCoverPlaceholder(initials, c1, c2));
      currentCover.replaceWith(img);
    });
  }

  return card;
}

let modalCleanupTimer = null;
let modalRequestToken = 0;
let modalPreviouslyFocused = null;
let currentMediaTitle = '';
let modalMediaInteracted = false;
let currentModalVideo = null;
let currentMiniVideo = null;
let spotifyController = null;
let spotifyControllerReady = false;
let pendingSpotifyTrackId = null;
let persistentSpotifyTrackId = null;
let persistentDiscographyItem = null;
let persistentPlaying = false;
let persistentPosition = 0;
let persistentDuration = 0;

function hideSpotifyControllerFrame() {
  const host = document.getElementById('spotify-controller-host');
  if (host) {
    host.hidden = false;
    host.setAttribute('aria-hidden', 'true');
  }
  document.querySelectorAll('iframe[src*="open.spotify.com/embed"]').forEach(frame => {
    if (frame.closest('.spotify-embed-wrap')) return;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    Object.assign(frame.style, {
      display: 'block',
      position: 'absolute',
      left: '-100vw',
      top: '-100vh',
      zIndex: '-1',
      width: '1px',
      height: '1px',
      opacity: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
    });
  });
}

const spotifyFrameObserver = new MutationObserver(hideSpotifyControllerFrame);
spotifyFrameObserver.observe(document.documentElement, { childList: true, subtree: true });

function formatPlaybackTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updatePersistentPlayerUi() {
  const player = document.getElementById('persistent-player');
  const playButton = document.getElementById('persistent-player-play');
  const progressFill = document.getElementById('persistent-progress-fill');
  const timeCurrent = document.getElementById('persistent-time-current');
  const timeTotal = document.getElementById('persistent-time-total');
  if (!player) return;

  player.classList.toggle('is-playing', persistentPlaying);
  playButton?.setAttribute('aria-label', persistentPlaying ? 'Pause audio' : 'Play audio');
  if (progressFill) {
    const ratio = persistentDuration > 0 ? Math.min(1, persistentPosition / persistentDuration) : 0;
    progressFill.style.width = `${ratio * 100}%`;
  }
  if (timeCurrent) timeCurrent.textContent = formatPlaybackTime(persistentPosition);
  if (timeTotal) timeTotal.textContent = formatPlaybackTime(persistentDuration);
}

function setPersistentTrackInfo(item) {
  const cover = document.getElementById('persistent-player-cover');
  const title = document.getElementById('persistent-player-title');
  const artist = document.getElementById('persistent-player-artist');
  const source = document.getElementById('persistent-player-source');
  const safeCover = safeExternalUrl(item?.cover, '');
  if (cover) {
    if (safeCover) {
      cover.src = safeCover;
      cover.alt = item?.title || '';
      cover.hidden = false;
    } else {
      cover.removeAttribute('src');
      cover.hidden = true;
    }
  }
  if (title) title.textContent = item?.title || 'Spotify';
  if (artist) artist.textContent = item?.artist || 'Hasbi LH';
  if (source) {
    const spotifyUrl = item?.spotifyTrackId && /^[A-Za-z0-9]{22}$/.test(item.spotifyTrackId)
      ? `https://open.spotify.com/track/${item.spotifyTrackId}`
      : 'https://open.spotify.com/';
    source.href = spotifyUrl;
    source.textContent = 'Buka di Spotify';
  }
}

function initSpotifyController(IFrameAPI = window.SpotifyIframeApi) {
  const host = document.getElementById('spotify-controller-host');
  if (!IFrameAPI || !host || spotifyController) return;

  IFrameAPI.createController(
    host,
    {
      uri: 'spotify:track:5BVAoJTekW7SaS9bMOrUCr',
      width: '300',
      height: '80',
    },
    controller => {
      spotifyController = controller;
      hideSpotifyControllerFrame();
      spotifyController.addListener('ready', () => {
        spotifyControllerReady = true;
        hideSpotifyControllerFrame();
        if (pendingSpotifyTrackId) {
          const trackId = pendingSpotifyTrackId;
          pendingSpotifyTrackId = null;
          playSpotifyTrack(trackId);
        }
      });
      spotifyController.addListener('playback_update', event => {
        const data = event?.data || {};
        persistentPlaying = !data.isPaused;
        persistentPosition = (data.position || 0) / 1000;
        persistentDuration = (data.duration || 0) / 1000;
        updatePersistentPlayerUi();
      });
    },
  );
}

function playSpotifyTrack(trackId) {
  if (!trackId) return;
  if (!spotifyController || !spotifyControllerReady) {
    pendingSpotifyTrackId = trackId;
    initSpotifyController();
    return;
  }
  spotifyController.loadUri(`spotify:track:${trackId}`);
  spotifyController.play();
}

function pauseSpotifyTrack() {
  spotifyController?.pause?.();
  persistentPlaying = false;
  updatePersistentPlayerUi();
}

function resumeSpotifyTrack() {
  if (!persistentSpotifyTrackId) return;
  if (!spotifyController || !spotifyControllerReady) {
    playSpotifyTrack(persistentSpotifyTrackId);
    return;
  }
  spotifyController.resume?.();
  persistentPlaying = true;
  updatePersistentPlayerUi();
}

window.onSpotifyIframeApiReady = IFrameAPI => {
  initSpotifyController(IFrameAPI);
};

if (window.SpotifyIframeApi) {
  initSpotifyController(window.SpotifyIframeApi);
}

function stopPersistentPlayer() {
  const player = document.getElementById('persistent-player');
  const playerEmbed = document.getElementById('persistent-player-embed');
  if (!player) return;
  pauseSpotifyTrack();
  pendingSpotifyTrackId = null;
  persistentSpotifyTrackId = null;
  persistentDiscographyItem = null;
  persistentPlaying = false;
  persistentPosition = 0;
  persistentDuration = 0;
  player.classList.remove('show');
  player.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-persistent-player');
  if (playerEmbed) playerEmbed.innerHTML = '';
  updatePersistentPlayerUi();
}

function showPersistentPlayer() {
  const player = document.getElementById('persistent-player');
  if (!player) return;
  player.classList.add('show');
  player.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-persistent-player');
}

function closeVideoMiniPlayer() {
  const player = document.getElementById('video-mini-player');
  const embed = document.getElementById('video-mini-embed');
  if (!player) return;
  player.classList.remove('show', 'in-modal');
  player.setAttribute('aria-hidden', 'true');
  player.removeAttribute('style');
  currentMiniVideo = null;
  setTimeout(() => {
    if (!player.classList.contains('show') && embed) embed.innerHTML = '';
  }, 240);
}

function stopVideoPlayback() {
  const miniPlayer = document.getElementById('video-mini-player');
  const miniEmbed = document.getElementById('video-mini-embed');
  const modalEmbed = document.getElementById('modal-embed');
  miniPlayer?.classList.remove('show', 'in-modal');
  miniPlayer?.setAttribute('aria-hidden', 'true');
  miniPlayer?.removeAttribute('style');
  if (miniEmbed) miniEmbed.innerHTML = '';
  if (currentModalVideo && modalEmbed) modalEmbed.innerHTML = '';
  currentMiniVideo = null;
  currentModalVideo = null;
  modalMediaInteracted = false;
}

function setVideoMiniPlayerIframe(video, videoId, forceReload = false) {
  const player = document.getElementById('video-mini-player');
  const embed = document.getElementById('video-mini-embed');
  const title = document.getElementById('video-mini-title');
  if (!player || !embed) return false;
  const currentFrame = embed.querySelector('iframe');
  const currentId = player.dataset.videoId;
  if (forceReload || !currentFrame || currentId !== videoId) {
    embed.innerHTML = `
      <div class="modal-video-embed">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?rel=0"
          title="${escapeHtml(video?.title || 'YouTube')}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
        ></iframe>
      </div>
    `;
    player.dataset.videoId = videoId;
  }
  currentMiniVideo = video;
  if (title) title.textContent = video?.title || 'YouTube';
  return true;
}

function positionVideoPlayerInModal() {
  const player = document.getElementById('video-mini-player');
  const placeholder = document.getElementById('modal-video-placeholder');
  if (!player || !placeholder || !player.classList.contains('in-modal')) return;
  const rect = placeholder.getBoundingClientRect();
  player.style.left = `${rect.left}px`;
  player.style.top = `${rect.top}px`;
  player.style.width = `${rect.width}px`;
}

function showVideoPlayerInModal(video, videoId, forceReload = false) {
  const player = document.getElementById('video-mini-player');
  if (!player || !setVideoMiniPlayerIframe(video, videoId, forceReload)) return false;
  stopPersistentPlayer();
  player.classList.add('show', 'in-modal');
  player.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(positionVideoPlayerInModal);
  return true;
}

function showVideoMiniPlayer(video) {
  const player = document.getElementById('video-mini-player');
  if (!player || !currentMiniVideo) return false;
  stopPersistentPlayer();
  currentMiniVideo = video || currentMiniVideo;
  player.classList.remove('in-modal');
  player.removeAttribute('style');
  player.classList.add('show');
  player.setAttribute('aria-hidden', 'false');
  return true;
}

function moveModalVideoToMiniPlayer() {
  if (!currentModalVideo || !document.querySelector('#video-mini-embed iframe')) return false;
  return showVideoMiniPlayer(currentModalVideo);
}

function openVideoMiniPlayerModal() {
  if (!currentMiniVideo) return;
  openVideoModal(currentMiniVideo, true);
}

function playDiscographyItem(item) {
  const spotifyTrackId = item?.spotifyTrackId;
  if (!spotifyTrackId || !/^[A-Za-z0-9]{22}$/.test(spotifyTrackId)) return;
  const playerEmbed = document.getElementById('persistent-player-embed');
  if (!playerEmbed) return;

  stopVideoPlayback();
  stopPersistentPlayer();
  persistentSpotifyTrackId = spotifyTrackId;
  persistentDiscographyItem = item;
  persistentPlaying = true;
  persistentPosition = 0;
  persistentDuration = 0;
  setPersistentTrackInfo(item);
  playerEmbed.innerHTML = '';
  showPersistentPlayer();
  updatePersistentPlayerUi();
  playSpotifyTrack(spotifyTrackId);
}

function openPersistentPlayerTrackModal() {
  if (!persistentDiscographyItem) return;
  const itemIndex = discographyData.findIndex(item => (
    item === persistentDiscographyItem ||
    (item.spotifyTrackId && item.spotifyTrackId === persistentDiscographyItem.spotifyTrackId) ||
    (item.title === persistentDiscographyItem.title && item.artist === persistentDiscographyItem.artist)
  ));
  const [c1, c2] = getGradient(Math.max(0, itemIndex));
  openModal(persistentDiscographyItem, c1, c2, false);
}

function prepareModalOpen() {
  if (modalCleanupTimer) {
    clearTimeout(modalCleanupTimer);
    modalCleanupTimer = null;
  }
  modalMediaInteracted = false;
  currentModalVideo = null;
  document.getElementById('modal-extra-details')?.remove();
  if (!document.getElementById('modal-overlay')?.classList.contains('open')) {
    modalPreviouslyFocused = document.activeElement;
  }
  return ++modalRequestToken;
}

function openModal(item, c1, c2, isProduced) {
  const requestToken = prepareModalOpen();
  currentMediaTitle = item.artist ? `${item.title} - ${item.artist}` : item.title;
  const overlay = document.getElementById('modal-overlay');
  const initials = makeInitials(item.title);
  const safeCover = safeExternalUrl(item.cover, '');

  // Cover
  const coverContainer = document.getElementById('modal-cover-container');
  if (safeCover) {
    coverContainer.innerHTML = `<img class="modal-cover" src="${escapeHtml(safeCover)}" alt="${escapeHtml(item.title)}">`;
  } else {
    coverContainer.innerHTML = `<div class="modal-cover-placeholder" style="background:linear-gradient(135deg,${c1},${c2})">${escapeHtml(initials)}</div>`;
  }

  if (item.spotifyTrackId) {
    resolveCoverFromSpotify(item).then(url => {
      if (!url || requestToken !== modalRequestToken || !overlay.classList.contains('open')) return;
      item.cover = url;
      coverContainer.innerHTML = `<img class="modal-cover" src="${escapeHtml(url)}" alt="${escapeHtml(item.title)}">`;
    });
  }

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-artist').textContent = item.artist
    ? getText('modal.by').replace('{artist}', item.artist)
    : 'Hasbi LH';

  const tags = document.getElementById('modal-tags');
  const yearLabel = item.year || '—';
  const normalizedType = (item.type || '').toString().trim().toLowerCase();
  const typeKeyMap = {
    'solo': 'filter.category.Solo',
    'kolaborasi': 'filter.category.Kolaborasi',
    'grup musik hasbi lh': 'filter.category.grup',
    'artis lain': 'filter.category.artis'
  };
  const modalTypeClassMap = {
    'solo': 'solo',
    'kolaborasi': 'collab',
    'grup musik hasbi lh': 'group',
    'artis lain': 'other',
    'video': 'video',
  };
  const modalTypeClass = modalTypeClassMap[normalizedType] || '';
  const typeLabelTranslated = typeKeyMap[normalizedType] ? getText(typeKeyMap[normalizedType]) : item.type;
  tags.innerHTML = `
    <span class="modal-tag">${escapeHtml(yearLabel)}</span>
    <span class="modal-tag ${isProduced ? '' : modalTypeClass}">${escapeHtml(isProduced ? getText('film.produced') : typeLabelTranslated)}</span>
  `;

  const embedDiv = document.getElementById('modal-embed');
  embedDiv.hidden = true;
  embedDiv.innerHTML = '';
  const spotifyTrackId = item.spotifyTrackId;
  const isSpotifyTrack = spotifyTrackId && /^[A-Za-z0-9]{22}$/.test(spotifyTrackId);
  const searchArtist = item.artist || 'Hasbi LH';
  const searchQuery = encodeURIComponent(`${item.title} ${searchArtist}`);

  const creditRows = [
    [getText('modal.credit.album'), item.album],
    [getText('modal.credit.songwriters'), item.songwriters],
    [getText('modal.credit.composer'), item.composer],
    [getText('modal.credit.producer'), item.producer],
    [getText('modal.credit.mixing'), item.mixing],
    [getText('modal.credit.mastering'), item.mastering],
    [getText('modal.credit.release_date'), formatReleaseDate(item.releaseDate)],
    [getText('modal.credit.studio_label'), item.studioLabel],
  ].filter(([, value]) => value);
  const creditsHtml = creditRows.length
    ? `<div id="modal-extra-details" class="modal-credits">
        ${creditRows.map(([label, value]) => `
          <div class="modal-credit-row">
            <div class="modal-detail-label">${label}</div>
            <div class="modal-detail-text">${escapeHtml(value)}</div>
          </div>
        `).join('')}
      </div>`
    : '';
  embedDiv.insertAdjacentHTML('beforebegin', creditsHtml);

  // Platform links
  const platformMeta = platformMetadata[item.title] || {};
  const platforms = document.getElementById('modal-platforms');
  platforms.className = 'platform-links';
  const spotifyUrl = isSpotifyTrack
    ? `https://open.spotify.com/track/${spotifyTrackId}`
    : `https://open.spotify.com/search/${searchQuery}`;

  const appleMusicUrl = platformMeta.appleUrl
    || (platformMeta.appleTrackId && platformMeta.appleAlbumId
      ? `https://music.apple.com/id/album/${platformMeta.appleAlbumId}?i=${platformMeta.appleTrackId}`
      : item.appleTrackId && item.appleAlbumId
        ? `https://music.apple.com/id/album/${item.appleAlbumId}?i=${item.appleTrackId}`
        : item.appleId
          ? `https://music.apple.com/id/album/${item.appleId}`
          : `https://music.apple.com/id/search?term=${searchQuery}`);

  const youtubeId = platformMeta.youtubeId || item.youtubeId;
  const youtubeUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.youtube.com/results?search_query=${searchQuery}`;
  const youtubeMusicUrl = platformMeta.youtubeMusicUrl || item.youtubeMusicUrl;
  const youtubeMusicId = platformMeta.youtubeMusicId || item.youtubeMusicId || youtubeId;
  const ytMusicUrl = youtubeMusicUrl
    || (youtubeMusicId
      ? `https://music.youtube.com/watch?v=${youtubeMusicId}`
      : `https://music.youtube.com/search?q=${searchQuery}`);
  const deezerTrack = platformMeta.deezerTrackId || item.deezerTrackId;
  const deezerUrl = platformMeta.deezerUrl || item.deezerUrl
    || (deezerTrack
      ? `https://www.deezer.com/en/track/${deezerTrack}`
      : item.deezerId
        ? `https://www.deezer.com/en/album/${item.deezerId}`
        : `https://www.deezer.com/search/${searchQuery}`);
  const tidalTrack = platformMeta.tidalTrackId || item.tidalTrackId;
  const tidalAlbum = platformMeta.tidalAlbumId || item.tidalAlbumId;
  const tidalUrl = platformMeta.tidalUrl || item.tidalUrl
    || (tidalTrack
      ? `https://tidal.com/browse/track/${tidalTrack}`
      : tidalAlbum
        ? `https://tidal.com/browse/album/${tidalAlbum}`
        : `https://tidal.com/search/${searchQuery}`);
  const soundcloudUrl = platformMeta.soundcloudUrl || item.soundcloudUrl || `https://soundcloud.com/search?q=${searchQuery}`;
  const amazonUrl = platformMeta.amazonUrl || item.amazonUrl || `https://music.amazon.com/search/${searchQuery}`;
  const platformUrls = {
    smartlink: getSmartlinkUrl(item),
    spotify: safeExternalUrl(spotifyUrl),
    apple: safeExternalUrl(appleMusicUrl),
    youtube: safeExternalUrl(youtubeUrl),
    youtubeMusic: safeExternalUrl(ytMusicUrl),
    soundcloud: safeExternalUrl(soundcloudUrl),
    deezer: safeExternalUrl(deezerUrl),
    tidal: safeExternalUrl(tidalUrl),
    amazon: safeExternalUrl(amazonUrl),
  };

  platforms.innerHTML = `
    <a href="${escapeHtml(platformUrls.spotify)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.6-.12-.421.18-.78.6-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.42-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.781-.18-.601.18-1.2.78-1.381 4.5-1.14 11.28-.86 15.72 1.621.479.3.599 1.02.28 1.5-.319.48-1.041.6-1.52.28z"/>
      </svg>
      Spotify
    </a>
    <a href="${escapeHtml(platformUrls.apple)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      Apple Music
    </a>
    <a href="${escapeHtml(platformUrls.youtube)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      YouTube
    </a>
    <a href="${escapeHtml(platformUrls.youtubeMusic)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>
      </svg>
      YT Music
    </a>
    <a href="${escapeHtml(platformUrls.soundcloud)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.999 14.165c-.052 1.796-1.612 3.169-3.4 3.169h-8.18a.68.68 0 0 1-.675-.683V7.862a.747.747 0 0 1 .452-.724s.75-.513 2.333-.513a5.364 5.364 0 0 1 2.763.755 5.433 5.433 0 0 1 2.57 3.54c.282-.08.574-.121.868-.12.884 0 1.73.358 2.347.992s.948 1.49.922 2.373ZM10.721 8.421c.247 2.98.427 5.697 0 8.672a.264.264 0 0 1-.53 0c-.395-2.946-.22-5.718 0-8.672a.264.264 0 0 1 .53 0ZM9.072 9.448c.285 2.659.37 4.986-.006 7.655a.277.277 0 0 1-.55 0c-.331-2.63-.256-5.02 0-7.655a.277.277 0 0 1 .556 0Zm-1.663-.257c.27 2.726.39 5.171 0 7.904a.266.266 0 0 1-.532 0c-.38-2.69-.257-5.21 0-7.904a.266.266 0 0 1 .532 0Zm-1.647.77a26.108 26.108 0 0 1-.008 7.147.272.272 0 0 1-.542 0 27.955 27.955 0 0 1 0-7.147.275.275 0 0 1 .55 0Zm-1.67 1.769c.421 1.865.228 3.5-.029 5.388a.257.257 0 0 1-.514 0c-.21-1.858-.398-3.549 0-5.389a.272.272 0 0 1 .543 0Zm-1.655-.273c.388 1.897.26 3.508-.01 5.412-.026.28-.514.283-.54 0-.244-1.878-.347-3.54-.01-5.412a.283.283 0 0 1 .56 0Zm-1.668.911c.4 1.268.257 2.292-.026 3.572a.257.257 0 0 1-.514 0c-.241-1.262-.354-2.312-.023-3.572a.283.283 0 0 1 .563 0Z"/>
      </svg>
      SoundCloud
    </a>
    <a href="${escapeHtml(platformUrls.deezer)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.03h5.19V8.38H6.27zM18.81 8.38v3.03H24V8.38h-5.19zM6.27 12.61v3.03h5.19v-3.03H6.27zM18.81 12.61v3.03H24v-3.03h-5.19zM6.27 16.83v3.03h5.19v-3.03H6.27zM12.54 16.83v3.03h5.19v-3.03h-5.19zM0 16.83v3.03h5.19v-3.03H0zM12.54 4.16v3.03h5.19V4.16h-5.19zM0 4.16v3.03h5.19V4.16H0zM0 8.38v3.03h5.19V8.38H0zM0 12.61v3.03h5.19v-3.03H0z"/>
      </svg>
      Deezer
    </a>
    <a href="${escapeHtml(platformUrls.tidal)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z"/>
      </svg>
      Tidal
    </a>
    <a href="${escapeHtml(platformUrls.amazon)}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <i class="fa-brands fa-amazon" aria-hidden="true"></i>
      Amazon Music
    </a>
    <div class="smartlink-row">
    <a href="${escapeHtml(platformUrls.smartlink)}" target="_blank" rel="noopener noreferrer" class="platform-link smartlink-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"></path>
        <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"></path>
      </svg>
      Smartlink
    </a>
    </div>
  `;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => document.getElementById('modal-close')?.focus());
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

const modalEmbedElement = document.getElementById('modal-embed');
['pointerdown', 'touchstart', 'focusin'].forEach(eventName => {
  modalEmbedElement?.addEventListener(eventName, () => {
    modalMediaInteracted = true;
    stopPersistentPlayer();
  }, true);
});

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay.classList.contains('open')) return;
  modalRequestToken++;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  moveModalVideoToMiniPlayer();
  if (modalCleanupTimer) clearTimeout(modalCleanupTimer);
  modalCleanupTimer = setTimeout(() => {
    document.getElementById('modal-embed').innerHTML = '';
    document.getElementById('modal-extra-details')?.remove();
    currentModalVideo = null;
    modalMediaInteracted = false;
    modalPreviouslyFocused?.focus?.();
    modalPreviouslyFocused = null;
    modalCleanupTimer = null;
  }, 300);
}

const navToggle = document.getElementById('nav-toggle');
const nav = document.querySelector('nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('nav-open')) {
        nav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// ====== BACK TO TOP ======
function updateBackToTopVisibility() {
  if (!backToTopButton) return;
  backToTopButton.classList.toggle('visible', window.scrollY > 500);
}

if (backToTopButton) {
  updateBackToTopLabel();
  updateBackToTopVisibility();
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ====== CONTACT DIALOG ======
let contactPreviouslyFocused = null;
let contactCloseTimer = null;

function openContactDialog() {
  if (!contactDialogOverlay || !contactDialog) return;
  if (contactCloseTimer) {
    clearTimeout(contactCloseTimer);
    contactCloseTimer = null;
  }
  contactPreviouslyFocused = document.activeElement;
  contactDialogOverlay.hidden = false;
  requestAnimationFrame(() => contactDialogOverlay.classList.add('open'));
  document.body.style.overflow = 'hidden';
  contactDialogClose?.focus();
}

function closeContactDialog() {
  if (!contactDialogOverlay || contactDialogOverlay.hidden) return;
  contactDialogOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if (contactCloseTimer) clearTimeout(contactCloseTimer);
  contactCloseTimer = setTimeout(() => {
    contactDialogOverlay.hidden = true;
    contactPreviouslyFocused?.focus?.();
    contactCloseTimer = null;
  }, 220);
}

if (contactFab && contactDialogOverlay) {
  updateContactLabels();
  contactFab.addEventListener('click', openContactDialog);
  navContactButton?.addEventListener('click', () => {
    if (nav?.classList.contains('nav-open')) {
      nav.classList.remove('nav-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
    openContactDialog();
  });
  contactDialogClose?.addEventListener('click', closeContactDialog);
  contactDialogOverlay.addEventListener('click', event => {
    if (event.target === contactDialogOverlay) closeContactDialog();
  });
}

// ====== RENDER DISCOGRAPHY ======
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let filteredItems = [];
let discographyData = typeof DISCOGRAPHY !== 'undefined' ? DISCOGRAPHY : [];
let platformMetadata = typeof PLATFORM_METADATA !== 'undefined' ? PLATFORM_METADATA : {};

async function loadDiscographyDatabase() {
  try {
    const response = await fetch('data/discography.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load discography database');

    const data = await response.json();
    if (!Array.isArray(data.discography)) throw new Error('Invalid discography database');

    discographyData = data.discography;
    platformMetadata = data.platformMetadata || {};
  } catch (error) {
    console.warn('Using bundled discography fallback:', error);
  }
}

async function initDiscography() {
  const grid = document.getElementById('disco-grid');
  if (grid) {
    grid.innerHTML = '<div class="loading-spinner-full"><div class="spinner"></div></div>';
  }
  await loadDiscographyDatabase();
  renderYearFilters();
  renderDisco('all', 'all', '', 'date-desc', 1);
}

function renderYearFilters() {
  const container = document.getElementById('year-filter-buttons');
  if (!container) return;
  const years = [...new Set(discographyData.map(item => Number(item.year)).filter(Number.isFinite))]
    .sort((a, b) => b - a);
  container.innerHTML = '';

  const allButton = document.createElement('button');
  allButton.className = 'filter-btn active';
  allButton.dataset.year = 'all';
  allButton.dataset.i18n = 'filter.year.all';
  allButton.textContent = getText('filter.year.all');
  container.appendChild(allButton);

  years.forEach(year => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.year = String(year);
    button.textContent = String(year);
    container.appendChild(button);
  });
}

function getItemAlbums(item) {
  return String(item.album || '')
    .split(',')
    .map(album => album.trim())
    .filter(Boolean);
}

function sortDiscographyItems(items, sortBy) {
  items.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return (b.releaseDate || '0000-00-00').localeCompare(a.releaseDate || '0000-00-00');
      case 'date-asc':
        return (a.releaseDate || '0000-00-00').localeCompare(b.releaseDate || '0000-00-00');
      case 'artist-asc':
        return (a.artist || '').localeCompare(b.artist || '');
      case 'artist-desc':
        return (b.artist || '').localeCompare(a.artist || '');
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      default:
        return (b.releaseDate || '0000-00-00').localeCompare(a.releaseDate || '0000-00-00');
    }
  });
  return items;
}

function getAlbumGroups() {
  const groups = new Map();
  discographyData.forEach(item => {
    getItemAlbums(item).forEach(album => {
      if (!groups.has(album)) groups.set(album, []);
      groups.get(album).push(item);
    });
  });
  return groups;
}

function getAlbumCollageTracks(tracks, limit = 4) {
  const sortedTracks = sortDiscographyItems(tracks.slice(), 'date-desc');
  const selected = [];
  const usedCovers = new Set();

  sortedTracks.forEach(track => {
    if (selected.length >= limit) return;
    const cover = safeExternalUrl(track.cover, '');
    if (!cover || usedCovers.has(cover)) return;
    usedCovers.add(cover);
    selected.push(track);
  });

  sortedTracks.forEach(track => {
    if (selected.length >= limit || selected.includes(track)) return;
    selected.push(track);
  });

  return selected;
}

function buildAlbumCard(albumName, tracks, index) {
  const card = document.createElement('article');
  card.className = 'disco-card album-card';
  const [c1, c2] = getGradient(index);
  const initials = makeInitials(albumName);
  const leadTrack = sortDiscographyItems(tracks.slice(), 'date-desc')[0];
  const safeCover = safeExternalUrl(leadTrack?.cover, '');
  const trackCount = getText('album.track_count').replace('{count}', tracks.length);
  const isSingleAlbum = albumName.trim().toLowerCase() === 'single';
  const collageTracks = isSingleAlbum ? getAlbumCollageTracks(tracks) : [];
  const coverMarkup = isSingleAlbum
    ? `<div class="album-cover-collage">
        ${collageTracks.map((track, collageIndex) => {
          const collageCover = safeExternalUrl(track.cover, '');
          const [placeholderStart, placeholderEnd] = getGradient(index + collageIndex);
          return `<div class="album-collage-item" data-collage-index="${collageIndex}">
            ${collageCover
              ? `<img src="${escapeHtml(collageCover)}" alt="${escapeHtml(track.title)}" loading="lazy">`
              : `<div class="disco-cover-placeholder" style="background:linear-gradient(135deg,${placeholderStart},${placeholderEnd})">${escapeHtml(makeInitials(track.title))}</div>`
            }
          </div>`;
        }).join('')}
      </div>`
    : safeCover
      ? `<img class="disco-img" src="${escapeHtml(safeCover)}" alt="${escapeHtml(albumName)}" loading="lazy">`
      : `<div class="disco-cover-placeholder" style="background:linear-gradient(135deg,${c1},${c2})">${escapeHtml(initials)}</div>`;

  card.innerHTML = `
    <div class="disco-cover${isSingleAlbum ? ' has-collage' : ''}">
      ${coverMarkup}
      <div class="album-card-overlay">
        <span>${escapeHtml(trackCount)}</span>
      </div>
    </div>
    <div class="disco-info">
      <div class="disco-title">${escapeHtml(albumName)}</div>
      <div class="album-track-count">${escapeHtml(trackCount)}</div>
    </div>
  `;

  if (isSingleAlbum) {
    collageTracks.forEach((track, collageIndex) => {
      if (!track.spotifyTrackId) return;
      resolveCoverFromSpotify(track).then(url => {
        if (!url) return;
        const collageItem = card.querySelector(`[data-collage-index="${collageIndex}"]`);
        if (!collageItem) return;
        const img = document.createElement('img');
        img.src = url;
        img.alt = track.title;
        img.loading = 'lazy';
        collageItem.replaceChildren(img);
      });
    });
  } else if (leadTrack?.spotifyTrackId) {
    resolveCoverFromSpotify(leadTrack).then(url => {
      if (!url) return;
      const currentCover = card.querySelector('.disco-img, .disco-cover-placeholder');
      if (!currentCover) return;
      const img = document.createElement('img');
      img.className = 'disco-img';
      img.src = url;
      img.alt = albumName;
      img.loading = 'lazy';
      currentCover.replaceWith(img);
    });
  }

  card.addEventListener('click', () => {
    selectedAlbum = albumName;
    currentPage = 1;
    renderDisco('all', 'Album', document.getElementById('search-input').value.toLowerCase().trim(), currentSort, 1);
    requestAnimationFrame(() => {
      document.querySelector('.album-detail-header')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
  return card;
}

function renderAlbumBrowser(searchQuery, sortBy) {
  const grid = document.getElementById('disco-grid');
  const groups = getAlbumGroups();
  let albums = [...groups.entries()].map(([name, tracks]) => ({
    name,
    tracks,
    latestRelease: sortDiscographyItems(tracks.slice(), 'date-desc')[0]?.releaseDate || '',
  }));

  if (searchQuery) {
    albums = albums.filter(album =>
      album.name.toLowerCase().includes(searchQuery)
      || album.tracks.some(item =>
        item.title.toLowerCase().includes(searchQuery)
        || (item.artist || '').toLowerCase().includes(searchQuery)
      )
    );
  }

  albums.sort((a, b) => {
    if (sortBy === 'date-asc') return a.latestRelease.localeCompare(b.latestRelease);
    if (sortBy === 'date-desc') return b.latestRelease.localeCompare(a.latestRelease);
    if (sortBy === 'title-desc' || sortBy === 'artist-desc') return b.name.localeCompare(a.name);
    return a.name.localeCompare(b.name);
  });

  if (albums.length === 0) {
    grid.innerHTML = `<div class="no-results">${getText('no_results.discography')}</div>`;
    return;
  }

  albums.forEach((album, index) => {
    grid.appendChild(buildAlbumCard(album.name, album.tracks, index));
  });
}

function renderAlbumHeader(albumName, trackCount) {
  const header = document.createElement('div');
  header.className = 'album-detail-header';
  header.innerHTML = `
    <button type="button" class="album-back-btn">
      <span aria-hidden="true">←</span>
      ${escapeHtml(getText('album.back'))}
    </button>
    <div>
      <h3>
        <span class="album-detail-title">${escapeHtml(albumName)}</span>
        <span class="album-detail-count">${escapeHtml(getText('album.track_count').replace('{count}', trackCount))}</span>
      </h3>
    </div>
  `;
  header.querySelector('.album-back-btn').addEventListener('click', () => {
    selectedAlbum = null;
    currentPage = 1;
    renderDisco('all', 'Album', document.getElementById('search-input').value.toLowerCase().trim(), currentSort, 1);
    requestAnimationFrame(() => {
      document.querySelector('#discography > .disco-controls')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
  return header;
}

function renderDisco(filterYear, filterCategory, searchQuery, sortBy, page) {
  page = page || 1;
  currentPage = page;

  const grid = document.getElementById('disco-grid');
  grid.innerHTML = '';

  if (filterCategory === 'Album' && !selectedAlbum) {
    renderAlbumBrowser(searchQuery, sortBy);
    return;
  }

  let items = discographyData.slice();

  if (filterCategory === 'Album' && selectedAlbum) {
    items = items.filter(item => getItemAlbums(item).includes(selectedAlbum));
  } else {
    if (filterYear !== 'all') items = items.filter(i => String(i.year) === filterYear);
    if (filterCategory && filterCategory !== 'all') items = items.filter(i => i.type === filterCategory);
  }

  // Search filter
  if (searchQuery) items = items.filter(i => i.title.toLowerCase().includes(searchQuery) || (i.artist||'').toLowerCase().includes(searchQuery));

  sortDiscographyItems(items, sortBy);

  filteredItems = items;

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results">${getText('no_results.discography')}</div>`;
    return;
  }

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (filterCategory === 'Album' && selectedAlbum) {
    grid.appendChild(renderAlbumHeader(selectedAlbum, items.length));
  }

  const trackPagination = document.createElement('div');
  trackPagination.className = 'disco-pagination track-list-pagination';
  grid.appendChild(trackPagination);

  pageItems.forEach((item, idx) => {
    grid.appendChild(buildCard(item, startIdx + idx, false));
  });

  renderPagination(items.length, totalPages, trackPagination);
}

function renderPagination(totalItems, totalPages, container) {
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const info = document.createElement('span');
  info.className = 'page-info';
  const startNum = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endNum = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const rangeTpl = getText('pagination.range');
  info.textContent = rangeTpl.replace('{start}', startNum).replace('{end}', endNum).replace('{total}', totalItems);

  // Prev button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.innerHTML = '&#8592;';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });
  container.appendChild(prevBtn);

  // Page number buttons with dots
  const pageNums = getPageNumbers(currentPage, totalPages);
  pageNums.forEach(p => {
    if (p === '...') {
      const dots = document.createElement('span');
      dots.className = 'page-dots';
      dots.textContent = '···';
      container.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', () => goToPage(p));
      container.appendChild(btn);
    }
  });

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.innerHTML = '&#8594;';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  });
  container.appendChild(nextBtn);

  container.appendChild(info);
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }
  return pages;
}

function goToPage(page) {
  renderDisco(currentYear, currentCategory, document.getElementById('search-input').value.toLowerCase().trim(), currentSort, page);

}

// Filter buttons
let currentYear = 'all';
let currentCategory = 'all';
let selectedAlbum = null;
let currentSort = 'date-desc';

function setYearFiltersDisabled(disabled) {
  document.querySelectorAll('#year-filter-buttons .filter-btn').forEach(yearButton => {
    yearButton.disabled = disabled;
    yearButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  });
}

document.querySelector('.filter-group').addEventListener('click', (event) => {
  const btn = event.target.closest('.filter-btn');
  if (!btn || btn.disabled) return;
  if (btn.classList.contains('filter-category')) {
    document.querySelectorAll('.filter-btn.filter-category').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category || 'all';
    selectedAlbum = null;
    setYearFiltersDisabled(currentCategory === 'Album');
    if (currentCategory === 'Album') {
      currentYear = 'all';
      document.querySelectorAll('#year-filter-buttons .filter-btn').forEach(yearButton => {
        yearButton.classList.toggle('active', yearButton.dataset.year === 'all');
      });
    }
  } else {
    document.querySelectorAll('#year-filter-buttons .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentYear = btn.dataset.year || 'all';
  }
  renderDisco(currentYear, currentCategory, document.getElementById('search-input').value.toLowerCase().trim(), currentSort, 1);
});

document.getElementById('sort-select').addEventListener('change', (e) => {
  currentSort = e.target.value;
  renderDisco(currentYear, currentCategory, document.getElementById('search-input').value.toLowerCase().trim(), currentSort, 1);
});

document.getElementById('search-input').addEventListener('input', (e) => {
  renderDisco(currentYear, currentCategory, e.target.value.toLowerCase().trim(), currentSort, 1);
});

initDiscography();



// ====== YOUTUBE RSS FEED ======
const CHANNEL_HANDLE = '@hasbilh_';
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
const CHANNEL_ID = 'UC-64KIoELn2IxnTZdgwPDLg';
const RSS_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-64KIoELn2IxnTZdgwPDLg';
const RSS_JSON_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;
const CORS_PROXY = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_URL)}`;

function getYouTubeIdFromUrl(value) {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return normalizeYouTubeId(url.pathname.slice(1));
    if (url.pathname.startsWith('/shorts/')) return normalizeYouTubeId(url.pathname.split('/')[2]);
    return normalizeYouTubeId(url.searchParams.get('v'));
  } catch (_) {
    return '';
  }
}

function parseYouTubeXml(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  return Array.from(xml.getElementsByTagNameNS('*', 'entry')).map(entry => {
    const videoId = entry.getElementsByTagNameNS('*', 'videoId')[0]?.textContent || '';
    const title = entry.getElementsByTagNameNS('*', 'title')[0]?.textContent || '';
    const published = entry.getElementsByTagNameNS('*', 'published')[0]?.textContent || '';
    return {
      id: videoId,
      title,
      date: new Date(published).getFullYear() || '',
    };
  }).filter(video => normalizeYouTubeId(video.id));
}

function renderVideos(videos) {
  const grid = document.getElementById('videos-grid');
  grid.innerHTML = '';
  const validVideos = (videos || []).filter(v => normalizeYouTubeId(v.id));
  if (validVideos.length === 0) {
    grid.innerHTML = `<div class="no-results">${getText('no_results.videos')} <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2)">${getText('videos.open_channel')}</a></div>`;
    return;
  }
  validVideos.slice(0, 10).forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    const videoId = normalizeYouTubeId(v.id);
    const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${thumb}" alt="${escapeHtml(v.title)}" loading="lazy">
        <div class="video-play-btn">
          <div class="yt-play">
            <svg width="16" height="12" viewBox="0 0 16 12"><polygon points="0,0 16,6 0,12"/></svg>
          </div>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${escapeHtml(v.title)}</div>
        <div class="video-date">${escapeHtml(v.date)}</div>
      </div>
    `;
    card.addEventListener('click', () => openVideoModal(v));
    grid.appendChild(card);
  });
}

function openVideoModal(video, keepCurrentPlayer = false) {
  const videoId = normalizeYouTubeId(video.id);
  if (!videoId) return;
  const currentVideoId = document.getElementById('video-mini-player')?.dataset.videoId;
  const shouldReloadVideo = !keepCurrentPlayer || currentVideoId !== videoId;
  if (shouldReloadVideo) closeVideoMiniPlayer();
  prepareModalOpen();
  currentModalVideo = video;
  modalMediaInteracted = true;
  currentMediaTitle = video.title || 'YouTube';
  const overlay = document.getElementById('modal-overlay');
  const coverContainer = document.getElementById('modal-cover-container');
  coverContainer.innerHTML = `
    <div class="modal-cover-placeholder video-modal-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    </div>`;
  document.getElementById('modal-title').textContent = video.title;
  document.getElementById('modal-artist').textContent = 'YouTube';
  document.getElementById('modal-tags').innerHTML = `
    <span class="modal-tag">${escapeHtml(video.date)}</span>
    <span class="modal-tag video">${escapeHtml(getText('modal.tag_video'))}</span>
  `;

  const embedDiv = document.getElementById('modal-embed');
  embedDiv.hidden = false;
  embedDiv.innerHTML = '<div class="modal-video-placeholder" id="modal-video-placeholder" aria-hidden="true"></div>';

  const platforms = document.getElementById('modal-platforms');
  platforms.className = 'platform-links';
  platforms.innerHTML = `
    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" class="platform-link">${escapeHtml(getText('modal.open_youtube'))}</a>
  `;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    showVideoPlayerInModal(video, videoId, shouldReloadVideo);
    document.getElementById('modal-close')?.focus();
  });
}

async function fetchYouTubeRSS() {
  try {
    const response = await fetch(RSS_JSON_URL);
    if (!response.ok) throw new Error('RSS JSON request failed');
    const data = await response.json();
    const videos = (data.items || []).map(item => ({
      id: getYouTubeIdFromUrl(item.link || item.guid || ''),
      title: item.title || '',
      date: new Date(item.pubDate || '').getFullYear() || '',
    })).filter(video => video.id);
    if (videos.length > 0) {
      renderVideos(videos);
      return;
    }
  } catch (_) {}

  try {
    const res = await fetch(CORS_PROXY);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const videos = parseYouTubeXml(data.contents);
    if (videos.length > 0) { renderVideos(videos); return; }
  } catch(_) {}

  // Fallback
  try {
    const res2 = await fetch(`https://corsproxy.io/?${encodeURIComponent(RSS_URL)}`);
    if (!res2.ok) throw new Error();
    const videos = parseYouTubeXml(await res2.text());
    if (videos.length > 0) { renderVideos(videos); return; }
  } catch(_) {}

  // Static fallback
  renderVideos(FALLBACK_VIDEOS);
}

fetchYouTubeRSS();

document.getElementById('persistent-player-stop')?.addEventListener('click', stopPersistentPlayer);
document.getElementById('persistent-player-title')?.addEventListener('click', openPersistentPlayerTrackModal);
document.getElementById('persistent-player-play')?.addEventListener('click', () => {
  if (!persistentSpotifyTrackId) return;
  if (persistentPlaying) pauseSpotifyTrack();
  else resumeSpotifyTrack();
});
document.getElementById('video-mini-title')?.addEventListener('click', openVideoMiniPlayerModal);
document.getElementById('video-mini-close')?.addEventListener('click', closeVideoMiniPlayer);
window.addEventListener('resize', positionVideoPlayerInModal);
window.addEventListener('scroll', positionVideoPlayerInModal, { passive: true });
document.getElementById('persistent-progress-bar')?.addEventListener('click', event => {
  if (!persistentDuration || !spotifyController) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const targetSeconds = ratio * persistentDuration;
  spotifyController.seek?.(Math.floor(targetSeconds * 1000));
  persistentPosition = targetSeconds;
  updatePersistentPlayerUi();
});

// ====== KEYBOARD ======
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (contactDialogOverlay && !contactDialogOverlay.hidden) {
      closeContactDialog();
    } else {
      closeModal();
    }
    return;
  }

  const openModalElement = document.getElementById('modal-overlay')?.classList.contains('open')
    ? document.getElementById('modal')
    : null;
  const activeDialog = contactDialogOverlay && !contactDialogOverlay.hidden
    ? contactDialog
    : openModalElement;

  if (event.key === 'Tab' && activeDialog) {
    const focusable = [...activeDialog.querySelectorAll('button, a[href], iframe, [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.disabled);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

});



