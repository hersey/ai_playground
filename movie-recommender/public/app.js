/* ═══════════════════════════════════════════════════════════
   CINEMATCH — Frontend Logic
   ═══════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

// ── State ────────────────────────────────────────────────
let busy = false;
let allRecs = [];
let currentSort = 'default';
let lastSearchTitle = '';
let gameScore = 0;
let gameInterval = null;
let gameActive = false;

// ── Elements ─────────────────────────────────────────────
const heroSection    = $('heroSection');
const loadingScreen  = $('loadingScreen');
const resultsSection = $('resultsSection');
const movieInput     = $('movieInput');
const searchBtn      = $('searchBtn');
const searchAgainBtn = $('searchAgainBtn');
const moreRecsBtn    = $('moreRecsBtn');
const moviesGrid     = $('moviesGrid');
const toast          = $('toast');
const toastMsg       = $('toastMsg');

// ── Quick search ──────────────────────────────────────────
function quickSearch(title) {
  movieInput.value = title;
  doSearch();
}

document.querySelectorAll('.pill[data-movie]').forEach(btn => {
  btn.addEventListener('click', () => quickSearch(btn.dataset.movie));
});

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

// ── Main search ───────────────────────────────────────────
async function doSearch(opts = {}) {
  const { refresh = false } = opts;
  const title = refresh ? lastSearchTitle : movieInput.value.trim();
  const excludeTitles = refresh ? allRecs.map(r => r.title).filter(Boolean) : [];

  if (!title) { showError('Please enter a movie or TV show title'); movieInput.focus(); return; }
  if (busy) return;

  if (!refresh) lastSearchTitle = title;

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
      body: JSON.stringify({ movieTitle: title, excludeTitles }),
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
      if (e.target.closest('a')) return;
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
  heroSection.hidden    = name !== 'hero';
  loadingScreen.hidden  = name !== 'loading';
  resultsSection.hidden = name !== 'results';
}

// ── Emoji Movie Quiz ──────────────────────────────────────
const EMOJI_QUIZ = [
  { emojis: '🦁👑🌍', answer: 'The Lion King',       options: ['The Lion King', 'Tarzan', 'Madagascar', 'The Jungle Book'] },
  { emojis: '🤖❤️🌱🚀', answer: 'WALL-E',             options: ['WALL-E', 'Ex Machina', 'I, Robot', 'Interstellar'] },
  { emojis: '🌊🚢❤️🧊', answer: 'Titanic',            options: ['Titanic', 'Cast Away', 'The Perfect Storm', 'Poseidon'] },
  { emojis: '🧙‍♂️💍🔥🗡️', answer: 'The Lord of the Rings', options: ['The Lord of the Rings', 'Harry Potter', 'The Hobbit', 'Merlin'] },
  { emojis: '🦈🏊😱',   answer: 'Jaws',               options: ['Jaws', 'The Meg', 'Deep Blue Sea', 'Open Water'] },
  { emojis: '🐠🔍🌊🐢', answer: 'Finding Nemo',       options: ['Finding Nemo', 'Finding Dory', 'The Little Mermaid', 'Shark Tale'] },
  { emojis: '🧸🚀⭐🤠', answer: 'Toy Story',           options: ['Toy Story', 'Bolt', 'Monsters, Inc.', 'Cars'] },
  { emojis: '👻🔫😄🏙️', answer: 'Ghostbusters',       options: ['Ghostbusters', 'Men in Black', 'Beetlejuice', 'The Frighteners'] },
  { emojis: '🦕🌴⚠️🏃', answer: 'Jurassic Park',      options: ['Jurassic Park', 'King Kong', 'Land of the Lost', 'Dinosaur'] },
  { emojis: '❄️👸⛄🎵', answer: 'Frozen',              options: ['Frozen', 'Tangled', 'Snow White', 'Cinderella'] },
  { emojis: '🕷️🏙️🕸️',  answer: 'Spider-Man',         options: ['Spider-Man', 'Batman', 'Ant-Man', 'Superman'] },
  { emojis: '💊🔵🔴🐇', answer: 'The Matrix',         options: ['The Matrix', 'Inception', 'Tron', 'Minority Report'] },
  { emojis: '🧊🏔️🪓😰', answer: 'The Shining',       options: ['The Shining', 'Misery', 'Psycho', 'It'] },
  { emojis: '🚀🌌⏰🌊', answer: 'Interstellar',       options: ['Interstellar', 'Gravity', 'The Martian', 'Contact'] },
  { emojis: '🎭😄😢🏠', answer: 'Inside Out',         options: ['Inside Out', 'Soul', 'Coco', 'Up'] },
  { emojis: '🕶️💼💵🎵', answer: 'Pulp Fiction',      options: ['Pulp Fiction', 'Reservoir Dogs', 'The Big Lebowski', 'Kill Bill'] },
  { emojis: '🏎️🌵🌅🔥', answer: 'Mad Max: Fury Road', options: ['Mad Max: Fury Road', 'Fast & Furious', 'Death Race', 'Fury'] },
  { emojis: '👦🏠🔧😄', answer: 'Home Alone',         options: ['Home Alone', 'Gremlins', 'Problem Child', 'The Goonies'] },
  { emojis: '🐋🌊🎵🏝️', answer: 'Moby Dick',         options: ['Moby Dick', 'Life of Pi', 'Cast Away', 'The Old Man and the Sea'] },
  { emojis: '🧟‍♂️🌍🚗💨', answer: 'The Walking Dead', options: ['The Walking Dead', 'World War Z', 'Zombieland', '28 Days Later'] },
];

let quizQueue = [];
let currentQuestion = null;

function startGame() {
  gameScore = 0;
  $('gameScore').textContent = '0';
  $('gameFeedback').textContent = '';
  $('gameFeedback').className = 'game-feedback';
  gameActive = true;

  // Shuffle quiz questions
  quizQueue = [...EMOJI_QUIZ].sort(() => Math.random() - 0.5);
  showNextQuestion();
}

function stopGame() {
  gameActive = false;
  clearTimeout(gameInterval);
}

function showNextQuestion() {
  if (!gameActive) return;
  if (quizQueue.length === 0) {
    quizQueue = [...EMOJI_QUIZ].sort(() => Math.random() - 0.5);
  }
  currentQuestion = quizQueue.pop();

  const emojiEl   = $('gameEmojis');
  const optionsEl = $('gameOptions');
  const feedbackEl = $('gameFeedback');

  // Reset animation
  emojiEl.style.animation = 'none';
  void emojiEl.offsetWidth;
  emojiEl.style.animation = '';
  emojiEl.textContent = currentQuestion.emojis;

  feedbackEl.textContent = '';
  feedbackEl.className = 'game-feedback';

  // Shuffle options
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

  // Disable all buttons and highlight
  optionsEl.querySelectorAll('.game-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === currentQuestion.answer) b.classList.add('correct');
    else if (b === btn && !correct) b.classList.add('wrong');
  });

  if (correct) {
    gameScore++;
    $('gameScore').textContent = gameScore;
    feedbackEl.textContent = '✓ Correct!';
    feedbackEl.className = 'game-feedback correct';
  } else {
    feedbackEl.textContent = `✗ It was ${currentQuestion.answer}`;
    feedbackEl.className = 'game-feedback wrong';
  }

  // Auto-advance after 1.6s
  gameInterval = setTimeout(() => {
    if (gameActive) showNextQuestion();
  }, 1600);
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
