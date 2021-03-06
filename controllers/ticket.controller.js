const db = require("../models");
const axios = require("axios");
const https = require("https");
const { env_vars } = require("../config/config");
const Ticket = db.tickets;
const Param = db.params;
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
      res.send({code :-1, message: err.message || "Error fetching data from Helpdesk"})
    });
  const items = results.data;
  let count_newtickets = 0;
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

    // if ticket with id was found dont create another ticket
    if (parseInt(ticket_count.count) < 1) {
      Ticket.create(ticket)
        .then((data) => {
          // console.log(data);
          // push 
        })
        .catch((err) => {
          res.status(500).send({
            code: -1,
            message:
              err.message || "Some error occurred while creating the User.",
          });
        });
    }else{
      count_newtickets++;
    }
  });

  // push tickets to JIRA
  if (count_newtickets > 0) {
    req.params.funcCall = true;
    pushToJira(req, res);
    res.send(items);
  }
  res.send({code: -1, message: "No new tickets found"});
};

// Retrieve all tickets from the database.
findAll = async (req, res) => {
  funcCall= req.params.funcCall || false;
  if (funcCall) {
    return 1;
  }

    const { page, size, title } = req.query;
    const active = req.query.active || 1;
  
    const { limit, offset } = getPagination(page, size);

  
    Ticket.findAndCountAll({
      limit,
      offset,
      where: { active: active },
    })
      .then((data) => {
        const response = getPagingData(data, page, limit);
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
  req.params.funcCall = true
  user =  await this.findAll(req, res)
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
  let jira_url = env_vars.jira_endpoint;
  let jira_url_issue = `${jira_url}/issue`;
  let param = await Param.findByPk(1);
  let project = param.project;
  let jira_url_findCreateProject = `${jira_url}/project/${project}`;
  const config = {
    headers: { Authorization: `Bearer ${env_vars.jira_apikey}` },
  };
  let funcCall= req.params.funcCall || false;

  // find or create project on jira  
  try {
    await axios.get(jira_url_findCreateProject, config);
  } catch (err) {
    console.log(err.message || "error occured");
    res.send( {code: -1, message: err.message +" Check if project: '"+project+"' is created on JIRA" || "error occured"})
  }



  let open_tickets = await openTickets().then((data) => data);
  let open_tickets_count = open_tickets.length;


  //  if there are tickets push to Jira
  if (open_tickets_count > 0) {
    
    open_tickets.map(ticket=> {
      // check priority for issueType
      let ticket_issue = {
        fields: {
          project: {
            key: project,
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
          labels: ["bug", 'issue', "blitz_test"],
        },
      };

      // push tickets to jira
      const res = axios.post(jira_url_issue, ticket_issue, config).then(res=>{
        // update the tickets as inactive
        ticket.active = 0;
        Ticket.update(ticket, {
          where: {
            id: ticket.id,
          },
        })
      }).catch((err) => {
        console.log(err.message || "error occured");
        res.send( {code:1, message: err.message || "error occured"})
      });
    });// .map
    
    if (funcCall) {
      return {code:1, message: "data pushed to JIRA", data: open_tickets,};
    }
  }else{
    res.send({
      code: -1,
      message: "No Active Tickets",
      data: open_tickets,
    });
  }

  res.send({
    code: 1,
    message: "Available Tickets",
    data: open_tickets,
  });
};

async function openTickets() {
  let data = await Ticket.findAll({ where: { active: 1 }, raw: true });
  return data;
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
