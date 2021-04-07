module.exports = (sequelize, Sequelize) => {
    const Param = sequelize.define("Param", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      project: {
        type: Sequelize.STRING
      },
      access_key: {
        type: Sequelize.STRING,
        get() {
          return undefined;
        }
      },
      last_logged: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      },
      ssl: {
        type: Sequelize.STRING
      },
      project_lead: {
        type: Sequelize.STRING
      },
      rec_type: {
        type: Sequelize.INTEGER
      },
    }, {
      timestamps: false,
      underscored: true
    });
  
    return Param;
  };