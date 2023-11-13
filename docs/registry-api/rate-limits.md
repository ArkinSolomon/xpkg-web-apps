# Rate Limits

All routes on the X-Pkg Registry are rate-limited. The amount of requests that can be made is typically unique to each route, though in some cases, multiple routes may share the same rate limit quota. Unless otherwise specified, if all allotted requests are consumed within the given duration, no further requests can be made for three seconds, after which, the rate limit is reset.

For accounts that do not require the authorization header, the ip address is used to identify clients. If the authorization header is required, the author's identifier is used. Trying to make a request to a route that requires an authorization header, but does not contain one will not count against the rate limit.

A global rate limit is also enforced, which is an overall rate limit for a single ip address. Only 30 requests can be made within 10 seconds. If this limit is broken, the registry will not accept any more requests from the ip address for 30 seconds.

## Rate Limiting Headers

Rate limit headers are provided for all requests. Any requests that do not count against rate limiting (such as not including an authorization token) do not include these headers. Also, being globally rate-limited (by ip) will disable non-global headers.

### `Retry-After`

The amount of seconds until the rate limit resets

### `X-RateLimit-Limit`

The total amount of requests that can be made per time duration. See the documentation on specific routes for the time duration. This number is also provided in the documentation and will be the same for all requests to the route.

### `X-RateLimit-Remaining` 

The remaining amount of requests that can be made in this time period. 

### `X-RateLimit-Reset`

The ISO date string of when the rate limit is reset.

### `X-Retry-After-Global`

The amount of seconds before the global rate limit is reset.

### `X-RateLimit-Limit-Global`

The amount of total requests that can be made.

### `X-RateLimit-Remaining-Global` 

The remaining amount of requests that can be made from this ip address in this time period. 

### `X-RateLimit-Reset-Global`

The ISO date string of when the global rate limit is reset.