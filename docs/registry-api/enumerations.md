# Enumerations

Some requests with the API involve custom enumerations (enums). All enums are represented as strings (its value)| but are referenced by its name.

## PackageType

The **PackageType** enumeration differentiates between different types of packages. See the package developer documentation on [package types](package-developers/package-types.md) for more information.

| Enumeration | Value      |
| ----------- | ---------- |
| Aircraft    | aircraft   |
| Executable  | executable |
| Scenery     | scenery    |
| Plugin      | plugin     |
| Livery      | livery     |
| Other       | other      |

## VersionStatus

The **VersionStatus** enumeration differentiates between all of the different statuses a version.

| Enumeration            | Value                     |
| ---------------------- | ------------------------- |
| Processing             | processing                |
| Processed              | processed                 |
| Removed                | removed                   |
| FailedMACOSX           | failed_macosx             |
| FailedNoFileDir        | failed_no_file_dir        |
| FailedManifestExists   | failed_manifest_exists    |
| FailedInvalidFileTypes | failed_invalid_file_types |
| FailedFileTooLarge     | failed_file_too_large     |
| FailedNotEnoughSpace   | failed_not_enough_space   |
| FailedServer           | failed_server             |
| Aborted                | aborted                   |