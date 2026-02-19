/* ═══════════════════════════════════════════════════════════
   CINEMATCH — Frontend Logic
   ═══════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

// ── State ────────────────────────────────────────────────
let busy = false;
let allRecs = [];         // full unordered list
let currentSort = 'default';

// ── Elements ─────────────────────────────────────────────
const heroSection    = $('heroSection');
const loadingScreen  = $('loadingScreen');
const resultsSection = $('resultsSection');
const movieInput     = $('movieInput');
const searchBtn      = $('searchBtn');
const searchAgainBtn = $('searchAgainBtn');
const moviesGrid     = $('moviesGrid');
const toast          = $('toast');
const toastMsg       = $('toastMsg');

// ── Quick search (called from HTML) ──────────────────────
function quickSearch(title) {
  movieInput.value = title;
  doSearch();
}

// ── Event listeners ───────────────────────────────────────
searchBtn.addEventListener('click', doSearch);
movieInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
const goHero = () => {
  showSection('hero');
  movieInput.value = '';
  setTimeout(() => movieInput.focus(), 50);
};
searchAgainBtn.addEventListener('click', goHero);
$('newSearchBtn').addEventListener('click', goHero);

// Sort buttons
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    renderGrid(getSorted(allRecs));
  });
});

// ── Main search ───────────────────────────────────────────
async function doSearch() {
  const title = movieInput.value.trim();
  if (!title) { showError('Please enter a movie title'); movieInput.focus(); return; }
  if (busy) return;

  busy = true;
  searchBtn.disabled = true;
  currentSort = 'default';
  document.querySelectorAll('.sort-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sort === 'default');
  });

  showSection('loading');
  startLoadingSteps();
  startTips();

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieTitle: title }),
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
    clearLoadingSteps();
    stopTips();
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
    copy.sort((a, b) => (parseRt(b.rtRating)) - (parseRt(a.rtRating)));
  }
  return copy;
}

function parseRt(val) {
  if (!val) return 0;
  return parseInt(val.replace('%', '')) || 0;
}

// ── Render ────────────────────────────────────────────────
function renderResults({ seed, recommendations }) {
  renderSeedMovie(seed);
  renderGrid(getSorted(recommendations));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderGrid(recs) {
  moviesGrid.innerHTML = '';
  recs.forEach((movie, i) => moviesGrid.appendChild(createMovieRow(movie, i)));
}

function renderSeedMovie(seed) {
  const backdrop = $('seedBackdrop');
  backdrop.style.backgroundImage = seed.poster ? `url('${seed.poster}')` : 'none';

  const posterEl   = $('seedPoster');
  const fallbackEl = $('seedPosterFallback');
  if (seed.poster) {
    posterEl.src = seed.poster;
    posterEl.alt = `${seed.title || ''} poster`;
    posterEl.hidden = false;
    fallbackEl.hidden = true;
  } else {
    posterEl.hidden = true;
    fallbackEl.hidden = false;
  }

  const year = seed.year ? ` (${seed.year.match(/\d{4}/)?.[0] || seed.year})` : '';
  $('seedTitle').textContent = (seed.title || 'Unknown') + year;

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
}

// ── Oscar badge helper ────────────────────────────────────
function buildOscarHtml(oscarWins, awards) {
  // Prefer specific wins from Claude; fall back to OMDB count string
  if (oscarWins && oscarWins.length > 0) {
    const cats = oscarWins.slice(0, 3).map(c => esc(c)).join(' · ');
    const extra = oscarWins.length > 3 ? ` <span class="oscar-more">+${oscarWins.length - 3}</span>` : '';
    return `<span class="oscar-badge">🏆 ${cats}${extra}</span>`;
  }
  if (!awards) return '';
  const nom = awards.match(/Nominated for (\d+) Oscar/i);
  if (nom) {
    return `<span class="oscar-badge oscar-nom">★ ${nom[1]} Oscar nom${parseInt(nom[1]) > 1 ? 's' : ''}</span>`;
  }
  return '';
}

// ── Movie row (list layout) ───────────────────────────────
function createMovieRow(movie, index) {
  const row = document.createElement('article');
  row.className = 'movie-card';
  row.style.animationDelay = `${index * 60}ms`;

  const imdbUrl = movie.imdbId ? `https://www.imdb.com/title/${movie.imdbId}/` : null;

  // Whole row opens IMDB
  if (imdbUrl) {
    row.addEventListener('click', e => {
      if (e.target.tagName === 'A') return;
      window.open(imdbUrl, '_blank', 'noopener,noreferrer');
    });
  }

  const metaParts = [
    movie.year?.match(/\d{4}/)?.[0] || movie.year,
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

  row.innerHTML = `
    <div class="row-num">${index + 1}</div>
    <div class="row-thumb${movie.poster ? '' : ' no-img'}">
      ${movie.poster ? `<img src="${esc(movie.poster)}" alt="${esc(movie.title || '')} poster" loading="lazy">` : ''}
      <div class="row-thumb-fallback">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
          <div class="reason-label">Why you'll love it</div>
          <p class="reason-text">${esc(movie.reason || '')}</p>
        </div>
      </div>
      ${streamingHtml}
    </div>
  `;

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
  'Peacock':            { bg: '#000000', text: '#fff', border: '1px solid rgba(255,255,255,0.2)' },
  'Tubi':               { bg: '#FA4516', text: '#fff' },
  'Kanopy':             { bg: '#3D9BE9', text: '#fff' },
};

function buildStreamingHtml(services) {
  if (!services || services.length === 0) return '';
  const badges = services.map(s => {
    const style = STREAMING_COLORS[s] || { bg: '#333', text: '#fff' };
    const border = style.border ? `border:${style.border};` : '';
    return `<span class="stream-badge" style="background:${style.bg};color:${style.text};${border}">${esc(s)}</span>`;
  }).join('');
  return `<div class="streaming-row"><span class="streaming-label">Watch on</span>${badges}</div>`;
}

// ── Section display ───────────────────────────────────────
function showSection(name) {
  heroSection.hidden    = name !== 'hero';
  loadingScreen.hidden  = name !== 'loading';
  resultsSection.hidden = name !== 'results';
}

// ── Movie tips (shown while loading) ─────────────────────
const TIPS = [
  { title: 'Anora', year: '2024', blurb: 'Sean Baker\'s Palme d\'Or winner follows a New York sex worker who impulsively marries the son of a Russian oligarch — and the chaos that follows.', poster: 'https://m.media-amazon.com/images/M/MV5BZTVmZDQ3ZTMtNDY5Ni00ZTQ5LTk2OTgtNzVkOWFlYzVkMjFhXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'The Brutalist', year: '2024', blurb: 'A Hungarian Holocaust survivor rebuilds his life in America as a visionary architect, across three and a half decades of ambition and betrayal.', poster: 'https://m.media-amazon.com/images/M/MV5BOWEzODNkNjctNjY4Ni00YzM4LTgxMjQtOWJlYzAyMzM3MDZhXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'Conclave', year: '2024', blurb: 'Edward Berger\'s thriller traps the world\'s most powerful cardinals in a secret Vatican election riddled with hidden pasts and a stunning revelation.', poster: 'https://m.media-amazon.com/images/M/MV5BZGU5YjM0NTMtY2NkOS00ZGFkLTk4ODgtNjc5YmI0MmI5YWZkXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'A Real Pain', year: '2024', blurb: 'Jesse Eisenberg and Kieran Culkin play mismatched cousins on a Holocaust remembrance tour of Poland — funny, heartbreaking, and quietly profound.', poster: 'https://m.media-amazon.com/images/M/MV5BZWVkM2RkMGQtMDY4MS00NTM2LTlkYjctMGM4YTM3MGI0ODliXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'Dune: Part Two', year: '2024', blurb: 'Denis Villeneuve\'s colossal sequel follows Paul Atreides into the heart of Arrakis — a sandworm-riding, empire-shaking, visually unprecedented sci-fi epic.', poster: 'https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtOGUxNWVlNzlkMzVhXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'All We Imagine as Light', year: '2024', blurb: 'Payal Kapadia\'s Cannes Grand Prix winner follows two Mumbai nurses navigating longing and quiet crisis in a city that never pauses for grief.', poster: 'https://m.media-amazon.com/images/M/MV5BYjQ0ZmI2YmYtNmI3YS00MDljLWFiMTAtOGQ4ZTlkNjc5MGEzXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'Emilia Pérez', year: '2024', blurb: 'A Mexican cartel boss transitions genders with help from a lawyer — Jacques Audiard\'s genre-defying musical thriller swept Cannes with 4 wins.', poster: 'https://m.media-amazon.com/images/M/MV5BZDBmYjhjOGQtNDg2MC00NDc5LWFlNmYtMjZhZmI1N2U4YjNhXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'Nickel Boys', year: '2024', blurb: 'RaMell Ross reimagines Colson Whitehead\'s Pulitzer-winning novel entirely in first-person perspective — a technical and emotional breakthrough.', poster: 'https://m.media-amazon.com/images/M/MV5BOTc3MjA2MDYtZDE0Yi00Nzg2LTk4YTAtNjQ5ZTU5OWQyMzYwXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'I Saw the TV Glow', year: '2024', blurb: 'Jane Schoenbrun\'s hypnotic horror drifts through suburban adolescence, suburban identity, and a TV show that may have been more real than the world.', poster: 'https://m.media-amazon.com/images/M/MV5BNzkyNzZkZmQtMTdhMy00OGJlLWJhMWEtODA5ZGZhMjE1ZmVmXkEyXkFqcGc@._V1_SX300.jpg' },
  { title: 'Challengers', year: '2024', blurb: 'Luca Guadagnino turns a tennis love triangle into a pulse-pounding exploration of desire, competition, and the way old relationships never really end.', poster: 'https://m.media-amazon.com/images/M/MV5BYWQ4ZjMzMWQtNTYxNi00YWMwLWI5MDctZjkwZmMzYzBmOGMzXkEyXkFqcGc@._V1_SX300.jpg' },
];

let tipIdx = 0;
let tipInterval = null;

function showTip(idx) {
  const tip = TIPS[idx % TIPS.length];
  const card = $('movieTipCard');
  card.style.animation = 'none';
  void card.offsetWidth; // reflow to restart
  card.style.animation = '';

  const poster = $('tipPoster');
  const ph = $('tipPosterPh');
  if (tip.poster) {
    poster.src = tip.poster;
    poster.style.display = 'block';
    ph.style.display = 'none';
  } else {
    poster.style.display = 'none';
    ph.style.display = 'block';
  }
  $('tipTitle').textContent = tip.title;
  $('tipYear').textContent  = tip.year;
  $('tipBlurb').textContent = tip.blurb;
}

function startTips() {
  tipIdx = Math.floor(Math.random() * TIPS.length);
  showTip(tipIdx);
  tipInterval = setInterval(() => {
    tipIdx++;
    showTip(tipIdx);
  }, 4000);
}

function stopTips() { clearInterval(tipInterval); }

// ── Loading steps ─────────────────────────────────────────
let stepInterval = null;
const STEPS = ['step1', 'step2', 'step3'];

function startLoadingSteps() {
  STEPS.forEach(id => { $(id).className = 'step'; });
  $(STEPS[0]).classList.add('active');
  let i = 0;
  clearInterval(stepInterval);
  stepInterval = setInterval(() => {
    $(STEPS[i]).classList.remove('active');
    $(STEPS[i]).classList.add('done');
    i++;
    if (i < STEPS.length) $(STEPS[i]).classList.add('active');
    else clearInterval(stepInterval);
  }, 1800);
}

function clearLoadingSteps() { clearInterval(stepInterval); }

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
