import express from 'express';
import { Client } from '@notionhq/client';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ── Property helpers ──────────────────────────────────────────────
const selectProp      = val => val ? { select: { name: val } } : undefined;
const multiSelectProp = arr => arr?.length ? { multi_select: arr.map(v => ({ name: v.trim() })) } : undefined;
function set(props, key, val) { if (val !== undefined) props[key] = val; }

// ── Page content (blocks) builder ────────────────────────────────
// Free-text fields go into the page body as labelled sections
function buildBlocks(fields) {
  const blocks = [];
  for (const { heading, content } of fields) {
    if (!content?.trim()) continue;
    blocks.push({
      object: 'block', type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: heading } }] },
    });
    blocks.push({
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: content.trim() } }] },
    });
  }
  return blocks;
}

// ── Page parsers ──────────────────────────────────────────────────
const getSel  = p => p?.select?.name || null;
const getTags = p => p?.multi_select?.map(t => t.name) || [];

function parseIdeaPage(p) {
  return {
    type: 'idea', id: p.id, url: p.url, createdAt: p.created_time,
    title:    p.properties['Title']?.title?.[0]?.plain_text || 'Untitled',
    ideaType: getSel(p.properties['Type']),
    tags:     getTags(p.properties['Tags']),
  };
}

function parseCharacterPage(p) {
  return {
    type: 'character', id: p.id, url: p.url, createdAt: p.created_time,
    title: p.properties['Name']?.title?.[0]?.plain_text || 'Unnamed',
    tags:  getTags(p.properties['Tags']),
  };
}

function parseStoryPage(p) {
  return {
    type: 'story', id: p.id, url: p.url, createdAt: p.created_time,
    title: p.properties['What']?.title?.[0]?.plain_text || 'Untitled',
    tags:  getTags(p.properties['Tags']),
  };
}

function parseRandomPage(p) {
  return {
    type: 'random', id: p.id, url: p.url, createdAt: p.created_time,
    title: p.properties['Title']?.title?.[0]?.plain_text || 'Untitled',
    tags:  getTags(p.properties['Tags']),
  };
}

// ── POST /api/idea ────────────────────────────────────────────────
app.post('/api/idea', async (req, res) => {
  const { title, type, details, tags } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const properties = { 'Title': { title: [{ text: { content: title.trim() } }] } };
    set(properties, 'Type', selectProp(type));
    set(properties, 'Tags', multiSelectProp(tags));
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_IDEAS_DB_ID },
      properties,
      children: buildBlocks([{ heading: 'Details', content: details }]),
    });
    res.json({ success: true, id: page.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save idea' });
  }
});

// ── POST /api/character ───────────────────────────────────────────
app.post('/api/character', async (req, res) => {
  const { name, description, whenEncountered, whyInteresting, tags } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const properties = { 'Name': { title: [{ text: { content: name.trim() } }] } };
    set(properties, 'Tags', multiSelectProp(tags));
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_CHARACTERS_DB_ID },
      properties,
      children: buildBlocks([
        { heading: 'Description',              content: description },
        { heading: 'When I encountered them',  content: whenEncountered },
        { heading: 'Why they are interesting', content: whyInteresting },
      ]),
    });
    res.json({ success: true, id: page.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save character' });
  }
});

// ── POST /api/story ───────────────────────────────────────────────
app.post('/api/story', async (req, res) => {
  const { what, when, whyInteresting, tags } = req.body;
  if (!what?.trim()) return res.status(400).json({ error: '"What" is required' });
  try {
    const properties = { 'What': { title: [{ text: { content: what.trim() } }] } };
    set(properties, 'Tags', multiSelectProp(tags));
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_STORIES_DB_ID },
      properties,
      children: buildBlocks([
        { heading: 'When',            content: when },
        { heading: 'Why interesting', content: whyInteresting },
      ]),
    });
    res.json({ success: true, id: page.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save story' });
  }
});

// ── POST /api/random ──────────────────────────────────────────────
app.post('/api/random', async (req, res) => {
  const { title, details, tags } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const properties = { 'Title': { title: [{ text: { content: title.trim() } }] } };
    set(properties, 'Tags', multiSelectProp(tags));
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_RANDOM_DB_ID },
      properties,
      children: buildBlocks([{ heading: 'Details', content: details }]),
    });
    res.json({ success: true, id: page.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to save entry' });
  }
});

// ── PATCH /api/entry/:id — update properties + replace body blocks ─
app.patch('/api/entry/:id', async (req, res) => {
  const { type, tags, sections, ...fields } = req.body;
  const id = req.params.id;
  try {
    // Build properties based on type
    const properties = {};
    if (type === 'idea') {
      if (fields.title?.trim())
        properties['Title'] = { title: [{ text: { content: fields.title.trim() } }] };
      set(properties, 'Type', selectProp(fields.ideaType));
    } else if (type === 'character') {
      if (fields.name?.trim())
        properties['Name'] = { title: [{ text: { content: fields.name.trim() } }] };
    } else if (type === 'story') {
      if (fields.what?.trim())
        properties['What'] = { title: [{ text: { content: fields.what.trim() } }] };
    } else if (type === 'random') {
      if (fields.title?.trim())
        properties['Title'] = { title: [{ text: { content: fields.title.trim() } }] };
    }
    set(properties, 'Tags', multiSelectProp(tags));
    if (Object.keys(properties).length)
      await notion.pages.update({ page_id: id, properties });

    // Replace body blocks: delete existing, append new
    const { results } = await notion.blocks.children.list({ block_id: id, page_size: 100 });
    await Promise.all(results.map(b => notion.blocks.delete({ block_id: b.id })));
    const newBlocks = buildBlocks(sections || []);
    if (newBlocks.length)
      await notion.blocks.children.append({ block_id: id, children: newBlocks });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/entry/:id — fetch page blocks as sections ───────────
app.get('/api/entry/:id', async (req, res) => {
  try {
    const { results } = await notion.blocks.children.list({
      block_id: req.params.id,
      page_size: 100,
    });

    const getRichText = rt => rt?.map(t => t.plain_text).join('') || '';

    const sections = [];
    let current = null;  // { heading, lines[] }

    const flush = () => {
      if (current && current.lines.length) sections.push(current);
    };

    for (const block of results) {
      // Any heading type starts a new section
      if (['heading_1','heading_2','heading_3'].includes(block.type)) {
        flush();
        current = {
          heading: getRichText(block[block.type].rich_text),
          lines: [],
        };
        continue;
      }

      // Text-bearing blocks
      let line = '';
      if (block.type === 'paragraph') {
        line = getRichText(block.paragraph.rich_text);
      } else if (block.type === 'bulleted_list_item') {
        line = '• ' + getRichText(block.bulleted_list_item.rich_text);
      } else if (block.type === 'numbered_list_item') {
        line = getRichText(block.numbered_list_item.rich_text);
      } else if (block.type === 'quote') {
        line = getRichText(block.quote.rich_text);
      }

      if (line.trim()) {
        if (!current) current = { heading: null, lines: [] };
        current.lines.push(line);
      }
    }
    flush();

    const parsed = sections.map(s => ({
      heading: s.heading,
      content: s.lines.join('\n'),
    }));

    res.json({ sections: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tags?db=ideas|characters|stories|random ──────────────
app.get('/api/tags', async (req, res) => {
  const dbMap = {
    ideas:      process.env.NOTION_IDEAS_DB_ID,
    characters: process.env.NOTION_CHARACTERS_DB_ID,
    stories:    process.env.NOTION_STORIES_DB_ID,
    random:     process.env.NOTION_RANDOM_DB_ID,
  };
  const dbId = dbMap[req.query.db];
  if (!dbId) return res.status(400).json({ error: 'Invalid or missing ?db= param' });

  try {
    const db   = await notion.databases.retrieve({ database_id: dbId });
    const tags = new Set();
    db.properties['Tags']?.multi_select?.options?.forEach(opt => tags.add(opt.name));
    res.json({ tags: [...tags].sort((a, b) => a.localeCompare(b)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/materials ────────────────────────────────────────────
app.get('/api/materials', async (req, res) => {
  try {
    const opts = { page_size: 20, sorts: [{ timestamp: 'created_time', direction: 'descending' }] };
    const [ideasRes, charsRes, storiesRes, randomRes] = await Promise.all([
      notion.databases.query({ database_id: process.env.NOTION_IDEAS_DB_ID,      ...opts }),
      notion.databases.query({ database_id: process.env.NOTION_CHARACTERS_DB_ID, ...opts }),
      notion.databases.query({ database_id: process.env.NOTION_STORIES_DB_ID,    ...opts }),
      notion.databases.query({ database_id: process.env.NOTION_RANDOM_DB_ID,     ...opts }),
    ]);

    const materials = [
      ...ideasRes.results.map(parseIdeaPage),
      ...charsRes.results.map(parseCharacterPage),
      ...storiesRes.results.map(parseStoryPage),
      ...randomRes.results.map(parseRandomPage),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ materials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to fetch materials' });
  }
});

// ── GET /api/search?q=query ───────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ materials: [] });

  try {
    const results = await notion.search({
      query: q,
      filter: { value: 'page', property: 'object' },
      page_size: 30,
    });

    const dbMap = {
      [process.env.NOTION_IDEAS_DB_ID]:      parseIdeaPage,
      [process.env.NOTION_CHARACTERS_DB_ID]: parseCharacterPage,
      [process.env.NOTION_STORIES_DB_ID]:    parseStoryPage,
      [process.env.NOTION_RANDOM_DB_ID]:     parseRandomPage,
    };

    const materials = results.results
      .filter(p => p.object === 'page' && p.parent?.type === 'database_id' && dbMap[p.parent.database_id])
      .map(p => dbMap[p.parent.database_id](p))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ materials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Search failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Scribe running → http://localhost:${PORT}`));
