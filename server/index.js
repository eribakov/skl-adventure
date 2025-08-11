const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const playersFile = path.join(dataDir, 'players.json');
const scoresFile = path.join(dataDir, 'scores.json');

async function ensureDataFilesExist() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(playersFile); } catch { await fs.writeFile(playersFile, JSON.stringify({}), 'utf-8'); }
  try { await fs.access(scoresFile); } catch { await fs.writeFile(scoresFile, JSON.stringify([]), 'utf-8'); }
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content || 'null');
}

async function writeJson(filePath, data) {
  const tempPath = filePath + '.tmp';
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

function generateId() {
  return 'p_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

app.post('/api/player', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    await ensureDataFilesExist();
    const players = await readJson(playersFile);
    const playerId = generateId();
    players[playerId] = { id: playerId, name: name.trim(), createdAt: new Date().toISOString() };
    await writeJson(playersFile, players);
    return res.json({ playerId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/score', async (req, res) => {
  try {
    const { playerId, score } = req.body || {};
    if (!playerId) {
      return res.status(400).json({ error: 'playerId is required' });
    }
    const numericScore = Number(score) || 0;
    await ensureDataFilesExist();
    const players = await readJson(playersFile);
    if (!players[playerId]) {
      return res.status(404).json({ error: 'Player not found' });
    }
    const scores = await readJson(scoresFile);
    scores.push({ playerId, score: numericScore, createdAt: new Date().toISOString() });
    await writeJson(scoresFile, scores);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    await ensureDataFilesExist();
    const [players, scores] = await Promise.all([
      readJson(playersFile),
      readJson(scoresFile),
    ]);

    // Sum score per player
    const totals = {};
    for (const entry of scores) {
      const pid = entry.playerId;
      totals[pid] = (totals[pid] || 0) + (Number(entry.score) || 0);
    }

    const rows = Object.entries(totals)
      .map(([pid, total]) => ({ playerId: pid, name: players[pid]?.name || 'Unknown', totalScore: total }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});