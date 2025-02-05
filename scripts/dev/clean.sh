#!/usr/bin/env bash
yarn cache clean;
mvtmp ./node_modules;
cd ./packages/CatalogService/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/OntologyService/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/RdfService/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/ies-service/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/ontology-icon-lib/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/ontology-icon-react-lib/; mvtmp ./node_modules; mvtmp ./dist; cd -;
cd ./packages/react-lib/; mvtmp ./node_modules; mvtmp ./dist; cd -;

