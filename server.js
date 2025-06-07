const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const db = new sqlite3.Database("survey.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS survey (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    surname TEXT,
    dob TEXT,
    age INTEGER,
    fav_food TEXT,
    eat_out INTEGER,
    watch_movies INTEGER,
    watch_tv INTEGER,
    listen_radio INTEGER
  )`);
});

app.post("/submit", (req, res) => {
  const d = req.body;
  const food = d.fav_food.join(", ");
  db.run(
    `INSERT INTO survey (name, surname, dob, age, fav_food, eat_out, watch_movies, watch_tv, listen_radio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.name, d.surname, d.dob, d.age, food, d.eat_out, d.watch_movies, d.watch_tv, d.listen_radio],
    function (err) {
      if (err) return res.status(500).send("Database error");
      res.send("Success");
    }
  );
});

app.get("/results", (req, res) => {
  db.all("SELECT * FROM survey", (err, rows) => {
    if (err) return res.status(500).send("Error fetching data");
    if (rows.length === 0) return res.json({ message: "No Surveys Available" });

    const total = rows.length;
    const ages = rows.map(r => r.age);
    const avgAge = (ages.reduce((a, b) => a + b, 0) / total).toFixed(1);
    const oldest = Math.max(...ages);
    const youngest = Math.min(...ages);
    const pizzaCount = rows.filter(r => r.fav_food.includes("Pizza")).length;
    const pizzaPct = ((pizzaCount / total) * 100).toFixed(1);
    const eatOutAvg = (
      rows.reduce((sum, r) => sum + r.eat_out, 0) / total
    ).toFixed(1);

    res.json({ total, avgAge, oldest, youngest, pizzaPct, eatOutAvg });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
