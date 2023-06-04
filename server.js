const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const cors = require('cors');

const dbPath = 'weather.db';
const port = 5000;

const app = express();

app.use(cors()); 

if (!fs.existsSync(dbPath)) {
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS pogoda (id INTEGER PRIMARY KEY AUTOINCREMENT, id_stacji INTEGER, stacja TEXT, temperatura REAL, predkosc_wiatru REAL, cisnienie REAL)'
    );

    db.close();
  });
}

const WorkOnData = () => {
  const req = https.request(
    {
      hostname: 'danepubliczne.imgw.pl',
      path: '/api/data/synop',
      method: 'GET'
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const WeatherData = JSON.parse(data);

        const db = new sqlite3.Database(dbPath);

        db.serialize(() => {
          const sql = db.prepare(
            'INSERT INTO pogoda (id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie) VALUES (?,?,?,?,?)'
          );

          WeatherData.forEach((item) => {
            const { id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie } = item;
            sql.run(id_stacji, stacja, temperatura, predkosc_wiatru, cisnienie);
          });

          sql.finalize();
          console.log('Dane zapisane do bazy danych');

          db.close();
        });
      });
    }
  );

  req.on('error', (error) => {
    console.error('Wystąpił błąd podczas pobierania danych:', error);
  });

  req.end();
};

app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

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

const databaseExists = fs.existsSync(dbPath);


if (databaseExists) {
  console.log("Ta baza danych już istnieje");
  app.listen(port, () => {
    console.log(`Serwer nasłuchuje na porcie ${port}`);
  });
} else {
  WorkOnData();
  app.listen(port, () => {
    console.log(`Serwer nasłuchuje na porcie ${port}`);
  });
} 

