-- Up

CREATE TABLE messages(
  id INTEGER PRIMARY KEY,
  content TEXT
);

CREATE TABLE users(
  id INTEGER PRIMARY KEY,
  username TEXT,
  passwordHash TEXT
);

-- Down

DROP TABLE messages;
DROP TABLE users;