# Clients

OAuth clients can be created for anyone. These allow third-party applications to access X-Pkg APIs on behalf of a user. Each client is given a client id, and a client secret. The client secret must be kept secret by the client. Proprietary servers send the client secret along with the client id and access token given by the user in order to validate the token. See [identity service](xpkg-developers/identity-service.md) for more information.

## Client Id and Client Secret

Both the client id and client secret are completely random. The client id starts with `xpkg_id_` followed by a 48 character numeric string. The client secret starts with `xpkg_secret_` followed by 71 random alphanumeric characters. Note that although the secret may include the `xpkg_secret_` at the beginning, only the following alphanumeric characters are hashed, due to bycrypt limitations. Clients are required to send the `xpkg_secret_` and `xpkg_id_` at the beginning of the secret and id.