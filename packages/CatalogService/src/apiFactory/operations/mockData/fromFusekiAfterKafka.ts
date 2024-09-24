export const data = [
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: {
        type: "uri",
        value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      },
      o: { type: "uri", value: "http://www.w3.org/ns/dcat#Dataset" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/description" },
      o: {
        type: "literal",
        value:
          "All political violence events, demonstration events,and strategic developments recorded in Africa from the beginning of ACLED coverage to the present.",
      },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/identifier" },
      o: { type: "literal", value: "acled_data" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/issued" },
      o: {
        type: "literal",
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
        value: "2024-09-13T07:00:00+00:00",
      },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/publisher" },
      o: { type: "uri", value: "http://telicent.io/catalog#acled" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/title" },
      o: { type: "literal", "xml:lang": "en", value: "acled" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/rights" },
      o: { type: "bnode", value: "b0" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: { type: "uri", value: "http://www.w3.org/ns/dcat#distribution" },
      o: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_distribution",
      },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_dataset",
      },
      p: {
        type: "uri",
        value: "http://www.w3.org/ns/prov#qualifiedAttribution",
      },
      o: { type: "bnode", value: "b1" },
    },
    {
      s: { type: "uri", value: "http://telicent.io/catalog#acled" },
      p: { type: "uri", value: "https://schema.org/email" },
      o: { type: "uri", value: "kafka://catalog/admin@acleddata.com" },
    },
    {
      s: { type: "uri", value: "http://telicent.io/catalog#acled" },
      p: { type: "uri", value: "https://schema.org/name" },
      o: {
        type: "literal",
        "xml:lang": "en",
        value: "Armed Conflict Location & Event Data Project (ACLED)",
      },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_distribution",
      },
      p: {
        type: "uri",
        value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      },
      o: { type: "uri", value: "http://www.w3.org/ns/dcat#Distribution" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_distribution",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/identifier" },
      o: { type: "literal", value: "acled_csv" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_distribution",
      },
      p: { type: "uri", value: "http://purl.org/dc/terms/title" },
      o: { type: "literal", "xml:lang": "en", value: "ACLED CSV Distribution" },
    },
    {
      s: {
        type: "uri",
        value: "http://telicent.io/catalog#acled_data_distribution",
      },
      p: { type: "uri", value: "http://www.w3.org/ns/dcat#mediaType" },
      o: {
        type: "uri",
        value: "http://www.iana.org/assignments/media-types/text/csv",
      },
    },
    {
      s: { type: "bnode", value: "b0" },
      p: { type: "uri", value: "http://purl.org/dc/terms/description" },
      o: {
        type: "literal",
        value:
          "All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restrictions and ACLED’s Attribution Policy outlined below. ACLED reserves the right to update the Terms of Use at any time and to restrict or revoke access from any user who violates these terms.\\n\\nTerms of Use\\nAll users must use ACLED data responsibly and in good faith.\\n\\n‘Responsible and good faith’ use includes ensuring accurate and faithful representation of ACLED’s methodology based on the codebook and other publicly available resources.\\n\\nIn the case of any uncertainty or confusion, users should consult the ACLED Access team directly (access@acleddata.com) to confirm accurate understandings and must correct any inaccuracies identified.\\n\\nUsers should clearly articulate and present any manipulation of the data for their research or analysis.\\n\\nUsers may crawl the ACLED website or API only in accordance with the provisions of our robots.txt file. Scraping is prohibited.\\n\\nUsers cannot use ACLED’s data or analysis in any manner that may harm, target, or oppress the data subjects or any groups, or cause any of these to be harmed, targeted, or oppressed.\\n\\nUsers cannot provide, permit, or allow direct access to any of ACLED’s original/raw data to any other user.\\n\\nUsers cannot use ACLED’s data or analysis to create or develop any dataset, product, or platform in competition with, or that would create a functional substitute for, any of ACLED’s content, products, or platforms.\\n\\nThese terms are not intended to affect legitimate academic inquiry or use of the data or analysis. ACLED encourages engagement with the academic community and welcomes constructive feedback that can help improve the data.\\n\\nACLED is required to monitor and address irresponsible or bad faith data use as part of our do-no-harm and conflict sensitivity policies.\\n\\nIf you have any other questions about the use restrictions or Attribution Policy, or their application, please feel free to contact us directly at access@acleddata.com.\\n\\nAttribution Policy\\nIf using ACLED data in any way, direct or manipulated, these data must be clearly and prominently acknowledged. Proper acknowledgement includes (1) a footnote with the full citation which includes a link to ACLED’s website (see below for examples), (2) in-text citation/acknowledgement, stating that ACLED is the source of these data and that these data are publicly available, and/or (3) clear citation on any and all visuals making use of ACLED data.\\nPlease also indicate:\\n\\nThe date you accessed these data: the ACLED dataset is a ‘living dataset’, with updates made weekly, so your date of access will help clarify the specific ‘snapshot’ of ACLED data you have accessed.\\nWhich data you accessed: what filters did you use to isolate the relevant events (what countries, time periods, event types, actors, etc.)?\\nIn what ways you have manipulated these data: are there any changes to the unit of analysis, categorization, groupings, etc. which would result in your data structure looking different from the original ACLED data?\\nIn what ways have you added to or amended these data: did you generate a new violence variable based on the original data? Did you add your own or another assessment of violence to the original data? This will help demonstrate whether and how the ACLED data used in your analysis has been slightly or considerably amended, and in which ways.\\nIf generating a data file for public or private use, and presenting those data to another party, the ACLED data included must be directly acknowledged in a source column, including ACLED’s full name and a link: “Armed Conflict Location & Event Data Project (ACLED); www.acleddata.com.”\\nTo reference the ACLED codebook, please cite as follows (substituting for the correct year):\\nACLED. (2019). “ACLED Codebook, 2019.” Armed Conflict Location & Event Data Project (ACLED). www.acleddata.com\\n\\nIf using ACLED data in an academic paper, report, or article, please cite as follows:\\nRaleigh, C., Kishi, R. & Linke, A. Political instability patterns are obscured by conflict dataset scope conditions, sources, and coding choices. Humanit Soc Sci Commun 10, 74 (2023). https://doi.org/10.1057/s41599-023-01559-4\\n\\nIf referring to figures or statistics published in ACLED analysis, infographics, working papers, etc., please cite the individual publication, including the author(s), using the following format:\\nHart, Tom, and Lauren Blaxter. (23 November 2018). “Ceasefire Divisions: Violations of the Truce with Gaza Lead to Rising Political Pressures in Israel.” Armed Conflict Location & Event Data Project (ACLED). https://www.acleddata.com/2018/11/23/ceasefire-divisions-violations-of-the-truce-with-gaza-lead-to-rising-political-pressures-in-israel/\\n\\nIf ACLED content does not list an author (often the case for documents describing ACLED methodology), the citation should identify ACLED as the author.\\n\\nIf using ACLED data in a visual, graphic, or map of your own, please attribute the source data clearly and prominently on the visual itself or within the key/legend and include a link to ACLED’s website. This can be in small print on the bottom of the image. Please note your date of data access. These citations should be included for both standalone infographics as well as for tables/figures within a larger report. If unable to include a link on a static visual file, please note “acleddata.com” as the source URL. When sharing such an image on social media, please (1) be sure that the citation is not cut off, and (2) please tag ACLED (Twitter; Facebook; LinkedIn).\\nIf you wish to reproduce or republish a visual, graphic, or map ACLED has already published (rather than creating an original image using raw data) for non-commercial purposes, please cite the individual publication, including the author(s), using the following format:\\nHart, Tom, and Lauren Blaxter. (23 November 2018). “Ceasefire Divisions: Violations of the Truce with Gaza Lead to Rising Political Pressures in Israel.” Armed Conflict Location & Event Data Project (ACLED). https://www.acleddata.com/2018/11/23/ceasefire-divisions-violations-of-the-truce-with-gaza-lead-to-rising-political-pressures-in-israel/ © 2018 ACLED All rights reserved. Used with permission from ACLED.\\n\\nIf ACLED content does not list an author (often the case for documents describing ACLED methodology), the citation should identify ACLED as the author.\\n\\nIf you wish to cite a statistic based on ACLED data in text, please explicitly reference “ACLED” by name, along with a hyperlink. For example:\\n“Political violence increased by 50% in Country X last month, according to ACLED.” (The hyperlink leads to the ACLED website).\\n\\nIf you wish to cite a specific finding from an ACLED report in text, please explicitly reference “ACLED” by name, along with a hyperlink to the ACLED report providing the finding. For example:\\n“Battles involving Actor X have been on the rise, according to a recent ACLED report.” (The hyperlink leads to the specific ACLED report you wish to reference). \\n\\nPlease do not use the ACLED logo to denote use of ACLED data unless explicitly authorized. The ACLED logo is reserved for products created directly by ACLED or jointly with ACLED.\\nIf you intend to use ACLED data or analysis in a manner not described in this Attribution Policy, contact us directly at access@acleddata.com for instructions regarding the attribution requirements.",
      },
    },
    {
      s: { type: "bnode", value: "b0" },
      p: { type: "uri", value: "http://purl.org/dc/terms/title" },
      o: {
        type: "literal",
        value: "ACLED Terms of Use & Attribution Policy - 17 October 2023",
      },
    },
    {
      s: { type: "bnode", value: "b1" },
      p: {
        type: "uri",
        value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      },
      o: { type: "uri", value: "http://www.w3.org/ns/prov#Attribution" },
    },
    {
      s: { type: "bnode", value: "b1" },
      p: { type: "uri", value: "http://www.w3.org/ns/dcat#hadRole" },
      o: {
        type: "uri",
        value:
          "http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner",
      },
    },
    {
      s: { type: "bnode", value: "b1" },
      p: { type: "uri", value: "http://www.w3.org/ns/prov#agent" },
      o: { type: "literal", value: "acled" },
    },
  ]