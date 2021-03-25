require('dotenv').config()

const env_vars = {
    helpdesk_username:  process.env.HELPDESK_USERNAME,
    helpdesk_apiKey: process.env.HELPDESK_APIKEY,
    helpdesk_endpoint : process.env.HELPDESK_ENDPOINT || "https://keklf-odk51:10443/helpdesk/WebObjects/Helpdesk.woa/ra",
    jira_endpoint : process.env.JIRA_ENDPOINT || "http://localhost:8080/rest/api/2",
    jira_apikey:  process.env.JIRA_APIKEY
}

module.exports = {
    env_vars
}