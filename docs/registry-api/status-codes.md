# Status Codes

This page contains general status codes that are not explained in the documentation all the time. They typically follow [standard HTTP status code definitions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status), however, some routes may provide additional information with or clarification on these status codes, and will be explained there. If no response body for a route is described, the contents of the response are irrelevant. All `200` level responses will be at least described.

> Status codes under "Other responses" that are surrounded by brackets indicate that the status code is not directly in the path of code execution, but may be sent abnormally.

## Status Code `200`

Any responses with status code 200 will be further explained.

## Status Code `204`

The response was successful, but no content was given.

## Status Code `400`

The are request was missing form fields, or had invalid data passed into it. Sometimes will contain information indicating what is invalid or missing.

## Status Code `401`

The requester was not authorized to perform an action. An authorization token may be required, or the token provided may have insufficient permissions. Routes that require authorization show "No" if no token needs to be provided, or they show the permissions required.

## Status Code `403`

Typically sent when an requestor is not allowed to perform a certain action, though they may be authorized.

## Status Code `404`

Sent if what was requested was not found, or if the requested resource is otherwise inaccessible.

## Status Code `409`

Status sent if no valid IP address or author identifier is found to keep track of rate limiting.

## Status Code `418` 

This response is sent if a route protected by reCAPTCHA assumes you are a bot.

## Status Code `429`

Sent if too many requests are sent and the client is being rate limited.

## Status Code `500`

The server had an error. This is typically not the requester's fault.