const db = require("../models");
const axios = require("axios");
const https = require("https");
const { env_vars } = require("../config/config");
const Ticket = db.tickets;
const Op = db.Sequelize.Op;

const { getPagingData } = require("../helpers/paginate");
const { getPagination } = require("../helpers/paginate");

// Create and Save a new Ticket
create = async function (req, res) {
  // Validate request

  // At request level
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  const results = await axios
    .get(
      `${env_vars.helpdesk_endpoint}/Tickets?apiKey=${env_vars.helpdesk_apiKey}&qualifier=(statustype.statusTypeName %3D 'Open')&username=${env_vars.helpdesk_username}`,
      {
        httpsAgent: agent,
      }
    )
    .then((res) => {
      return res;
    })
    .catch((err) => {
      console.log(err);
    });
  const items = results.data;

  items.map(async function (item) {
    let ticket = {
      ticket_id: item.id,
      project: "TEST",
      subject: item.shortSubject,
      description: item.shortDetail,
      priority: item.updateFlagType,
      assigned: item.displayClient,
      reporter: item.displayClient,
      issue_type: 2,
      ticket_updated_at: item.lastUpdated,
      status: item.updateFlagType,
    };

    let ticket_count = await Ticket.findAndCountAll({
      where: {
        ticket_id: ticket.ticket_id,
      },
    });

    if (parseInt(ticket_count.count) < 1) {
      Ticket.create(ticket)
        .then((data) => {
          console.log(data);
        })
        .catch((err) => {
          res.status(500).send({
            code: -1,
            message:
              err.message || "Some error occurred while creating the User.",
          });
        });
    }
  });

  res.send(items);
};

// Retrieve all tickets from the database.
findAll = (req, res, funcCall=false) => {
  const { page, size, title } = req.query;
  const active = req.query.active || 1;
  var condition = active
    ? {
        active: {
          [Op.like]: `%${active}%`,
        },
      }
    : null;

  const { limit, offset } = getPagination(page, size);

  if (funcCall) {
    return 1;
  }

  Ticket.findAndCountAll({
    limit,
    offset,
    where: condition,
  })
    .then((data) => {
      const response = getPagingData(data, page, limit);
      console.log("____________");
      res.send(response);
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: err.message || "Some error occurred while retrieving tickets.",
      });
    });
};

// Find a single Ticket with an id
async function findOne(req, res) {
  const id = req.params.id;
  // get user
  user =  this.findAll(req, res, true)
  console.log(user);
  Ticket.findByPk(id)
    .then((data) => {
      
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Error retrieving Ticket with id=" + id,
      });
    });
};

// Update a Ticket by the id in the request
update = (req, res) => {
  const id = req.params.id;

  Ticket.update(req.body, {
    where: {
      id: id,
    },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Ticket was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Ticket with id=${id}. Maybe Ticket was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Error updating Ticket with id=" + id,
      });
    });
};

// Delete a Ticket with the specified id in the request
deleteOne = (req, res) => {
  const id = req.params.id;
  Ticket.destroy({
    where: {
      id: id,
    },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Ticket was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Ticket with id=${id}. Maybe Ticket was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Could not delete Ticket with id=" + id,
      });
    });
};

// Delete all tickets from the database.
deleteAll = (req, res) => {
  Ticket.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({
        message: `${nums} Ticket were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message:
          err.message || "Some error occurred while removing all tickets.",
      });
    });
};

// Find all published tickets
findAllPublished = (req, res) => {
  res.send({
    code: -1,
    message: "nothing to show on published",
  });
};

// push issues to jira endpoint
pushToJira = async function (req, res) {
  let open_tickets = await logUser().then((data) => data);
  let open_tickets_count = open_tickets.length;
  console.log(open_tickets_count);

  //  if there are tickets push to Jira
  if (open_tickets_count > 0) {
    const config = {
      headers: { Authorization: `Bearer ${env_vars.jira_apikey}` },
    };
    let jira_url = `${env_vars.jira_endpoint}/issue`;
    open_tickets.map(ticket=> {
      // check priority for issueType
      let ticket_issue = {
        fields: {
          project: {
            key: "TEST",
          },
          summary: ticket.subject,
          description: ticket.description,
          issuetype: {
            name: "Bug",
          },
          assignee: {
            name: "ssiva",
          },
          reporter: {
            name: "ssiva",
          },
          priority: {
            name: "Highest",
          }, 
          labels: ["bugfix", "blitz_test"],
        },
      };

      // push tickets to jira
      const res = axios.post(jira_url, ticket_issue, config).then(res=>{
        console.log(res.data);
        // TODO:
        // update the tickets as inactive
      }).catch((err) => {
        console.log(err.message || "error occured");
      });
    });
  }

  res.send({
    code: 1,
    message: "Available Tickets",
    data: open_tickets,
  });
};

async function logUser() {
  return await Ticket.findAll({ where: { active: 1 }, raw: true }).then(
    (data) => {
      return data;
    }
  );
}

module.exports = {
  create,
  findAll,
  findOne,
  update,
  deleteOne,
  deleteAll,
  findAllPublished,
  pushToJira,
}
