# GET `/analytics/:packageId/:packageVersion`

Get the analytics for a package within a certain time frame with the granularity of hours. Authorization is only required if the package is not publicly available.

Rate limit: 6 requests every 4 seconds.

## Request

- Content type: N/A
- Authorization: **None** | **ViewAnalyticsAnyPackage** | **ViewAnalyticsSpecificPackages**

Route parameters:

- `packageId` -- the partial identifier of the package to get the information of.
- `packageVersion` -- the version of the package to get the information of.

Query parameters

- `after` -- The time in milliseconds from the UNIX epoch from which to get the analytics (inclusive). Must be greater than 1672531200000. Defaults to one day ago.
- `before` -- The time in milliseconds from the UNIX epoch up to which to get the analytics (inclusive). Must be greater than 1672531260000. Must be no more than 30 days in the future from the date and hour of `after`. Defaults to one day after the hour provided in `after`.

> Comparisons are done by the beginning of the hour. For instance if the time provided is September 18th 2023, 13:50 (1:50 PM) UTC, then the time used is September 18 2023, 13:00 (1:00 PM) UTC.

Sample route:

```uri
https://registry.xpkg.net/analytics/example.package1/1.0.0?after=1691636404209&before=1691657394042
```

## `200` Response

Sent if the requester has permission to view the analytics for the given version. Note that if no analytics exists for a given hour, the hour will be omitted.

- Content type: `application/json`

Response body: 

- Array
  - timestamp
    - Type: `string`
    - Required: **Yes**
    - Description: The date string of the hour for which the analytics object is for.
  - downloads
    - Type: `string`
    - Required: **Yes**
    - Description: The number of downloads in the given hour.

Sample response:

```json
[
  {
    "timestamp": "2023-08-10T03:00:00.000Z",
    "downloads": 91
  },
  {
    "timestamp": "2023-08-10T08:00:00.000Z",
    "downloads": 84
  }
]
```

## `400` Response

Sent if there was an issue with the format of the request, or an issue with the request parameters.

- Content-type: `text/plain`

Response body:

- "invalid_or_empty_str" -- sent if `packageId` or `packageVersion` is not provided.
- "bad_version_len" -- sent if `packageVersion` is too short or too long to be a version.
- "invalid_version" -- sent if `packageVersion` is formatted invalidly.
- "full_id_or_invalid" -- sent if `packageId` is a full package identifier, or if it is formatted invalidly.
- "bad_after_date" -- sent if `after` is provided, but is not an integer, or if it is less than 1672531200000.
- "bad_before_date" -- sent if `after` is provided, but is not an integer, or if it is less than 1672531260000.
- "bad_date_combo" -- sent if `after` is greater than `before`.
- "short_diff" -- sent if the difference between `after` and `before` is less than one hour in milliseconds.
- "long_diff" -- sent if the difference between `after` and `before` is greater than thirty days in milliseconds.

## `404` Response

Sent if the package does not exist, or if the package is not public, and no authorization or insufficient authorization was provided.

## Other Responses

`409`, `429`, `500`