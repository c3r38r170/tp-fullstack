const { Sequelize } = require('sequelize');

module.exports= new Sequelize(
  `mysql://${process.env.DB_DIRECTION}@aws.connect.psdb.cloud/ttads`//?ssl={"rejectUnauthorized":true}
  , {dialectOptions: {
    ssl: {
      rejectUnauthorized: true,
    }
  }}
);