module.exports = (sequelize, Sequelize) => {
    const Ticketcomment = sequelize.define("Ticketcomment", {
      body: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      jira_id: {
        type: Sequelize.INTEGER
      },
      helpdesk_id: {
        type: Sequelize.INTEGER
      },
      ticket_id: {
        type: Sequelize.INTEGER
      },
      is_solution: {
        type: Sequelize.BOOLEAN
      },
      type: {
        type: Sequelize.STRING
      },
      is_tech_note: {
        type: Sequelize.BOOLEAN
      },
      status: {
        type: Sequelize.INTEGER
      },
      active: {
        type: Sequelize.INTEGER
      }
    }, {
      // timestamps: false, 
      underscored: true
    });
  
    return Ticketcomment;
  };