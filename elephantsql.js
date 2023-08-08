var pg = require('pg');
var client = new pg.Client("postgres://mpedmvbz:pPKfi5TtLeUJsnoBoCHHMuK2oMh0aCcz@john.db.elephantsql.com/mpedmvbz");

client.connect((err) => {
  if(err) {
    return console.error('Could not connect to postgres', err);
  }
  client.query('SELECT NOW() AS "theTime"', (err, result) => {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
    // >> output: 2018-08-23T14:02:57.117Z
  });

});

module.exports = client;