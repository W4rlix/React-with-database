import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeatherData = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/data');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredData = data.filter((row) =>
    row.stacja.toLowerCase().startsWith(filter.toLowerCase())
  );

  return (
    <div>
      <h2>Weather Data</h2>
      <input type="text" placeholder="Filtruj przez stacje" value={filter} onChange={handleFilterChange} />
      <table>
        <thead>
          <tr>
            <th>ID stacji</th>
            <th>Stacja</th>
            <th>Temperatura</th>
            <th>Predkosc wiatru</th>
            <th>Cisnienie</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.id}>
              <td>{item.id_stacji}</td>
              <td>{item.stacja}</td>
              <td>{item.temperatura}</td>
              <td>{item.predkosc_wiatru}</td>
              <td>{item.cisnienie}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeatherData;
