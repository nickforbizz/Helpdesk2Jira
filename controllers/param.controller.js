const db = require("../models");
const axios = require("axios");
const https = require("https");
const { env_vars } = require("../config/config");
const Param = db.params;
const Op = db.Sequelize.Op;

const { getPagingData } = require("../helpers/paginate");
const { getPagination } = require("../helpers/paginate");

// Create and Save a new Param
create = async function (req, res) {
  // Validate request

  let param_count = await Param.count({
    where: {
      rec_type: 1,
    },
  });
  let param = req.body;

  if (parseInt(param_count) < 1) {
    Param.create(param)
      .then((data) => {
        console.log(data);
        req.key = param.project;
        req.name = param.project;
        req.params.funcCall = true;
        createJiraProject(req, res);
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send({
          code: -1,
          message:
            err.message || "Some error occurred while creating the User.",
        });
      });
  }
  res.send({ count: param_count, message: "Record exists, ammend the record" });
};

// Retrieve all params from the database.
findAll = async (req, res) => {
  funcCall = req.params.funcCall || false;
  if (funcCall) {
    return 1;
  }

  const { page, size, title } = req.query;
  const rec_type = req.query.rec_type || 1;
  var condition = rec_type
    ? {
        rec_type: {
          [Op.like]: `%${rec_type}%`,
        },
      }
    : null;

  const { limit, offset } = getPagination(page, size);

  Param.findAndCountAll({
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
        message: err.message || "Some error occurred while retrieving params.",
      });
    });
};

// Find a single Param with an id
async function findOne(req, res) {
  const id = req.params.id;
  // get user
  Param.findByPk(id)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Error retrieving Param with id=" + id,
      });
    });
}

// Update a Param by the id in the request
update = async (req, res) => {
  const id = req.params.id;
  let param = req.body;


  try {
    let data  = await Param.update(param, {
      where: {
        id: id,
      },
    });

    if (data) {
      req.params.funcCall = true;
      let cjp = await createJiraProject(req, res);
      console.log(cjp);
      res.send({
        code: 1,
        message: "Param was updated successfully.",
      });
    } else {
      res.send({
        code: -1,
        message: `Cannot update Param with id=${id}. Maybe Param was not found or req.body is empty or no changes have been detected!`,
      });
    }

  } catch (err) {
    res.status(500).send({
      code: -1,
      message: err.message || "Error updating Param with id=" + id,
    });
  }

};

// Delete a Param with the specified id in the request
deleteOne = (req, res) => {
  const id = req.params.id;
  Param.destroy({
    where: {
      id: id,
    },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Param was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Param with id=${id}. Maybe Param was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message: "Could not delete Param with id=" + id,
      });
    });
};

// Delete all params from the database.
deleteAll = (req, res) => {
  Param.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({
        message: `${nums} Param were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        code: -1,
        message:
          err.message || "Some error occurred while removing all params.",
      });
    });
};

createJiraProject = async function (req, res) {
  let funcCall = req.params.funcCall || false;
  let param = await Param.findByPk(1);
  let project = param.project;
  let project_lead = param.project_lead;
  let jira_url = env_vars.jira_endpoint;
  let jira_url_findCreateProject = `${jira_url}/project`;
  const config = {
    headers: { Authorization: `Bearer ${env_vars.jira_apikey}` },
  };
  let data = {
    key: project,
    name: project,
    projectTypeKey: "software",
    description: project+" Project description",
    lead: project_lead,
  };
  // find or create project on jira
  try {
    let res = await axios.post(jira_url_findCreateProject, data, config);
    console.log(res);
    if (funcCall) return res;
    res.send(res);
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
};

module.exports = {
  create,
  findAll,
  findOne,
  update,
  deleteOne,
  deleteAll,
  createJiraProject,
};
