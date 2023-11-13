# GET `/info/:packageId/:packageVersion`

Get detailed information about a specific package version.

Rate limit: 10 requests every 2 seconds.

## Request

- Content type: `application/json`
- Authorization: **None**

Route parameters:

- `packageId` -- the partial identifier of the package to get the information of.
- `packageVersion` -- the version of the package to get the information of.

Sample route:

```uri
https://registry.xpkg.net/packages/info/example.package1/1.8.2a52
```

Request body: 

- privateKey
  - Type: `string`
  - Required: **No**
  - Description: The private key used to install private packages.


## `200` Response

Sent if the package exists.

Content type: `application/json`

Response body: 

- loc
  - Type: `string`
  - Required: **Yes**
  - Description: A URI from which to download the package.
- hash
  - Type: `string`
  - Required: **Yes**
  - Description: The SHA256 hash of the X-Pkg file.

Sample response:

```json
{
  "loc": "https://cdn.xpkg.net/_40fZRpg5ZfQ7j_ANZ5J06-9Mz4QSycT5tSQ4WoVloilYOarVgYBSOQF3yENutSZ",
  "hash": "37dce52e27cbf572bd391d15ff891ae1a27ea7031166e5c86ed1e4f7e48d68a9",
  "dependencies": [
    ["example.package2", "1.2-"]
  ],
  "incompatibilities": []
}
```

## `400` Response

Sent if the package identifier or the package version is invalid.

## `404` Response

Sent if no such version exists for the given package identifier, or if the package has not been processed. Also sent if the package is private, and no private key is given, or the private key is wrong.

## Other Responses

`409`, `429`, `500`