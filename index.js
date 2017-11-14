'use strict';

const request = require('request-promise');

TODO:
let logger = console.warn;

/**
 * @param {*} endpoint
 * @param {*} secret
 * @returns {string} the Active Directory Access token
 */
function getAADTokenFromMSI(endpoint, secret) {
    const vaultResourceUrl = 'https://vault.azure.net';
    const apiVersion = '2017-09-01';

    var options = {
        uri: `${endpoint}/?resource=${vaultResourceUrl}&api-version=${apiVersion}`,
        headers: {
            Secret: secret,
        },
        json: true,
    };

    return request(options);
}

module.exports = {
    config(props = {}) {
        const _props = props;

        return (_env) => {
            const { adToken } = _props;

            let tokenGet;
            if (!adToken) {
                // no token - get one using Managed Service Identity process.env
                tokenGet = getAADTokenFromMSI(process.env.MSI_ENDPOINT, process.env.MSI_SECRET);
            } else if (typeof adToken === 'function') {
                tokenGet = adToken();
            } else if (typeof adToken === 'string') {
                tokenGet = adToken;
            }

            return Promise.resolve(tokenGet).then((token) => {
                const fetches = Object.keys(_env).filter((key) => {
                    return _env[key].match(/^kv:/);
                }).map((key) => {
                    const uri = _env[key].replace(/^kv:/, '');
                    return new Promise((resolve, reject) => {
                        return request({
                            method: 'GET',
                            json: true,
                            uri,
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }).then((secretResponse) => {
                            _env[key] = secretResponse.value;
                            resolve();
                        }).catch((err) => {
                            logger.error('Problem fetching KeyVault secret for', key, err.message);
                            reject(err);
                        });
                    });
                });
                return Promise.all(fetches).then(() => {
                    return _env;
                });
            });
        };
    },
};
