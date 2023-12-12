const { Sequelize } = require('sequelize');

module.exports= new Sequelize(
  `mysql://${DB_DIRECTION}@aws.connect.psdb.cloud/ttads`//?ssl={"rejectUnauthorized":true}
  , {dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
    }
  }}
);