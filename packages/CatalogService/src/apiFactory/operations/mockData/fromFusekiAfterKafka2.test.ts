import { RDFTripleSchema } from "@telicent-oss/rdfservice";
import { result } from "./fromFusekiAfterKafka2";
import { formatDataAsArray } from "../../../__tests__/utils/formatDataAsArray";

test("fromFusekiAfterKafka2: parse", () => {
  expect(
    result.results.bindings
      .map((el, i) => {
        const result = RDFTripleSchema.safeParse(el);
        return result.success
          ? false
          : `${result.error} ${JSON.stringify(el, null, 2)}`;
      })
      .filter(Boolean)
  ).toMatchInlineSnapshot(`[]`);
});

test("fromFusekiAfterKafka2: output", () => {
  expect(formatDataAsArray(result.results.bindings).join("\n"))
    .toMatchInlineSnapshot(`
    "s                                                  | p                                               | o
    http://telicent.io/catalog#acled_data_dataset      | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/description            | All political violence events, demonstration events,and strategic developments recorded in Africa from the beginning of ACLED coverage to the present.
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/identifier             | acled_data
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/issued                 | 2024-09-13T07:00:00+00:00
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/publisher              | http://telicent.io/catalog#acled
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/title                  | acled
    http://telicent.io/catalog#acled_data_dataset      | http://purl.org/dc/terms/rights                 | b0
    http://telicent.io/catalog#acled_data_dataset      | http://www.w3.org/ns/dcat#distribution          | http://telicent.io/catalog#acled_data_distribution
    http://telicent.io/catalog#acled_data_dataset      | http://www.w3.org/ns/prov#Attribution           | b1
    http://telicent.io/catalog#acled                   | https://schema.org/email                        | kafka://catalog/admin@acleddata.com
    http://telicent.io/catalog#acled                   | https://schema.org/name                         | Armed Conflict Location & Event Data Project (ACLED)
    http://telicent.io/catalog#acled_data_distribution | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Distribution
    http://telicent.io/catalog#acled_data_distribution | http://purl.org/dc/terms/identifier             | acled_csv
    http://telicent.io/catalog#acled_data_distribution | http://purl.org/dc/terms/title                  | ACLED CSV Distribution
    http://telicent.io/catalog#acled_data_distribution | http://www.w3.org/ns/dcat#mediaType             | http://www.iana.org/assignments/media-types/text/csv
    b0                                                 | http://purl.org/dc/terms/description            | All rights to use ACLED data or analysis are conditioned on the user’s adherence to the use restrictions and ACLED’s Attribution Policy outlined below. ACLED reserves the right to update the Terms of Use at any time and to restrict or revoke access from any user who violates these terms.

    Terms of Use
    All users must use ACLED data responsibly and in good faith.

    ‘Responsible and good faith’ use includes ensuring accurate and faithful representation of ACLED’s methodology based on the codebook and other publicly available resources.

    In the case of any uncertainty or confusion, users should consult the ACLED Access team directly (access@acleddata.com) to confirm accurate understandings and must correct any inaccuracies identified.

    Users should clearly articulate and present any manipulation of the data for their research or analysis.

    Users may crawl the ACLED website or API only in accordance with the provisions of our robots.txt file. Scraping is prohibited.

    Users cannot use ACLED’s data or analysis in any manner that may harm, target, or oppress the data subjects or any groups, or cause any of these to be harmed, targeted, or oppressed.

    Users cannot provide, permit, or allow direct access to any of ACLED’s original/raw data to any other user.

    Users cannot use ACLED’s data or analysis to create or develop any dataset, product, or platform in competition with, or that would create a functional substitute for, any of ACLED’s content, products, or platforms.

    These terms are not intended to affect legitimate academic inquiry or use of the data or analysis. ACLED encourages engagement with the academic community and welcomes constructive feedback that can help improve the data.

    ACLED is required to monitor and address irresponsible or bad faith data use as part of our do-no-harm and conflict sensitivity policies.

    If you have any other questions about the use restrictions or Attribution Policy, or their application, please feel free to contact us directly at access@acleddata.com.

    Attribution Policy
    If using ACLED data in any way, direct or manipulated, these data must be clearly and prominently acknowledged. Proper acknowledgement includes (1) a footnote with the full citation which includes a link to ACLED’s website (see below for examples), (2) in-text citation/acknowledgement, stating that ACLED is the source of these data and that these data are publicly available, and/or (3) clear citation on any and all visuals making use of ACLED data.
    Please also indicate:

    The date you accessed these data: the ACLED dataset is a ‘living dataset’, with updates made weekly, so your date of access will help clarify the specific ‘snapshot’ of ACLED data you have accessed.
    Which data you accessed: what filters did you use to isolate the relevant events (what countries, time periods, event types, actors, etc.)?
    In what ways you have manipulated these data: are there any changes to the unit of analysis, categorization, groupings, etc. which would result in your data structure looking different from the original ACLED data?
    In what ways have you added to or amended these data: did you generate a new violence variable based on the original data? Did you add your own or another assessment of violence to the original data? This will help demonstrate whether and how the ACLED data used in your analysis has been slightly or considerably amended, and in which ways.
    If generating a data file for public or private use, and presenting those data to another party, the ACLED data included must be directly acknowledged in a source column, including ACLED’s full name and a link: “Armed Conflict Location & Event Data Project (ACLED); www.acleddata.com.”
    To reference the ACLED codebook, please cite as follows (substituting for the correct year):
    ACLED. (2019). “ACLED Codebook, 2019.” Armed Conflict Location & Event Data Project (ACLED). www.acleddata.com

    If using ACLED data in an academic paper, report, or article, please cite as follows:
    Raleigh, C., Kishi, R. & Linke, A. Political instability patterns are obscured by conflict dataset scope conditions, sources, and coding choices. Humanit Soc Sci Commun 10, 74 (2023). https://doi.org/10.1057/s41599-023-01559-4

    If referring to figures or statistics published in ACLED analysis, infographics, working papers, etc., please cite the individual publication, including the author(s), using the following format:
    Hart, Tom, and Lauren Blaxter. (23 November 2018). “Ceasefire Divisions: Violations of the Truce with Gaza Lead to Rising Political Pressures in Israel.” Armed Conflict Location & Event Data Project (ACLED). https://www.acleddata.com/2018/11/23/ceasefire-divisions-violations-of-the-truce-with-gaza-lead-to-rising-political-pressures-in-israel/

    If ACLED content does not list an author (often the case for documents describing ACLED methodology), the citation should identify ACLED as the author.

    If using ACLED data in a visual, graphic, or map of your own, please attribute the source data clearly and prominently on the visual itself or within the key/legend and include a link to ACLED’s website. This can be in small print on the bottom of the image. Please note your date of data access. These citations should be included for both standalone infographics as well as for tables/figures within a larger report. If unable to include a link on a static visual file, please note “acleddata.com” as the source URL. When sharing such an image on social media, please (1) be sure that the citation is not cut off, and (2) please tag ACLED (Twitter; Facebook; LinkedIn).
    If you wish to reproduce or republish a visual, graphic, or map ACLED has already published (rather than creating an original image using raw data) for non-commercial purposes, please cite the individual publication, including the author(s), using the following format:
    Hart, Tom, and Lauren Blaxter. (23 November 2018). “Ceasefire Divisions: Violations of the Truce with Gaza Lead to Rising Political Pressures in Israel.” Armed Conflict Location & Event Data Project (ACLED). https://www.acleddata.com/2018/11/23/ceasefire-divisions-violations-of-the-truce-with-gaza-lead-to-rising-political-pressures-in-israel/ © 2018 ACLED All rights reserved. Used with permission from ACLED.

    If ACLED content does not list an author (often the case for documents describing ACLED methodology), the citation should identify ACLED as the author.

    If you wish to cite a statistic based on ACLED data in text, please explicitly reference “ACLED” by name, along with a hyperlink. For example:
    “Political violence increased by 50% in Country X last month, according to ACLED.” (The hyperlink leads to the ACLED website).

    If you wish to cite a specific finding from an ACLED report in text, please explicitly reference “ACLED” by name, along with a hyperlink to the ACLED report providing the finding. For example:
    “Battles involving Actor X have been on the rise, according to a recent ACLED report.” (The hyperlink leads to the specific ACLED report you wish to reference). 

    Please do not use the ACLED logo to denote use of ACLED data unless explicitly authorized. The ACLED logo is reserved for products created directly by ACLED or jointly with ACLED.
    If you intend to use ACLED data or analysis in a manner not described in this Attribution Policy, contact us directly at access@acleddata.com for instructions regarding the attribution requirements.
    b0                                                 | http://purl.org/dc/terms/title                  | ACLED Terms of Use & Attribution Policy - 17 October 2023
    b1                                                 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/prov#Attribution
    b1                                                 | http://www.w3.org/ns/dcat#hadRole               | http://standards.iso.org/iso/19115/resources/Codelist/cat/codelists.xml#CI_RoleCode/owner
    b1                                                 | http://www.w3.org/ns/prov#agent                 | acled"
  `);
});
