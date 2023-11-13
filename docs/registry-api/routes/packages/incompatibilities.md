# PATCH `/packages/incompatibilities`

Update the incompatibilities for a specific package version.

Rate limit: 3 requests every 4 seconds.

## Request

- Content type: `application/json`
- Authorization: **UpdateVersionDataAnyPackage** | **UpdateVersionDataSpecificPackages**

Request body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The full or partial identifier of the package to update the incompatibilities of.
- packageVersion
  - Type: `string`
  - Required: **Yes**
  - Description: The version of the package to update the incompatibilities of.
- incompatibilities
  - Type: `[string, string][]`
  - Required: **Yes**
  - Description: An array of tuples of incompatibilities, where the first value is the identifier of the incompatibility, and the second value is the version selection which is incompatible. Overwrite all incompatibilities with these values. Duplicates will be merged. Maximum length of 128.

Sample request:

```json
{
  "packageId": "example.package1",
  "version": "4.2.1",
  "incompatibilities": [
    ["example.package2", "*"],
    ["randomauthor.package1", "1.2-3.4"]
  ]
}
```

## `204` Response

Response sent if the incompatibilities were successfully updated.

## `400` Response

Response sent if the request is invalid.

- Content type: `text/plain`

Response body:

- "invalid_or_empty_str" -- at least one of either `packageId` or `version` is not a string, or is an empty string.
- "invalid_id_or_repo" -- the provided package identifier is invalid, or is a full package identifier for a package that belongs to a different repository.
- "bad_version_len" -- the version provided is too long.
- "invalid_version" -- the provided package version is invalidly formatted.
- "bad_inc_arr" -- the incompatibility list provided is either not an array, or is too long.
- "bad_inc_tuple" -- at least one tuple in the provided incompatibility list has an element in the list that is either not a JSON array, or is a JSON array that does not have a length of two.
- "invalid_inc_tuple_types" -- at least one tuple in the provided incompatibility list has a tuple in the list where at least one element is not a string.
- "invalid_inc_tuple_id" -- at least one tuple in the provided incompatibility list has a tuple in the list where the package identifier is invalid.
- "invalid_inc_sel" -- at least one tuple in the the provided incompatibility list contains a version selection that is invalid.
- "dep_or_self_inc" -- at least one provided incompatibility within the incompatibility list has a package identifier which refers to itself or a dependency.

Sample response:

```text
invalid_or_empty_str
```

## `401` Response

Response sent if the provided token does not have valid authorization to update the version data of a package or if the package at the specified version is not found.

## Other Responses

`409`, `429`, `500`