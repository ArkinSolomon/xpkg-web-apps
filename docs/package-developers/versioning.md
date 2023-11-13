# Versioning

Packages on X-Pkg are expected to follow a semantic versioning-like system. If you are unfamiliar with semantic versioning, see [here](https://semver.org). X-Pkg follows the general principles of semantic versioning, though there are a few differences. 

## Basics

Versions follow the general form `x.y.z`, where `x` is the major version, `y` is the minor version, and `z` is the patch version. The major version should be incremented for any breaking changes, the minor version should be incremented for non-breaking feature changes, and the patch version should be incremented for small, non-breaking, bug fixes that do not add features. Whenever `x` is incremented, `y` and `z` should be reset to zero. Similarly, whenever `y` is incremented, `z` should be reset back to zero. `x`, `y`, or `z` are all numbers from 0 to 999. At least one of these values must be non-zero. It is recommended that while your package is in early development, it starts at 0.1.0, and for it's first full release, your package should release at 1.0.0.

## Pre-Release Versions

X-Pkg's versioning includes pre-release versioning that is quite different from semantic versioning. Pre-release versions are in the form `x.y.zPw`, where `x` is the major version, `y` is the minor version, `z` is the patch version, `P` is the pre-release type, and `w` is the pre-release number. `x`, `y`, and `z` follow the same rules as before. `P` can be any of the letters `a`, `b`, or `r`. If `P` is `a`, then the version is classified as an alpha release. Likewise, f `P` is `b` the version is classified as a beta relase. And if `P` is `r`, then the version is classified as a release-candidate. If any other letter is used for `P` then the version is invalid. If `P` is included, then `w` must also be included. `w` must be a number from 1 to 999.

## Example Versions

Here are some example versions.

- `3.41.2` -- Read as "3 point 41 point 2"
- `1.9.7a3` -- Read as "1 point 9 point 7, alpha 3"
- `4.0.3b51` -- Read as "4 point 0 point 3, beta 51"
- `9.2.0r4` -- Read as "9 point 2 point 0, release-candidate 4"

## Version Ordering

Versions are ordered first by their major versions, then by their minor versions, and then by their patch versions. All pre-release versions are below their semantic part, but above the previous semantic part. For instance, the version `1.5.2b3` is less than version `1.5.2`, but greater than version `1.5.1`. For pre-release versions, release-candidates are greater than beta versions, which are greater than alpha versions. For instance, the following list is in order from greatest to least:

- `5.0.0`
- `4.2.1`
- `4.2.0`
- `4.2.0r2`
- `4.2.0r1`
- `4.2.0b3`
- `4.2.0b2`
- `4.2.0b1`
- `4.2.0a2`
- `4.2.0a1`
- `4.1.5`

## Version Completion

You may omit different parts of a version, and it will be automatically completed (assumed). If you only provide a major version, both the minor versions and patch versions are assumed be zero. Likewise, if you only provide a major and minor version, the patch number is assumed to be zero. You can not provide a minor version without providing a major version, and likewise a patch version can not be provided without providing a major version. Pre-release versions and types must be explicitly stated and can not be assumed.

## Reference Strings

Now that you know about full and partial package identifiers, as well as versions, a single version of a package can be referenced with the form: `repo/author.package.variant@version`. For instance: `xpkg/example.package1@3.2.6b4`.