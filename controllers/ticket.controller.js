const db = require("../models");
const axios = require("axios");
const https = require("https");
const { env_vars } = require("../config/config");
const Ticket = db.tickets;
const Param = db.params;
const Ticketcomment = db.ticketcomments;
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

  // current project
  let param = await Param.findByPk(1);
  let project = param.project;
  // const helpdesk_tickets; 

  try {
    let helpdesk_getTickets = `${env_vars.helpdesk_endpoint}/Tickets?apiKey=${env_vars.helpdesk_apiKey}&qualifier=(statustype.statusTypeName %3D 'Open')&username=${env_vars.helpdesk_username}`;
    helpdesk_tickets = await axios.get(helpdesk_getTickets,{httpsAgent: agent})
  } catch (err) {
    console.log(err);
      res.send({
        code: -1,
        message: err.message || "Error fetching data from Helpdesk",
      });
  }
 
  const newtickets = helpdesk_tickets.data;
  
  // loop through helpdesk fetched tickets and store them
  let count_newtickets = 0;
  newtickets.map(async function (newticket) {
    let ticket = {
      ticket_id: newticket.id,
      project: project,
      subject: newticket.shortSubject,
      description: newticket.shortDetail,
      priority: newticket.updateFlagType,
      assigned: newticket.displayClient,
      reporter: newticket.displayClient,
      issue_type: 2,
      ticket_updated_at: newticket.lastUpdated,
      status: newticket.updateFlagType,
    };

    let ticket_count = await Ticket.findAndCountAll({
      where: {
        ticket_id: ticket.ticket_id,
      },
    });

    // if ticket with id was found dont create another ticket
    if (parseInt(ticket_count.count) < 1) {
      try {
        await Ticket.create(ticket)
      } catch (err) {
        res.status(500).send({
          code: -1,
          message: err.message || "Some error occurred while creating the User.",
        });
      }
      
    } else {
      count_newtickets++;
    }
  });

  req.params.funcCall = true;
  await pullComments(req, res);

  // push tickets to JIRA
  if (count_newtickets > 0) {
    req.params.funcCall = true;
    pushToJira(req, res);
    res.send(newtickets);
  }
  res.send({ code: -1, message: "No new tickets found" });
};

// Retrieve all tickets from the database.
findAll = async (req, res) => {
  funcCall = req.params.funcCall || false;
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
  req.params.funcCall = true;
  user = await this.findAll(req, res);
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
}

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
  let project_lead = param.project_lead;
  let jira_url_findCreateProject = `${jira_url}/project/${project}`;
  const config = {
    headers: { Authorization: `Bearer ${env_vars.jira_apikey}` },
  };
  let funcCall = req.params.funcCall || false;

  // find or create project on jira
  try {
    await axios.get(jira_url_findCreateProject, config);
    // res.send({code: 1, message: "found", data: cc});
  } catch (err) {
    console.log(err.message || "error occured");
    res.send({
      code: -1,
      message:
        err.message +
          " Check if project: '" +
          project +
          "' is created on JIRA" || "error occured",
    });
  }

  let open_tickets = await openTickets().then((data) => data);
  let open_tickets_count = open_tickets.length;

  //  if there are tickets push to Jira
  if (open_tickets_count > 0) {
    open_tickets.map((ticket) => {
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
          reporter: {
            name: project_lead,
          },
          priority: {
            name: "Highest",
          },
        },
      };


      // push tickets to jira
      axios
        .post(jira_url_issue, ticket_issue, config)
        .then((res) => {
          // update the tickets as inactive
          ticket.active = 0;
          ticket.jira_ticket_id = res.data.id;
          ticket.jira_ticket_key = res.data.key;
          Ticket.update(ticket, {
            where: {
              id: ticket.id,
            },
          });
        })
        .catch((err) => {
          console.log(
            err.message + " while sending ticket to Jira" || "error occured"
          );
          return;
          // res.send( {code: -1, message: err.message || "error occured"})
        });
    }); // .map

    if (funcCall) {
      return { code: 1, message: "data pushed to JIRA", data: open_tickets };
    }
  } else {
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

async function pullComments(req, res) {
  let jira_url = env_vars.jira_endpoint;

  // At request level
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  let funcCall = req.params.funcCall || false;
  const tickets = await Ticket.findAll(); //.then(data => res.json(data))

  if (tickets.length > 0) {
    tickets.map(async (data) => {
      let jira_url_issue = `${jira_url}/issue/${data.jira_ticket_id}/comment`;
      let ticketcomments = await axios.get(
        `${env_vars.helpdesk_endpoint}/TicketNotes?apiKey=${env_vars.helpdesk_apiKey}&jobTicketId=${data.ticket_id}&username=${env_vars.helpdesk_username}`,
        {
          httpsAgent: agent,
        }
      );
      let resticketcomments = ticketcomments.data;

      if (resticketcomments.length > 0) {
        resticketcomments.map(async (response) => {
          // if (response.isTechNote === false) {
            let data_comments = await Ticketcomment.findAll({
              where: { helpdesk_id: response.id },
            });
            if (data_comments.length < 1) {
              res_comment = {
                body: response.mobileNoteText.replace(/(<([^>]+)>)/gi, ""),
                is_tech_note: response.isTechNote,
                is_solution: response.isSolution,
                type: response.type,
                helpdesk_id: response.id,
                ticket_id: data.jira_ticket_id,
              };
              Ticketcomment.create(res_comment)
                .then((comment_created) => {
                  // push comment to Jira and deactivate
                  
                  let ticket_comment = {
                    body: comment_created.body,
                  };

                  // TODO:
                  // call post comment to jira with some parameters
                  postComments2Jira(jira_url_issue, ticket_comment, comment_created.id)
                })
                .catch((err) => {
                  console.log(err.message + " while creating ticket comment");
                });
            }
          // }
          //   (response.isTechNote === false)
        });
      }else{
        let comments = await Ticketcomment.findAll({where: { active: 1}});
        if(comments.length > 0){
          comments.map(comment => {
            let ticket_comment = {
              body: comment.body,
            };
            // call post comment to jira with some parameters
            postComments2Jira(jira_url_issue,ticket_comment, comment.id)
          })
        }
      }
    });
  }

  if (funcCall) {
    return {
      code: 1,
      message: "data found",
      data: tickets,
    };
  }

  res.json({
    code: 1,
    message: "data found",
    data: tickets,
  });
}

async function openTickets() {
  let data = await Ticket.findAll({ where: { active: 1 }, raw: true });
  return data;
}

async function postComments2Jira(url, ticket_comment, comment_id){
  const config = {
    headers: { Authorization: `Bearer ${env_vars.jira_apikey}` },
  };
  try {
    let comments = await axios.post(url, ticket_comment, config)
    let data_patch = {
      username: comments.data.author.name,
      email: comments.data.author.emailAddress,
      jira_id: parseInt(comments.data.id),
      active: 0
      }

      try {
        
        await Ticketcomment.update(data_patch, {
          where: {
            id: comment_id,
          },
        })
      } catch (err) {
        console.log(err.message + " while patching comment" || "comment patch failed")
      }
  } catch (err) {
    console.log( err.message + " while posting comment to jira" || "comment patch failed" )
  }
                  
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
  pullComments,
};
