# Package Types

Every package has a type. This type is in general what the package is. Is it an Aircraft? A livery? A scenery pack? The package type can not be changed once the package has been created. The package type not only makes it easier for users to search for and find your package, but it can also affect the default behaviour of the package, and in some cases its relationship to other packages.

## Aircraft

The aircraft type means that your package is a brand new (or modded version of a default) aircraft. It should show up in X-Plane as a new plane to select. 

Default aircraft installation script: 

```ska
COPY @default TO /Aircraft/"Extra Aircraft"/$(@packageName)
```

Default aircraft uninstall script:

```ska
DELETE /Aircraft/"Extra Aircraft"/$(@packageName)
```