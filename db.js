const mysql = require('mysql2');

// Criando o pool de conexão
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'projeto_es',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();