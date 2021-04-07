const verify = require("../helpers/verify-token")
module.exports = (app) => {
  const tickets = require("../controllers/ticket.controller");

  var router = require("express").Router();

  // Create a new Ticket
  router.post("/", verify, tickets.create);

  // Retrieve all tickets
  router.get("/", tickets.findAll);

  // Retrieve all published tickets
  router.get("/pullcomments", tickets.pullComments);
  
  // push issues to jira endpoint
  router.post("/pushtojira", verify, tickets.pushToJira);


  // Retrieve a single Ticket with id
  router.get("/:id", tickets.findOne);

  // Update a Ticket with id
  router.put("/:id", verify, tickets.update);

  // Delete a Ticket with id
  router.delete("/:id", verify, tickets.deleteOne);

  // Delete all tickets
  router.delete("/", verify, tickets.deleteAll);

  app.use("/api/tickets", router);
};
