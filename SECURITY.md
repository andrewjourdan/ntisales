# Security Policy

## Supported versions

Security fixes apply to the latest version on the `main` branch and the current deployment of https://ntisales.com/, including the contact Worker maintained in this repository. Older commits, forks, and third-party services are not maintained by this project.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to [andrew@andrewjourdan.com](mailto:andrew@andrewjourdan.com) with the subject `Security report: ntisales.com`.

Do not post vulnerabilities, credentials, personal information, or exploit details in public issues or pull requests.

Include:

- The affected URL, file, or component and a description of the potential impact.
- Clear reproduction steps and a minimal proof of concept, using test data.
- Relevant dates, browser or tool versions, and redacted screenshots or logs.
- A contact address for follow-up.

Never include passwords, API tokens, or real contact-form submissions. If a secret is exposed, notify the maintainer privately so it can be revoked and replaced.

## Responsible testing and disclosure

Limit testing to systems you own or have explicit permission to test. This policy does not grant authorization to test GitHub, Cloudflare, Network Solutions, or other third-party infrastructure. Do not disrupt service, send unsolicited messages, access other people's data, or attempt destructive testing. Stop and report privately if you encounter sensitive information.

Allow the maintainer time to investigate and coordinate a fix before publishing details. Reports will be reviewed as availability permits; no response-time guarantee or bug bounty is offered.

## Security maintenance

Changes should use pull requests and pass the repository's required checks before merging. Keep credentials in the hosting provider's secret storage, never in repository files or browser code. Review dependencies and GitHub Actions when they change, and verify the deployed site and contact flow after security-related changes. Account access, DNS, email, and hosting settings require separate review.
