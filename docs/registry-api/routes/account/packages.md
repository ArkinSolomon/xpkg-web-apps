# GET `/account/packages/:packageId/:packageVersion`

Get the information for an author's packages for an author.

Rate limit: 5 requests every 3 seconds.

## Request

- Content type: N/A
- Authorization: **ViewPackages**

Route parameters:

- `packageId` -- the partial identifier of the package to get the information of (not required).
- `packageVersion` -- the version of the package to get the information of (not required).

Sample route:

```uri
https://registry.xpkg.net/account/packages/example.package1/1.4.3
```

## `200` Response

Contains the data for all of the author's packages. Three different possible requests can be given based on the provided route parameters.

- Content type: `application/json`

<details>
<summary>Neither <code>packageId</code> nor <code>packageVersion</code> provided</summary>

Response body:

- packages
  - Type: `Object[]`
  - Required: **Yes**
  - Description: All of the packages of the author, along with all version information.
    - packageId
      - Type: `string`
      - Required: **Yes**
      - Description: The partial identifier of the package.
    - packageName
      - Type: `string`
      - Required: **Yes**
      - Description: The name of the package.
    - description
      - Type: `string`
      - Required: **Yes**
      - Description: The description of the package.
    - packageType
      - Type: [`PackageType`](/registry-api/enumerations#PackageType)
      - Required: **Yes**
      - Description: The type of the package.
    - versions
      - Type: `Object[]`
      - Required: **Yes**
      - Description: All of the versions of the package, including failed or removed.
        - version
          - Type: `string`
          - Required: **Yes**
          - Description: The version string.
        - isPublic
          - Type: `boolean`
          - Required: **Yes**
          - Description: True if the package is public.
        - isStored
          - Type: `boolean`
          - Required: **Yes**
          - Description: True if the package is stored on remote.
        - installs
          - Type: `number`
          - Required: **Yes**
          - Description: The number of total installations of the package.
        - status
          - Type: [`VersionStatus`](/registry-api/enumerations#VersionStatus)
          - Required: **Yes**
          - Description: The current status of the package.
        - dependencies
          - Type: `[string, string][]`
          - Required: **Yes**
          - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection that the dependency must satisfy.
        - incompatibilities
          - Type: `[string, string][]`
          - Required: **Yes**
          - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection of the versions that are incompatibile.
        - size
          - Type: `number`
          - Required: **Yes**
          - Description: The storage size that the version takes up on the server in bytes; the storage space that this version uses on the account.
        - installedSize
          - Type: `number`
          - Required: **Yes**
          - Description: The approximate size that the package will take once installed (in bytes).
        - xpSelection
          - Type: `string`
          - Required: **Yes**
          - Description: The selection of compatible X-Plane versions.
        - uploadDate
          - Type: `string`
          - Required: **Yes**
          - Description: The [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) date string of when the package version was uploaded to the server.
        - hash
          - Type: `string`
          - Required: **No**
          - Description: The hash of the file which will be downloaded on install. Only present if this version was successfully processed.
        - loc
          - Type: `string`
          - Required: **No**
          - Description: The location of the file from which to install. Only present if this version was successfully processed and if the version is public.

Sample route:

```uri
https://registry.xpkg.net/account/packages
```

Sample response:

```json
{
  "data": [
    {
      "packageId": "example.package1",
      "packageName": "Example Package 1",
      "description": "A cool package\n\nJust for an example though",
      "packageType": "other",
      "versions": [
        {
          "version": "1.3.0",
          "isPublic": true,
          "isStored": true,
          "installs": 0,
          "status": "failed_server",
          "dependencies": [
            ["example.package2", "1.2-"]
          ],
          "incompatibilities": [
            ["xpkg/example.package3", "*"],
            ["xpkg/example.package4", "1.0.0a1-5.999.999"]
          ],
          "size": 0,
          "installedSize": 0,
          "xpSelection": "*",
          "uploadDate": "2023-07-16T05:53:38.506Z"
        },
        {
          "version": "1.4.3",
          "isPublic": true,
          "isStored": true,
          "installs": 0,
          "status": "processed",
          "dependencies": [
            ["xpkg/example.package4","*"]
          ],
          "incompatibilities": [
            ["xpkg/example.package5", "*"],
            ["xpkg/example.package3", "41b3-222.3.0"],
            ["xpkg/example.package6", "27-30.999a41"]
          ],
          "size": 1249,
          "installedSize": 3428,
          "xpSelection": "*",
          "uploadDate": "2023-08-24T21:15:44.117Z",
          "hash": "54ecb365c57979f886a126e5ed87d8c0865298e6ce30f0abcde96e66fcef6fdd",
          "loc": "https://cdn.xpkg.net/3snWkGSFswC2NBmIgXLWGfsosnVujpj4yCxQH8wVlt7t_43m1n8Cywg0qUKo4Za6"
        }
      ]
    },
    {
      "packageId": "example.package2",
      "packageName": "Example Package 2",
      "description": "Example package 2",
      "packageType": "other",
      "versions": []
    }
  ]
}
```
</details>

<details>
<summary>Only <code>packageId</code> provided</summary>

Response body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The partial identifier of the package.
- packageName
  - Type: `string`
  - Required: **Yes**
  - Description: The name of the package.
- description
  - Type: `string`
  - Required: **Yes**
  - Description: The description of the package.
- packageType
  - Type: [`PackageType`](/registry-api/enumerations#PackageType)
  - Required: **Yes**
  - Description: The type of the package.
- versions
  - Type: `Object[]`
  - Required: **Yes**
  - Description: All of the versions of the package, including failed or removed.
    - version
      - Type: `string`
      - Required: **Yes**
      - Description: The string of the version.
    - isPublic
      - Type: `boolean`
      - Required: **Yes**
      - Description: True if the package is public.
    - isStored
      - Type: `boolean`
      - Required: **Yes**
      - Description: True if the package is stored on remote.
    - installs
      - Type: `number`
      - Required: **Yes**
      - Description: The number of total installations of the package.
    - status
      - Type: [`VersionStatus`](/registry-api/enumerations#VersionStatus)
      - Required: **Yes**
      - Description: The current state of the package.
    - dependencies
      - Type: `[string, string][]`
      - Required: **Yes**
      - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection that the dependency must satisfy.
    - incompatibilities
      - Type: `[string, string][]`
      - Required: **Yes**
      - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection of the versions that are incompatibile.
    - size
      - Type: `number`
      - Required: **Yes**
      - Description: The storage size that the version takes up on the server in bytes; the storage space that this version uses on the account.
    - installedSize
      - Type: `number`
      - Required: **Yes**
      - Description: The approximate size that the package will take once installed (in bytes).
    - xpSelection
      - Type: `string`
      - Required: **Yes**
      - Description: The selection of compatible X-Plane versions.
    - uploadDate
      - Type: `string`
      - Required: **Yes**
      - Description: The [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) date string of when the package version was uploaded to the server.
    - hash
      - Type: `string`
      - Required: **No**
      - Description: The hash of the file which will be downloaded on install. Only present if this version was successfully processed.
    - loc
      - Type: `string`
      - Required: **No**
      - Description: The location of the file from which to install. Only present if this version was successfully processed and if the version is public.

Sample route:

```uri
https://registry.xpkg.net/account/packages/example.package1
```

Sample response:

```json
{
      "packageId": "example.package1",
      "packageName": "Example Package 1",
      "description": "A cool package\n\nJust for an example though",
      "packageType": "other",
      "versions": [
        {
          "version": "1.3.0",
          "isPublic": true,
          "isStored": true,
          "installs": 0,
          "status": "failed_server",
          "dependencies": [
            ["example.package2", "1.2-"]
          ],
          "incompatibilities": [
            ["xpkg/example.package3", "*"],
            ["xpkg/example.package4", "1.0.0a1-5.999.999"]
          ],
          "size": 0,
          "installedSize": 0,
          "xpSelection": "*",
          "uploadDate": "2023-07-16T05:53:38.506Z"
        },
        {
          "version": "1.4.3",
          "isPublic": true,
          "isStored": true,
          "installs": 0,
          "status": "processed",
          "dependencies": [
            ["xpkg/example.package4","*"]
          ],
          "incompatibilities": [
            ["xpkg/example.package5", "*"],
            ["xpkg/example.package3", "41b3-222.3.0"],
            ["xpkg/example.package6", "27-30.999a41"]
          ],
          "size": 1249,
          "installedSize": 3428,
          "xpSelection": "*",
          "uploadDate": "2023-08-24T21:15:44.117Z",
          "hash": "54ecb365c57979f886a126e5ed87d8c0865298e6ce30f0abcde96e66fcef6fdd",
          "loc": "https://cdn.xpkg.net/3snWkGSFswC2NBmIgXLWGfsosnVujpj4yCxQH8wVlt7t_43m1n8Cywg0qUKo4Za6"
        }
      ]
    }
```
</details>

<details>
<summary>Both <code>packageId</code> and <code>packageVersion</code> provided</summary>

Response body:

- packageId
  - Type: `string`
  - Required: **Yes**
  - Description: The partial identifier of the package.
- packageName
  - Type: `string`
  - Required: **Yes**
  - Description: The name of the package.
- description
  - Type: `string`
  - Required: **Yes**
  - Description: The description of the package.
- packageType
  - Type: [`PackageType`](/registry-api/enumerations#PackageType)
  - Required: **Yes**
  - Description: The type of the package.
- versionData
  - Type: `Object`
  - Required: **Yes**
  - Description: The data for the requested package version.
    - version
      - Type: `string`
      - Required: **Yes**
      - Description: The string of the version.
    - isPublic
      - Type: `boolean`
      - Required: **Yes**
      - Description: True if the package is public.
    - isStored
      - Type: `boolean`
      - Required: **Yes**
      - Description: True if the package is stored on remote.
    - installs
      - Type: `number`
      - Required: **Yes**
      - Description: The number of total installations of the package.
    - status
      - Type: [`VersionStatus`](/registry-api/enumerations#VersionStatus)
      - Required: **Yes**
      - Description: The current state of the package.
    - dependencies
      - Type: `[string, string][]`
      - Required: **Yes**
      - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection that the dependency must satisfy.
    - incompatibilities
      - Type: `[string, string][]`
      - Required: **Yes**
      - Description: An array of tuples, which represent the dependencies of the package. The first element of every tuple is the full package identifier of the dependency, and the second element is the version selection of the versions that are incompatibile.
    - size
      - Type: `number`
      - Required: **Yes**
      - Description: The storage size that the version takes up on the server in bytes; the storage space that this version uses on the account.
    - installedSize
      - Type: `number`
      - Required: **Yes**
      - Description: The approximate size that the package will take once installed (in bytes).
    - xpSelection
      - Type: `string`
      - Required: **Yes**
      - Description: The selection of compatible X-Plane versions.
    - uploadDate
      - Type: `string`
      - Required: **Yes**
      - Description: The [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) date string of when the package version was uploaded to the server.
    - hash
      - Type: `string`
      - Required: **No**
      - Description: The hash of the file which will be downloaded on install. Only present if this version was successfully processed.
    - loc
      - Type: `string`
      - Required: **No**
      - Description: The location of the file from which to install. Only present if this version was successfully processed and if the version is public.

Sample response:

```uri
https://registry.xpkg.net/account/packages/example.package1/1.4.3
```
```json
{
  "packageId": "example.package1",
  "packageName": "Example Package 1",
  "authorId": "GPew5C4M1688712972",
  "authorName": "Arkin Solomon",
  "description": "A cool package\n\nJust for an example though",
  "packageType": "aircraft",
  "versionData": {
    "version": "1.4.3",
    "isPublic": true,
    "isStored": true,
    "installs": 0,
    "status": "processed",
    "dependencies": [
        [ "xpkg/example.package4", "*"]
    ],
    "incompatibilities": [
        ["xpkg/example.package5", "*"],
        [ "xpkg/example.package3", "41b3-222.3.0" ],
        ["xpkg/example.package6", "27-30.999a41"]
    ],
    "size": 1249,
    "installedSize": 584,
    "xpSelection": "*",
    "uploadDate": "2023-08-24T21:15:44.117Z",
    "hash": "54ecb365c57979f886a126e5ed87d8c0865298e6ce30f0abcde96e66fcef6fdd",
    "loc": "https://cdn.xpkg.net/3snWkGSFswC2NBmIgXLWGfsosnVujpj4yCxQH8wVlt7t_43m1n8Cywg0qUKo4Za6"
  }
}
```
</details>

## `400` Response

Response sent if any provided route parameter is invalid. An example would be a badly-formatted version string, or attempting to use a full package identifier.

## `404` Response

Sent if `packageId` is provided, but no package was found on the author's account with the given identifier. Also sent if both `packageId` and `packageVersion` are provided, but no package was found on the author's account with the given identifier, or if the package did not have a package with that version.

## Other Responses

`409`, `429`, `500`