module.exports = (sequelize, Sequelize) => {
    const Ticket = sequelize.define("Ticket", {
      ticket_id: {
        type: Sequelize.INTEGER
      },
      project: {
        type: Sequelize.STRING
      },
      subject: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      priority: {
        type: Sequelize.INTEGER
      },
      assigned: {
        type: Sequelize.STRING
      },
      reporter: {
        type: Sequelize.STRING
      },
      issue_type: {
        type: Sequelize.INTEGER
      },
      ticket_updated_at: {
        type: Sequelize.DATE,
      },
      active: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.INTEGER, 
      },
      updated_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      timestamps: false,
      underscored: true
    });
  
    return Ticket;
  };