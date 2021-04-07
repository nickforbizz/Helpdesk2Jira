const verify = require("../helpers/verify-token")
module.exports = (app) => {
  const params = require("../controllers/param.controller");

  var router = require("express").Router();

  // Create a new Param
  router.post("/",  params.create);

  // Retrieve all params
  router.get("/", params.findAll);

  // Retrieve a single Param with id
  router.get("/:id", params.findOne);

  // Update a Param with id
  router.put("/:id", verify, params.update);

  // Delete a Param with id
  router.delete("/:id", verify, params.deleteOne);

  // Delete all params
  router.delete("/", verify, params.deleteAll);

  
  //  create project to Jira
  router.post("/createjiraproject", verify, params.createJiraProject);

  app.use("/api/params", router);
};
