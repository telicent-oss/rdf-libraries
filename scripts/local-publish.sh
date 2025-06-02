#!/usr/bin/env bash
set -euo pipefail
lerna run build \
  --scope=@telicent-oss/ontology-icon-react-lib;

lerna run local-publish \
  --scope=@telicent-oss/ontology-icon-react-lib;

./scripts/update-deps.mjs \
  --scope=@telicent-oss/ontology-icon-react-lib \
  ../telicent-user-portal \
  ../../telicent-io/telicent-graph;