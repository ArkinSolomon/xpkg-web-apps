# Package Identifiers

Package identifiers are how specific packages are referenced in X-Pkg. Each identifier is selected by the user, and must be unique. Most packages should follow the format of `author.package.variant`. A variant is optional. Package identifiers can not be changed once registered, and must be between 6 and 15 characters long. Packages with identifiers that attempt to steal the identity of another author, or is intentionally misleading, or otherwise determined to be out-of-line may be removed.

## Full Package Identifiers

Package identifiers have two ways of being referenced, partial and full. A full package identifier references not only the package identifier, but also the repository where it is located. Full package identifiers are in the format `repo/author.package.variant`. The `repo/` refers to the repository. For instance, the official X-Pkg repository has a prefix of `xpkg/`. Providing a partial package identifier is ambigous by nature, but it is typically refers to the default `xpkg/` repository. Repository prefexes (also known as repository identifiers) must be between 3 and 8 characters long (without the slash).