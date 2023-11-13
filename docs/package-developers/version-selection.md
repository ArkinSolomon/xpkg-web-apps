# Version Selection

Ensure you have read [versioning](/package-developers/versioning) and especially understand version ordering before reading this page. Version selection is used to select multiple versions of a package or of X-Plane, whether that is used for declaring dependencies or incompatibilities.

## Universal Selector

The universal selector is just an asterisk (`*`), and it covers all possible versions. It is not recommended to use this selector unless absolutely certain of its use.

## Basic Version Selection

The most basic version selection is just a single version, like `1.2.4`. This version selection includes all versions of `1.2.4` from `1.2.4a1` to `1.2.4`. Though it is not recommended, you can also select just a single pre-release with a selection like `6.2.9b3`. This will only select the version `6.2.9b3`. If parts of a version are left out, it's assumed to select the remaining parts from 0-999. For instance, the selection `5.4` would cover the versions `5.4.0a1` to `5.4.999`, and the selection `7` would include versions `7.0.0a1` to `7.999.999`. Remeber that if a pre-release version is left out of a version selection, it is assumed to include all of them.

## Version Ranges

More commonly, version selections will be ranges of versions. To select a specific range, simply put a hyphen between two versions, where the left version is greater than the right version. For instance, the selection `5.2.1-5.3.5` will cover the ranges `5.2.1a1` to `5.3.5`. Remember that this includes pre-release versions. It is impossible to remove pre-release versions, however it is possible to includ minimum pre-release versions. For instance the selection `2.2.5b5-2.2.5` includes pre-release versions greater than `2.2.5b5` up to the full release of version `2.2.5`.

If part of the version is omitted, the results may vary depending on which side of the hyphen the omitted version is. If the omitted version is on the left side of the hyphen, the minor and patch versions (if not present) are assumed to be zero, the pre-release type is assumed to be alpha (`a`), and the pre-release version is assumed to be 1. If the partially-omitted version is on the right side of the hyphen, the minor and patch versions (if not present) are assumed to be 999, and it is not assumed to be a pre-release version. In both cases, at least the major version must be present.

> Though it's not recommended, if you absolutely *must* select only the release version, you can include release-candidate 999 (which is unlikely to ever appear) to the release version for example if I require only version `5.4.3`, I can use the version selection `5.4.3r999-5.4.3`.

## Greater/Less Than or Equal To

In order to select a version that is greater than or equal to a version, put a hyphen to the right of the version. For instance, to select all versions greater than or equal to version `4.2.1`, use the selection `4.2.1-`. Likewise in order to select a version that is less than or equal to a version, put a hyphen to the left of the version. For instance, to select a version less than or equal to `6.4.4` use the selection `-6.4.4`. Remember that this includes all pre-release versions of version `6.4.4`. This works for pre-release versions too. For instance to select all versions greater than or equal to `9.2.2r8`, use the selection `9.2.2r8-`. If part of the version is omitted, it works the same as it does in [selection ranges](#version-ranges).

## Combining Selections

Multiple selections can be joined together by using a comma between them (with or without a space). Joining multiple selections together is like adding an "and" between them. For instance, the selection `4.4-4.8, 5.2-5.9` select versions `4.4.0a1` to version `4.8.999` and versions `5.2.0a1` to `5.9.999`. Basic version selections, and greater/less than or equal to selections can be used as well. For instance, the version selection `-3.1.2, 3.2.4, 5.6.2-5.8.1b4, 8.2-` selects versions less than or equal to the full release of `3.1.2`, versions `3.2.4a1` to `3.2.4`, versions `5.6.2a1` to `5.8.1b4`, and versions greater than `8.2.0a1`.

Joining overlapping selection will be simplified as well, for instance the selection `5.0.2b4-9.2.1, 6.7.4-6.8.2` will be simplified to just `5.0.2b4-9.2.1`, since the range `6.7.4-6.8.2` is completely within the range `5.0.2b4-9.2.1`. A universal selection will take precedent over any version selection, and any version selection that contains a universal selection will be simplified to just one universal selection.

## Testing Version Selections

Version selections can be tested using the [version selection tool](http://localhost:3000/tools), found on the tools page in the developer portal.