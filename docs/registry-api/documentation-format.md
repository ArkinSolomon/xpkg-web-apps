# Documentation Format

The API documentation goes over requests, responses, and status codes for each route. Only significant status codes that may return data, or require clarification are explained, otherwise they will be filed under "Other Responses". These status codes follow [standard HTTP status code definitions](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status). For information on these status codes see the page on [general status codes](/registry-api/status-codes.md). 

## Documentation Structure

The first few pages of this section are general information that applies to the entire registry API, after that all pages are routes. The routes are divided by function (i.e. `/auth/*` routes deal with authorization etc.), and the page will contain all data involving the routes.

## Content Types

Content types will always be provided in the request section of each route. If no request body is to be sent, the content type will be "N/A". Any other content type indicates that a request body may be sent. If a content type is ommitted from the documentation for a response status code, the response data is irrelevant.

## Route Parameters

Route parameters and query parameters may be used. For routes that use route parameters, the parameters will be documented, and the position in the URL will be denoted by a colon, then the name. Query parameters will not be documented in the route, but rather given a seperate position in the request documentation. If either are omitted, then the route does not use either. A sample URL will also be provided if either are used. Note that route parameters will not appear on the sidebar.

## Schemas

The majority of routes deals with a response schema. The schema may represent a JSON object, or a formdata request schema. These schemas are represented as follows:

- fieldName
  - Type: `<type>`
  - Required: **Yes**/**No**
  - Description: Additional information about the field.

The type is typically a standard [JSON data type](https://www.w3schools.com/js/js_json_datatypes.asp).  Arrays are specified with the type, then square brackets. For instance, an array of strings will be denoted as `string[]`. Objects will simply have the type of `object`. If the object has a specific schema, it will be nested under the field. Similarly an array of objects will be specified `object[]`, with the schema for each element of the array nested under the field. If the entire JSON response is an array, it will be denoted with a bullet at the top which says "Array."

Tuples are also denoted in the schema. A tuple is just an array of a fixed length. These are denoted with a comma-seperated list of the types wrapped in square brackets. For instance, a number tuple of two can be represented as `[number, number]`. There can also be an array of tuples, such as `[number, number][]`.

[Enumerations](/registry-api/enumerations.md) may also be used as types. The actual sent type of the value in the enumeration field must be `string`, but its value must match its enumeration.

The `File` type is only used in multipart requests. It is used only in multipart uploads.

JSON strings, which are string values that contain valid JSON, may be denoted as a type with the `STR<type>`, with the type (a tuple, an object, an array, etc.) inside the angle brackets.