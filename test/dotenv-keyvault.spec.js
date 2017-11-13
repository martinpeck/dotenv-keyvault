const rewire = require('rewire');
const dotenvKeyvault = rewire('../index');
const sinon = require('sinon');
const { expect } = require('chai');

describe('dotenv-keyvault', () => {
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
        dotenvKeyvault.config(configSpy).then(() => {
            expect(configSpy.called).to.equal(true);
            done();            
        });
    });
    it('calls keyvault with the AD access token', () => {
        dotenvKeyvault.config('SOME_TOKEN');
        expect(requestSpy.called).to.equal(true);
        expect(requestSpy.args[0][0]).to.have.nested.property('headers.Authorization').that.contains('SOME_TOKEN');
    });
    it('does nothing with non-secret variables', () => {
        dotenvKeyvault.config(() => 'SOME_TOKEN');
        expect(process.env).to.have.property('ENVVAR1', 'somevalue1');
    });
    it('returns a promise representing open fetches', () => {
        expect(dotenvKeyvault.config('SOME_TOKEN')).to.respondTo('then');
    });
});