# POST `/packages/upload`

Upload a new package version to the registry.

Rate limit: 3 requests every 8 seconds.

## Request

- Content type: `multipart/formdata`
- Authorization: **UploadVersionAnyPackage** | **UploadVersionSpecificPackages**

Request body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The id of the package to upload the version to.
- packageVersion
  - Type: `string`
  - Required: **Yes**
  - Description: The version string of the new version.
- xplaneSelection
  - Type: `string`
  - Required: **Yes**
  - Description: The version selection of the compatible X-Plane versions. May not be longer than 256 characters.
- isPublic
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if the package version is public. Can not be true if `isPrivate` is true, or if `isStored` is false.
- isPrivate
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if the package version is public. Can not be true if `isPublic` is true.
- isStored
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if the package version should be permanently stored on X-Pkg servers. Can not be false if `isPublic` is true.
- dependencies
  - Type: `STR<[string, string][]>`
  - Required: **Yes**
  - Description: A JSON string which is an array of tuples, where the first element of each tuple is the full identifier of the package which is a dependency, and the second element is the version selection string that the dependency must satisfy. Partial identifiers will be assumed to be part of the X-Pkg registry, that is, they will have the `xpkg/` repository prefixed. Maximum length of 128 tuples.
- incompatibilities
  - Type: `STR<[string, string][]>`
  - Required: **Yes**
  - Description: A JSON string which is an array of tuples, where the first element of each tuple is the full identifier of the package which is incompatible, and the second element is the version selection string of all versions that are incompatible. Partial identifiers will be assumed to be part of the X-Pkg registry, that is, they will have the `xpkg/` repository prefixed. Maximum length of 128 tuples.
- supportsMacOS
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if this package version supports MacOS.
- supportsWindows
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if this package version supports Windows.
- supportsLinux
  - Type: `STR<boolean>`
  - Required: **Yes**
  - Description: True if this package version supports Linux.
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
Content-Disposition: form-data; name="xplaneSelection"

*
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="isPublic"

true
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="isPrivate"

false
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="isStored"

true
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="dependencies"

[["example.package2","1.2-"]]
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="incompatibilities"

[]
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="supportsMacOS"

false
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="supportsWindows"

true
------WebKitFormBoundaryc5i0j0B6oJS681gS
Content-Disposition: form-data; name="supportsLinux"

true
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
- "not_bool" -- at least one field that was expected to be a boolean is not a boolean.
- "no_file" -- no file was uploaded.
- "invalid_id_or_repo" -- the provided package identifier is invalid, or is a full package identifier for a package that belongs to a different repository.
- "bad_version_len" -- the version provided is too long.
- "invalid_version" -- the package version provided is invalid.
- "bad_sel_len" -- the X-Plane selection provided is too long.
- "invalid_selection" -- the X-Plane selection provided is invalid.
- "invalid_access_config" -- the access configuration (`isPublic`, `isPrivate`, and `isStored` fields) was invalid.
- "plat_supp" -- no platform (operating system) was declared as supported.
- "dep_not_str" -- the value provided for `dependencies` is not a string.
- "inc_not_str" -- the value provided for `incompatibilities` is not a string.
- "bad_dep_arr" -- the dependency list provided is either not an array, or is too long.
- "bad_inc_arr" -- the incompatibility list provided is either not an array, or is too long.
- "version_exists" -- the version specified already exists for the given package.
- "bad_inc_tuple" -- at least one tuple in the provided incompatibility list has an element in the list that is either not a JSON array, or is a JSON array that does not have a length of two.
- "invalid_inc_tuple_types" -- at least one tuple in the provided incompatibility list has a tuple in the list where at least one element is not a string.
- "invalid_inc_tuple_id" -- at least one tuple in the provided incompatibility list has a tuple in the list where the package identifier is invalid.
- "invalid_inc_sel" -- at least one tuple in the the provided incompatibility list contains a version selection that is invalid.
- "dep_or_self_inc" -- at least one provided incompatibility within the incompatibility list has a package identifier which refers to itself or a dependency.
- "bad_dep_tuple" -- at least one tuple in the provided dependency list has an element in the list that is either not a JSON array, or is a JSON array that does not have a length of two.
- "invalid_dep_tuple_types" -- at least one tuple in the provided dependency list has a tuple in the list where the package identifier that is invalid.
- "invalid_dep_tuple_id" -- at least one tuple in the provided dependency list contains an invalid package identifier.
- "self_dep" -- the dependency list contains at least one tuple that attempts to declare itself as a package identifier.

Sample response:

```text
invalid_or_empty_str
```

## `403` Response

Sent if the author does not own a package with the provided identifier.

## Other Responses

`401`, `409`, `429`, `500`