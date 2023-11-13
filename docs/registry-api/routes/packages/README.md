# GET `/packages`

Retrieve all packages on the registry that have public versions that have been processed.

Rate limit: 4 requests every 4 seconds.

## Request

- Content type: N/A
- Authorization: **None**

## `200` Response

Sent on every request that does not exceed the rate limit. Contains information about all packages on the registry.

- Content type: `application/json`

Response body:

- generated
  - Type: `string`
  - Required: **Yes**
  - Description: The ISO string of the date at which the package list finished generating.
- packages
  - Type: `object[]`
  - Required: **Yes**
  - Description: All of the registry packages, and their versions.
    - packageId
      - Type: `string`
      - Required: **Yes**
      - Description: The identifier of the package.
    - packageName
      - Type: `string`
      - Required: **Yes**
      - Description: The human readable name of the package.
    - authorId
      - Type: `string`
      - Required: **Yes**
      - Description: The identfier of the author.
    - authorName
      - Type: `string`
      - Required: **Yes**
      - Description: The current name of the author.
    - description
      - Type: `string`
      - Required: **Yes**
      - Description: The description of the package.
    - packageType
      - Type: [`PackageType`](/registry-api/enumerations.md#PackageType)
      - Required: **Yes**
      - Description: The type of the package.
    - versions
      - Type: `Object[]`
      - Required: **Yes**
      - Description: An array of all of the available versions of the package, and the version's data.
        - version
          - Type: `string`
          - Required: **Yes**
          - Description: The version string of the version.
        - dependencies
          - Type: `[string, string][]`
          - Required: **Yes**
          - Description: An array of tuples, where the first element of each tuple is the id of the package which is a dependency, and the second element is the version selection string that the dependency must satisfy.
        - incompatibilities
          - Type: `[string, string][]`
          - Required: **Yes**
          - Description: An array of tuples, where the first element of each tuple is the id of the package which is incompatbile, and the second element is the version selection string of all versions that are incompatible.
        - xplaneSelection
          - Type: `string`
          - Required: **Yes**
          - Description: The version selection string of the X-Plane versions that this package is compatible with.
        - platforms
          - Type: `Object`
          - Required: **Yes**
          - Description: The platforms or operating systems that this version of the package supports.
            - macOS
              - Type: `boolean`
              - Required: **Yes**
              - Description: True if MacOS is supported by this package version.
            - windows
              - Type: `boolean`
              - Required: **Yes**
              - Description: True if Windows is supported by this package version.
            - linux
              - Type: `boolean`
              - Required: **Yes**
              - Description: True if Linux is supported by this package version.

Sample response:

```json
{
  "generated": "2023-08-09T19:17:21.095Z",
  "packages": [
    {
      "packageId": "example.package1",
      "packageName": "Example Package 1",
      "authorId": "GPew5C4M1688712972",
      "authorName": "Example Account",
      "description": "Example package 1",
      "packageType": "other",
      "versions": [
        {
          "version": "1.3.0b12",
          "dependencies": [
            ["example.package2", "1.2-"]
          ],
          "incompatibilities": [],
          "xplaneSelection": "*",
          "platforms": {
            "macOS": false,
            "windows": true,
            "linux": false
          }
        }
      ]
    }
  ]
}
```

## Other Responses

`409`, `429`, [`500`]