const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');

const dbPath = 'weather.db';
const port = 5000;

const app = express();
app.use(cors());

const databaseExists = fs.existsSync(dbPath);

if (!databaseExists) {
  const db = new sqlite3.Database(dbPath);

  db.run(`CREATE TABLE IF NOT EXISTS pogoda (id INTEGER PRIMARY KEY AUTOINCREMENT, id_stacji INTEGER, stacja TEXT, temperatura REAL, predkosc_wiatru REAL, cisnienie REAL)`);
  db.close();
}

const fetchData = async () => {
  try {
    const { data } = await axios.get('https://danepubliczne.imgw.pl/api/data/synop');
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      const sql = db.prepare(`
        INSERT INTO pogoda (id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie)
        VALUES (?,?,?,?,?)
      `);

      data.forEach((row) => {
        const { id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie } = row;
        sql.run(id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie);
      });

      sql.finalize();
      console.log('Dane zapisane do bazy danych');

      db.close();
    });
  } catch (error) {
    console.error('Wystąpił błąd podczas pobierania danych:', error);
  }
};

app.get('/data', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM pogoda', (err, rows) => {
    if (err) {
      console.error('Wystąpił błąd podczas pobierania danych z bazy:', err);
      res.status(500).send('Wystąpił błąd podczas pobierania danych');
    } else {
      res.json(rows);
    }
    db.close();
  });
});

if (databaseExists) {
  console.log('Ta baza danych już istnieje');
}

app.listen(port, () => {
  console.log(`Serwer nasłuchuje na porcie ${port}`);
});

if (!databaseExists) {
  fetchData();
}
