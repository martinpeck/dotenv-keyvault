'use strict';

const dotenv = require('dotenv');
const rp = require('request-promise');

module.exports = function dotenvKeyvault(adToken) {
    const token = typeof adToken === 'string' ? adToken : adToken();
    const newEnv = dotenv.config().parsed;
    const fetches = Object.keys(newEnv).filter((key) => {
        return newEnv[key].match(/^kv:/);
    }).map((key) => {
        const uri = newEnv[key].replace(/^kv:/, '');
        return rp({
            method: 'GET',
            uri,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    });
};