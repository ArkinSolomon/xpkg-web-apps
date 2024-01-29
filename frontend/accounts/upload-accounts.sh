#!/bin/bash

OCI_OBJECT_STORAGE_NAMESPACE=$1
ACCOUNTS_BUCKET_NAME=$2

oci os object bulk-upload --src-dir build --namespace-name $OCI_OBJECT_STORAGE_NAMESPACE --bucket-name $ACCOUNTS_BUCKET_NAME --no-follow-symlinks --overwrite --parallel-upload-count 15 --include --dry-run