/* ═══════════════════════════════════════════════════════════
   MARQUEE — Frontend Logic
   ═══════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);
const TV_TAB = 'TV';

// ── State ────────────────────────────────────────────────
let busy = false;
let allRecs = [];
let currentSort = 'default';
let lastSearchQuery = '';
let currentSection = 'hero';
let prevSection = 'hero';
let watchlistData = [];
let watchlistFilter = 'all';
let watchlistTypeFilter = 'all'; // 'all' | 'movie' | 'tv'
let gameScore = 0;
let gameInterval = null;
let gameActive = false;

// ── Elements ─────────────────────────────────────────────
const heroSection      = $('heroSection');
const loadingScreen    = $('loadingScreen');
const resultsSection   = $('resultsSection');
const watchlistSection = $('watchlistSection');
const movieInput       = $('movieInput');
const searchBtn        = $('searchBtn');
const searchAgainBtn   = $('searchAgainBtn');
const moreRecsBtn      = $('moreRecsBtn');
const moviesGrid       = $('moviesGrid');
const toast            = $('toast');
const toastMsg         = $('toastMsg');

// ── Textarea auto-resize ──────────────────────────────────
movieInput.addEventListener('input', () => {
  movieInput.style.height = 'auto';
  const newH = Math.min(movieInput.scrollHeight, 140);
  movieInput.style.height = newH + 'px';
  movieInput.style.overflowY = movieInput.scrollHeight > 140 ? 'auto' : 'hidden';
});

// ── Quick search pills ────────────────────────────────────
document.querySelectorAll('.pill[data-query]').forEach(btn => {
  btn.addEventListener('click', () => {
    movieInput.value = btn.dataset.query;
    movieInput.style.height = 'auto';
    movieInput.style.height = Math.min(movieInput.scrollHeight, 140) + 'px';
    doSearch();
  });
});

// ── Event listeners ───────────────────────────────────────
searchBtn.addEventListener('click', doSearch);

movieInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    doSearch();
  }
});

const goHero = () => {
  showSection('hero');
  movieInput.value = '';
  movieInput.style.height = '';
  setTimeout(() => movieInput.focus(), 50);
};

searchAgainBtn.addEventListener('click', goHero);
$('newSearchBtn').addEventListener('click', goHero);

moreRecsBtn.addEventListener('click', () => {
  if (busy) return;
  doSearch({ refresh: true });
});

// Sort buttons
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderGrid(getSorted(allRecs));
  });
});

// Nav watchlist button
$('navWatchlistBtn').addEventListener('click', () => {
  showSection('watchlist');
  loadWatchlist();
});

// Back from watchlist
$('backFromWatchlistBtn').addEventListener('click', () => {
  showSection(prevSection);
});

// New Search from watchlist
$('watchlistNewSearchBtn').addEventListener('click', goHero);

// Watchlist status filter tabs
document.querySelectorAll('#watchlistFilterTabs .filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#watchlistFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    watchlistFilter = btn.dataset.filter;
    renderWatchlist();
  });
});

// Watchlist type filter tabs
document.querySelectorAll('#watchlistTypeFilterTabs .filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#watchlistTypeFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    watchlistTypeFilter = btn.dataset.filter;
    renderWatchlist();
  });
});

// ── Main search ───────────────────────────────────────────
async function doSearch(opts = {}) {
  const { refresh = false } = opts;
  const query = refresh ? lastSearchQuery : movieInput.value.trim();
  const excludeTitles = refresh ? allRecs.map(r => r.title).filter(Boolean) : [];

  if (!query) { showError('Please describe what you want to watch'); movieInput.focus(); return; }
  if (busy) return;

  if (!refresh) lastSearchQuery = query;

  busy = true;
  searchBtn.disabled = true;
  moreRecsBtn.disabled = true;
  currentSort = 'default';
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === 'default');
  });

  showSection('loading');

  try {
    startGame();
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, excludeTitles }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${res.status})`);
    }
    const data = await res.json();
    allRecs = data.recommendations;
    renderResults(data);
    showSection('results');
  } catch (err) {
    showSection('hero');
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    busy = false;
    searchBtn.disabled = false;
    moreRecsBtn.disabled = false;
    stopGame();
  }
}

// ── Sorting ───────────────────────────────────────────────
function getSorted(recs) {
  const copy = [...recs];
  if (currentSort === 'year') {
    copy.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  } else if (currentSort === 'imdb') {
    copy.sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0));
  } else if (currentSort === 'rt') {
    copy.sort((a, b) => parseRt(b.rtRating) - parseRt(a.rtRating));
  }
  return copy;
}

function parseRt(val) {
  if (!val) return 0;
  return parseInt(val.replace('%', '')) || 0;
}

// ── Render ────────────────────────────────────────────────
function renderResults({ seed, queryLabel, recommendations }) {
  renderSeedMovie(seed, queryLabel);
  renderGrid(getSorted(recommendations));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderGrid(recs) {
  moviesGrid.innerHTML = '';
  recs.forEach((movie, i) => moviesGrid.appendChild(createMovieRow(movie, i)));
}

function renderSeedMovie(seed, queryLabel) {
  const banner = $('seedBanner');
  const posterWrap = $('seedPosterWrap');
  const posterEl   = $('seedPoster');
  const fallbackEl = $('seedPosterFallback');
  const seedInfo   = $('seedInfo');

  // Remove any existing watchlist button from seed banner
  const existingWBtn = seedInfo.querySelector('.watchlist-btn');
  if (existingWBtn) existingWBtn.remove();

  if (!seed) {
    // Query mode — no seed movie identified
    banner.classList.add('seed-banner--query');
    posterWrap.hidden = true;
    $('seedLabel').textContent = 'Your search';
    $('seedTitle').textContent = queryLabel || '';
    $('seedQueryTag').hidden = true;
    $('seedRatings').innerHTML = '';
    $('seedGenres').innerHTML = '';
    $('seedSynopsis').textContent = '';
    $('seedCredits').textContent = '';
    return;
  }

  // Movie mode — seed movie identified
  banner.classList.remove('seed-banner--query');
  posterWrap.hidden = false;

  if (seed.poster) {
    posterEl.src = seed.poster;
    posterEl.alt = `${seed.title || ''} poster`;
    posterEl.hidden = false;
    fallbackEl.hidden = true;
  } else {
    posterEl.hidden = true;
    fallbackEl.hidden = false;
  }

  $('seedLabel').textContent = 'Because you liked';

  const year = seed.year ? ` (${seed.year.match?.(/\d{4}/)?.[0] || seed.year})` : '';
  $('seedTitle').textContent = (seed.title || 'Unknown') + year;

  if (queryLabel) {
    $('seedQueryTag').textContent = `"${queryLabel}"`;
    $('seedQueryTag').hidden = false;
  } else {
    $('seedQueryTag').hidden = true;
  }

  $('seedRatings').innerHTML = [
    seed.imdbRating ? `<span class="badge badge-imdb badge-lg">★ ${seed.imdbRating} IMDb</span>` : '',
    seed.rtRating   ? `<span class="badge badge-rt badge-lg">🍅 ${seed.rtRating}</span>` : '',
  ].filter(Boolean).join('');

  $('seedGenres').innerHTML = (seed.genre || [])
    .map(g => `<span class="genre-tag">${esc(g)}</span>`).join('');

  $('seedSynopsis').textContent = seed.synopsis || '';

  const credits = [];
  if (seed.director) credits.push(`Directed by ${seed.director}`);
  if (seed.actors) credits.push(seed.actors.split(', ').slice(0, 3).join(', '));
  $('seedCredits').textContent = credits.join(' · ');

  // Add watchlist button for seed
  const inWL = isInWatchlist(seed.title);
  const wBtn = document.createElement('button');
  wBtn.className = `watchlist-btn${inWL ? ' watchlist-btn--added' : ''}`;
  wBtn.textContent = inWL ? '✓ Added' : '＋ Watchlist';
  if (inWL) wBtn.disabled = true;
  wBtn.addEventListener('click', () => addToWatchlist(seed, wBtn));
  seedInfo.appendChild(wBtn);
}

// ── Oscar badge ───────────────────────────────────────────
function buildOscarHtml(oscarWins, awards) {
  if (oscarWins && oscarWins.length > 0) {
    const shown = oscarWins.slice(0, 2);
    const cats  = shown.map(c => esc(c)).join(' · ');
    const hasMore = oscarWins.length > 2;
    const extra = hasMore ? `<span class="oscar-more"> +${oscarWins.length - 2} more</span>` : '';
    const tooltipContent = oscarWins.map(c => `🏆 ${esc(c)}`).join('<br>');
    const tooltip = hasMore
      ? `<span class="oscar-tooltip">${tooltipContent}</span>`
      : '';
    return `<span class="oscar-badge${hasMore ? ' has-tooltip' : ''}">🏆 ${cats}${extra}${tooltip}</span>`;
  }
  if (!awards) return '';
  const nom = awards.match(/Nominated for (\d+) Oscar/i);
  if (nom) {
    return `<span class="oscar-badge oscar-nom">★ ${nom[1]} Oscar nom${parseInt(nom[1]) > 1 ? 's' : ''}</span>`;
  }
  return '';
}

// ── Movie row ─────────────────────────────────────────────
function createMovieRow(movie, index) {
  const row = document.createElement('article');
  row.className = 'movie-card';
  row.style.animationDelay = `${index * 50}ms`;

  const imdbUrl = movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}/` : null;

  if (imdbUrl) {
    row.addEventListener('click', e => {
      if (e.target.closest('a') || e.target.closest('.watchlist-btn')) return;
      window.open(imdbUrl, '_blank', 'noopener,noreferrer');
    });
  }

  const metaParts = [
    movie.year?.match?.(/\d{4}/)?.[0] || movie.year,
    movie.runtime,
    movie.director ? `Dir. ${movie.director}` : '',
  ].filter(Boolean);

  const titleHtml = imdbUrl
    ? `<a href="${imdbUrl}" target="_blank" rel="noopener noreferrer">${esc(movie.title || 'Unknown')}</a>`
    : esc(movie.title || 'Unknown');

  const oscarHtml = buildOscarHtml(movie.oscarWins, movie.awards);

  const ratingsHtml = [
    movie.imdbRating ? `<span class="badge badge-imdb">★ ${movie.imdbRating}</span>` : '',
    movie.rtRating   ? `<span class="badge badge-rt">🍅 ${movie.rtRating}</span>` : '',
    oscarHtml,
  ].filter(Boolean).join('');

  const genresHtml = (movie.genre || []).slice(0, 3)
    .map(g => `<span class="genre-tag">${esc(g)}</span>`).join('');

  const streamingHtml = buildStreamingHtml(movie.streaming || []);

  const inWL = isInWatchlist(movie.title);

  row.innerHTML = `
    <div class="row-num">${index + 1}</div>
    <div class="row-thumb${movie.poster ? '' : ' no-img'}">
      ${movie.poster ? `<img src="${esc(movie.poster)}" alt="${esc(movie.title || '')} poster" loading="lazy">` : ''}
      <div class="row-thumb-fallback">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
      </div>
    </div>
    <div class="row-content">
      <div class="row-top">
        <h3 class="row-title">${titleHtml}</h3>
        <div class="row-ratings">${ratingsHtml}</div>
      </div>
      ${metaParts.length ? `<div class="row-meta">${esc(metaParts.join(' · '))}</div>` : ''}
      ${genresHtml ? `<div class="row-genres">${genresHtml}</div>` : ''}
      ${movie.synopsis ? `<p class="row-synopsis">${esc(movie.synopsis)}</p>` : ''}
      <div class="row-reason">
        <div class="reason-bar"></div>
        <div class="reason-body">
          <div class="reason-label">Why it matches</div>
          <p class="reason-text">${esc(movie.reason || '')}</p>
        </div>
      </div>
      ${streamingHtml}
      <button class="watchlist-btn${inWL ? ' watchlist-btn--added' : ''}" ${inWL ? 'disabled' : ''}>
        ${inWL ? '✓ Added' : '＋ Watchlist'}
      </button>
    </div>
  `;

  const wBtn = row.querySelector('.watchlist-btn');
  if (wBtn) {
    wBtn.addEventListener('click', e => {
      e.stopPropagation();
      addToWatchlist(movie, wBtn);
    });
  }

  return row;
}

// ── Streaming badges ──────────────────────────────────────
const STREAMING_COLORS = {
  'Netflix':            { bg: '#E50914', text: '#fff' },
  'Amazon Prime Video': { bg: '#00A8E0', text: '#fff' },
  'Amazon Prime':       { bg: '#00A8E0', text: '#fff' },
  'Max':                { bg: '#002BE7', text: '#fff' },
  'HBO Max':            { bg: '#002BE7', text: '#fff' },
  'Hulu':               { bg: '#1CE783', text: '#000' },
  'Disney+':            { bg: '#113CCF', text: '#fff' },
  'Apple TV+':          { bg: '#555555', text: '#fff' },
  'Paramount+':         { bg: '#0064FF', text: '#fff' },
  'Peacock':            { bg: '#000000', text: '#fff' },
  'Tubi':               { bg: '#FA4516', text: '#fff' },
  'Kanopy':             { bg: '#3D9BE9', text: '#fff' },
};

function buildStreamingHtml(services) {
  if (!services || services.length === 0) return '';
  const badges = services.map(s => {
    const style = STREAMING_COLORS[s] || { bg: '#6C63FF', text: '#fff' };
    return `<span class="stream-badge" style="background:${style.bg};color:${style.text}">${esc(s)}</span>`;
  }).join('');
  return `<div class="streaming-row"><span class="streaming-label">Watch on</span>${badges}</div>`;
}

// ── Section display ───────────────────────────────────────
function showSection(name) {
  if (name !== 'watchlist') prevSection = currentSection;
  currentSection = name;
  heroSection.hidden      = name !== 'hero';
  loadingScreen.hidden    = name !== 'loading';
  resultsSection.hidden   = name !== 'results';
  watchlistSection.hidden = name !== 'watchlist';
}

// ── Watchlist title set (server-synced, title-based) ─────
const watchlistTitles = new Set();

function isInWatchlist(title) {
  return !!title && watchlistTitles.has(title.toLowerCase());
}

function markInWatchlist(title) {
  if (title) watchlistTitles.add(title.toLowerCase());
}

function unmarkInWatchlist(title) {
  if (title) watchlistTitles.delete(title.toLowerCase());
}

// ── Awards formatter (Oscars for films, Emmy for TV) ─────
function formatAwardsForWatchlist(movie) {
  const isTv = movie.type === 'series' || movie.type === 'episode';
  if (isTv) {
    if (!movie.awards) return '';
    const won = movie.awards.match(/Won (\d+) Emmy/i);
    if (won) return `${won[1]} Emmy win${parseInt(won[1]) > 1 ? 's' : ''}`;
    const nom = movie.awards.match(/Nominated for (\d+) Emmy/i);
    if (nom) return `${nom[1]} Emmy nomination${parseInt(nom[1]) > 1 ? 's' : ''}`;
    return '';
  }
  // Film — use specific Oscar category names from Claude
  if (movie.oscarWins && movie.oscarWins.length > 0) {
    return movie.oscarWins.join(' · ');
  }
  return '';
}

// ── Add to Watchlist ──────────────────────────────────────
async function addToWatchlist(movie, btn) {
  if (!movie || btn.disabled) return;

  btn.disabled = true;
  const origText = btn.textContent;
  btn.innerHTML = '<span class="watchlist-spinner"></span>';

  try {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: movie.title,
        year: movie.year,
        director: movie.director,
        genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || ''),
        awards: formatAwardsForWatchlist(movie),
        actors: movie.actors || '',
        type: movie.type || 'movie',
        imdbRating: movie.imdbRating || '',
        rtRating: movie.rtRating || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status}`);
    }

    markInWatchlist(movie.title);
    btn.textContent = '✓ Added';
    btn.classList.add('watchlist-btn--added');

    // Update count badge without full reload
    updateWatchlistCountBadge();

  } catch (err) {
    btn.disabled = false;
    btn.textContent = origText;
    showError(err.message || 'Failed to add to watchlist');
  }
}

// ── Watchlist count badge ─────────────────────────────────
async function updateWatchlistCountBadge() {
  try {
    const res = await fetch('/api/watchlist');
    if (!res.ok) return;
    const items = await res.json();
    // Sync the in-memory set with the sheet — single source of truth
    watchlistTitles.clear();
    items.forEach(item => { if (item.title) watchlistTitles.add(item.title.toLowerCase()); });
    const badge = $('watchlistCount');
    const count = items.length;
    if (count > 0) {
      badge.textContent = count;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  } catch { /* silent */ }
}

// ── Load & Render Watchlist ───────────────────────────────
async function loadWatchlist() {
  const listEl = $('watchlistList');
  listEl.innerHTML = '<p style="text-align:center;color:var(--text-3);padding:30px 0">Loading…</p>';

  try {
    const res = await fetch('/api/watchlist');
    watchlistData = await res.json();

    // Update header count
    const badge = $('watchlistCount');
    const count = watchlistData.length;
    badge.textContent = count;
    badge.hidden = count === 0;
    $('watchlistHeaderCount').textContent = count > 0 ? `${count} title${count !== 1 ? 's' : ''}` : '';

    renderWatchlist();
  } catch (err) {
    listEl.innerHTML = `<div class="watchlist-empty">Failed to load watchlist. Check your Google Sheets configuration.</div>`;
  }
}

function renderWatchlist() {
  const listEl = $('watchlistList');
  let filtered = watchlistData;
  if (watchlistFilter !== 'all') filtered = filtered.filter(item => item.status === watchlistFilter);
  if (watchlistTypeFilter === 'movie') filtered = filtered.filter(item => item.tab !== TV_TAB);
  if (watchlistTypeFilter === 'tv')    filtered = filtered.filter(item => item.tab === TV_TAB);

  if (filtered.length === 0) {
    const msg = watchlistData.length === 0
      ? 'Your watchlist is empty — add movies while browsing recommendations'
      : 'No titles match the current filters';
    listEl.innerHTML = `<div class="watchlist-empty">${esc(msg)}</div>`;
    return;
  }

  listEl.innerHTML = '';
  filtered.forEach(item => listEl.appendChild(createWatchlistRow(item)));
}

function createWatchlistRow(item) {
  const row = document.createElement('div');
  row.className = 'watchlist-row';

  const isWatched = item.status === 'Watched';
  const isTv = item.tab === 'TV';
  const metaParts = [item.year, item.genre].filter(Boolean);

  row.innerHTML = `
    <span class="watchlist-type-badge ${isTv ? 'tv' : 'movie'}">${isTv ? 'TV' : 'Film'}</span>
    <div class="watchlist-row-main">
      <div class="watchlist-row-title">${esc(item.title)}</div>
      ${metaParts.length ? `<div class="watchlist-row-meta">${esc(metaParts.join(' · '))}</div>` : ''}
      ${item.actors ? `<div class="watchlist-actors">${esc(item.actors)}</div>` : ''}
      ${item.awards ? `<div class="watchlist-oscar">🏆 ${esc(item.awards)}</div>` : ''}
    </div>
    <div class="tag-chip-wrap"></div>
    <button class="watchlist-status-btn ${isWatched ? 'watched' : 'not-watched'}">
      ${isWatched ? '✓ Watched' : 'Not Watched'}
    </button>
    <button class="watchlist-delete-btn" title="Remove">✕</button>
  `;

  // Tag chip UI
  initTagChips(row.querySelector('.tag-chip-wrap'), item);

  // Status toggle
  const statusBtn = row.querySelector('.watchlist-status-btn');
  statusBtn.addEventListener('click', async () => {
    const newStatus = item.status === 'Watched' ? 'Not Watched' : 'Watched';
    try {
      await fetch(`/api/watchlist/${item.rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, tab: item.tab }),
      });
      item.status = newStatus;
      const nowWatched = newStatus === 'Watched';
      statusBtn.className = `watchlist-status-btn ${nowWatched ? 'watched' : 'not-watched'}`;
      statusBtn.textContent = nowWatched ? '✓ Watched' : 'Not Watched';
      if (watchlistFilter !== 'all') renderWatchlist();
    } catch {
      showError('Failed to update status');
    }
  });

  // Delete
  const deleteBtn = row.querySelector('.watchlist-delete-btn');
  deleteBtn.addEventListener('click', async () => {
    deleteBtn.disabled = true;
    try {
      await fetch(`/api/watchlist/${item.rowIndex}?tab=${encodeURIComponent(item.tab)}`, {
        method: 'DELETE',
      });
      unmarkInWatchlist(item.title);
      watchlistData.forEach(d => {
        if (d.tab === item.tab && d.rowIndex > item.rowIndex) d.rowIndex -= 1;
      });
      watchlistData = watchlistData.filter(d => d !== item);
      renderWatchlist();
      const count = watchlistData.length;
      $('watchlistCount').textContent = count;
      $('watchlistCount').hidden = count === 0;
      $('watchlistHeaderCount').textContent = count > 0 ? `${count} title${count !== 1 ? 's' : ''}` : '';
    } catch {
      deleteBtn.disabled = false;
      showError('Failed to remove from watchlist');
    }
  });

  return row;
}

// ── Tag Chip UI ───────────────────────────────────────────
function initTagChips(container, item) {
  function getTags() {
    return item.tag ? item.tag.split(',').map(t => t.trim()).filter(Boolean) : [];
  }

  async function saveTags(tags) {
    const tagStr = tags.join(', ');
    item.tag = tagStr;
    try {
      await fetch(`/api/watchlist/${item.rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagStr, tab: item.tab }),
      });
    } catch {
      showError('Failed to save tag');
    }
  }

  function render() {
    container.innerHTML = '';
    const tags = getTags();

    tags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';

      const textSpan = document.createElement('span');
      textSpan.className = 'tag-chip-text';
      textSpan.textContent = tag;
      chip.appendChild(textSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-chip-remove';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove tag';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        const updated = getTags().filter(t => t !== tag);
        item.tag = updated.join(', ');
        saveTags(updated);
        render();
      });
      chip.appendChild(removeBtn);
      container.appendChild(chip);
    });

    const input = document.createElement('input');
    input.className = 'tag-chip-input';
    input.type = 'text';
    input.placeholder = tags.length === 0 ? 'Add tag…' : '＋';

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.replace(',', '').trim();
        if (val) {
          const current = getTags();
          if (!current.includes(val)) {
            const updated = [...current, val];
            item.tag = updated.join(', ');
            saveTags(updated);
          }
          input.value = '';
          render();
        }
      } else if (e.key === 'Backspace' && !input.value) {
        const current = getTags();
        if (current.length > 0) {
          const updated = current.slice(0, -1);
          item.tag = updated.join(', ');
          saveTags(updated);
          render();
        }
      }
    });

    container.appendChild(input);
  }

  container.addEventListener('click', () => {
    container.querySelector('.tag-chip-input')?.focus();
  });

  render();
}

// ── Movie Trivia ──────────────────────────────────────────
const TRIVIA_QUESTIONS = [
  // ── Directors ─────────────────────────────────────────────
  {
    category: 'Director',
    question: 'Who directed "Schindler\'s List" (1993)?',
    answer: 'Steven Spielberg',
    options: ['Steven Spielberg', 'Martin Scorsese', 'Oliver Stone', 'Roman Polanski'],
    fact: 'Spielberg was so emotionally drained making the film that he called Robin Williams daily for comic relief.',
  },
  {
    category: 'Director',
    question: '"Goodfellas," "Raging Bull," and "Taxi Driver" were all directed by whom?',
    answer: 'Martin Scorsese',
    options: ['Martin Scorsese', 'Francis Ford Coppola', 'Brian De Palma', 'Michael Mann'],
    fact: 'Scorsese has said "Raging Bull" is his most personal film.',
  },
  {
    category: 'Director',
    question: 'Who directed "Parasite" (2019), the first non-English film to win Best Picture?',
    answer: 'Bong Joon-ho',
    options: ['Bong Joon-ho', 'Park Chan-wook', 'Lee Chang-dong', 'Hwang Dong-hyuk'],
    fact: 'Bong Joon-ho thanked Scorsese in his speech, saying "I was ready to get up from my seat to pay respect."',
  },
  {
    category: 'Director',
    question: 'Who directed the original "Alien" (1979)?',
    answer: 'Ridley Scott',
    options: ['Ridley Scott', 'James Cameron', 'David Fincher', 'John Carpenter'],
    fact: 'The sequel "Aliens" (1986) was directed by James Cameron — a rare case of both being classics.',
  },
  {
    category: 'Director',
    question: '"The Grand Budapest Hotel," "Moonrise Kingdom," and "The Royal Tenenbaums" all share the same director. Who?',
    answer: 'Wes Anderson',
    options: ['Wes Anderson', 'Noah Baumbach', 'Paul Thomas Anderson', 'Sofia Coppola'],
    fact: 'Wes Anderson\'s meticulously symmetrical style is so distinctive it\'s been parodied worldwide.',
  },
  {
    category: 'Director',
    question: 'Who directed "2001: A Space Odyssey" (1968)?',
    answer: 'Stanley Kubrick',
    options: ['Stanley Kubrick', 'Ridley Scott', 'George Lucas', 'Steven Spielberg'],
    fact: 'NASA used "2001" footage to train Apollo astronauts. Kubrick thought real space footage looked fake by comparison.',
  },
  {
    category: 'Director',
    question: 'Which Japanese director made "Seven Samurai" (1954) and "Rashomon" (1950)?',
    answer: 'Akira Kurosawa',
    options: ['Akira Kurosawa', 'Yasujiro Ozu', 'Kenji Mizoguchi', 'Kon Ichikawa'],
    fact: '"Seven Samurai" was remade as "The Magnificent Seven" in 1960 and again in 2016.',
  },
  {
    category: 'Director',
    question: '"Pulp Fiction," "Inglourious Basterds," and "The Hateful Eight" were directed by whom?',
    answer: 'Quentin Tarantino',
    options: ['Quentin Tarantino', 'Robert Rodriguez', 'Guy Ritchie', 'Richard Linklater'],
    fact: 'Tarantino has stated he plans to retire after his 10th film.',
  },
  {
    category: 'Director',
    question: 'Who directed "Get Out" (2017), his feature directorial debut?',
    answer: 'Jordan Peele',
    options: ['Jordan Peele', 'Barry Jenkins', 'Ryan Coogler', 'Ava DuVernay'],
    fact: '"Get Out" was made for $4.5 million and grossed over $255 million worldwide.',
  },
  {
    category: 'Director',
    question: 'Who directed "La La Land" (2016) and "Whiplash" (2014)?',
    answer: 'Damien Chazelle',
    options: ['Damien Chazelle', 'Tom Hooper', 'Florian Zeller', 'Cary Fukunaga'],
    fact: 'Chazelle became the youngest Best Director winner in Oscar history at age 32.',
  },
  {
    category: 'Director',
    question: '"The Silence of the Lambs" was directed by which filmmaker?',
    answer: 'Jonathan Demme',
    options: ['Jonathan Demme', 'David Fincher', 'Michael Mann', 'Bryan Singer'],
    fact: 'Jonathan Demme was previously known for lighter films like "Stop Making Sense" — a concert film for Talking Heads.',
  },
  {
    category: 'Director',
    question: 'Who directed "Spirited Away" (2001)?',
    answer: 'Hayao Miyazaki',
    options: ['Hayao Miyazaki', 'Isao Takahata', 'Mamoru Oshii', 'Satoshi Kon'],
    fact: '"Spirited Away" is the only non-English-language film to win the Oscar for Best Animated Feature.',
  },
  {
    category: 'Director',
    question: 'Which director made both "Being John Malkovich" (1999) and "Her" (2013)?',
    answer: 'Spike Jonze',
    options: ['Spike Jonze', 'Michel Gondry', 'Charlie Kaufman', 'David O. Russell'],
    fact: 'Spike Jonze started his career directing iconic music videos for Beastie Boys and Weezer.',
  },
  {
    category: 'Director',
    question: 'Which director made "Eternal Sunshine of the Spotless Mind" (2004)?',
    answer: 'Michel Gondry',
    options: ['Michel Gondry', 'Spike Jonze', 'Charlie Kaufman', 'Alejandro González Iñárritu'],
    fact: 'The film was shot mostly in-camera — many of its surreal effects used no CGI.',
  },
  {
    category: 'Director',
    question: 'Christopher Nolan\'s first feature film (1998), shot on weekends for ~£6,000, was called what?',
    answer: 'Following',
    options: ['Following', 'Memento', 'Insomnia', 'Batman Begins'],
    fact: 'Nolan shot "Following" on black-and-white 16mm film with friends over a year of weekends.',
  },
  {
    category: 'Director',
    question: '"Mulholland Drive" and "Blue Velvet" were directed by which American filmmaker?',
    answer: 'David Lynch',
    options: ['David Lynch', 'David Fincher', 'Joel Coen', 'Darren Aronofsky'],
    fact: 'Lynch is also a musician, painter, and coffee entrepreneur — his brand is called David Lynch Signature Cup.',
  },
  {
    category: 'Director',
    question: 'Alfonso Cuarón directed "Gravity" (2013) and which Harry Potter film?',
    answer: 'Prisoner of Azkaban',
    options: ['Prisoner of Azkaban', 'Chamber of Secrets', 'Goblet of Fire', 'Order of the Phoenix'],
    fact: 'Cuarón is Mexican — making him the first Latin American director of a Harry Potter film.',
  },

  // ── Famous Quotes ──────────────────────────────────────────
  {
    category: 'Famous Quote',
    question: '"Here\'s looking at you, kid." — Which classic film?',
    answer: 'Casablanca',
    options: ['Casablanca', 'Gone with the Wind', 'The African Queen', 'Citizen Kane'],
    fact: 'Humphrey Bogart improvised the line. The American Film Institute ranked it #5 on its list of great movie quotes.',
  },
  {
    category: 'Famous Quote',
    question: '"You can\'t handle the truth!" — Which film?',
    answer: 'A Few Good Men',
    options: ['A Few Good Men', 'The Verdict', 'Philadelphia', 'JFK'],
    fact: 'Jack Nicholson improvised slightly — the script said "You already have the truth!"',
  },
  {
    category: 'Famous Quote',
    question: '"I\'ll be back." — Which film?',
    answer: 'The Terminator',
    options: ['The Terminator', 'Total Recall', 'Predator', 'RoboCop'],
    fact: 'Schwarzenegger originally argued for "I will be back" — he thought contractions sounded too human for a robot.',
  },
  {
    category: 'Famous Quote',
    question: '"Why so serious?" — Which film?',
    answer: 'The Dark Knight',
    options: ['The Dark Knight', 'Batman (1989)', 'Joker (2019)', 'Batman Returns'],
    fact: 'Heath Ledger won a posthumous Oscar for his Joker. He passed away before the film\'s release.',
  },
  {
    category: 'Famous Quote',
    question: '"To infinity and beyond!" — Which film?',
    answer: 'Toy Story',
    options: ['Toy Story', 'WALL-E', "A Bug's Life", 'Monsters, Inc.'],
    fact: '"Toy Story" (1995) was the first fully computer-animated feature film ever made.',
  },
  {
    category: 'Famous Quote',
    question: '"Life is like a box of chocolates." — Which film?',
    answer: 'Forrest Gump',
    options: ['Forrest Gump', 'Chocolat', 'The Pursuit of Happyness', 'Big Fish'],
    fact: 'The complete quote is "Life is like a box of chocolates, you never know what you\'re gonna get."',
  },
  {
    category: 'Famous Quote',
    question: '"You had me at hello." — Which film?',
    answer: 'Jerry Maguire',
    options: ['Jerry Maguire', 'As Good as It Gets', 'When Harry Met Sally', 'Pretty Woman'],
    fact: 'Renée Zellweger delivered the line. The film launched the catchphrase "Show me the money!" in the same year.',
  },
  {
    category: 'Famous Quote',
    question: '"I see dead people." — Which film?',
    answer: 'The Sixth Sense',
    options: ['The Sixth Sense', 'Stir of Echoes', 'Ghost', 'Beetlejuice'],
    fact: 'Haley Joel Osment was 10 years old when he delivered the line, earning an Oscar nomination.',
  },
  {
    category: 'Famous Quote',
    question: '"Say hello to my little friend!" — Which film?',
    answer: 'Scarface',
    options: ['Scarface', 'The Godfather', 'Goodfellas', 'Casino'],
    fact: 'Al Pacino wore platform shoes throughout "Scarface" to appear taller than his co-stars.',
  },
  {
    category: 'Famous Quote',
    question: '"You\'re gonna need a bigger boat." — Which film?',
    answer: 'Jaws',
    options: ['Jaws', 'The Meg', 'The Abyss', 'Open Water'],
    fact: 'The line was ad-libbed by Roy Scheider after seeing the mechanical shark for the first time.',
  },
  {
    category: 'Famous Quote',
    question: '"What\'s in the box?!" — Which film?',
    answer: 'Se7en',
    options: ['Se7en', 'The Gift', 'Zodiac', 'Prisoners'],
    fact: 'Director David Fincher fought with the studio to keep the ending — they wanted Brad Pitt\'s character to survive.',
  },
  {
    category: 'Famous Quote',
    question: '"I am Groot." — Which Marvel film first featured this character?',
    answer: 'Guardians of the Galaxy',
    options: ['Guardians of the Galaxy', 'Thor: The Dark World', 'Avengers: Infinity War', 'The Avengers'],
    fact: 'Vin Diesel recorded "I am Groot" in over 15 languages for various international releases.',
  },
  {
    category: 'Famous Quote',
    question: '"They may take our lives, but they\'ll never take our freedom!" — Which film?',
    answer: 'Braveheart',
    options: ['Braveheart', 'Gladiator', 'Kingdom of Heaven', 'Rob Roy'],
    fact: '"Braveheart" won Best Picture and Best Director for Mel Gibson at the 1996 Oscars.',
  },
  {
    category: 'Famous Quote',
    question: '"Open the pod bay doors, HAL." — Which film?',
    answer: '2001: A Space Odyssey',
    options: ['2001: A Space Odyssey', 'Interstellar', 'The Martian', 'Event Horizon'],
    fact: 'Actor Douglas Rain voiced HAL 9000 so calmly that Kubrick felt his friendly tone made it more menacing.',
  },

  // ── Taglines ──────────────────────────────────────────────
  {
    category: 'Tagline',
    question: '"In space, no one can hear you scream." — Which film?',
    answer: 'Alien',
    options: ['Alien', 'Event Horizon', 'Gravity', 'Interstellar'],
    fact: 'The tagline was so iconic that it\'s been parodied in hundreds of films and TV shows since 1979.',
  },
  {
    category: 'Tagline',
    question: '"Be afraid. Be very afraid." — Which 1986 horror film?',
    answer: 'The Fly',
    options: ['The Fly', 'Aliens', 'Poltergeist', 'A Nightmare on Elm Street'],
    fact: 'Jeff Goldblum and director David Cronenberg made the film as a meditation on illness and physical decay.',
  },
  {
    category: 'Tagline',
    question: '"You\'ll believe a man can fly." — Which 1978 superhero film?',
    answer: 'Superman',
    options: ['Superman', 'Spider-Man (2002)', 'Iron Man (2008)', 'The Rocketeer (1991)'],
    fact: 'Christopher Reeve wore a costume with a fake upper body to look more muscular without bulking up.',
  },
  {
    category: 'Tagline',
    question: '"Houston, we have a problem." is most closely associated with which film?',
    answer: 'Apollo 13',
    options: ['Apollo 13', 'The Martian', 'Gravity', 'First Man'],
    fact: 'The real phrase was "Houston, we\'ve had a problem." The film slightly altered it for dramatic effect.',
  },
  {
    category: 'Tagline',
    question: '"Just when you thought it was safe to go back in the water." — Which sequel?',
    answer: 'Jaws 2',
    options: ['Jaws 2', 'Jaws 3-D', 'The Meg', 'Piranha'],
    fact: '"Jaws 2" was made without Steven Spielberg, who refused to return. It\'s still the highest-grossing horror sequel of its era.',
  },

  // ── Academy Awards ─────────────────────────────────────────
  {
    category: 'Academy Awards',
    question: 'Which film won the first-ever Best Picture Oscar in 1929?',
    answer: 'Wings',
    options: ['Wings', 'Sunrise', 'The Jazz Singer', 'The Last Command'],
    fact: '"Wings" is a WWI silent film — still the only silent film to win Best Picture until "The Artist" (2011).',
  },
  {
    category: 'Academy Awards',
    question: 'Which film swept all five major Oscar categories (Picture, Director, Actor, Actress, Screenplay) in 1992?',
    answer: 'The Silence of the Lambs',
    options: ['The Silence of the Lambs', 'Goodfellas', 'JFK', 'Misery'],
    fact: 'Only three films have ever swept the "Big Five." The others are "It Happened One Night" and "One Flew Over the Cuckoo\'s Nest."',
  },
  {
    category: 'Academy Awards',
    question: 'Who won the Best Actress Oscar for "Monster" (2003)?',
    answer: 'Charlize Theron',
    options: ['Charlize Theron', 'Nicole Kidman', 'Halle Berry', 'Sandra Bullock'],
    fact: 'Theron gained 30 pounds and wore prosthetic teeth and contacts to transform into serial killer Aileen Wuornos.',
  },
  {
    category: 'Academy Awards',
    question: '"Moonlight" won Best Picture after a famous envelope mix-up with which other film?',
    answer: 'La La Land',
    options: ['La La Land', 'Manchester by the Sea', 'Arrival', 'Hacksaw Ridge'],
    fact: 'Warren Beatty and Faye Dunaway were given the wrong envelope. "La La Land\'s" producers had already begun their speech.',
  },
  {
    category: 'Academy Awards',
    question: 'Which actress holds the record for the most acting Oscar wins with 4?',
    answer: 'Katharine Hepburn',
    options: ['Katharine Hepburn', 'Meryl Streep', 'Frances McDormand', 'Cate Blanchett'],
    fact: 'Hepburn famously never attended the ceremony — she attended zero of the four evenings she won.',
  },
  {
    category: 'Academy Awards',
    question: 'How many Oscars did "Parasite" (2019) win?',
    answer: '4',
    options: ['4', '2', '6', '3'],
    fact: '"Parasite" won Picture, Director, Original Screenplay, and International Feature — an unprecedented sweep.',
  },
  {
    category: 'Academy Awards',
    question: 'Which animated film\'s Best Picture nomination prompted the Academy to create a separate Animated Feature category?',
    answer: 'Beauty and the Beast',
    options: ['Beauty and the Beast', 'The Lion King', 'Aladdin', 'Snow White'],
    fact: 'The first Best Animated Feature Oscar was awarded in 2002. "Shrek" won the inaugural prize.',
  },
  {
    category: 'Academy Awards',
    question: 'Cate Blanchett won Best Actress for which Woody Allen film (2013)?',
    answer: 'Blue Jasmine',
    options: ['Blue Jasmine', 'Match Point', 'Midnight in Paris', 'Vicky Cristina Barcelona'],
    fact: 'Blanchett also won Best Supporting Actress for "The Aviator" (2004), making her a two-time winner.',
  },
  {
    category: 'Academy Awards',
    question: 'Which film holds the record for most Oscar nominations with 14 (tied)?',
    answer: 'All About Eve (1950) & La La Land (2016)',
    options: ['All About Eve (1950) & La La Land (2016)', 'Titanic (1997)', 'The Lord of the Rings: Return of the King', 'Gone with the Wind'],
    fact: '"All About Eve" and "La La Land" both received 14 nominations. Titanic and The Return of the King each won a record-tying 11.',
  },

  // ── Actors & Actresses ─────────────────────────────────────
  {
    category: 'Actor',
    question: 'Who played Tyler Durden in "Fight Club" (1999)?',
    answer: 'Brad Pitt',
    options: ['Brad Pitt', 'Edward Norton', 'Jared Leto', 'Matt Damon'],
    fact: 'Brad Pitt trained intensively for months and ate constantly to achieve his physique, which took 6 weeks to film.',
  },
  {
    category: 'Actor',
    question: 'Who played Clarice Starling in "The Silence of the Lambs"?',
    answer: 'Jodie Foster',
    options: ['Jodie Foster', 'Sigourney Weaver', 'Susan Sarandon', 'Meryl Streep'],
    fact: 'Michelle Pfeiffer and Meg Ryan were both considered for the role before Foster was cast.',
  },
  {
    category: 'Actor',
    question: 'Who played Tony Montana in "Scarface" (1983)?',
    answer: 'Al Pacino',
    options: ['Al Pacino', 'Robert De Niro', 'Joe Pesci', 'James Caan'],
    fact: 'Al Pacino wore platform shoes throughout filming to appear taller than his co-stars.',
  },
  {
    category: 'Actor',
    question: 'Which actress has received the most Academy Award acting nominations?',
    answer: 'Meryl Streep',
    options: ['Meryl Streep', 'Katharine Hepburn', 'Cate Blanchett', 'Bette Davis'],
    fact: 'Meryl Streep has 21 Oscar nominations and 3 wins — a record no other actor comes close to.',
  },
  {
    category: 'Actor',
    question: 'Who played Forrest Gump in the 1994 film?',
    answer: 'Tom Hanks',
    options: ['Tom Hanks', 'John Travolta', 'Kevin Costner', 'Bill Murray'],
    fact: 'Tom Hanks became the second person ever to win back-to-back Best Actor Oscars (for Philadelphia and Forrest Gump).',
  },
  {
    category: 'Actor',
    question: 'Who played the Joker in Christopher Nolan\'s "The Dark Knight"?',
    answer: 'Heath Ledger',
    options: ['Heath Ledger', 'Joaquin Phoenix', 'Jared Leto', 'Jack Nicholson'],
    fact: 'Ledger kept a personal diary in character as the Joker during pre-production. It sold for $120,000 after his death.',
  },
  {
    category: 'Actor',
    question: 'Who played Amy Dunne in "Gone Girl" (2014)?',
    answer: 'Rosamund Pike',
    options: ['Rosamund Pike', 'Carey Mulligan', 'Emily Blunt', 'Keira Knightley'],
    fact: 'Pike was barely known outside the UK before "Gone Girl" — she became an overnight Hollywood star.',
  },
  {
    category: 'Actor',
    question: 'Who played Hannibal Lecter in "The Silence of the Lambs"?',
    answer: 'Anthony Hopkins',
    options: ['Anthony Hopkins', 'Brian Cox', 'Gary Oldman', 'Jeremy Irons'],
    fact: 'Hopkins is on screen for only about 16 minutes total — one of the shortest Oscar-winning performances in history.',
  },
  {
    category: 'Actor',
    question: 'Which actress played Nina Sayers in "Black Swan" (2010)?',
    answer: 'Natalie Portman',
    options: ['Natalie Portman', 'Mila Kunis', 'Cate Blanchett', 'Winona Ryder'],
    fact: 'Portman trained in ballet for a year before filming. A body double handled some of the more complex routines.',
  },
  {
    category: 'Actor',
    question: 'Meryl Streep won her first Oscar for which 1979 film?',
    answer: 'Kramer vs. Kramer',
    options: ['Kramer vs. Kramer', 'The Deer Hunter', 'Manhattan', "Sophie's Choice"],
    fact: '"Kramer vs. Kramer" was a landmark film in exploring divorce from both parents\' perspectives.',
  },
  {
    category: 'Actor',
    question: 'Daniel Day-Lewis won Best Actor for playing an oil prospector in which 2007 film?',
    answer: 'There Will Be Blood',
    options: ['There Will Be Blood', 'No Country for Old Men', 'Gangs of New York', 'Lincoln'],
    fact: 'Day-Lewis won 3 Best Actor Oscars — the only person to do so. He retired from acting in 2017.',
  },
  {
    category: 'Actor',
    question: 'Who played Detective William Somerset in "Se7en" (1995)?',
    answer: 'Morgan Freeman',
    options: ['Morgan Freeman', 'Brad Pitt', 'Kevin Spacey', 'Denzel Washington'],
    fact: 'Morgan Freeman ad-libbed Somerset\'s final line: "Ernest Hemingway once wrote... the world is a fine place and worth fighting for."',
  },

  // ── Behind the Scenes ──────────────────────────────────────
  {
    category: 'Behind the Scenes',
    question: 'The shark in "Jaws" was so unreliable that Spielberg had to shoot around it. What did the crew nickname the mechanical shark?',
    answer: 'Bruce',
    options: ['Bruce', 'Jaws', 'Chomper', 'Harvey'],
    fact: 'Bruce was named after Spielberg\'s lawyer. The malfunctions actually improved the film by hiding the shark longer.',
  },
  {
    category: 'Behind the Scenes',
    question: 'During filming "Apocalypse Now," whose heart attack nearly halted production?',
    answer: 'Martin Sheen',
    options: ['Martin Sheen', 'Marlon Brando', 'Dennis Hopper', 'Francis Ford Coppola'],
    fact: 'The documentary "Hearts of Darkness" (1991) chronicled the catastrophic production — storms, heart attacks, and Brando\'s erratic behavior.',
  },
  {
    category: 'Behind the Scenes',
    question: '"Jaws" (1975) is widely credited with inventing what concept?',
    answer: 'The summer blockbuster',
    options: ['The summer blockbuster', 'The franchise', 'Wide-release strategy', 'The movie sequel'],
    fact: 'Before "Jaws," studios considered summer a dead season. It grossed over $100 million and changed Hollywood forever.',
  },
  {
    category: 'Behind the Scenes',
    question: 'In "The Shining," which famous line did Jack Nicholson ad-lib while breaking through the door?',
    answer: '"Here\'s Johnny!"',
    options: ['"Here\'s Johnny!"', '"Wendy, I\'m home!"', '"All work and no play…"', '"Red rum!"'],
    fact: 'The line is a reference to the intro of "The Tonight Show Starring Johnny Carson." Kubrick kept it in.',
  },
  {
    category: 'Behind the Scenes',
    question: 'What was the approximate budget of the original "Star Wars" (1977)?',
    answer: '$11 million',
    options: ['$11 million', '$25 million', '$4 million', '$50 million'],
    fact: '"Star Wars" eventually grossed over $775 million worldwide — the highest-grossing film of its era.',
  },
  {
    category: 'Behind the Scenes',
    question: '"The Blair Witch Project" (1999) cost roughly how much to make?',
    answer: '$60,000',
    options: ['$60,000', '$500,000', '$1 million', '$200,000'],
    fact: 'It grossed $248 million worldwide — one of the greatest returns on investment in film history.',
  },
  {
    category: 'Behind the Scenes',
    question: 'Which film pioneered the "bullet time" slow-motion effect, developed by John Gaeta?',
    answer: 'The Matrix',
    options: ['The Matrix', 'Dark City', 'Mission: Impossible 2', 'Inception'],
    fact: 'Over 100 still cameras were positioned in a circle to capture the effect. It won the Oscar for Visual Effects.',
  },
  {
    category: 'Behind the Scenes',
    question: 'Heath Ledger locked himself in a hotel room for weeks to develop the Joker\'s mannerisms. How long?',
    answer: 'About 6 weeks',
    options: ['About 6 weeks', '2 weeks', '3 months', '10 days'],
    fact: 'During isolation, Ledger kept a journal in character, filling it with the Joker\'s thoughts and disturbing imagery.',
  },
  {
    category: 'Behind the Scenes',
    question: 'Tom Hanks lost 55 pounds for his role in which 2000 survival film?',
    answer: 'Cast Away',
    options: ['Cast Away', 'Philadelphia', 'The Terminal', 'Joe Versus the Volcano'],
    fact: 'Production was halted for a year so Hanks could lose the weight. Director Robert Zemeckis used that time to film "What Lies Beneath."',
  },

  // ── Film History ───────────────────────────────────────────
  {
    category: 'Film History',
    question: 'What was the first feature-length animated film ever made?',
    answer: 'Snow White and the Seven Dwarfs (1937)',
    options: ['Snow White and the Seven Dwarfs (1937)', 'Fantasia (1940)', 'Bambi (1942)', 'Pinocchio (1940)'],
    fact: 'Hollywood insiders called it "Disney\'s Folly" before release. It became the highest-grossing film of 1938.',
  },
  {
    category: 'Film History',
    question: '"The Jazz Singer" (1927) is considered the first successful what?',
    answer: 'Sound film (talkie)',
    options: ['Sound film (talkie)', 'Color film', 'Widescreen film', 'Sync-sound musical'],
    fact: 'Al Jolson\'s famous ad-lib "You ain\'t heard nothin\' yet!" was not in the script.',
  },
  {
    category: 'Film History',
    question: 'The Lumière Brothers held the first public film screening in 1895. In which city?',
    answer: 'Paris',
    options: ['Paris', 'London', 'New York', 'Berlin'],
    fact: 'Their "L\'Arrivée d\'un train en gare de La Ciotat" reportedly caused audience members to flee, fearing they\'d be hit.',
  },
  {
    category: 'Film History',
    question: 'Which filming technique — used extensively in "Citizen Kane" — keeps foreground and background in sharp focus simultaneously?',
    answer: 'Deep focus',
    options: ['Deep focus', 'Rack focus', 'Dutch angle', 'Dolly zoom'],
    fact: 'Cinematographer Gregg Toland pioneered deep focus for "Citizen Kane." Toland was so proud he shared the title card with Welles.',
  },
  {
    category: 'Film History',
    question: 'Which 1975 Spielberg film is widely credited with creating the summer blockbuster era?',
    answer: 'Jaws',
    options: ['Jaws', 'Star Wars', 'The Exorcist', 'American Graffiti'],
    fact: '"Jaws" was the first film to open in over 400 theaters simultaneously — a new wide-release strategy.',
  },

  // ── World Cinema ───────────────────────────────────────────
  {
    category: 'World Cinema',
    question: 'Which Italian neorealist film follows a bicycle thief in postwar Rome?',
    answer: 'Bicycle Thieves (1948)',
    options: ['Bicycle Thieves (1948)', 'Rome, Open City (1945)', 'La Strada (1954)', 'Umberto D. (1952)'],
    fact: 'Director Vittorio De Sica cast mostly non-professional actors and shot entirely on Rome\'s streets.',
  },
  {
    category: 'World Cinema',
    question: 'Ingmar Bergman\'s "The Seventh Seal" features a knight playing chess with whom?',
    answer: 'Death',
    options: ['Death', 'God', 'The Devil', 'A plague victim'],
    fact: 'Bergman was inspired by a medieval church painting he saw as a child. The film\'s chess image is one of cinema\'s most iconic.',
  },
  {
    category: 'World Cinema',
    question: 'Which French New Wave director made "Breathless" (À bout de souffle) in 1960?',
    answer: 'Jean-Luc Godard',
    options: ['Jean-Luc Godard', 'François Truffaut', 'Alain Resnais', 'Jacques Demy'],
    fact: 'Godard had no dolly, so cameraman Raoul Coutard filmed handheld shots from a wheelchair pushed around Paris.',
  },
  {
    category: 'World Cinema',
    question: '"Pan\'s Labyrinth" (2006) was directed by which filmmaker?',
    answer: 'Guillermo del Toro',
    options: ['Guillermo del Toro', 'Pedro Almodóvar', 'Alejandro González Iñárritu', 'Alfonso Cuarón'],
    fact: 'Del Toro funded the film partially himself so he could maintain full creative control.',
  },
  {
    category: 'World Cinema',
    question: '"A Separation" (2011) won Iran\'s first Oscar for Foreign Language Film. Who directed it?',
    answer: 'Asghar Farhadi',
    options: ['Asghar Farhadi', 'Abbas Kiarostami', 'Majid Majidi', 'Jafar Panahi'],
    fact: 'Farhadi wrote the script in just 15 days. The film won the Golden Bear at Berlin and 60+ international awards.',
  },
  {
    category: 'World Cinema',
    question: 'Akira Kurosawa\'s "The Hidden Fortress" (1958) directly inspired which famous space opera?',
    answer: 'Star Wars',
    options: ['Star Wars', 'Dune', 'Star Trek', 'The Fifth Element'],
    fact: 'George Lucas credited Kurosawa\'s film as a key inspiration — the two bumbling farmer characters became C-3PO and R2-D2.',
  },

  // ── Music & Score ──────────────────────────────────────────
  {
    category: 'Music & Score',
    question: 'Which composer wrote the score for all three original "Lord of the Rings" films?',
    answer: 'Howard Shore',
    options: ['Howard Shore', 'John Williams', 'Hans Zimmer', 'Ennio Morricone'],
    fact: 'Shore wrote over 12 hours of orchestral music across the trilogy — one of the largest film scores ever recorded.',
  },
  {
    category: 'Music & Score',
    question: 'Ennio Morricone is most famous for scoring Westerns by which Italian director?',
    answer: 'Sergio Leone',
    options: ['Sergio Leone', 'Dario Argento', 'Federico Fellini', 'Luchino Visconti'],
    fact: 'For "The Good, the Bad and the Ugly," Leone shot scenes to Morricone\'s pre-recorded music — an unusual practice.',
  },
  {
    category: 'Music & Score',
    question: 'Hans Zimmer\'s "Inception" score slows down which Édith Piaf song into the iconic "BWAAAAM" sound?',
    answer: '"Non, je ne regrette rien"',
    options: ['"Non, je ne regrette rien"', '"La Vie en Rose"', '"Milord"', '"Padam Padam"'],
    fact: 'The song choice is also a nod to Marion Cotillard, who played Piaf in "La Vie en Rose" and stars in "Inception."',
  },
  {
    category: 'Music & Score',
    question: 'Which film\'s soundtrack — featuring "Stayin\' Alive" and "Night Fever" — became one of the best-selling soundtracks ever?',
    answer: 'Saturday Night Fever',
    options: ['Saturday Night Fever', 'Grease', 'Footloose', 'Dirty Dancing'],
    fact: 'The soundtrack spent 24 weeks at #1 on the Billboard charts and sold over 40 million copies worldwide.',
  },
  {
    category: 'Music & Score',
    question: 'John Williams did NOT compose the score for which of these films?',
    answer: 'The Dark Knight',
    options: ['The Dark Knight', "Schindler's List", 'E.T. the Extra-Terrestrial', 'Saving Private Ryan'],
    fact: '"The Dark Knight" was scored by Hans Zimmer and James Newton Howard. Nolan\'s films rarely use Williams.',
  },

  // ── Cinematography ─────────────────────────────────────────
  {
    category: 'Cinematography',
    question: 'Roger Deakins finally won his first Oscar for cinematography for which film?',
    answer: 'Blade Runner 2049',
    options: ['Blade Runner 2049', 'No Country for Old Men', 'Sicario', 'The Shawshank Redemption'],
    fact: 'Deakins had been nominated 13 times before winning. He won again shortly after for "1917."',
  },
  {
    category: 'Cinematography',
    question: '"1917" (2019) was edited to appear as one continuous shot. Who directed it?',
    answer: 'Sam Mendes',
    options: ['Sam Mendes', 'Christopher Nolan', 'Alfonso Cuarón', 'Denis Villeneuve'],
    fact: 'The film was inspired by a story Sam Mendes\'s grandfather Alfred told him about WWI messenger missions.',
  },
  {
    category: 'Cinematography',
    question: 'The "dolly zoom" effect — the camera zooms out while moving forward, distorting perspective — was first used in which Hitchcock film?',
    answer: 'Vertigo',
    options: ['Vertigo', 'Psycho', 'Rear Window', 'The Birds'],
    fact: 'Also called the "Hitchcock zoom" or "Jaws shot," it\'s used to create a sense of dread or unreality.',
  },

  // ── Adaptations ────────────────────────────────────────────
  {
    category: 'Adaptation',
    question: '"No Country for Old Men" is based on a novel by which author?',
    answer: 'Cormac McCarthy',
    options: ['Cormac McCarthy', 'Don DeLillo', 'Philip Roth', 'Joyce Carol Oates'],
    fact: 'McCarthy\'s novel was so cinematic that the Coen Brothers reportedly used entire pages as their screenplay.',
  },
  {
    category: 'Adaptation',
    question: '"The Godfather" was adapted from a novel by which author?',
    answer: 'Mario Puzo',
    options: ['Mario Puzo', 'Gay Talese', 'Nicholas Pileggi', 'Don Winslow'],
    fact: 'Puzo co-wrote the screenplay with Coppola and won the Oscar for Best Adapted Screenplay.',
  },
  {
    category: 'Adaptation',
    question: 'Stephen King\'s novella "Rita Hayworth and Shawshank Redemption" was adapted into which beloved 1994 film?',
    answer: 'The Shawshank Redemption',
    options: ['The Shawshank Redemption', 'Stand by Me', 'The Green Mile', 'Misery'],
    fact: '"The Shawshank Redemption" was a box office disappointment in 1994 but became the most-watched film on TV ever.',
  },
  {
    category: 'Adaptation',
    question: '"Blade Runner" is based on a Philip K. Dick novel. What is the original title?',
    answer: 'Do Androids Dream of Electric Sheep?',
    options: ['Do Androids Dream of Electric Sheep?', 'A Scanner Darkly', 'Ubik', 'The Man in the High Castle'],
    fact: 'Philip K. Dick saw early footage of "Blade Runner" before his death and said it was exactly what he\'d imagined.',
  },
  {
    category: 'Adaptation',
    question: '"Apocalypse Now" (1979) is loosely based on which novel?',
    answer: 'Heart of Darkness by Joseph Conrad',
    options: ['Heart of Darkness by Joseph Conrad', 'The Naked and the Dead', 'Catch-22', 'The Thin Red Line'],
    fact: 'Conrad\'s 1899 novella is set in colonial Africa — Coppola transplanted the story to the Vietnam War.',
  },
  {
    category: 'Adaptation',
    question: '"2001: A Space Odyssey" is based on a short story by which author?',
    answer: 'Arthur C. Clarke',
    options: ['Arthur C. Clarke', 'Isaac Asimov', 'Philip K. Dick', 'Ray Bradbury'],
    fact: 'Clarke and Kubrick co-wrote the screenplay and the novel simultaneously. The novel was published after the film\'s release.',
  },

  // ── Plot Twists ────────────────────────────────────────────
  {
    category: 'Plot Twist',
    question: 'In "The Usual Suspects," who is revealed to be Keyser Söze?',
    answer: 'Verbal Kint',
    options: ['Verbal Kint', 'Keaton', 'Kobayashi', 'McManus'],
    fact: 'Kevin Spacey won Best Supporting Actor for the role. The famous "Keyser Söze" name means "too much talking" in Turkish.',
  },
  {
    category: 'Plot Twist',
    question: 'In "Fight Club," the narrator and Tyler Durden are the same person. Who played the narrator?',
    answer: 'Edward Norton',
    options: ['Edward Norton', 'Brad Pitt', 'Jared Leto', 'Matt Damon'],
    fact: 'Director David Fincher hid dozens of foreshadowing clues throughout the film that only reveal themselves on rewatch.',
  },
  {
    category: 'Plot Twist',
    question: 'In "The Sixth Sense," Dr. Malcolm Crowe has secretly been what the whole time?',
    answer: 'Dead',
    options: ['Dead', 'Dreaming', 'In a coma', 'Hallucinating'],
    fact: 'M. Night Shyamalan hid clues throughout: Malcolm never interacts with anyone except Cole, and he\'s always cold.',
  },
  {
    category: 'Plot Twist',
    question: 'In "Memento" (2000), the story is told in reverse chronological order. Who plays the protagonist?',
    answer: 'Guy Pearce',
    options: ['Guy Pearce', 'Christian Bale', 'Tom Hardy', 'Cillian Murphy'],
    fact: 'Nolan\'s script for "Memento" was so unconventional that every studio rejected it. He made it independently for $9 million.',
  },
  {
    category: 'Plot Twist',
    question: 'In "Psycho" (1960), protagonist Marion Crane is killed in which shocking scene?',
    answer: 'The shower scene',
    options: ['The shower scene', 'The swamp scene', 'The fruit cellar scene', 'The motel check-in scene'],
    fact: 'Killing off the apparent heroine at the midpoint was unprecedented. Hitchcock bought up copies of the novel to prevent spoilers.',
  },

  // ── Miscellaneous ──────────────────────────────────────────
  {
    category: 'Trivia',
    question: 'What color pill does Neo take in "The Matrix"?',
    answer: 'Red',
    options: ['Red', 'Blue', 'Green', 'White'],
    fact: 'The blue pill = blissful ignorance, red pill = harsh truth. The metaphor has entered mainstream culture.',
  },
  {
    category: 'Trivia',
    question: 'In "Back to the Future," what speed must the DeLorean reach to time-travel?',
    answer: '88 mph',
    options: ['88 mph', '65 mph', '100 mph', '75 mph'],
    fact: 'The DeLorean was chosen because its stainless steel body looked futuristic, and because the makers liked the gull-wing doors.',
  },
  {
    category: 'Trivia',
    question: 'What is the name of the AI antagonist in "2001: A Space Odyssey"?',
    answer: 'HAL 9000',
    options: ['HAL 9000', 'ARIA', 'SAL 9000', 'JARVIS'],
    fact: 'Each letter in HAL precedes a letter in IBM. Kubrick denied it was intentional; Clarke also denied it — repeatedly.',
  },
  {
    category: 'Trivia',
    question: 'How many Oscar nominations did "La La Land" receive — the most since 1950?',
    answer: '14',
    options: ['14', '12', '11', '13'],
    fact: '"La La Land" won 6 of those 14 nominations, tying the record for wins with "All About Eve" (none won).',
  },
  {
    category: 'Trivia',
    question: 'Alfred Hitchcock made a cameo appearance in how many of his own films?',
    answer: '39',
    options: ['39', '20', '52', '15'],
    fact: 'Hitchcock began cameos because he was a recognizable figure after "The Lodger" (1927). It became his signature.',
  },
  {
    category: 'Trivia',
    question: 'What was the first Pixar feature film?',
    answer: 'Toy Story (1995)',
    options: ['Toy Story (1995)', "A Bug's Life (1998)", 'Finding Nemo (2003)', 'Monsters, Inc. (2001)'],
    fact: '"Toy Story" took 4 years to make and was nearly cancelled when Disney executives hated the early "dark" cut.',
  },
  {
    category: 'Trivia',
    question: 'What is Cobb\'s totem in "Inception"?',
    answer: 'A spinning top',
    options: ['A spinning top', 'A chess piece', 'A coin', 'A loaded die'],
    fact: 'The film\'s ending deliberately cuts before we see if the top falls — Nolan said the answer is in Cobb\'s wedding ring.',
  },
  {
    category: 'Trivia',
    question: 'In "The Wizard of Oz" (1939), what technology made the color sequences vibrant?',
    answer: 'Technicolor',
    options: ['Technicolor', 'Kodachrome', 'CinemaScope', 'Vistavision'],
    fact: 'Dorothy\'s famous ruby slippers were silver in the original book — they were changed to red to show off Technicolor.',
  },
  {
    category: 'Trivia',
    question: 'Which 1994 film features a coffee shop robbery, a hitman, and a mysterious briefcase?',
    answer: 'Pulp Fiction',
    options: ['Pulp Fiction', 'Reservoir Dogs', 'The Big Lebowski', 'Fargo'],
    fact: 'The briefcase\'s contents are never revealed. Popular theories include Marsellus Wallace\'s soul — or diamonds.',
  },
  {
    category: 'Trivia',
    question: 'In "The Wizard of Oz," what does Dorothy use to get home?',
    answer: 'Clicking her ruby slippers',
    options: ['Clicking her ruby slippers', 'The Good Witch\'s wand', 'A magic potion', 'Saying "there\'s no place like home" three times into the slippers'],
    fact: 'In L. Frank Baum\'s original book, the slippers are silver, not ruby, and there\'s no clicking — she just walks.',
  },
  {
    category: 'Trivia',
    question: 'What does the title "M" (1931) stand for in Fritz Lang\'s film?',
    answer: 'Murderer (Mörder in German)',
    options: ['Murderer (Mörder in German)', 'Mystery', 'Menace', 'Monster'],
    fact: 'The letter M is chalked on the killer\'s coat by a blind man to identify him to the criminal underworld.',
  },
  {
    category: 'Trivia',
    question: 'Which horror villain wears a hockey mask?',
    answer: 'Jason Voorhees',
    options: ['Jason Voorhees', 'Michael Myers', 'Leatherface', 'Ghostface'],
    fact: 'Jason didn\'t actually wear the hockey mask until "Friday the 13th Part III" (1982). He wore a burlap sack in Part II.',
  },
  {
    category: 'Trivia',
    question: 'In "Casablanca," what do Rick and Ilsa ask Sam to play?',
    answer: '"As Time Goes By"',
    options: ['"As Time Goes By"', '"La Marseillaise"', '"It Had to Be You"', '"Moonlight Becomes You"'],
    fact: 'Ingrid Bergman deliberately acted confused about her feelings on set to keep the ending ambiguous even to herself.',
  },
];

let quizQueue = [];
let currentQuestion = null;

function startGame() {
  gameScore = 0;
  $('gameScore').textContent = '0';
  $('gameFeedback').innerHTML = '';
  $('gameFeedback').className = 'game-feedback';
  gameActive = true;

  quizQueue = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  showNextQuestion();
}

function stopGame() {
  gameActive = false;
  clearTimeout(gameInterval);
}

function showNextQuestion() {
  if (!gameActive) return;
  if (quizQueue.length === 0) {
    quizQueue = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  }
  currentQuestion = quizQueue.pop();

  const categoryEl = $('triviaCategory');
  const questionEl = $('triviaQuestion');
  const optionsEl  = $('gameOptions');
  const feedbackEl = $('gameFeedback');

  categoryEl.style.animation = 'none';
  void categoryEl.offsetWidth;
  categoryEl.style.animation = 'popIn 0.3s ease';
  categoryEl.textContent = currentQuestion.category;

  questionEl.style.animation = 'none';
  void questionEl.offsetWidth;
  questionEl.style.animation = 'fadeUp 0.3s ease';
  questionEl.textContent = currentQuestion.question;

  feedbackEl.innerHTML = '';
  feedbackEl.className = 'game-feedback';

  const shuffled = [...currentQuestion.options].sort(() => Math.random() - 0.5);
  optionsEl.innerHTML = '';
  shuffled.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'game-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(btn, opt));
    optionsEl.appendChild(btn);
  });
}

function handleAnswer(btn, selected) {
  if (!gameActive) return;
  const correct = selected === currentQuestion.answer;
  const feedbackEl = $('gameFeedback');
  const optionsEl  = $('gameOptions');

  optionsEl.querySelectorAll('.game-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === currentQuestion.answer) b.classList.add('correct');
    else if (b === btn && !correct) b.classList.add('wrong');
  });

  const factHtml = currentQuestion.fact
    ? `<span class="fb-fact">${currentQuestion.fact}</span>`
    : '';

  if (correct) {
    gameScore++;
    $('gameScore').textContent = gameScore;
    feedbackEl.innerHTML = `<span class="fb-correct">✓ Correct!</span>${factHtml}`;
    feedbackEl.className = 'game-feedback correct';
  } else {
    feedbackEl.innerHTML = `<span class="fb-wrong">✗ ${currentQuestion.answer}</span>${factHtml}`;
    feedbackEl.className = 'game-feedback wrong';
  }

  const delay = currentQuestion.fact ? 2600 : 1800;
  gameInterval = setTimeout(() => {
    if (gameActive) showNextQuestion();
  }, delay);
}

// ── Error toast ───────────────────────────────────────────
let toastTimer = null;

function showError(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 5000);
}

// ── HTML escape ───────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── Init ──────────────────────────────────────────────────
updateWatchlistCountBadge();
