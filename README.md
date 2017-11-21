# dotenv-keyvault

Use `dotenv` to load a `.env` or your `process.env` which should contain your environment.

For Key Vault secrets, specify the Key Vault Secret URL inside inside `.env`, prefixed with `kv:`, like below:

```
SECRET1=kv:https://supersecret.vault.azure.net/secrets/secret1/
```

With `dotenv-keyvault` you can...

- for local development, set up "secrets" in your .env that allow you to debug and build your app
- in non-production environments, point your `.env` file at a non-production Key Vault
- in production, have your code access secrets from the production Key Vault

... and throughout, the only thing that changes is the contents of your `.env` file.

# Installation

`npm install --save dotenv-keyvault`

`yarn add dotenv-keyvault`

# Usage

Usage in tandem with `dotenv` and enabling [Managed Service Instance] on your Function App:

```js
const dotenvConfig = require('dotenv').config();
const keyVaultGetter = require('dotenv-keyvault').config();
const ensureKeyVaultLoaded = keyVaultGetter(dotenvConfig);
module.exports = function myFunctionApp(context, req) {
	ensureKeyVaultLoaded.then(function keyvaultLoaded(envWithKeyvaultSecrets) {
		// access secrets here
	});    
};
```

The `config` function accepts either an Azure Active Directory (AAD) access token, or a function that returns an AAD access token. This is the bearer token that will be used when making calls to Key Vault. 

Depending upon your scenario, you can obtain this token in a number of ways:

```js
// with string:
require('dotenv-keyvault').config(aadAcccessToken);
// with function:
require('dotenv-keyvault').config(function getOwnAccessToken() {
    // code to acquire and return an Azure AD Access Token goes here
});
```

# Example `.env` file

The following .env file has 4 environment variables:

- `SECRET1` and `SECRET2` have their values stored as secrets in Key Vault. The urls that represent their secret values are prefixed with `kv:` to signify that the value is in Key Vault.
- `ENVVAR1` and `ENVVAR2` are regular `dotenv` environemnt variables

```ini
# .env file
SECRET1=kv:https://mykeyvault.vault.azure.net/secrets/secret1/dfc4252878b649f2bcf1c811247825c9
SECRET2=kv:https://mykeyvault.vault.azure.net/secrets/secret2/9036e3d87f924977a3bbaf4f7b310c4b
ENVVAR1=somevalue1
ENVVAR2=somevalue2
```
In JS, you will be able to access these 4 values using:

```js
const keyVaultGetter = require('dotenv-keyvault').config();
const ensureKeyVaultLoaded = keyVaultGetter(dotenvConfig);
ensureKeyVaultLoaded.then(function keyvaultLoaded(envWithKeyvaultSecrets) {
	// access secrets here
    console.log(envWithKeyvaultSecrets.SECRET1); // logs the value of secret1, obtained from Azure Key Vault
    console.log(envWithKeyvaultSecrets.SECRET2); // logs the value of secret2, obtained from Azure Key Vault
    console.log(envWithKeyvaultSecrets.SECRET3); // logs "somevalue1"
    console.log(envWithKeyvaultSecrets.SECRET4); // logs "somevalue2"
});
```

# Azure Key Vault - Secret Identifiers

The secret identifier is a url. For example:

`https://mykeyvault.vault.azure.net/secrets/secret1/dfc4252878b649f2bcf1c811247825c9`

Each secret identified is constructed in the following way:

`https://[VAULT].vault.azure.net/secrets/[SECRET]/[VERSION]`

Where:

* [VAULT] is the name of your Key Vault
* [SECRET] is the name of the secret contained in the Key Vault
* [VERSION] is the version of the secret you want to retrieve

You can drop the [VERSION] if you simply want the latest value for this secret.

# Rules for Populating `process.env`

Under the covers, `dotenv-keyvault` uses `dotenv`. Therefore, it will populate `process.env` in the following manner:

1. If a value exists within the process's environment (i.e. an environment variable exists) then this takes precedence over everything else and it will **not** use the .env file value *or* call into Key Vault for the value (the environment always wins)
2. For values defined in the `.env` file, and not present in the environemnt, `process.env` will be populated with those values
3. For values defined in the `.env` file, where the value is prefixed with `kv:` what follows is assumed to be the secret identifier of a secret stored in Key Vault, and so `dotenv-keyvault` will attempt to populate the value from Key Vault. If this fails, `dotenv-keyvault` will throw `UnableToPopulateKVBackedEnvVar`

# Further Reading

- dotenv: <https://github.com/motdotla/dotenv>
- Azure Active Directory : Access Tokens:  <https://docs.microsoft.com/en-us/rest/api/keyvault/authentication--requests-and-responses#authentication>
- Key Vault API: <https://docs.microsoft.com/en-us/rest/api/keyvault/> 
- Access Secrets in Key Vault: <https://docs.microsoft.com/en-us/rest/api/keyvault/GetSecret/GetSecret> 
