# POST `/packages/new`

Create a new package on the registry. Creating a package does not upload a version.

Rate limit: 3 requests every 5 seconds

## Request

- Content type: `application/json`
- Authorization: **CreatePackage**

Request body:

- packageId
  - Type: `string`
  - Requied: **Yes**
  - Description: The partial identifier of the new package. Whitespace on the edges will be trimmed, and will be converted to lowercase. Must be between 6 and 32 characters long (inclusive).
- packageName
  - Type: `string`
  - Required: **Yes**
  - Description: The name of the new package. Must be case-insensitively unique. Whitespace on the edges will be trimmed. Must be between 3 and 32 characters long (inclusive) after whitespace has been trimmed.
- packageType
  - Type: [`PackageType`](/registry-api/enumerations#PackageType)
  - Required: **Yes**
  - Description: The type of package that this will be.
- description
  - Type: `string`
  - Required: **Yes**
  - Description: The description of the new package. Whitespace on the edges will be trimmed. Must be between 10 and 8192 characters long (inclusive).

Sample request:

```formdata
------WebKitFormBoundaryxX57CHpQyB1OifNF
Content-Disposition: form-data; name="packageId"

example.package3
------WebKitFormBoundaryxX57CHpQyB1OifNF
Content-Disposition: form-data; name="packageName"

Example Package 3
------WebKitFormBoundaryxX57CHpQyB1OifNF
Content-Disposition: form-data; name="packageType"

other
------WebKitFormBoundaryxX57CHpQyB1OifNF
Content-Disposition: form-data; name="description"

Another cool example package!
------WebKitFormBoundaryxX57CHpQyB1OifNF--
```

## `204` Response

Sent if the package was successfully registered in the database. 

## `400` Response

Sent if the request was invalid.

- Content type: `text/plain`

Response body:

- "invalid_or_empty_str" -- at least one field provided is either not a string or is an empty string.
- "full_id_or_invalid" -- the package identifier provided is a full identifier, or it is invalid.
- "profane_name" -- the name provided was detected to contain profanity.
- "invalid_name" -- the name provided is invalid.
- "bad_desc_len" -- the description length is less than 10 characters long, or greater than 1892 characters long.
- "profane_desc" -- the description was detected to contain profanity
- "invalid_pkg_type" -- the value provided for the `packageType` field is invalid. See [`here`](/registry-api/enumerations#PackageType) for valid values.
- "id_in_use" -- the provided package identifier is already in use.
- "name_in_use" -- the provided package name is already in use.

Sample response:

```text
id_in_use
```

## Other Responses

`401`, `409`, `429`, `500`