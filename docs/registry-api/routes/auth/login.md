
# POST `/auth/login`

> This route is protected by reCAPTCHA, and should not be used except by the X-Pkg developer portal.

Attempt to login with an email and password to an existing author's account, and retrieve an authorization token, which expires in six hours. To create an author account, use [`/auth/create`](/registry-api/routes/auth/create) instead.

Rate limit: 5 requests every 3 seconds.

## Request

- Content type: `application/json`
- Authorization: **None**

Request body:

- email 
  - Type: `string`
  - Required: **Yes**
  - Description: The case-insensitive email address of the author that is trying to login.
- password
  - Type: `string`
  - Required: **Yes**
  - Description: The case-sensitive password of the author that is trying to login.
- validation
  - Type `string`
  - Required: **Yes**
  - Description: The reCAPTCHA token.

Sample request: 

```json
{
  "email": "example@example.com",
  "password": "secret_password!",
  "validation": "03AL8dmw9LyBhSIqAQEyM2puvTFUeJpQXcSBc4A80Qzk0VP0vBR70fYcCFGxIpYigDu"
}
```

## `200` Response

Sent if an author exists with the given email, and the given password also matches. Contains the author's JSON web token.

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

Sent if part of the request body is missing.

- Content-type: `text/plain`

- "invalid_or_empty_str" -- sent if any field is not a string, or is an empty string.
- "bad_len" -- sent if any field violates the given length constraints.
- "bad_email" -- sent if the provided email address is invalid.
- "is_password" -- sent if the provided password is any case variation of "password".

## `401` Response

Sent if an author does not exist with the given email, or if an author exists with the email, but the password does not match.

## Other Responses

`409`, `418`, `429`, `500`