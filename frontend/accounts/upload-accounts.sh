#!/bin/bash

OCI_OBJECT_STORAGE_NAMESPACE=$1
ACCOUNTS_BUCKET_NAME=$2

find ./build -name ".DS_Store" -type f -delete

EXTENSIONS=$(find ./build -type f -name '*.*' | sed 's|.*\.||' | sort -u)
IFS=$'\n'

for EXT in $EXTENSIONS; do
  TEST_FILE=$(find . -type f -iname "*.$EXT" | head -1)
  MIME_TYPE=$(mimetype "$TEST_FILE")
  echo "Uploading all files with a .$EXT extension with a Mime-Type of $MIME_TYPE"
  oci os object bulk-upload --src-dir ./build --namespace-name $OCI_OBJECT_STORAGE_NAMESPACE --bucket-name $ACCOUNTS_BUCKET_NAME --no-follow-symlinks --overwrite --include "*.$EXT" --parallel-upload-count 15 --content-type "$MIME_TYPE"
done

