# API Tokens

API tokens can be used to grant third-party applications access to your account. They can be refined with "permissions" to only allow applications to do certain things, like uploading packages, or modifying the descriptions of certain packages. 

API tokens are sensitive, and should be treated like passwords, as they also give access to your account. Do not give an API token to an untrusted third-party. Anyone with the token (the bearer) will be permitted to access your account. For security purposes, refrain from giving a token full access to your account, so that if it is compromised, not as much damage will be done. You can revoke a token at any time. 

## Permissions

### CreatePackage

The bearer of the token may create (or register) a new package on the registry. They will not be permitted to upload versions of the package, and may only set the description upon creation.

### UploadVersionAnyPackage

The bearer of the token may upload (and reupload) a new version to any package. Can not be used with [UploadVersionSpecificPackages](#UploadVersionSpecificPackages).

### UpdateDescriptionAnyPackage

The bearer of the token may update the description of any package. Can not be used with [UpdateDescriptionSpecificPackages](#UpdateDescriptionSpecificPackages).

### UploadVersionSpecificPackages

The bearer of the token may upload (and reupload) new versions to specific packages. Can not be used with [UploadVersionAnyPackage](#UploadVersionAnyPackage).

### UpdateDescriptionSpecificPackages

The bearer of the token may update the descriptions of specific packages. Can not be used with [UpdateDescriptionAnyPackage](#UpdateDescriptionAnyPackage).

### UploadResources

The bearer of the token may upload resources.

### ReadAuthorData

The bearer of the token may author account information, including your public name, email, storage capacity, and email verification status. Does not permit reading the authorization tokens on your account. 

### ViewPackages

The bearer of the token may list and view all author packages, and versions, and have access to the description of the packages.

### ViewResources

The bearer of the token may list and view all resources.

### UpdateVersionDataAnyPackage

The bearer of the token may update the X-Plane selection as well as the incompatibilities of a package. Note that all versions of all packages may be updated by the bearer of the token.

### UpdateVersionDataSpecificPackages

The bearer of the token may update the X-Plane selection as well as the incompatibilities of specified packages. Note that all versions of the specified packages may be updated by the bearer of the token.

### ViewAnalyticsAnyPackage

The bearer of the token may view analytics for any package at any version. Can not be used with [ViewAnalyticsAnyPackage](#ViewAnalyticsAnyPackage).

### ViewAnalytcisSpecificPackages

The bearer of the token may view analytics for specific packages. Can not be used with [ViewAnalyticsAnyPackage](#ViewAnalyticsAnyPackage).