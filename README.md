# dotenv-keyvault

Azure Key Vault is a service that lets you, among other things, securely store secrets (name/value pairs). 'dotenv-keyvault' is a npm package makes it easier to retrieve those secrets from Key Vault. 'dotenv-keyvault' was written with Azure Functions in mind, and makes use of Azure Managed Service Identity to authenticate against Key Vault.

So, if you're...

1. Writing Azure Functions, Azure App Services, with JavaScript/Node.js
2. Have secrets (API keys, or other tokens) that you want to store securely and audit/manage centrally

... then you're in the right place!

## Overview

Let's assume you're writing an Azure Function and it needs to call a 3rd party API. This particular API requires you to pass an API key when you call it. This API key is a "secret" that only you, and the 3rd party API know. 

So, you need to store that API key somewhere. Let's also assume:

- The API key has some value. You want to limit the number of people who can see it, and you certainly don't want everyone in your engineering team having access to it.
- You have different API keys for different environments. Developers will have a an API key for their local development, your non-production environments (CI, test, staging etc) will have other API keys, and your production environment will use your most valuable API key
- The API key might change over time. 
- You need to prove to people (auditors, security teams) that you've restricted access to this secret.

One nice solution to all of this is to use your environment to store this API key. If you're following the methodology of a 12 Factor App (https://12factor.net/) then you'll probably want these API keys to be stored in the environment along with other config (https://12factor.net/config). BUT, if you need to tightly control your secret, and show that only authorised users/systems can access it, this might not be good enough.

**This is where Key Vault comes in**. You can store your secret, the API key, in Key Vault. Now, only authenticated services and users can access the API key. 

"But...how do I access Key Vault. Also, what do I do during local development?"

Good question. **This is where `dotenv-keyvault` comes in**. 

`dotenv-keyvault`, in combination with `dotenv`, takes the output of `dotenv` (which is a combination of your environment varibles, plus anything defined in a `.env` file), and then resolves any specially crafted environment variables against Key Vault. The end result is a config object containing:

- values from your environment
- values resolved against Key Vault

To make authenticated calls against Key Vault you need an Azure Active Directory (AAD) Bearer token. Obtaining one of these is easy if you're using the Managed Service Identity (MSI) feature of Azure Functions and Azure App Services, and if that's the case `dotenv-keyvault` does all the work to obtain this token for you. If you're not, or want to obtain your own AAD Bearer token, then you can supply that token to `dotenv-keyvault`.

"Enough of this talking...Let's see an example!"

OK, but first, some further reading...

## Further Reading

If you're unfamiliar with `dotenv` then you should check it out here: 
- <https://github.com/motdotla/dotenv>

If you're unfamiliar with Azure Key Vault, then this document is a good place to start:
- <https://docs.microsoft.com/en-us/azure/key-vault/key-vault-whatis>

If you want to know the Managed Service Identity (MSI) obtains a Bearer token to access Key Vault, you should read these:
- https://docs.microsoft.com/en-us/azure/active-directory/msi-overview
- https://docs.microsoft.com/en-us/azure/app-service/app-service-managed-service-identity

## Examples

An example Azure function that uses `dotenv-keyvault` can be found here:

<https://github.com/martinpeck/dotenv-keyvault-example>

**TODO**

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
