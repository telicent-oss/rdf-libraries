export const MOCK_DATA_POLICY = `Effective Date: 25/10/20241.

1. Introduction

This agency is committed to ensuring the security and confidentiality of the personal and sensitive data we handle. This policy outlines the procedures and responsibilities for managing and protecting data to comply with relevant laws and regulations.

2. Purpose

The purpose of this policy is to:Ensure the proper handling, protection, and use of data.Comply with applicable data protection laws and regulations.Protect the privacy rights of individuals whose data we handle.

3. Scope

This policy applies to all employees, contractors, and third-party service providers of who have access to, or handle, data.

4. Data Collection

Lawful and Fair Collection: Data must be collected lawfully and fairly, and only for specified, explicit, and legitimate purposes.Consent: Where applicable, data subjects must provide informed consent for the collection and processing of their data.

5. Data Use

Purpose Limitation: Data must be used only for the purposes for which it was collected and not further processed in a manner incompatible with those purposes.Data Minimization: Only the minimum necessary data should be collected and processed.

6. Data Storage

Secure Storage: Data must be stored securely to prevent unauthorized access, loss, or damage. This includes physical and electronic storage measures.Retention Period: Data must be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.

For questions or concerns about this policy or data protection practices, contact John Smiley at 0394 300498.

Approved by:John Smiley
Head of Data Capture
The agency

25/03/2024
`
.split('\n')
.join('   ');;

export const DEBUG = false;

export enum MockSet {
  SIMPLE = 'simple',
  COMPLEX = 'complex',
  ACLED = 'acled'
}

type MockDataBase = {
  uri: string;
  title: string;
  description: string;
  creator: string;
  rights: string;
  published: string;
  modified: string;
  accessRights: string;
};
type MockDataDCATCatalog = {
  classType: "DCATCatalog";
} & MockDataBase;
type MockDataDCATDataService = {
  classType: "DCATDataService";
} & MockDataBase;
type MockDataDCATDataset = {
  classType: "DCATDataset";
} & MockDataBase;

export type MockData =
  | MockDataDCATCatalog
  | MockDataDCATDataService
  | MockDataDCATDataset;


const ns = "http://telicent.io/data/";

export const MOCK: Record<string, MockData> = {
  catalog1: {
    classType: "DCATCatalog",
    uri: `${ns}catalog1`,
    title: `Catalog: Cornwall Data`,
    description: `2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Mario Giacomelli`,
    accessRights: `James Hardacre`,
    rights: MOCK_DATA_POLICY,
    published: `2020-3-12`,
    modified: `2023-6-1`,
  },
  catalog2: {
    classType: "DCATCatalog",
    uri: `${ns}cat2`,
    title: `Catalog: Sussex Data`,
    description: `2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.`,
    creator: `Amina Okeke`,
    accessRights: `Erik Johansson`,
    rights: MOCK_DATA_POLICY,
    published: `2020-3-12`,
    modified: `2020-3-12`,
  },
  catalog1_1: {
    classType: "DCATCatalog",
    uri: `${ns}catalog1.1`,
    title: `Catalog: St Clement Wind turbine`,
    description: `Third-party data pulled from Wind Turbine register.`,
    creator: `Hans Müller`,
    accessRights: `Aarav Sharma`,
    rights: MOCK_DATA_POLICY,
    published: `2019-5-3`,
    modified: `2019-5-3`,
  },
  catalog1_1_dataset: {
    classType: "DCATDataset",
    uri: `${ns}catalog1_1_dataset`,
    title: `Dataset: Region 44`,
    description: `Turbines around Trefranc and St Clether.`,
    creator: `George Maxwell`,
    accessRights: `Aiman Ismail`,
    rights: MOCK_DATA_POLICY,
    published: `2022-6-5`,
    modified: `2022-6-5`,
  },

  dataservice1: {
    uri: `${ns}dataservice1`,
    classType: "DCATDataService",
    title: `Service: Wind Feed`,
    description: `Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.`,
    creator: `Oleg Novak`,
    accessRights: `James Hardacre`,
    rights: MOCK_DATA_POLICY,
    published: `2023-2-3`,
    modified: `2023-2-3`,
  },
  dataset1: {
    classType: "DCATDataset",
    uri: `${ns}dataset1`,
    title: `Dataset: Q1 2021`,
    description: `Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    accessRights: `Damir Sato`,
    rights: MOCK_DATA_POLICY,
    published: `2021-4-5`,
    modified: `2021-4-5`,
  },
  dataset2: {
    classType: "DCATDataset",
    uri: `${ns}dataset2`,
    title: `Dataset: Q2 2021`,
    description: `Q2 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    accessRights: `Damir Sato`,
    rights: MOCK_DATA_POLICY,
    published: `2021-7-5`,
    modified: `2021-7-5`,
  },
  dataset3: {
    classType: "DCATDataset",
    uri: `${ns}dataset3`,
    title: `Dataset: Q3 2021`,
    description: `Q3 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    accessRights: `Damir Sato`,
    rights: MOCK_DATA_POLICY,
    published: `2022-10-5`,
    modified: `2022-10-6`,
  },
  dataset4: {
    classType: "DCATDataset",
    uri: `${ns}dataset4`,
    title: `Dataset: Q4 2021`,
    description: `Q4 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.`,
    creator: `Kiki Sato`,
    accessRights: `Wei Zhang`,
    rights: MOCK_DATA_POLICY,
    published: `2023-2-5`,
    modified: `2023-3-21`,
  },
};
