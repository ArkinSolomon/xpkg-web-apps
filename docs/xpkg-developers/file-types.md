# File Types

There are several different file types used by X-Pkg, which are all structured differently.

## Package Files

Package files are the files that are stored in the S3 buckets, and they are very similar to the zip files developers upload. When downloading packages through the X-Pkg client, these are the files that are downloaded. They are just zip files. In the root directory, there are scripts, as well as the manifest.json file. See documentation on the [package manifest](/xpkg-developers/package-manifest) for more information. All of the directories in the package manifest are resources, and can be accessed through code by using the names of their directories.

## Installation Files

Installation files are text files that authors can distribute to their users. These simply instruct the client to download the package from the registry. These types of files are only available for package versions that are stored on the registry. The format of an installation file is as follows:

```
>>>package_id>package_version>passkey
```

Where `package_id` is replaced with the id of the package to download and `package_version` is replaced with the version of the package to download. If the package is private, passkey will be the passkey required to download the file, otherwise, passkey is a singular exclamation mark (`!`).

## Determining File Type

Before opening a .xpkg file, in order to determine what type of file it is. You can do this by checking the first 4 bytes of the file:

- For package files, it is hex `504b 0304`
- For installation files, it is hex `3e3e 3e3e`

Use this information to determine how to handle a file.