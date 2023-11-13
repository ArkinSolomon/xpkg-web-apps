# Packaging

Packaging X-Pkg packages requires a specific directory structure. It consists of an wrapping directory (or folder), with another directory inside with at least one directory inside that contains the package id. ~~The package id directory will be the root directory for your scripts~~. Sakura scripts should be placed in the wrapping directory. For instance, here is a simple package: 

```
.
├── arkin.test_package/
│   ├── file1.txt
│   ├── file2.txt
│   └── subdir/
│       └── another-file.txt
├── install.ska
└── uninstall.ska
```