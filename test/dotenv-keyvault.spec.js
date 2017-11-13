const dotenvKeyvault = require('../index');
const { expect } = require('chai');

describe('dotenv-keyvault', () => {
    it('takes an Azure Active Directory token as a string', () => {
        dotenvKeyvault('SOME_TOKEN');
    });
    it('takes an Azure Active Directory token as a function', () => {
        dotenvKeyvault(() => 'SOME_TOKEN');
    });
    it('calls keyvault with the MSI_IDENTITY to obtain an AD access token');
    it('does nothing with non-secret variables', () => {
        dotenvKeyvault(() => 'SOME_TOKEN');
        expect(process.env).to.have.property('ENVVAR1', 'somevalue1');
    });
    it('async thingy', () => {
        expect(dotenvKeyvault('SOME_TOKEN').config()).to.respond.to('then');
    });
});