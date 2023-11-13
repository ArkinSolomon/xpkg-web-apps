# POST `/auth/verify/:verificationToken`

> This route is protected by reCAPTCHA, and should not be used except by the X-Pkg developer portal.

Verify an author's email so that they can publish packages and upload resources to the registry.

Rate limit: 3 requests every 4 seconds.

## Request

- Content type: `application/json`
- Authorization: **None**

Route parameters:

- `verificationToken` -- The JWT containing the id of the author to be verified.

Sample route:

```uri
https://registry.xpkg.net/auth/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdadkpmNFgtZTdybWZaV0oiLCJpYXQiOjE2ODc5MTY0MzEsImV4cCI6MTY4ODAwMjgzMX0.kdAcQ_HQF0eCTTLnvoBdR6QM9CVBLBJvwkeOdFUxhR8
```

Request body:

- validation
  - Type `string`
  - Required: **Yes**
  - Description: The reCAPTCHA token.

Sample request:

```json
{
  "validation": "03AL8dmw9LyBhSIqAQEyM2puvTFUeJpQXcSBc4A80Qzk0VP0vBR70fYcCFGxIpYigDu"
}
```

## `204` Response

Sent if the verification token is valid, and if the author has not already verified their email.

## `400` Response

Sent if no reCAPTCHA validation or verification token was provided.

## `401` Response

Sent if the verification token is invalid (or expired).

## `403` Response

Sent if the verification token is valid, but the author has already verified their email.

## `404` Response

Although not technically a provided response, you may see this response if `verificationToken` is not provided.

## Other Responses

`409`, `418`, `429`, `500`