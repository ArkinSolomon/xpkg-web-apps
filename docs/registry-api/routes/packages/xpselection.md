# PATCH `/packages/xpselection` 

Update the X-Plane selection of a package version.

Rate limit: 3 requests every 4 seconds.

## Request

- Content type: `application/json`
- Authorization: **UpdateVersionDataAnyPackage** | **UpdateVersionDataSpecificPackages**

Request body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The full or partial identifier of the package to update the incompatibilities of.
- version
  - Type: `string`
  - Required: **Yes**
  - Description: The version of the package to update the incompatibilities of.
- xpSelection
  - Type: `string`
  - Required: **Yes**
  - Description: The new X-Plane selection. Maximum length of 256 characters.

Sample request:

```json
{
  "packageId": "example.package1",
  "version": "4.2.1",
  "xpSelection": "11.6-12.4b4"
}
```

## `204` Response

Response sent if the X-Plane selection was successfully updated in the database.

## `400` Response

- Content type: `text/plain`

Response body: 

- "invalid_or_empty_str" -- at least one field which was expected to be a string is not a string, or is an empty string.
- "invalid_id_or_repo" -- the provided package identifier is invalid, or is a full package identifier for a package that belongs to a different repository.
- "bad_version_len" -- the version provided is too long.
- "invalid_version" -- the provided package version is invalidly formatted.
- "bad_sel_len" -- the X-Plane selection provided is too long.
- "invalid_selection" -- the X-Plane selection provided is invalid.

Sample response:

```text
invalid_or_empty_str
```

## `401` Response

Response sent if the package at the specified version does not exist, or the client does not have authorization to modify it.

## Other Responses

`409`, `429`, `500`