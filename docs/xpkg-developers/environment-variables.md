# Environment Variables

This file defines different environment variables used in all X-Pkg software. Not including all required variables results in undefined behavior.

## Registry

### Required Variables

- `AUTH_SECRET` -- The secret used to sign authorization tokens.
- `COMPARTMENT_ID` -- The OCID of the compartment of which all of the buckets are in.
- `EMAIL_VERIFY_SECRET` -- The secret used to sign email verification tokens.
- `JOBS_SERVICE_ADDR` -- The address of the X-Pkg jobs service. Include the port number with a colon if not on port 443 (assumes HTTPS).
- `JOBS_SERVICE_PASSWORD` -- The password sent to the X-Pkg jobs service during the handshake.
- `OCI_CONFIG_FILE` -- The absolute path to the configuration file for Oracle Cloud.
- `PASSWORD_RESET_SECRET` -- The secret used to sign password reset tokens.
- `PRIVATE_BUCKET_NAME` -- The name of the bucket where to store private packages.
- `PUBLIC_BUCKET_NAME` -- The name of the bucket where to store public packages.
- `SERVER_TRUST_HASH` -- The hash of the trust key recieved from the X-Pkg jobs service during the handshake.
- `TEMPORARY_BUCKET_NAME` -- The name of the bucket where to store packages that are not stored for author downloads.

### Optional Variables

- `PORT` -- Only used to changed the port that the registry listens on. Defaults to 443.
- `SERVER_ID` -- The unique identifier of the server. If not provided, a default one will be.

## Jobs Service

### Required Variables

- `HTTPS_KEY_PATH` -- The path to the private key file for HTTPS.
- `HTTPS_CERT_PATH` -- The path to the cert file for HTTPS.
- `HTTPS_CHAIN_PATH` -- The path to the chain file used for HTTPS.
- `JOBS_SERVICE_HASH` -- The hash of the password that the worker sends during the handshake.
- `MONGODB_IP` -- The address (or URI) of the MongoDB Atlas server.
- `MONGODB_KEY_PATH` -- The absolute path to the certificate for MongoDB atlas.
- `SERVER_TRUST_KEY` -- The trust key that is sent to a worker during the handshake.

### Optional Variables

- `PORT` -- Only used to changed the port that the registry listens on. Defaults to 443.

## Common

These variables are used between several X-Pkg services, and are referenced in `xpkg-common`. Not every X-Pkg application accepts every variable.

### Required Variables

- `EMAIL_FROM` -- The email address that is sending the email.
- `EMAIL_PASSWORD` -- The password of the account to login to the email sending service.
- `EMAIL_USER` -- The username of the account to login to the email sending service.
- `MONGODB_IP` -- The address (or URI) of the MongoDB Atlas server.
- `MONGODB_KEY_PATH` -- The absolute path to the certificate for MongoDB atlas.
- `NODE_ENV` -- Either "production", "test", or "development". Changes the behavior of the server by enabling or disabling certain features.
- `RECAPTCHA_SECRET` -- The secret shared between reCAPTCHA and the server. 
- `RECAPTCHA_DISABLE` -- Set to 1 in order to disable server-side reCAPTCHA validation.