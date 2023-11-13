# PATCH `/packages/description`

Update the description of a package.

Rate limit: 3 requests every 4 seconds.

## Request 

- Content type: `application/json`
- Authorization: **UpdateDescriptionAnyPackage** | **UpdateDescriptionSpecificPackages**

Request body:

- newDescription
  - Type: `string`
  - Required: **Yes**
  - Description: The new description for the package. Whitespace on the edges will be trimmed. Must be between 10 and 8192 characters long (after whitespace has been trimmed).
- packageId
  - Type `string`
  - Required: **Yes**
  - Description: The full or partial package identifier to update the description of.

Sample request:

```json
{
  "newDescription": "My new and awesome description for my package!",
  "packageId": "example.package2"
}
```

## `204` Response

Sent if the description was updated in the database successfully.

## `400` Response

Sent if the request was invalid.

- Content type: `text/plain`

Response body:

- "invalid_or_empty_str" -- the required field is an empty string, or of the wrong type.
- "bad_version_len" -- the version provided is too long.
- "invalid_id_or_repo" -- the `packageId` field is provided, but invalid, or is a full package identifier for a package that belongs to a different repository.
- "bad_desc_len" -- the new description length is less than 10 characters long, or greater than 1892 characters long.
- "profane_desc" -- the new description was detected to contain profanity

Sample response:

```text
invalid_or_empty_str
```

## `403` Response

Sent if the author does not own the package with the given package identifier.

## Other responses

`401`, `409`, `429`, `500` 