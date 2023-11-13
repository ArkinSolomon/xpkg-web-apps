# Access Tokens

Authorization tokens are issued by the [X-Pkg identity service (XIS)](/xpkg-developers/identity-service.md) in order to authenticate a user and authorize requests made by the bearer. Ensure you have understood the role of the [XIS](/xpkg-developers/identity-service.md) before viewing this documentation.

## Token Format

Access tokens are reference tokens. The XIS will use the information in the token in order to authorize a user. For instance, a token might look like this:

```txt
xpkg_5VqKhnxWAOVPZXlXpyVGp6bbuov3FvJQH45E20LwWQAvmfq1Ue4f5CS9rUokmrQ82GpvCEqS0jOlws3fNL6xEr5NWKeJlQW1xupL8lR6511b12c
```

The token has several parts parts, the prefix, the token identifier, the token itself, the expiry date, and the permissions number.

- The token always begins with `xpkg_`.
- The next 32 characters are random, known as the *token identifier*. The hash of the token identifier is stored in the database.
- The next 71 characters is the token secret. The secret is random, and is validated with the data stored in the database.
- The next 8 characters is the date at which the refresh token expires, as seconds since the Unix Epoch.