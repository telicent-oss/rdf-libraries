#!/usr/bin/env bash
echo "WARNING: This script is illustrative only."
echo "(which local packages are linked depends on the dev task)"
# Modify for your specific needs and local code
yarn link \
  react \
  react-dom \
  @telicent-oss/ds \
  @telicent-oss/ontology-icon-lib \
  @telicent-oss/react-lib;

