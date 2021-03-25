const bcrypt = require('bcrypt');
const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;

const { getPagingData } = require('../helpers/paginate');  
const { getPagination } = require('../helpers/paginate');  

// Create and Save a new User
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.names) {
    res.status(400).send({
      code: -1,
      message: "names can not be empty!",
    });
    return;
  }
  if (!req.body.username) {
    res.status(400).send({
      code: -1,
      message: "usernames can not be empty!",
    });
    return;
  }
  if (!req.body.password) {
    res.status(400).send({
      code: -1,
      message: "password can not be empty!",
    });
    return;
  }

  if (!req.body.email) {
    res.status(400).send({
      code: -1,
      message: "email can not be empty!",
    });
    return;
  }

  const data = req.body;
  const hashedPassword = await bcrypt.hash(data.password, 10)

  
  // Save User in the database
  try {
      const user = {
        names: data.names,
        username: data.username,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        website: data.website,
        fb: data.fb ? data.fb : null,
        twitter: data.twitter ? data.twitter : null,
        ig: data.ig ? data.ig : null,
      };
      let user_res = await User.create(user);
      res.send(user_res);
  } catch (err) {
    res.status(500).send({
        code: -1,
        message: err.message || "Some error occurred while creating the User.",
      });
  }

};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
    const { page, size, title } = req.query;
  const active = req.query.active || 1;
  var condition = active ? { active: { [Op.like]: `%${active}%` } } : null;

  const { limit, offset } = getPagination(page, size); 

  User.findAndCountAll({
    limit,
    offset,
    where: condition,
  })
    .then((data) => {
        const response = getPagingData(data, page, limit);
      res.send(response);
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  User.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Error retrieving User with id=" + id,
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Error updating User with id=" + id,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  User.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Could not delete User with id=" + id,
      });
    });
};

// Delete all Users from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} User were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: err.message || "Some error occurred while removing all Users.",
      });
    });
};

// Find all published Users
exports.findAllPublished = (req, res) => {};
