const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.post('/data', (req, res) => {
  res.json({ received: true, size: JSON.stringify(req.body).length });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
