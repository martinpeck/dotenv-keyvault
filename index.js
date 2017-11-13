'use strict';

const dotenv = require('dotenv');
const request = require('request-promise');

module.exports = function dotenvKeyvault(adToken) {
    const tokenGet = typeof adToken === 'string' ? adToken : adToken();
    const newEnv = dotenv.config().parsed;
    return Promise.resolve(tokenGet).then((token) => {
        const fetches = Object.keys(newEnv).filter((key) => {
            return newEnv[key].match(/^kv:/);
        }).map((key) => {
            const uri = newEnv[key].replace(/^kv:/, '');
            return request({
                method: 'GET',
                uri,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        });
        return Promise.all(fetches);    
    });
};