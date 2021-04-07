const dbConfig = require("../config/db");
const Sequelize = require("sequelize");

const db_config = dbConfig.db;

const sequelize = new Sequelize(
  db_config.DB,
  db_config.USER, 
  db_config.PASSWORD,
  {
    host: db_config.HOST,
    dialect: db_config.dialect,
    operatorsAliases: false,

    pool: {
      max: db_config.pool.max,
      min: db_config.pool.min,
      acquire: db_config.pool.acquire,
      idle: db_config.pool.idle,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.users = require("./user.model.js")(sequelize, Sequelize);
db.tickets = require("./ticket.model.js")(sequelize, Sequelize);
db.params = require("./param.model.js")(sequelize, Sequelize);
db.ticketcomments = require("./ticketcomment.model.js")(sequelize, Sequelize);

module.exports = db;
