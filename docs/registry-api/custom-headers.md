# Custom Headers

There are very few custom (non-standard) headers that are ever contained in the response.

## `X-Powered-By`

This header is provided in every response, and simply contains the string: `Express, X-Pkg contributors, and you :)`. It does not change. Ever.

## `X-Request-Id`

This header is provided in every response, and contains the unique request identifier.

## Rate-Limit Headers

There are three non-standard headers sent for rate-limiting purposes. See the page on [rate limits](/registry-api/rate-limits.md) for information about these headers.