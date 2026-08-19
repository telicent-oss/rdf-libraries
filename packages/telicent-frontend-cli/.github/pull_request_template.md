Ticket: <!-- Let the ticket expand inline. Maybe change the ticket name field for clarity -->

### Goal

<!-- The Goal. -->

### Work Completed

<!-- The Solution.  -->

### Design Testing

- Pre-release version: _e.g. v1.2.3-JIRA-123.0_ <!-- create a prerelease branch, build it, and push it with flux. By also including the version here u allow Dev testers to verify the right version is deployed  -->
- [ ] This PR is setup for easy assessment of "<strong>Design approval areas</strong>")  

<details>
  <summary><strong>Design approval areas</strong></summary>

  <hr />
  
  A _indicative_ list of suggested screenshots or videos.

  Action each: Mark "`[x]`" (click) for _complete_, or "`[-]`" for _not-applicable_.

  - [ ] UI content:
    - [ ] **Ideal** - show UI with "happy content" i.e. what Figma considers typical
    - [ ] **Empty** - show UI with empty (or minimum) content
    - [ ] **Full** - show UI with all (or technically maximum) content
  - [ ] UI States:
    - [ ] **Form validation** - show UI for validation errors, hints and success
    - [ ] **Network states** - show UI for fetch failures and success
    - [ ] **env-config errors** - show release-engineer UI for app config errors
  - [ ] Responsiveness:
    - [ ] **Min width** - show UI with minimum width supported by parent container, or [most common desktop](https://www.google.com/search?q=most+common+desktop+screen+resolution+now) split screen
    - [ ] **Min height** - show UI with minimum height supported by parent container, or [most common desktop](https://www.google.com/search?q=most+common+desktop+screen+resolution+now) half height
  - [ ] Accessibility: new issues introduced this PR (perhaps include report before, and report after)

</details>

### Testing Method

<!-- Describe your testing steps -->

### Code Review Tips <!-- OPTIONAL-->

<!-- Pointers for reviewer  -->

### Engineering Notes <!-- OPTIONAL-->

<!-- Implementation context  -->

### Out-of-scope <!-- OPTIONAL-->

<!-- Boundary setting -->

---

<details>
  <summary><strong>🕵️ Review Guidance</strong></summary>

---

General guidance

- Generally, approve a PR if it makes the system better, even if it's not perfect. — [Google: The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)
- The aim of both PR AUTHOR and PR REVIEWER is to get the code merged
- Aim for consensus, defined as _everyone can live with the outcome_
- PR with changes requires 2 approvals
- PR with no changes requires 1 approvals

For PR REVIEWER:

1. Read the ticket & description
2. [Review the code](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
3. Request any changes that are essential.
4. For non-essential comments:
   - Use prefixes, e.g. "**nit:** change to Pascal case"
     - **nit:** small, non-essential change
     - **obs:** just an observation, doesn't affect the PR
     - **idea:** a suggestion to think about
     - **q:** questions
   - Use modifiers, e.g. "**obs**`[pr-owner-resolve]`: Jim is also editing this file"
     - `pr-author-resolve` PR author can resolve after reading
     - `pr-author-delete` (rare) delete after reading to avoid confusion
5. try to add _at least_ a helpful comment per ~500 lines; less if the PR is already busy

For PR AUTHOR:

1. Aim for enough detail in PR description for things to go smoothly
2. After requested changes, [re-request a review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews#re-requesting-a-review) (so the PR shows up in [reviews-requested:@me](https://github.com/pulls?q=is%3Apr+is%3Aopen+archived%3Afalse+sort%3Aupdated-desc+review-requested%3A%40me+))

</details>
