# POST `/auth/create`

> This route is protected by reCAPTCHA, and should not be used except by the X-Pkg developer portal.

Attempt to create a new author account. The email is case-insensitive and is required to be unique. The name must is stored in the given case, however may not match any other author's name (regardless of case). Returns an authorization token which will expire in six hours. If an author already has an account, use [`/auth/login`](/registry-api/routes/auth/login) instead. 

Rate limit: 5 requests every 3 seconds.

## Request

- Content type: `application/json`
- Authorization: **None**

Request body:

- email 
  - Type: `string`
  - Required: **Yes**
  - Description: The case-insensitive email address to be associated with the account. Must be between 5 and 64 characters (inclusive). May not contain whitespace within the email address; whitespace on the edges will be trimmed.
- name
  - Type: `string`
  - Required: **Yes**
  - Description: The public name of the author's account. Must be between 3 and 32 characters (inclusive). Whitespace on the edges will be trimmed.
- password
  - Type: `string`
  - Required: **Yes**
  - Description: The case-sensitive password. Must be between 8 and 64 (inclusive) characters. Can not be any case variation of "password" (i.e. "passWORD", "PassWorD", etc.).
- validation
  - Type `string`
  - Required: **Yes**
  - Description: The reCAPTCHA token.

Sample request: 

```json
{
  "email": "example@example.com",
  "name": "Example Account",
  "password": "secret_password!",
  "validation": "03AL8dmw9LyBhSIqAQEyM2puvTFUeJpQXcSBc4A80Qzk0VP0vBR70fYcCFGxIpYigDu"
}
```

## `200` Response

Sent if a new author with a unique email and case-insensitive name was successfully inserted in the database. Contains the author's JSON web token.

- Content type: `application/json`

Response body:

- token
  - Type: `string`
  - Required: **Yes**
  - Description: The JSON web token for authorizing requests.

Sample response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IklXQkRFZGNBOGhVTXFjNi0iLCJuYW1lIjoiRXhhbXBsZSBBY2NvdW50Iiwic2Vzc2lvbiI6IlplX1JQR3F1TTRoVFoyZVJ5WVlFMSIsImlhdCI6MTY4NzkxODY1NSwiZXhwIjo0Mjc5OTE4NjU1fQ.jFSyz2oIpgi6Edh7MbchFgE1BMhEOG3QLUPNS89l-_0"
}
```

## `400` Response

Sent if the email, display name, or password is invalid, that is: it does not match the length criteria or is an invalid value.

- Content type: `text/plain`

Response body:

- "invalid_or_empty_str" -- sent if any field is not a string, or is an empty string.
- "bad_len" -- sent if any field violates the given length constraints.
- "bad_email" -- sent if the provided email address is invalid.
- "profane" -- sent if the provided name is profane.
- "is_password" -- sent if the provided password is any case variation of "password".

## `403` Response

Sent if the email, or display name (both case-insensitive) are already in use.

- Content type: `text/plain`

Response body:

- "email" -- sent if the email is already in use.
- "name" -- sent if the name is already in use.

Sample response:

```text
email
```

## Other Responses

`409`, `418`, `429`, `500`