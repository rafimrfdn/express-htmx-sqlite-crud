const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Connect to SQLite database
const db = new sqlite3.Database('database.db');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create the users table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT
  )`);
});

// Routes

// POST add a new user
app.post('/users', (req, res) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).send('Username is required');
    return;
  }

  db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
    if (err) {
      res.status(500).send('Failed to add user');
      return console.error(err.message);
    }
    console.log(`User added with ID: ${this.lastID}`);
    res.sendStatus(200);
  });
});

// GET all users
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      res.status(500).send('Failed to fetch users');
      return console.error(err.message);
    }
    // res.json(rows);
    let html = ""
    rows.map(user => 
      html += `<li 
                id="items-${user.id}">
                ${user.username}

                    <button class="bg-yellow-500"
                        hx-get="/user/${user.id}"
                        hx-trigger="click"
                        hx-swap="outerHTML"
                        >Edit ${user.id}
                    </button>

                    <button class="bg-red-500"
                        hx-delete="/users/${user.id}" 
                        hx-trigger="click"
                        hx-swap="outerHTML"
                        hx-target="#items-${user.id}"
                    > Hapus ${user.id}
                    </button>
            </li>`
    )
    res.send(html);
    // res.json(rows);
  });
});

// GET specific user for update form
app.get('/user/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).send('Failed to fetch user');
      return console.error(err.message);
    }
        res.send(`<form method="PUT" id="editme" hx-swap="beforeend" hx-get="/users" hx-target="#items-${row.id}"> 
                    <input type="text"  name="username" placeholder="${row.username}" class="border"/>
                    <button 
                        hx-trigger="click"
                        hx-put="/user/${row.id}" 
                        hx-include="[name=username]" 
                    >update</button>
                </form>
                `);
  });
});

// PUT update a user
app.put('/user/:id', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).send('Username is required');
  }

  db.run('UPDATE users SET username = ? WHERE id = ?', [username, id], function(err) {
    if (err) {
      console.error('Failed to update user:', err.message);
      return res.status(500).send('Failed to update user');
    }
    console.log(`User updated with ID: ${id}`);
    // res.sendStatus(200);
    res.send(`User updated with ${username}`);
  });
});

// DELETE delete a user
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).send('Failed to delete user');
      return console.error(err.message);
    }
    console.log(`User deleted with ID: ${id}`);
    // res.send('');
    res.send(`User with id ${id} deleted`);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

