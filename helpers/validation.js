const Joi = require("joi");


const registerValidation =  (data) =>{
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

    return schema.validate(data);
    
}


const loginValidation =  (data) =>{

    const schema = Joi.object({
        password: Joi.string().min(6).max(12).required(),
        email: Joi.string().email().required(),
        access_token: [
            Joi.string(),
            Joi.number()
        ]
    })
    .xor('password', 'access_token');

    return schema.validate(data);
    
}


module.exports = {
    registerValidation,
    loginValidation
}