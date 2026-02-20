'use strict';

// ── State ─────────────────────────────────────────────────────────
let activeTab     = 'ideas';
let activeView    = 'capture';
let activeFilter  = 'all';
let materialsData = [];
let browseLoaded  = false;
let libraryCount  = null;
let searchTimer   = null;
let itemsById     = new Map();

// ── Helpers ───────────────────────────────────────────────────────
const el  = id => document.getElementById(id);
const esc = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
const trunc   = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// ── Auto-expanding textareas ──────────────────────────────────────
document.querySelectorAll('.textarea').forEach(ta => {
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
});

// ══════════════════════════════════════════════════════════════════
// TAG PICKER
// ══════════════════════════════════════════════════════════════════
function createTagPicker(containerId) {
  const container     = el(containerId);
  const formTab       = container.dataset.form;
  let selected        = [];
  let myAvailableTags = [];

  container.innerHTML = `
    <div class="tp-box tp-box--${formTab}" id="${containerId}-box">
      <div class="tp-chips" id="${containerId}-chips">
        <input class="tp-input" id="${containerId}-input"
          type="text" placeholder="Add tag…"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      </div>
    </div>
    <div class="tp-dropdown hidden" id="${containerId}-drop"></div>
  `;

  const boxEl  = el(`${containerId}-box`);
  const chips  = el(`${containerId}-chips`);
  const input  = el(`${containerId}-input`);
  const drop   = el(`${containerId}-drop`);

  function renderChips() {
    chips.querySelectorAll('.tp-chip').forEach(c => c.remove());
    selected.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tp-chip';
      chip.innerHTML = `${esc(tag)}<button class="tp-chip-x" type="button" data-tag="${esc(tag)}" aria-label="Remove">×</button>`;
      chips.insertBefore(chip, input);
    });
    input.placeholder = selected.length ? '' : 'Add tag…';
  }

  function openDrop(query) {
    const q = query.toLowerCase().trim();
    const opts = myAvailableTags.filter(t =>
      !selected.includes(t) && (!q || t.toLowerCase().includes(q))
    );

    let html = opts.map(t =>
      `<button class="tp-opt" type="button" data-tag="${esc(t)}">${esc(t)}</button>`
    ).join('');

    const trimmed = query.trim();
    const isNew = trimmed &&
      !myAvailableTags.some(t => t.toLowerCase() === trimmed.toLowerCase()) &&
      !selected.includes(trimmed);

    if (isNew) {
      html += `<button class="tp-opt tp-opt-new" type="button" data-tag="${esc(trimmed)}">+ Create "<b>${esc(trimmed)}</b>"</button>`;
    }

    if (!html) { drop.classList.add('hidden'); return; }
    drop.innerHTML = html;
    drop.classList.remove('hidden');
  }

  function closeDrop() { drop.classList.add('hidden'); }

  function addTag(tag) {
    const t = tag.trim();
    if (!t || selected.includes(t)) return;
    selected.push(t);
    input.value = '';
    renderChips();
    closeDrop();
  }

  function removeTag(tag) {
    selected = selected.filter(t => t !== tag);
    renderChips();
  }

  // Open on focus / typing
  input.addEventListener('focus', () => openDrop(input.value));
  input.addEventListener('input', () => openDrop(input.value));

  // Tap option in dropdown (pointerdown to beat blur)
  drop.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.tp-opt');
    if (btn) { e.preventDefault(); addTag(btn.dataset.tag); }
  });

  // Remove chip
  chips.addEventListener('click', e => {
    const btn = e.target.closest('.tp-chip-x');
    if (btn) removeTag(btn.dataset.tag);
  });

  // Close on blur
  input.addEventListener('blur', () => setTimeout(closeDrop, 160));

  // Enter = add typed value; Backspace on empty = remove last chip
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value.trim();
      if (v) addTag(v); else closeDrop();
    }
    if (e.key === 'Backspace' && !input.value && selected.length) {
      removeTag(selected[selected.length - 1]);
    }
  });

  // Click anywhere in box focuses input
  boxEl.addEventListener('click', e => {
    if (!e.target.closest('.tp-chip-x') && !e.target.closest('.tp-opt')) input.focus();
  });

  return {
    getTags:      () => [...selected],
    setTags:      tags => { selected = [...tags]; renderChips(); },
    reset:        () => { selected = []; renderChips(); closeDrop(); },
    setAvailable: tags => { myAvailableTags = tags; },
  };
}

// ── Instantiate pickers ───────────────────────────────────────────
const pickers = {
  ideas:      createTagPicker('ideaTagPicker'),
  characters: createTagPicker('charTagPicker'),
  stories:    createTagPicker('storyTagPicker'),
  random:     createTagPicker('randomTagPicker'),
};

// ── Load available tags from Notion ───────────────────────────────
const typeToDb = { idea: 'ideas', character: 'characters', story: 'stories', random: 'random' };

async function loadTagsForPicker(dbName, picker) {
  try {
    const res = await fetch(`/api/tags?db=${dbName}`);
    if (!res.ok) return;
    const { tags } = await res.json();
    picker.setAvailable(tags);
  } catch (_) { /* fail silently — pickers still work for new tags */ }
}

function loadAllTags() {
  loadTagsForPicker('ideas',      pickers.ideas);
  loadTagsForPicker('characters', pickers.characters);
  loadTagsForPicker('stories',    pickers.stories);
  loadTagsForPicker('random',     pickers.random);
}
loadAllTags();

// ── Tab switching ─────────────────────────────────────────────────
function showPicker() {
  el('pickerScreen').hidden = false;
  document.querySelectorAll('.form').forEach(f => f.classList.add('hidden'));
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  el('pickerScreen').hidden = true;
  document.querySelectorAll('.form').forEach(f => f.classList.toggle('hidden', f.dataset.tab !== tab));
}

// ── View switching ────────────────────────────────────────────────
function switchView(view) {
  activeView = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  el('captureView').hidden = view !== 'capture';
  el('browseView').hidden  = view !== 'browse';
  el('tabBar').classList.toggle('hidden', view === 'browse');
  document.body.style.paddingBottom = view === 'browse' ? '0' : '';
  if (view === 'browse' && !browseLoaded) loadMaterials();
}

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = el('toast');
  toast.className = 'toast';
  el('toastMsg').textContent = msg;
  toast.getBoundingClientRect();
  toast.classList.add('show', ...(type === 'error' ? ['error'] : []));
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Library badge ─────────────────────────────────────────────────
function updateBadge() {
  if (libraryCount === null) return;
  el('libraryBadge').hidden = false;
  el('libraryCount').textContent = libraryCount;
}

// ── Generic save handler ──────────────────────────────────────────
function handleSave(endpoint, getPayload, btnId, formId, pickerKey, label) {
  el(formId).addEventListener('submit', async e => {
    e.preventDefault();
    const btn     = el(btnId);
    const btnText = btn.querySelector('.btn-text');
    btn.disabled = true;
    btnText.textContent = 'Saving…';

    try {
      const payload = getPayload();
      if (!payload) return;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      el(formId).reset();
      el(formId).querySelectorAll('.textarea').forEach(ta => { ta.style.height = ''; });
      pickers[pickerKey].reset();

      // Refresh tags for this picker (a new tag may have been created)
      loadTagsForPicker(pickerKey, pickers[pickerKey]);

      showToast(`${label} saved to Notion ✓`);
      if (libraryCount !== null) { libraryCount++; updateBadge(); }
      browseLoaded = false;
      showPicker();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Save to Notion';
    }
  });
}

// ── Form: Ideas ───────────────────────────────────────────────────
handleSave('/api/idea',
  () => {
    const title = el('ideaTitle').value.trim();
    if (!title) { showToast('Title is required', 'error'); el('ideaTitle').focus(); return null; }
    return {
      title,
      type:    el('ideaType').value || null,
      details: el('ideaDetails').value.trim() || null,
      tags:    pickers.ideas.getTags(),
    };
  },
  'ideaSaveBtn', 'ideaForm', 'ideas', 'Idea'
);

// ── Form: Characters ──────────────────────────────────────────────
handleSave('/api/character',
  () => {
    const name = el('charName').value.trim();
    if (!name) { showToast('Name is required', 'error'); el('charName').focus(); return null; }
    return {
      name,
      description:     el('charDescription').value.trim() || null,
      whenEncountered: el('charWhenEncountered').value.trim() || null,
      whyInteresting:  el('charWhyInteresting').value.trim() || null,
      tags:            pickers.characters.getTags(),
    };
  },
  'charSaveBtn', 'characterForm', 'characters', 'Character'
);

// ── Form: Past Stories ────────────────────────────────────────────
handleSave('/api/story',
  () => {
    const what = el('storyWhat').value.trim();
    if (!what) { showToast('"What" is required', 'error'); el('storyWhat').focus(); return null; }
    return {
      what,
      when:           el('storyWhen').value.trim() || null,
      whyInteresting: el('storyWhyInteresting').value.trim() || null,
      tags:           pickers.stories.getTags(),
    };
  },
  'storySaveBtn', 'storyForm', 'stories', 'Story'
);

// ── Form: Random ──────────────────────────────────────────────────
handleSave('/api/random',
  () => {
    const title = el('randomTitle').value.trim();
    if (!title) { showToast('Title is required', 'error'); el('randomTitle').focus(); return null; }
    return {
      title,
      details: el('randomDetails').value.trim() || null,
      tags:    pickers.random.getTags(),
    };
  },
  'randomSaveBtn', 'randomForm', 'random', 'Entry'
);

// ── Browse: load materials ────────────────────────────────────────
async function loadMaterials() {
  el('browseLoading').hidden   = false;
  el('browseEmpty').hidden     = true;
  el('materialsList').innerHTML = '';

  try {
    const res = await fetch('/api/materials');
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    materialsData = data.materials;
    libraryCount  = materialsData.length;
    browseLoaded  = true;
    updateBadge();
    renderMaterials();
  } catch (err) {
    showToast('Could not load library: ' + err.message, 'error');
    el('browseEmpty').hidden = false;
    el('emptySubText').textContent = 'Could not connect. Check server and Notion config.';
  } finally {
    el('browseLoading').hidden = true;
  }
}

function renderMaterials() {
  const filtered = activeFilter === 'all'
    ? materialsData
    : materialsData.filter(m => m.type === activeFilter);

  if (filtered.length === 0) {
    el('browseEmpty').hidden = false;
    el('emptySubText').textContent = 'No entries yet. Switch to Capture to add your first entry.';
    el('materialsList').innerHTML = '';
  } else {
    el('browseEmpty').hidden = true;
    el('materialsList').innerHTML = filtered.map(renderCard).join('');
  }
}

function renderSearchResults(items) {
  if (items.length === 0) {
    el('browseEmpty').hidden = false;
    el('emptySubText').textContent = 'No results found. Try different keywords.';
    el('materialsList').innerHTML = '';
  } else {
    el('browseEmpty').hidden = true;
    el('materialsList').innerHTML = items.map(renderCard).join('');
  }
}

// ── Card renderer ─────────────────────────────────────────────────
const entryCache = new Map();

function renderCard(item) {
  itemsById.set(item.id, item);
  const badges = {
    idea:      '<span class="type-badge type-idea">Idea</span>',
    character: '<span class="type-badge type-character">Character</span>',
    story:     '<span class="type-badge type-story">Story</span>',
    random:    '<span class="type-badge type-random">Random</span>',
  };

  let meta = '';
  if (item.type === 'idea' && item.ideaType) meta = item.ideaType;
  if (item.type === 'story' && item.when)    meta = item.when;

  const tagsHtml = item.tags?.length
    ? `<div class="card-tags">${item.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
    : '';

  return `
    <div class="material-card" data-id="${item.id}" data-type="${item.type}" data-url="${esc(item.url || '')}">
      <div class="card-summary">
        <div class="card-header">
          <div class="card-title-row">
            ${badges[item.type] || ''}
            <h3 class="card-title">${esc(item.title)}</h3>
          </div>
          <div class="card-header-right">
            <time class="card-time">${fmtDate(item.createdAt)}</time>
            <svg class="card-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        ${meta ? `<p class="card-details">${esc(meta)}</p>` : ''}
        ${tagsHtml}
      </div>
      <div class="card-expand-wrap">
        <div class="card-expand-content"></div>
      </div>
    </div>`;
}

// ── Card edit helpers ─────────────────────────────────────────────
function enterEditMode(card) {
  const id       = card.dataset.id;
  const type     = card.dataset.type;
  const item     = itemsById.get(id);
  const sections = entryCache.get(id) || [];
  if (!item) return;

  card.dataset.editing = 'true';
  const contentEl = card.querySelector('.card-expand-content');
  const secMap    = {};
  sections.forEach(s => { if (s.heading) secMap[s.heading] = s.content; });

  let fieldsHtml = '';
  const dbName   = typeToDb[type] || type;

  if (type === 'idea') {
    fieldsHtml = `
      <div class="edit-field"><label class="label">Title <span class="req">*</span></label>
        <input class="input edit-input" name="title" value="${esc(item.title)}" autocomplete="off"></div>
      <div class="edit-field"><label class="label">Type</label>
        <select class="select edit-select" name="ideaType">
          <option value="">— Select type —</option>
          <option value="Script Idea"${item.ideaType === 'Script Idea' ? ' selected' : ''}>Script Idea</option>
          <option value="Scene Idea"${item.ideaType === 'Scene Idea' ? ' selected' : ''}>Scene Idea</option>
        </select></div>
      <div class="edit-field"><label class="label">Details</label>
        <textarea class="textarea edit-textarea" name="details">${esc(secMap['Details'] || '')}</textarea></div>`;
  } else if (type === 'character') {
    fieldsHtml = `
      <div class="edit-field"><label class="label">Name <span class="req">*</span></label>
        <input class="input edit-input" name="name" value="${esc(item.title)}" autocomplete="off"></div>
      <div class="edit-field"><label class="label">Description</label>
        <textarea class="textarea edit-textarea" name="description">${esc(secMap['Description'] || '')}</textarea></div>
      <div class="edit-field"><label class="label">When I encountered them</label>
        <textarea class="textarea edit-textarea" name="whenEncountered">${esc(secMap['When I encountered them'] || '')}</textarea></div>
      <div class="edit-field"><label class="label">Why they are interesting</label>
        <textarea class="textarea edit-textarea" name="whyInteresting">${esc(secMap['Why they are interesting'] || '')}</textarea></div>`;
  } else if (type === 'story') {
    fieldsHtml = `
      <div class="edit-field"><label class="label">What <span class="req">*</span></label>
        <input class="input edit-input" name="what" value="${esc(item.title)}" autocomplete="off"></div>
      <div class="edit-field"><label class="label">When</label>
        <textarea class="textarea edit-textarea" name="when">${esc(secMap['When'] || '')}</textarea></div>
      <div class="edit-field"><label class="label">Why interesting</label>
        <textarea class="textarea edit-textarea" name="whyInteresting">${esc(secMap['Why interesting'] || '')}</textarea></div>`;
  } else {
    fieldsHtml = `
      <div class="edit-field"><label class="label">Title <span class="req">*</span></label>
        <input class="input edit-input" name="title" value="${esc(item.title)}" autocomplete="off"></div>
      <div class="edit-field"><label class="label">Details</label>
        <textarea class="textarea edit-textarea" name="details">${esc(secMap['Details'] || '')}</textarea></div>`;
  }

  const editPickerId = `editPicker${id.replace(/-/g, '')}`;
  contentEl.innerHTML = `
    <div class="card-edit-form" data-id="${id}">
      <p class="card-edit-label">Editing</p>
      ${fieldsHtml}
      <div class="edit-field"><label class="label">Tags</label>
        <div class="tag-picker" id="${editPickerId}" data-form="${dbName}"></div>
      </div>
      <div class="card-edit-actions">
        <button class="card-edit-cancel" type="button">Cancel</button>
        <button class="card-edit-save" type="button">Save</button>
      </div>
    </div>`;

  // Auto-size textareas
  contentEl.querySelectorAll('.edit-textarea').forEach(ta => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
    ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
  });

  // Init tag picker pre-populated with current tags, then load db tags
  const editPicker = createTagPicker(editPickerId);
  editPicker.setTags(item.tags || []);
  loadTagsForPicker(dbName, editPicker);
  card._editPicker = editPicker;
}

function exitEditMode(card) {
  delete card.dataset.editing;
  card._editPicker = null;
  const id        = card.dataset.id;
  const url       = card.dataset.url;
  const contentEl = card.querySelector('.card-expand-content');
  contentEl.innerHTML = entryCache.has(id) ? buildExpandHtml(entryCache.get(id), url) : '';
}

async function saveEdit(card) {
  const id      = card.dataset.id;
  const type    = card.dataset.type;
  const item    = itemsById.get(id);
  const form    = card.querySelector('.card-edit-form');
  const picker  = card._editPicker;
  const saveBtn = card.querySelector('.card-edit-save');

  saveBtn.textContent = 'Saving…';
  saveBtn.disabled    = true;

  try {
    const tags     = picker.getTags();
    const sections = [];
    const payload  = { type, tags };

    if (type === 'idea') {
      payload.title    = form.querySelector('[name=title]').value.trim();
      payload.ideaType = form.querySelector('[name=ideaType]').value || null;
      const details    = form.querySelector('[name=details]').value.trim();
      if (details) sections.push({ heading: 'Details', content: details });
    } else if (type === 'character') {
      payload.name = form.querySelector('[name=name]').value.trim();
      const desc   = form.querySelector('[name=description]').value.trim();
      const when   = form.querySelector('[name=whenEncountered]').value.trim();
      const why    = form.querySelector('[name=whyInteresting]').value.trim();
      if (desc) sections.push({ heading: 'Description', content: desc });
      if (when) sections.push({ heading: 'When I encountered them', content: when });
      if (why)  sections.push({ heading: 'Why they are interesting', content: why });
    } else if (type === 'story') {
      payload.what = form.querySelector('[name=what]').value.trim();
      const when   = form.querySelector('[name=when]').value.trim();
      const why    = form.querySelector('[name=whyInteresting]').value.trim();
      if (when) sections.push({ heading: 'When', content: when });
      if (why)  sections.push({ heading: 'Why interesting', content: why });
    } else {
      payload.title = form.querySelector('[name=title]').value.trim();
      const details = form.querySelector('[name=details]').value.trim();
      if (details) sections.push({ heading: 'Details', content: details });
    }

    payload.sections = sections;
    const primaryVal = (payload.title || payload.name || payload.what || '').trim();
    if (!primaryVal) {
      showToast('Title is required', 'error');
      saveBtn.textContent = 'Save'; saveBtn.disabled = false;
      return;
    }

    const res = await fetch(`/api/entry/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');

    // Update local caches
    if (item) {
      item.title = primaryVal;
      item.tags  = tags;
      if (type === 'idea') item.ideaType = payload.ideaType;
    }
    entryCache.set(id, sections);

    // Update card summary title
    const titleEl = card.querySelector('.card-title');
    if (titleEl) titleEl.textContent = primaryVal;

    // Update card summary tags
    const tagsHtml = tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const tagsEl   = card.querySelector('.card-tags');
    if (tagsEl) {
      tagsEl.innerHTML = tagsHtml;
    } else if (tags.length) {
      card.querySelector('.card-summary').insertAdjacentHTML('beforeend',
        `<div class="card-tags">${tagsHtml}</div>`);
    }

    // Refresh the capture-form picker for this type
    loadTagsForPicker(typeToDb[type], pickers[typeToDb[type]]);

    showToast('Saved ✓');
    exitEditMode(card);
  } catch (err) {
    showToast(err.message, 'error');
    saveBtn.textContent = 'Save'; saveBtn.disabled = false;
  }
}

// ── Card expand / edit event delegation ──────────────────────────
document.addEventListener('click', async e => {
  // Edit button
  if (e.target.closest('.card-edit-btn')) {
    const card = e.target.closest('.material-card');
    if (card) enterEditMode(card);
    return;
  }
  // Cancel edit
  if (e.target.closest('.card-edit-cancel')) {
    const card = e.target.closest('.material-card');
    if (card) exitEditMode(card);
    return;
  }
  // Save edit
  if (e.target.closest('.card-edit-save')) {
    const card = e.target.closest('.material-card');
    if (card) await saveEdit(card);
    return;
  }

  const card = e.target.closest('.material-card');
  if (!card) return;
  if (e.target.closest('.card-notion-link')) return;  // let link open
  if (card.dataset.editing === 'true') return;         // don't collapse while editing

  const wasExpanded = card.classList.contains('expanded');
  document.querySelectorAll('.material-card.expanded').forEach(c => c.classList.remove('expanded'));
  if (wasExpanded) return;

  card.classList.add('expanded');

  const id        = card.dataset.id;
  const url       = card.dataset.url;
  const contentEl = card.querySelector('.card-expand-content');

  if (entryCache.has(id)) {
    contentEl.innerHTML = buildExpandHtml(entryCache.get(id), url);
    return;
  }

  contentEl.innerHTML = `<div class="card-loading"><div class="spinner-sm"></div></div>`;

  try {
    const res = await fetch(`/api/entry/${id}`);
    if (!res.ok) throw new Error();
    const { sections } = await res.json();
    entryCache.set(id, sections);
    contentEl.innerHTML = buildExpandHtml(sections, url);
  } catch {
    contentEl.innerHTML = `<p class="card-expand-error">Could not load content.</p>`;
  }
});

function buildExpandHtml(sections, url) {
  const sectionsHtml = sections.length
    ? sections.map(s => `
        <div class="card-section">
          ${s.heading ? `<p class="card-section-heading">${esc(s.heading)}</p>` : ''}
          <p class="card-section-content">${esc(s.content)}</p>
        </div>`).join('')
    : `<p class="card-expand-empty">No details recorded.</p>`;

  const notionBtn = url
    ? `<a class="card-notion-link" href="${url}" target="_blank" rel="noopener">
        Open in Notion
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
        </svg>
      </a>`
    : '';

  return `<div class="card-expand-inner">${sectionsHtml}<div class="card-expand-actions"><button class="card-edit-btn" type="button">Edit</button>${notionBtn}</div></div>`;
}

// ── Search ────────────────────────────────────────────────────────
async function doSearch(q) {
  el('searchLoading').hidden   = false;
  el('browseEmpty').hidden     = true;
  el('materialsList').innerHTML = '';
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Search failed');
    renderSearchResults((await res.json()).materials);
  } catch (err) {
    showToast('Search error: ' + err.message, 'error');
  } finally {
    el('searchLoading').hidden = true;
  }
}

el('searchInput').addEventListener('input', function () {
  const q = this.value.trim();
  el('searchClear').hidden = q.length === 0;
  el('filterRow').style.display = q ? 'none' : '';
  clearTimeout(searchTimer);
  if (!q) { browseLoaded ? renderMaterials() : loadMaterials(); return; }
  if (q.length < 2) return;
  searchTimer = setTimeout(() => doSearch(q), 400);
});

el('searchClear').addEventListener('click', () => {
  el('searchInput').value = '';
  el('searchInput').dispatchEvent(new Event('input'));
  el('searchInput').focus();
});

// ── Filter buttons ────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === activeFilter)
    );
    renderMaterials();
  });
});

// ── Picker cards ──────────────────────────────────────────────────
document.querySelectorAll('.picker-card').forEach(card => {
  card.addEventListener('click', () => switchTab(card.dataset.tab));
});

// ── Back buttons ──────────────────────────────────────────────────
['ideaBackBtn', 'charBackBtn', 'storyBackBtn', 'randomBackBtn'].forEach(id => {
  el(id).addEventListener('click', showPicker);
});

// ── Tab bar ───────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ── View toggle ───────────────────────────────────────────────────
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ── Refresh ───────────────────────────────────────────────────────
el('refreshBtn').addEventListener('click', () => {
  browseLoaded = false;
  entryCache.clear();
  el('searchInput').value = '';
  el('searchClear').hidden = true;
  el('filterRow').style.display = '';
  loadMaterials();
});

// ── Init ──────────────────────────────────────────────────────────
switchView('capture');
showPicker();
