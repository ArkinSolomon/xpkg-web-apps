# GET `/account/data`

Get author data, including storage information, and personal account information. No request body is provided for this route.

Rate limit: 8 requests every 5 seconds.

## Request

- Content type: N/A
- Authorization: **ReadAuthorData**

## `200` Response

Contains the author's data if the token provided has access to the author's data.

- Content type: `application/json`

Response body:

- id
  - Type: `string`
  - Required: **Yes**
  - Description: The id of the author.
- name 
  - Type: `string`
  - Required: **Yes**
  - Description: The name of the author. Includes the cases used during sign-up (or last name change).
- email 
  - Type: `string`
  - Required: **Yes**
  - Description: The email address of the author. Always completely lowercase.
- isVerified
  - Type: `boolean`
  - Required: **Yes**
  - Description: True if the author has verified their email, or false otherwise.
- usedStorage
  - Type: `number`
  - Required: **Yes**
  - Description: How much storage the author has used (in bytes).
- totalStorage
  - Type `string`
  - Required: **Yes**
  - Description: How much storage the author has in total (in bytes).

Sample Response:

```json
{
  "id": "jKagPVBo1688095257",
  "name": "Example Account",
  "email": "example@example.com",
  "verified": true,
  "usedStorage": 1067306,
  "totalStorage": 536870912
}
```

## Other Responses

`401`, `409`, `429`, [`500`]