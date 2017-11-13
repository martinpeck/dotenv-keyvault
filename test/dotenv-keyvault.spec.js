const rewire = require('rewire');
const dotenvKeyvault = rewire('../index');
const sinon = require('sinon');
const { expect } = require('chai');

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
            dotenvKeyvault.config({ adToken: configSpy }).then(() => {
                expect(configSpy.called).to.equal(true);
                done();
            }).catch(done);
        });
        it('calls keyvault with the AD access token', (done) => {
            dotenvKeyvault.config({ adToken: 'SOME_TOKEN' }).then(() => {
                expect(requestSpy.called).to.equal(true);
                expect(requestSpy.args[0][0]).to.have.nested.property('headers.Authorization').that.contains('SOME_TOKEN');
                done();
            }).catch(done);
        });
        it('does nothing with non-secret variables', () => {
            dotenvKeyvault.config({ adToken: () => 'SOME_TOKEN' });
            expect(process.env).to.have.property('ENVVAR1', 'somevalue1');
        });
        it('returns a promise representing open fetches', () => {
            expect(dotenvKeyvault.config({ adToken: 'SOME_TOKEN' })).to.respondTo('then');
        });
        it('sets the secret EV to the value property of the KeyVault API JSON response', () => {

        });
        it('passes through all properties to the underlying dotenv library');
    });
    describe('integration', () => {

    });
});