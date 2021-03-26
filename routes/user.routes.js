const verify = require("../helpers/verify-token")

module.exports = app => {
  const users = require("../controllers/user.controller");

  var router = require("express").Router();

  // Create a new User
  router.post("/", verify, users.create);

  // login User
  router.post("/login", users.login);

  // Retrieve all users
  router.get("/", users.findAll);

  // Retrieve all published users
  router.get("/published", users.findAllPublished);

  // Retrieve a single User with id
  router.get("/:id", users.findOne);

  // Update a User with id
  router.put("/:id", verify, users.update);

  // Delete a User with id
  router.delete("/:id", verify, users.delete);

  // Delete all users
  router.delete("/", verify, users.deleteAll);

  app.use('/api/users', router);
};