#!/usr/bin/env bash
yarn cache clean
mvtmp ./node_modules
mvtmp ./packages/CatalogService/node_modules
mvtmp ./packages/OntologyService/node_modules
mvtmp ./packages/RdfService/node_modules
mvtmp ./packages/ies-service/node_modules
mvtmp ./packages/ontology-icon-lib/node_modules
mvtmp ./packages/ontology-icon-react-lib/node_modules
mvtmp ./packages/react-lib/node_modules