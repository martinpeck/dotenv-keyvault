'use strict';

const request = require('request-promise');

const logger = console;

/**
 * @param {*} endpoint
 * @param {*} secret
 * @returns {string} the Active Directory Access token
 */
function getAADTokenFromMSI(endpoint, secret) {
    const vaultResourceUrl = 'https://vault.azure.net';
    const apiVersion = '2017-09-01';

    const options = {
        uri: `${endpoint}/?resource=${vaultResourceUrl}&api-version=${apiVersion}`,
        headers: {
            Secret: secret,
        },
        json: true,
    };

    return request(options)
        .then((response) => response.access_token);
}

module.exports = {
    /**
     * @param {{aadAccessToken:*}} props
     */
    config(props = {}) {
        const { aadAccessToken } = props;

        let tokenGet;
        if (!aadAccessToken) {
            // no token - get one using Managed Service Identity inside process.env
            tokenGet = getAADTokenFromMSI(process.env.MSI_ENDPOINT, process.env.MSI_SECRET);
        } else if (typeof aadAccessToken === 'function') {
            tokenGet = aadAccessToken();
        } else if (typeof aadAccessToken === 'string') {
            tokenGet = aadAccessToken;
        }
        return (dotenvConfig = {}) => {
            const dotenvParsed = dotenvConfig.parsed || {};
            const envWithKeyvault = Object.assign({}, dotenvParsed);
            return Promise.resolve(tokenGet).then((token) => {
                const fetches = Object.keys(dotenvParsed)
                    .filter((key) => dotenvParsed[key].match(/^kv:/))
                    .map((key) => {
                        const uri = dotenvParsed[key].replace(/^kv:/, '');
                        return new Promise((resolve, reject) => {
                            return request({
                                method: 'GET',
                                json: true,
                                uri,
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }).then((secretResponse) => {
                                envWithKeyvault[key] = secretResponse.value;
                                resolve();
                            }).catch((err) => {
                                logger.error('Problem fetching KeyVault secret for', key, err.message);
                                reject(err);
                            });
                        });
                    });
                return Promise.all(fetches)
                    .then(() => envWithKeyvault);
            });
        };
    },
};
