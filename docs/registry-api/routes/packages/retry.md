# POST `/packages/retry`

Attempt to reupload a file to a failed version.

Rate limit: 3 requests every 8 seconds.

## Request

- Content type: `multipart/formdata`
- Authorization: **UploadVersionAnyPackage** | **UploadVersionSpecificPackages**

Request body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The full or partial identifier of the package to reupload the version to.
- packageVersion
  - Type: `string`
  - Required: **Yes**
  - Description: The version string of the version to reupload to.
- file
  - Type: `file`
  - Required: **Yes**
  - Description: The .zip file of the package. See the [folder structure of a package](/package-developers/packaging.md) for information on the file's contents.

Sample request:

```formdata
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="packageId"

example.package1
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="packageVersion"

1.3b9
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="file"; filename="Example Package.zip"
Content-Type: application/zip

PK|ð...the file...PK`
------WebKitFormBoundaryc5i0j0B6oJS681gS--
```

## `204` Response

Response sent if the package has begun processing successfully. Does not mean that the version will process successfully.

## `400` Response

Sent if the request was invalid.

- Content type: `text/plain`

Response body:

- "invalid_or_empty_str" -- at least one field that was expected to be a string, is either not a string or is an empty string.
- "no_file" -- no file was uploaded.
- "invalid_id_or_repo" -- the provided package identifier is invalid, or is a full package identifier for a package that belongs to a different repository.
- "bad_version_len" -- the version provided is too long.
- "invalid_version" -- the package version provided is invalid.
- "version_not_exist" -- the provided package version does not contain the version specified.
- "cant_retry" -- the package version specified has already been processed successfully, and can not be retried.

## `403` Response

Sent if the author does not own a package with the provided identifier.

## Other Responses

`401`, `409`, `429`, `500`