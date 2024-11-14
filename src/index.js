import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const app = express();

// open the database
const db = await open({
  filename: './database/database.db',
  driver: sqlite3.Database
})

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.urlencoded());

app.get('/', async (req, res) => {
  const messages = await db.all('SELECT * FROM messages;');
  res.render('home', { messages })
})

app.post('/message', async (req, res) => {
  console.log(req.body);
  await db.run('INSERT INTO messages (content) VALUES (?);', req.body.message);
  res.redirect('/')
})

async function setup() {
  await db.migrate();
  app.listen(8080, () => {
    console.log('listening on http://localhost:8080')
  })
}
setup()