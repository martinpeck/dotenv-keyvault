'use strict';

const dotenv = require('dotenv');
const request = require('request-promise');

/**
 * @param {*} endpoint 
 * @param {*} secret 
 * @returns {string} the Active Directory Access token
 */
function getAADTokenFromMSI(endpoint, secret) {
    // todo
}

module.exports = {
    config(props) {
        const { adToken } = props;
        let tokenGet;
        if (!adToken) {
            // no token - get one using Managed Service Identity process.env
            tokenGet = getAADTokenFromMSI(process.env.MSI_ENDPOINT, process.env.MSI_SECRET);
        } else if (typeof adToken === 'function') {
            tokenGet = adToken();
        } else if (typeof adToken === 'string') {
            tokenGet = adToken;
        }
        const newEnv = dotenv.config(props).parsed;
    
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
                }).then((secretResponse) => {
                    process.env[key] = secretResponse.body;
                });
            });
            return Promise.all(fetches);    
        });    
    }
};
