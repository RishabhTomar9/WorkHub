const stringify = require('csv-stringify');

function attendanceToCSV(rows) {
  return new Promise((resolve, reject) => {
    const out = [];
    stringify(rows, { header: true }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

module.exports = { attendanceToCSV };
