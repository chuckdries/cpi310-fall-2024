-- Up

CREATE TABLE messages(
  id INTEGER PRIMARY KEY,
  content TEXT,
  authorId INTEGER,
  FOREIGN KEY (authorId) REFERENCES users(id)
);

CREATE TABLE users(
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  passwordHash TEXT
);

CREATE TABLE authTokens(
  token TEXT PRIMARY KEY,
  userId INTEGER,
  FOREIGN KEY (userId) REFERENCES users (id)
);

-- Down

DROP TABLE messages;
DROP TABLE users;
DROP TABLE authTokens;
