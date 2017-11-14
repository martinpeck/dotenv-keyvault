const rewire = require('rewire');
const dotenvKeyvault = rewire('../index');
const sinon = require('sinon');
const { expect } = require('chai');
var ServerMock = require('mock-http-server');

function createFakeDotenv(parsed) {
    return {
        parsed,
    };
}

describe('dotenv-keyvault', () => {
    describe('unit', () => {
        let requestSpy = sinon.stub().returns(Promise.resolve({}));
        let revert;
        beforeEach(() => {
            revert = dotenvKeyvault.__set__({
                request: requestSpy,
            });
        });
        afterEach(() => {
            revert();
        });
        it('takes an Azure Active Directory token as a function', (done) => {
            const fakeADToken = 'SOME_TOKEN';
            const configSpy = sinon.stub().returns(fakeADToken);
            const keyVaultGetter = dotenvKeyvault.config({ aadAccessToken: configSpy });
            keyVaultGetter({})
                .then(() => {
                    expect(configSpy.called).to.equal(true);
                    done();
                })
                .catch(done);
        });
        it('calls keyvault with the AD access token', (done) => {
            const keyVaultGetter = dotenvKeyvault.config({ aadAccessToken: 'SOME_TOKEN' });
            keyVaultGetter(createFakeDotenv({ MYPLAIN: 'PLAINTEXT', MYSECRET: 'kv:myfakekeyvault.com' }))
                .then(() => {
                    expect(requestSpy.called).to.equal(true);
                    expect(requestSpy.args[0][0]).to.have.nested.property('headers.Authorization').that.contains('SOME_TOKEN');
                    done();
                })
                .catch(done);
        });
        it('does nothing with non-secret variables', (done) => {
            const myEnv = createFakeDotenv({ MYTRUTH: 'THETRUTH' });
            const keyVaultGetter = dotenvKeyvault.config({ aadAccessToken: () => 'SOME_TOKEN' });
            keyVaultGetter(myEnv)
                .then((nonSecretEnv) => {
                    expect(nonSecretEnv).to.have.property('MYTRUTH', 'THETRUTH');
                    done();
                })
                .catch(done);
        });
        it('returns a promise representing open fetches', () => {
            const keyVaultGetter = dotenvKeyvault.config({ aadAccessToken: 'SOME_TOKEN' });
            expect(keyVaultGetter()).to.respondTo('then');
        });
    });

    describe('integration', () => {
        const msiServer = new ServerMock({ host: 'localhost', port: 9000 });
        const kvServer = new ServerMock({ host: 'localhost', port: 9001 });
        const { MSI_ENDPOINT, MSI_SECRET } = process.env;

        beforeEach((done) => {
            process.env.MSI_ENDPOINT = 'http://localhost:9000';
            process.env.MSI_SECRET = 'MY_SECRET_KEY';
            msiServer.start(() => {
                kvServer.start(done);
            });
        });

        afterEach((done) => {
            process.env.MSI_ENDPOINT = MSI_ENDPOINT;
            process.env.MSI_SECRET = MSI_SECRET;
            kvServer.stop(() => {
                msiServer.stop(done);
            });
        });

        it('succesfully works all up', (done) => {
            msiServer.on({
                method: 'GET',
                path: '*',
                reply: {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        access_token: 'eyJ0eXAiblahblah',
                        expires_on: '09/14/2018 00:00:00 PM +00:00',
                        resource: 'https://vault.azure.net',
                        token_type: 'Bearer',
                    }),
                },
            });

            kvServer.on({
                method: 'GET',
                path: '*',
                reply: {
                    status: 200,
                    body: JSON.stringify({
                        attributes: 'attr',
                        contentType: 'thing',
                        id: 'id',
                        kid: 'string',
                        managed: 'true',
                        value: 'MYSECRETVALUE',
                    }),
                },
            });

            const dotEnvConfig = createFakeDotenv({
                MYTRUTH: 'TRUTH',
                MYSECRET: 'kv:http://localhost:9001/secrets/MYSECRET',
            });
            const keyVaultEnvGetter = dotenvKeyvault.config();

            keyVaultEnvGetter(dotEnvConfig)
                .then((keyVaultConfigWithSecrets) => {
                    expect(msiServer.requests() === 1);
                    expect(kvServer.requests() === 1);
                    expect(keyVaultConfigWithSecrets.MYSECRET === 'MYSECRETVALUE');
                    done();
                })
                .catch(done);
        });
    });
});
