const bcrypt = require("bcrypt");
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {
      names: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      }, 
      password: {
        type: Sequelize.TEXT,
        // get() {
        //   // return undefined;
        // }
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      phone: {
        type: Sequelize.STRING
      },
      website: {
        type: Sequelize.STRING
      },
      fb: {
        type: Sequelize.STRING
      },
      twitter: {
        type: Sequelize.STRING
      },
      ig: {
        type: Sequelize.STRING
      },
      updated_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      active: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      }
    }, {
      hooks: {},
      timestamps: false,
      underscored: true
    });

    // FIXME: 
    User.validPassword = (async function(password, options) {
      // return await bcrypt.compare(password, this.password);
      return (password)
    })
    
    return User;
  };