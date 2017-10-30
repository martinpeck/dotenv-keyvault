# dotenv-keyvault

Identical to `dotnev`, but calls into Azure Key Vault to populate `process.env` with secrets stored in Key Vault.

# Installation

~~`npm install --save dotenv-keyvault`~~

~~` yarn add dotenv-keyvault`~~

> NOTE: The package described in this README.md does not yet exist! This is an example of **README Driven Development**! 
>
> The text here describes a package that I'm considering building. 
>
> If you feel this would be a useful package please consider starring this repository, adding a Thumbs-Up to the Github issue "README FEEDBACK", or providing more detailed feedback as comment on that issue. Thanks!

# Usage

Usage is almost identical to `dotenv`:

``` javascript
require('dotenv-keyvault').config(aadAcccessToken);
```

or 

``` javascript
require('dotenv-keyvault').config( () => {
    // code to aquire and return an Azure AD Access Token goes here
});
```

The `config` funtion takes either an Azure Active Directory (AAD) access token, or a function that returns an AAD access token. This is the bearer token that will be used when making calls to Key Vault. Depending upon your scenario, you can obtain this token in a number of ways:

* TODO
* TODO

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

# Rules for Populating `process.env`

Under the covers, `dotenv-keyvault` uses `dotenv`. Therefore, it will populate `process.env` using the following rules:

1. If a value exists within the process's environment (i.e. an environment variable exists) then this takes precedence over everything else and it will **not** use the .env file value *or* call into Key Vault for the value
2. For values defined in the `.env` file, and not present in the environemnt, `process.env` will be populated with those values
3. For values defined in the `.env` file, where the value is prefixed with `kv:` what follows is assumed to be the secret identifier of a secret stored in Key Vault, and so `dotenv-keyvault` will attempt to populate the value from Key Vault. If this fails, `dotenv-keyvault` will throw `UnableToPopulateKVBackedEnvVar`

# Further Reading

- See <https://docs.microsoft.com/en-us/rest/api/keyvault/authentication--requests-and-responses#authentication> for more details on Azure Active Directory access tokens.
- See <https://docs.microsoft.com/en-us/rest/api/keyvault/GetSecret/GetSecret> for details of the API call made when retrieving secret values from Azure Key Vault, and <https://docs.microsoft.com/en-us/rest/api/keyvault/> for general information about the Key Vault API
- 