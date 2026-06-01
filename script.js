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

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['id'];
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

function getSpotifyOembedUrl(item) {
  const id = item.spotifyTrackId || item.spotifyId;
  if (!id) return null;
  const type = item.spotifyTrackId ? 'track' : 'album';
  return `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`;
}

async function resolveCoverFromSpotify(item) {
  const oembedUrl = getSpotifyOembedUrl(item);
  if (!oembedUrl) return null;
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const json = await response.json();
    return json.thumbnail_url || null;
  } catch (error) {
    return null;
  }
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
  const typeClass = normalizedType === 'kolaborasi' ? 'disco-type collab' : normalizedType === 'grup musik hasbi lh' ? 'disco-type group' : 'disco-type';
  const typeKeyMap = {
    'solo': 'filter.category.Solo',
    'kolaborasi': 'filter.category.Kolaborasi',
    'grup musik hasbi lh': 'filter.category.grup',
    'artis lain': 'filter.category.artis'
  };
  const typeLabel = (typeKeyMap[normalizedType] ? getText(typeKeyMap[normalizedType]) : (item.type || 'Single'));
  const artistLine = item.artist ? `<br><span style="font-size:11px;color:var(--muted2);">${item.artist}</span>` : '';

  card.innerHTML = `
    <div class="disco-cover">
      ${item.cover 
        ? `<img class="disco-img" src="${item.cover}" alt="${item.title}" loading="lazy">`
        : `<div class="disco-cover-placeholder" style="background:linear-gradient(135deg,${c1},${c2})">${initials}</div>`
      }
      <div class="disco-play-overlay">
        <div class="play-icon">
          <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="4,2 16,9 4,16"/></svg>
        </div>
      </div>
    </div>
    <div class="disco-info">
      <div class="disco-title">${item.title}${artistLine}</div>
      <div class="disco-meta">
          <span class="disco-year">${yearLabel}</span>
          <span class="${typeClass}">${typeLabel}</span>
        </div>
    </div>
  `;

  const initialCoverImage = card.querySelector('.disco-img');
  if (initialCoverImage) {
    initialCoverImage.onerror = () => initialCoverImage.replaceWith(createCoverPlaceholder(initials, c1, c2));
  }

  card.addEventListener('click', () => openModal(item, c1, c2, isProduced));

  if (!item.cover && (item.spotifyTrackId || item.spotifyId)) {
    resolveCoverFromSpotify(item).then(url => {
      if (!url) return;
      item.cover = url;
      const placeholder = card.querySelector('.disco-cover-placeholder');
      if (placeholder) {
        const img = document.createElement('img');
        img.className = 'disco-img';
        img.src = url;
        img.alt = item.title;
        img.loading = 'lazy';
        img.onerror = () => img.replaceWith(createCoverPlaceholder(initials, c1, c2));
        placeholder.replaceWith(img);
      }
    });
  }

  return card;
}

function openModal(item, c1, c2, isProduced) {
  const overlay = document.getElementById('modal-overlay');
  const initials = makeInitials(item.title);

  // Cover
  const coverContainer = document.getElementById('modal-cover-container');
  if (item.cover) {
    coverContainer.innerHTML = `<img class="modal-cover" src="${item.cover}" alt="${item.title}">`;
  } else {
    coverContainer.innerHTML = `<div class="modal-cover-placeholder" style="background:linear-gradient(135deg,${c1},${c2})">${initials}</div>`;
    if (item.spotifyTrackId || item.spotifyId) {
      resolveCoverFromSpotify(item).then(url => {
        if (!url) return;
        item.cover = url;
        coverContainer.innerHTML = `<img class="modal-cover" src="${url}" alt="${item.title}">`;
      });
    }
  }

  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-artist').textContent = item.artist ? `by ${item.artist}` : 'Hasbi LH';

  const tags = document.getElementById('modal-tags');
  const yearLabel = item.year || '—';
  const normalizedType = (item.type || '').toString().trim().toLowerCase();
  const typeKeyMap = {
    'solo': 'filter.category.Solo',
    'kolaborasi': 'filter.category.Kolaborasi',
    'grup musik hasbi lh': 'filter.category.grup',
    'artis lain': 'filter.category.artis'
  };
  const typeLabelTranslated = typeKeyMap[normalizedType] ? getText(typeKeyMap[normalizedType]) : item.type;
  tags.innerHTML = `
    <span class="modal-tag">${yearLabel}</span>
    <span class="modal-tag">${isProduced ? getText('film.produced') : typeLabelTranslated}</span>
  `;

  // Spotify embed
  const embedDiv = document.getElementById('modal-embed');
  const spotifyTrackId = item.spotifyTrackId;
  const spotifyAlbumId = item.spotifyId;
  const isSpotifyTrack = spotifyTrackId && /^[A-Za-z0-9]{22}$/.test(spotifyTrackId);
  const isSpotifyAlbum = !spotifyTrackId && spotifyAlbumId && /^[A-Za-z0-9]{22}$/.test(spotifyAlbumId);
  const searchArtist = item.artist || 'Hasbi LH';
  const searchQuery = encodeURIComponent(`${item.title} ${searchArtist}`);

  if (isSpotifyTrack) {
    embedDiv.innerHTML = `<iframe style="border-radius:8px" 
      src="https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0" 
      width="100%" height="152" frameBorder="0" 
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
      loading="lazy"></iframe>`;
  } else if (isSpotifyAlbum) {
    embedDiv.innerHTML = `<iframe style="border-radius:8px" 
      src="https://open.spotify.com/embed/album/${spotifyAlbumId}?utm_source=generator&theme=0" 
      width="100%" height="152" frameBorder="0" 
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
      loading="lazy"></iframe>`;
  } else {
    embedDiv.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">
      <p>Spotify embed tidak tersedia untuk rilisan ini. Gunakan tautan pencarian.</p>
    </div>`;
  }

  // Platform links
  const platformMeta = platformMetadata[item.title] || {};
  const platforms = document.getElementById('modal-platforms');
  const spotifyUrl = isSpotifyTrack
    ? `https://open.spotify.com/track/${spotifyTrackId}`
    : isSpotifyAlbum
      ? `https://open.spotify.com/album/${spotifyAlbumId}`
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
  const deezerUrl = deezerTrack
    ? `https://www.deezer.com/en/track/${deezerTrack}`
    : item.deezerId
      ? `https://www.deezer.com/en/album/${item.deezerId}`
      : `https://www.deezer.com/search/${searchQuery}`;
  const tidalTrack = platformMeta.tidalTrackId || item.tidalTrackId;
  const tidalAlbum = platformMeta.tidalAlbumId || item.tidalAlbumId;
  const tidalUrl = tidalTrack
    ? `https://tidal.com/browse/track/${tidalTrack}`
    : tidalAlbum
      ? `https://tidal.com/browse/album/${tidalAlbum}`
      : `https://tidal.com/search/${searchQuery}`;

  platforms.innerHTML = `
    <a href="${spotifyUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.6-.12-.421.18-.78.6-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.241 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.42-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.781-.18-.601.18-1.2.78-1.381 4.5-1.14 11.28-.86 15.72 1.621.479.3.599 1.02.28 1.5-.319.48-1.041.6-1.52.28z"/>
      </svg>
      Spotify
    </a>
    <a href="${appleMusicUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      Apple Music
    </a>
    <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      YouTube
    </a>
    <a href="${ytMusicUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      YT Music
    </a>
    <a href="https://soundcloud.com/search?q=${searchQuery}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 17.939h-.411c-.907.058-1.586.518-1.739 1.398-.355.167-.671.326-.671.326s1.916.114 4.129.114c2.213 0 4.129-.114 4.129-.114s-.316-.159-.671-.326c-.153-.88-.832-1.34-1.739-1.398H9v-5.969c0-.307.029-.614.089-.91.06-.296.153-.58.278-.841.125-.261.284-.489.472-.683.188-.194.406-.345.647-.45.241-.105.497-.158.765-.158.269 0 .525.053.766.158.241.105.459.256.647.45.188.194.347.422.472.683.125.261.218.545.278.841.06.296.089.603.089.91V17.939zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.083c-5.994 0-10.861-4.867-10.861-10.861S6.006 1.361 12 1.361 22.861 6.228 22.861 12.222 17.994 22.083 12 22.083z"/>
      </svg>
      SoundCloud
    </a>
    <a href="${deezerUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.03h5.19V8.38H6.27zM18.81 8.38v3.03H24V8.38h-5.19zM6.27 12.61v3.03h5.19v-3.03H6.27zM18.81 12.61v3.03H24v-3.03h-5.19zM6.27 16.83v3.03h5.19v-3.03H6.27zM12.54 16.83v3.03h5.19v-3.03h-5.19zM0 16.83v3.03h5.19v-3.03H0zM12.54 4.16v3.03h5.19V4.16h-5.19zM0 4.16v3.03h5.19V4.16H0zM0 8.38v3.03h5.19V8.38H0zM0 12.61v3.03h5.19v-3.03H0z"/>
      </svg>
      Deezer
    </a>
    <a href="${tidalUrl}" target="_blank" rel="noopener noreferrer" class="platform-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.844 17.656c-1.961 0-3.552-1.59-3.552-3.552 0-1.962 1.59-3.552 3.552-3.552s3.552 1.59 3.552 3.552c0 1.962-1.59 3.552-3.552 3.552zm6.504-5.024c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm-13.008 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z"/>
      </svg>
      Tidal
    </a>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { document.getElementById('modal-embed').innerHTML = ''; }, 300);
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
  renderDisco('all', 'all', '', 'date-desc', 1);
}

function renderDisco(filterYear, filterCategory, searchQuery, sortBy, page) {
  page = page || 1;
  currentPage = page;

  const grid = document.getElementById('disco-grid');
  grid.innerHTML = '';
  let items = discographyData.slice();

  // Filter by year
  if (filterYear !== 'all') items = items.filter(i => String(i.year) === filterYear);

  // Filter by category
  if (filterCategory && filterCategory !== 'all') items = items.filter(i => i.type === filterCategory);

  // Search filter
  if (searchQuery) items = items.filter(i => i.title.toLowerCase().includes(searchQuery) || (i.artist||'').toLowerCase().includes(searchQuery));

  // Sort items
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

  filteredItems = items;

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results">${getText('no_results.discography')}</div>`;
    renderPagination(0, 1);
    return;
  }

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  pageItems.forEach((item, idx) => {
    grid.appendChild(buildCard(item, startIdx + idx, false));
  });

  renderPagination(items.length, totalPages);
}

function renderPagination(totalItems, totalPages) {
  const container = document.getElementById('disco-pagination');
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
let currentSort = 'date-desc';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('filter-category')) {
      document.querySelectorAll('.filter-btn.filter-category').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      currentCategory = (cat === undefined || cat === '') ? 'all' : cat;
    } else {
      document.querySelectorAll('.filter-btn:not(.filter-category)').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const yr = btn.dataset.year;
      currentYear = (yr === undefined || yr === '') ? 'all' : yr;
    }
    renderDisco(currentYear, currentCategory, document.getElementById('search-input').value.toLowerCase().trim(), currentSort, 1);
  });
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
const CORS_PROXY = `https://api.allorigins.win/get?url=${encodeURIComponent(RSS_URL)}`;

function renderVideos(videos) {
  const grid = document.getElementById('videos-grid');
  grid.innerHTML = '';
  if (!videos || videos.length === 0) {
    grid.innerHTML = `<div class="no-results">${getText('no_results.videos')} <a href="${CHANNEL_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2)">${getText('videos.open_channel')}</a></div>`;
    return;
  }
  videos.slice(0, 9).forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    const thumb = `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`;
    card.innerHTML = `
      <div class="video-thumb">
        <img src="${thumb}" alt="${v.title}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${v.id}/default.jpg'">
        <div class="video-play-btn">
          <div class="yt-play">
            <svg width="16" height="12" viewBox="0 0 16 12"><polygon points="0,0 16,6 0,12"/></svg>
          </div>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.title}</div>
        <div class="video-date">${v.date}</div>
      </div>
    `;
    card.addEventListener('click', () => openVideoModal(v));
    grid.appendChild(card);
  });
}

function openVideoModal(video) {
  const overlay = document.getElementById('modal-overlay');
  const coverContainer = document.getElementById('modal-cover-container');
  coverContainer.innerHTML = `<div class="modal-cover-placeholder" style="background:linear-gradient(135deg,#0d1528,#163f72)">YT</div>`;
  document.getElementById('modal-title').textContent = video.title;
  document.getElementById('modal-artist').textContent = 'YouTube';
  document.getElementById('modal-tags').innerHTML = `
    <span class="modal-tag">${video.date}</span>
    <span class="modal-tag">${getText('modal.tag_video')}</span>
  `;

  const embedDiv = document.getElementById('modal-embed');
  embedDiv.innerHTML = `
    <div style="position:relative;padding-top:56.25%;">
      <iframe
        src="https://www.youtube.com/embed/${video.id}?rel=0"
        title="${video.title.replace(/"/g, '&quot;')}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
      ></iframe>
    </div>
  `;

  const platforms = document.getElementById('modal-platforms');
  platforms.innerHTML = `
    <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer" class="platform-link">${getText('modal.open_youtube')}</a>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function fetchYouTubeRSS() {
  try {
    const res = await fetch(CORS_PROXY);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    const videos = Array.from(entries).map(e => ({
      id: e.querySelector('videoId')?.textContent || '',
      title: e.querySelector('title')?.textContent || '',
      date: new Date(e.querySelector('published')?.textContent||'').getFullYear() || '',
    })).filter(v => v.id);
    if (videos.length > 0) { renderVideos(videos); return; }
  } catch(_) {}

  // Fallback
  try {
    const res2 = await fetch(`https://corsproxy.io/?${encodeURIComponent(RSS_URL)}`);
    if (!res2.ok) throw new Error();
    const xml = new DOMParser().parseFromString(await res2.text(), 'text/xml');
    const entries = xml.querySelectorAll('entry');
    const videos = Array.from(entries).map(e => ({
      id: e.querySelector('videoId')?.textContent || '',
      title: e.querySelector('title')?.textContent || '',
      date: new Date(e.querySelector('published')?.textContent||'').getFullYear() || '',
    })).filter(v => v.id);
    if (videos.length > 0) { renderVideos(videos); return; }
  } catch(_) {}

  // Static fallback
  renderVideos(FALLBACK_VIDEOS);
}

fetchYouTubeRSS();

// ====== KEYBOARD ESC ======
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });



