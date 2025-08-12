const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let players = [];

app.post('/result', (req, res) => {
  const { name, mistakes } = req.body;
  if (!name || mistakes === undefined) {
    return res.status(400).json({ error: 'Name and mistakes are required' });
  }
  players.push({ name, mistakes });
  console.log(`New result: ${name}, mistakes: ${mistakes}`);
  res.json({ success: true, message: "Result saved" });
});

app.get('/leaderboard', (req, res) => {
  const sorted = [...players].sort((a, b) => a.mistakes - b.mistakes);
  res.json(sorted);
});

app.get('/', (req, res) => {
  res.send('School Adventure Backend is running!');
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
