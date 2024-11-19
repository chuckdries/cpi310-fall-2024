import express from "express";
import { engine } from "express-handlebars";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";

const saltRounds = 10;
const app = express();

// open the database
const db = await open({
  filename: "./database/database.db",
  driver: sqlite3.Database,
});

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use(express.urlencoded());
app.use(cookieParser());
app.use("/public", express.static("./public"));

app.use(async (req, res, next) => {
  const authToken = req.cookies.authToken;
  if (!authToken) {
    next();
    return;
  }
  const maybeUser = await db.get(
    "SELECT users.username, users.id FROM authTokens INNER JOIN users ON users.id = authTokens.userId WHERE token = ?;",
    authToken
  );
  req.user = maybeUser;
  next();
});

app.get("/", async (req, res) => {
  const messages = await db.all("SELECT * FROM messages;");
  res.render("home", { messages, user: req.user });
});

app.get("/register", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("register");
});

app.post("/register", async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  if (!req.body.username || !req.body.password) {
    return res.render("register", { error: "missing required field" });
  }
  const passwordHash = await bcrypt.hash(req.body.password, saltRounds);
  let userInsertResult;
  try {
    userInsertResult = await db.run(
      "INSERT INTO users (username, passwordHash) VALUES (?, ?);",
      req.body.username,
      passwordHash
    );
  } catch (e) {
    if (e.errno === 19) {
      return res.render("register", { error: "Username already taken"});
    }
    return res.render("register", { error: "Something went wrong. Try again later" })
  }

  const token = uuidv4();
  await db.run(
    "INSERT INTO authTokens (token, userId) VALUES (?, ?);",
    token,
    userInsertResult.lastID
  );
  const expirationDate = new Date();
  expirationDate.setFullYear(2050);
  res.cookie("authToken", token, {
    expires: expirationDate,
  });
  res.redirect("/");
});

app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("login");
});

app.post("/login", async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  const maybeUser = await db.get(
    "SELECT * FROM users WHERE username = ?;",
    req.body.username
  );
  if (!maybeUser) {
    return res.render("login", { error: "Incorrect username or password" });
  }
  const passwordMatches = await bcrypt.compare(
    req.body.password,
    maybeUser.passwordHash
  );
  if (!passwordMatches) {
    return res.render("login", { error: "Incorrect username or password" });
  }
  const token = uuidv4();
  await db.run(
    "INSERT INTO authTokens (token, userId) VALUES (?, ?);",
    token,
    maybeUser.id
  );
  const expirationDate = new Date();
  expirationDate.setFullYear(2050);
  res.cookie("authToken", token, {
    expires: expirationDate,
  });
  res.redirect("/");
});

app.post("/message", async (req, res) => {
  if (!req.user) {
    res.status(401)
    res.send('Unauthorized')
    return;
  }
  await db.run(
    "INSERT INTO messages (content, authorId) VALUES (?, ?);",
    req.body.message,
    req.user.id
  );
  res.redirect("/");
});

async function setup() {
  await db.migrate({ force: false });
  app.listen(8080, () => {
    console.log("listening on http://localhost:8080");
  });
}
setup();
