const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Example route to test
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Example POST to save score
let scores = []; // Temporary in-memory "database"
app.post('/score', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ error: 'Name and score are required' });
  }
  scores.push({ name, score });
  res.json({ success: true });
});

// Example GET to see leaderboard
app.get('/leaderboard', (req, res) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  res.json(sorted);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
