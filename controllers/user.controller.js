const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const {env_vars} = require("../config/config")
const Joi = require("joi");
const User = db.users;
const Op = db.Sequelize.Op;


const {registerValidation} = require('../helpers/validation')
const {loginValidation} = require('../helpers/validation')
const {
    getPagingData
} = require("../helpers/paginate");
const {
    getPagination
} = require("../helpers/paginate");

const schema = Joi.object({
    names: Joi.string().min(5).required(),
    password: Joi.string().min(6).max(12).required(),
    password_confirmation: Joi.ref('password'),
    email: Joi.string().email(),
    username: Joi.string(),
    phone: Joi.string(),
    website: Joi.string(),
    fb: Joi.any(),
    ig: Joi.any(),
    twitter: Joi.any(),
    access_token: [
        Joi.string(),
        Joi.number()
    ]
})
.with('password', 'password_confirmation')
.xor('password', 'access_token');

// Create and Save a new User
exports.create = async (req, res) => {
    const data = req.body;

    let names = data.names;
    let username = data.username;
    let email = data.email;
    let password = data.password;
    let phone = data.phone;
    let website = data.website;
    // let fb = data.fb;
    // let ig = data.ig;
    // let twitter = data.twitter;

    // Validate request
    const validation = registerValidation(req.body);
    
    // check validation
    if (validation.error) {
        res.status(400).send(validation.error.details[0]);
        return ;
    }

    // check email
    let email_exists = await User.findOne({where:{email}});
    if (email_exists)  res.status(400).send({ code: -1, message: email +" exists"})

    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save User in the database
    try {
        const user = {
            names,username,email,
            password: hashedPassword,
            phone,website,
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


exports.login = async (req, res) => {
    const data = req.body;
    let username = data.username;
    let email = data.email;
    let password = data.password;

    // Validate request
    const validation = loginValidation(req.body);
    
    // check validation
    if (validation.error) {
        res.status(400).send(validation.error.details[0]);
        return ;
    }
    // check email
    let email_exists = await User.findOne({where:{email}});
    if (!email_exists)  res.status(400).send({ code: -1, message:"Wrong Email/Password combination! please check your email or password and try again"});

    // check password 
    console.log(email_exists);
    const password_check = await bcrypt.compare(password, email_exists.password);
    if (!password_check)  res.status(400).send({ code: -1, message:"Wrong Password/Email combination! please check your email or password and try again"});

    // jwt
    const token = jwt.sign({_id: email_exists.id}, env_vars.token_key);
    res.header("acess-token", token).send({code:1, message:"logged in", data:token});
}

// Retrieve all Users from the database.
exports.findAll = async (req, res) => {
    const {
        page,
        size,
        title
    } = req.query;
    const active = req.query.active || 1;
    var condition = active ? {
        active: {
            [Op.like]: `%${active}%`
        }
    } : null;

    const {
        limit,
        offset
    } = getPagination(page, size);

    try {
        let users = await User.findAndCountAll({
            limit,
            offset,
            where: condition,
        });
        const response = getPagingData(users, page, limit);
        res.send(response);
    } catch (err) {
        res.status(500).send({
            code: -1,
            message: err.message || "Some error occurred while retrieving users.",
        });
    }
};

// Find a single User with an id
exports.findOne = async (req,  res) => {
    const id = req.params.id;

    try {
        let user = await User.findByPk(id);
        res.send(user);
    } catch (err) {
        res.status(500).send({
            code: -1,
            message: err.message || "Error retrieving User with id=" + id,
        });
    }
};

// Update a User by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;
    try {
        let patched_user = await User.update(req.body, {
            where: {
                id: id
            },
        });
        let message = ""
            (patched_user == 1) ? message = "User was updated successfully." : message = `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`;

        res.send({
            message
        });
    } catch (err) {
        res.status(500).send({
            code: -1,
            message: err.message || "Error updating User with id=" + id,
        });
    }

};

// Delete a User with the specified id in the request
exports.delete = async (req, res) => {
    const id = req.params.id;
    try {
        let del_user = await User.destroy({
            where: {
                id: id
            },
        });
        let message = ""
            (del_user == 1) ? message = "User was deleted successfully!" : message = `Cannot delete User with id=${id}. Maybe User was not found!`;
        res.send({
            message
        });
    } catch (err) {
        res.status(500).send({
            code: -1,
            message: err.message || "Could not delete User with id=" + id,
        });
    }

};

// Delete all Users from the database.
exports.deleteAll = async (req, res) => {
    try {
        let dellusers = await User.destroy({
            where: {},
            truncate: false,
        });
        let message = ""
            (dellusers == 1) ? message = "User was deleted successfully!" : message = `Cannot delete User with id=${id}. Maybe User was not found!`;
        res.send({
            message
        });
    } catch (err) {
        res.status(500).send({
            code: -1,
            message: err.message || "Some error occurred while removing all Users.",
        });
    }
};

// Find all published Users
exports.findAllPublished = (req, res) => {};