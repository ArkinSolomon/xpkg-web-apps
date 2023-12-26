# Identity

X-Pkg identifies all users with an OAuth2-like system provided by the X-Pkg identity service (XIS). Third-party applications can use OpenID Connect (OIDC) in order to authenticate users, as well as gain authorization to use the XIS's or registry APIs. This allows users to login to the client, developer portal, and forums using a single account. The XIS is also where users will create and manage their accounts.

## Identity for Proprietary Services

Each X-Pkg service stores the data they need in their own database, storing all information by identifying the users by their id received from the XIS. The result of having everything centralized results in a special relationship with proprietary services; the XIS support scopes that it will not fulfill.

### The `client_id` Parameter

The identity service takes a special `client_id` parameter for proprietary services. These parameters grant human-level permission to the bearer. The `client_id` issues specific tokens that allow all actions for a service. The redirect URL provided must match the base URL in the table below in order to be granted a token.

> Note that you should not use these client identifiers for non-proprietary applications, these are provided for clarity in X-Pkg services.

| `client_id` | Service        | Expiry  | Description                                                                                                                                                                                                                                                                |
| ----------- | -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registry`  | X-Pkg Registry | 1 Hour  | Grants the bearer access to all registry access, including the viewing of storage data and access to private packages, package and resource creation, version uploads, analytics, as well as token issuing, also allows access to personal information of the the XIS API. |
| `client`    | X-Pkg Client   | 90 Days | Grants the bearer access to view data of packages they have access to, as well install them.                                                                                                                                                                               |

### Proprietary OAuth2 Differences

In OAuth2, the user is typically given an access code after authorization, which is forwarded to a server (called the client), which recieves the token. However, for proprietary services, the user is given the access token in place of the OAuth2 code. It is the client's responsibility to fetch manage the access token(s) they are issued. X-Pkg attempts to make this simpler by expiring access tokens that access sensitive content (like registry tokens) quickly. 

This works this way for several reasons: in order to remain RESTful, proprietary server backends do not retain token information. Additionally, X-Pkg web-applications are not backed by one singular server, rather they are statically served, and dynamically load content using X-Pkg's APIs.

## Identity For Third-Party Services

Third-party services may use OIDC backed by the XIS to authenticate users or to access certain APIs.

## XIS High-Level Token Procedures

This portion of the documentation will go through high level operations that the API performs in order to validate or issue tokens. Look at the [access token format](xpkg-developers/access-tokens.md) before referencing this documentation.

### Validating Tokens

Token validation is performed by both proprietary services through the `/tokens/validate` route or through calls directly to the XIS with APIs. Validation requires the access token, the client id, and the client secret that was used to issue the token. Validation contains the following steps:

1. The XIS looks for a client with the given id, and fetches its secret hash from the database.
2. The XIS ensures that the client secret hash matches the provided client secret.
3. The XIS looks for a token in the database with the specified client id and the token id hash of the access token. It retrieves the user id, permissions number, token hash, and the optional data string. 
4. The XIS verifies the provided secret with the stored token secret.
5. If they match, the token is valid and, the XIS will return the user id, permissions number, and the data string, if provided. 

## Samples

### Sample Proprietary Auth Flow

The SSO process below outlines a procedure to authorize with XIS from the developer portal and retrieve the author's registry data (packages, storage information, etc).

1. User attempts to access the developer portal.
2. Developer portal notices the user has no token or an invalid/expired token, and redirects to XIS, passing along the full redirect URL, and the query parameter `client_id=dev_portal`.
3. XIS presents the user with a login screen.
4. Once the user authenticates successfully and authorizes the developer portal's access, a new access token for the registry is issued (only one registry token can exist at a time).
5. The user is redirected to the developer portal through the provided redirect URL.
6. The developer portal makes a call to the X-Pkg registry with the access token.
7. The registry makes a call to the XIS with the access token, sending along the client secret, and the client id.
8. The XIS looks for a client with a matching client id, and validates the secret stored in the database, with the one provided.
9. The XIS then looks for a token with the given token id, and client id, then pulls the author id, and permissions number.