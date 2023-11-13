# PATCH `/account/changename`

> This route is protected by reCAPTCHA, and should not be used except by the X-Pkg developer portal.

Update the author's publicly available name. The author's name can only be updated once every thirty days (that is, thirty days since the last name change). There is no minumum time that must pass since account creation for the author to change their name.

Rate limit: 3 requests every 5 seconds.

## Request

- Content type: `application/json`
- Authorization: **Admin**

Request body:

- newName
  - Type: `string`
  - Required: **Yes**
  - Description: The new publicly-viewable name of the author. May not be case-insensitively equivalent to the current name of the author. Must be between 3 and 32 characters (inclusive). Whitespace on the edges will be trimmed.
- validation
  - Type `string`
  - Required: **Yes**
  - Description: The reCAPTCHA token.

Sample request:

```json
{
  "newName": "Example New Name",
  "validation": "03AL8dmw9LyBhSIqAQEyM2puvTFUeJpQXcSBc4A80Qzk0VP0vBR70fYcCFGxIpYigDu"
}
```

## `204` Response

The name change was successful.

## `400` Response

Sent if the `newName` field is missing from the JSON request body, or if the trimmed new name is case-insensitively equivalent to the current name of the author.

## `403` Response

It has been less than thirty days since the author's last name change.

## Other Responses

`401`, `409`, `418`, `429`, `500`