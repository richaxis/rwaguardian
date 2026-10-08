# RWA Guardian

RWA Guardian is an intelligent verification layer for real-world assets.

It uses a GenLayer Intelligent Contract to review public evidence about an
asset and record a verification status and confidence score onchain.

## How it works

1. An RWA is registered with its name, type, and public evidence URL.
2. The GenLayer Intelligent Contract retrieves the evidence.
3. GenLayer evaluates the evidence.
4. The contract reaches a consensus result.
5. The verification status and score are stored onchain.
6. The website displays the current verification state.

## Network

RWA Guardian is configured for:

- **Network:** GenLayer Studio Next
- **Chain ID:** 61997
- **RPC:** https://studio-dev.genlayer.com/api
- **Currency:** GEN
- **Explorer:** https://explorer-studio-dev.genlayer.com/

## Deployment

The Intelligent Contract is deployed on **GenLayer Studio Next**.

The web application is deployed on **Vercel** and connects directly to the
deployed GenLayer contract.

## Verification

The main verification flow is handled by the GenLayer Intelligent Contract.
The website is the interface for viewing the asset and starting a verification.

## Repository structure

```text
contracts/    Intelligent Contract
deploy/       Deployment files
docs/         Application documentation
frontend/     Web application
scripts/      Project scripts
tests/direct/ Direct contract tests
```
