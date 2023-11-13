# POST `/auth/issue`

Issue a new [authorization token](xpkg-developers/authorization-tokens) for use in third-party applications.

Rate limit: 3 requests every 3 seconds.

## Request

- Content type: `application/json`
- Authorization: **Admin**

Request body:

- name
  - Type: `string`
  - Required: **Yes**
  - Description: The human-readable name of the token. Must be between 3 and 32 characters (inclusive). Whitespace on the edges will be trimmed. Must be unique (case-sensitive).
- permissions:
  - Type: `number`
  - Required: **Yes**
  - Description: An integer which is the [permission number](xpkg-developers/authorization-tokens#permission-number) of the token. Note that at least one permission must be granted, and the [Admin](xpkg-developers/authorization-tokens#admin) permission may not be granted.
- expires
  - Type: `number`
  - Required: **Yes**
  - Description: A positive integer which is the number of days until the token expires. Must be less than or equal to 365.
- description
  - Type: `string`
  - Required: **No**
  - Description: The human-readable descrption of the token. If provided, must be less than or equal to 256 characters. Whitespace on the edges will be trimmed.
- versionUploadPackages
  - Type: `string[]`
  - Required: **No**
  - Description: The package identifiers of packages that the token will be allowed to upload versions for. The author must own all of the packages the array contains. Must be included with a length greater than zero if the [UploadVersionSpecificPackages](package-developers/api-tokens#UploadVersionSpecificPackages) permission is provided. May be included if this permission is not provided, however it must have a length of zero. Maximum length of 32.
- descriptionUpdatePackages
  - Type: `string[]`
  - Required: **No**
  - Description: The package identifiers of packages that the token will be allowed to modify the description of. The author must own all of the packages the array contains. Must be included with a length greater than zero if the [UpdateDescriptionSpecificPackages](package-developers/api-tokens#UpdateDescriptionSpecificPackages) permission is provided. May be included if this permission is not provided, however it must have a length of zero. Maximum length of 32.
- updateVersionDataPackages
  - Type: `string[]`
  - Required: **No**
  - Description: The package identifiers of packages that the token will be allowed to update the package data of. The author must own all of the packages the array contains. Must be included with a length greater than zero if the [UpdateVersionDataSpecificPackages](package-developers/api-tokens#UpdateVersionDataSpecificPackages) permission is provided. May be included if this permission is not provided, however it must have a length of zero. Maximum length of 32.
- viewAnalyticsPackages
  - Type: `string[]`
  - Required: **No**
  - Description: The package identifiers of packages that the token will be allowed to view the analytics of. The author must own all of the packages the array contains. Must be included with a length greater than zero if the [ViewAnalyticsSpecificPackages](package-developers/api-tokens#ViewAnalyticsSpecificPackages) permission is provided. May be included if this permission is not provided, however it must have a length of zero. Maximum length of 32.

Sample request:

```json
{
  "name": "my_auth_token",
  "permissions": 658,
  "expires": 60,
  "description": "My authorization token",
  "versionUploadPackages": [
    "example.package1",
    "example.package2"
  ],
  "viewAnalyticsPackages": []
}
```

## `200` Response

Sent if the token was created without issues.

- Content type: `application/json`

Response body:

- token
  - Type: `string`
  - Required: **Yes**
  - Description: A new JWT with the requested permissions.

Sample response:

```json
{
  "token": "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJ0b2tlblNlc3Npb24iOiJ0NUZRRGxuUFIxd1pxZ2h5cTY3SGoiLCJzZXNzaW9uIjoiVlU2enlyTXpROFRJMkRJbXh6dWVCIiwiYXV0aG9ySWQiOiJHUGV3NUM0TTE2ODg3MTI5NzIiLCJwZXJtaXNzaW9ucyI6NjU4LCJkZXNjcmlwdGlvblVwZGF0ZVBhY2thZ2VzIjpbXSwidmVyc2lvblVwbG9hZFBhY2thZ2VzIjpbImV4YW1wbGUucGFja2FnZTEiLCJleGFtcGxlLnBhY2thZ2UyIl0sImlhdCI6MTY4OTIyODAwOSwiZXhwIjoxNjk0NDEyMDA5fQ.y9SDf9pZRJ2ZM3PHsHd9WR_-Gw3nbeRg1whiNoG-8zOu-RBe8BZ8VK0D0hStjpkG"
}
```

## `400` Response

Sent if the request was invalid.

- Content type: `text/plain`

Response body:

- "missing_form_data" -- sent if fields are missing from the form, or if invalid data types were provided.
- "too_many_tokens" -- sent if the author already has 64 tokens on their account.
- "long_desc" -- sent if the token's description is provided and it is too long (after edge whitespace removal).
- "short_name" -- sent if the token's name is too short (after edge whitespace removal).
- "long_name" -- sent if the token's name is too long (after edge whitespace removal).
- "name_exists" -- sent if the author already owns a token with the given name.
- "neg_or_zero_expiry" -- sent if the `expires` property is less than or equal to zero.
- "long_expiry" -- sent if the expires property is too large.
- "float_expiry" -- sent if the expires property is not an integer.
- "zero_perm" -- sent if the permissions number is less than or equal to zero.
- "float_perm" -- sent if the permissions number is not an integer.
- "large_perm" -- sent if the permissions number is too large.
- "admin_perm" -- sent if the token is attempting to assign the administrator permission.
- "invalid_perm" -- sent if the token has an invalid permission configuration. Also takes `versionUploadPackages` and `descriptionUpdatePackages`.
- "long_arr" -- sent if either the array `versionUploadPackages` or the array `descriptionUpdatePackages` is too long.
- "invalid_arr" -- sent if either `versionUploadPackages` or `descriptionUpdatePackages` is invalid, such as having non-string values, duplicates, or packages that the author does not own.
- "extra_arr" -- sent if a package-specific permission was not requested, but a specific array was given.

Sample response:

```text
missing_form_data
```

## Other responses

`401`, `409`, `429`, `500`