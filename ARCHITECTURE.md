# Architecture: Cross-Border Payments API (USDC → COP)

## Overview

This document describes the infrastructure and application design for a cross-border payments API that off-ramps USDC to Colombian Peso (COP) via multiple vendors. The focus is on **infrastructure, extensibility, observability, and SOC 2–aligned design**.

## High-Level Design

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                     Load Balancer / Ingress              │
                    └─────────────────────────────┬───────────────────────────┘
                                                  │
                    ┌─────────────────────────────▼───────────────────────────┐
                    │              Payments API (NestJS, containerized)        │
                    │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
                    │  │ POST/transfer│  │ /health      │  │ /metrics        │  │
                    │  └──────┬──────┘  └──────────────┘  └─────────────────┘  │
                    │         │                                                  │
                    │  ┌──────▼──────┐     ┌─────────────────────────────────┐  │
                    │  │ Transfer    │     │ Blockchain (mock)                 │  │
                    │  │ Service     │────▶│ verify txhash → confirmed|not found│  │
                    │  └──────┬──────┘     └─────────────────────────────────┘  │
                    │         │                                                  │
                    │         │     ┌─────────────────────────────────────────┐  │
                    │         └────▶│ Vendor Registry → vendorA | vendorB | … │  │
                    │               └─────────────────────────────────────────┘  │
                    └───────────────────────────────────────────────────────────┘
```

- **Compute**: Kubernetes (e.g. kind for local/dev, EKS or GKE for production).
- **Networking**: ClusterIP + NodePort (or cloud LB + Ingress in production).
- **Secrets**: Kubernetes Secrets (mock); production would use Vault, AWS SSM, or External Secrets Operator.
- **CI/CD**: GitHub Actions build → deploy to cluster → post-deploy tests; deployment fails if tests fail.

## Txhash Verification Flow

1. Client sends `POST /transfer` with `{ amount, vendor, txhash }`.
2. **Validation**: Request body is validated (amount > 0, vendor and txhash present).
3. **Blockchain check**: A blockchain service (mock in this repo) verifies the txhash:
   - **Mock rule**: `txhash` starting with `0x` and length ≥ 10 → `"confirmed"`; otherwise `"not found"`.
   - Production: replace with a call to a real chain indexer/RPC to confirm the USDC deposit.
4. If status is **not found**, the API returns `{ txhashStatus: "not found", error: "…" }` and does not call the vendor.
5. If **confirmed**, the request is forwarded to the selected **vendor adapter** (mocked).
6. The vendor’s response (e.g. `{ status: "success" }` or `{ status: "pending" }`) is returned along with `txhashStatus: "confirmed"`.

All verification outcomes and vendor calls are reflected in **metrics and logs** (see Observability).

## Extensible Vendor Architecture

Vendors are implemented as **adapters** that implement a single interface:

- **Interface**: `IVendorAdapter`: `name: string`, `executeTransfer(amount, txhash): Promise<VendorResponse>`.
- **Registry**: `VendorRegistryService` holds a map of `name → adapter`. At startup, `VendorRegistrationService` registers each adapter.

**Current mock vendors:**

- **vendorA**: returns `{ status: "success" }`.
- **vendorB**: returns `{ status: "pending" }`.

**Adding a new vendor (e.g. vendorC) without redesigning:**

1. Create a new class implementing `IVendorAdapter` (e.g. `VendorCAdapter` in `api/src/transfer/vendors/`).
2. Add it to the `TransferModule` `providers` array.
3. In `VendorRegistrationService`, inject the new adapter and call `this.registry.register(this.vendorC)` in `onModuleInit`.

No changes are required in the controller, transfer service, or other vendors. An example adapter is provided in `api/src/transfer/vendors/vendor-c.example.adapter.ts`.

## Infrastructure-as-Code (Terraform)

- **Location**: `infra/terraform/`.
- **Structure**: Modular; two environments (**dev**, **prod**).
- **Modules**:
  - **ecr**: ECR repository for the API image (name, lifecycle, scan on push).
  - **app-runner**: App Runner service (ECR as source, IAM roles for access and instance, health check, **runtime_environment_variables** and optional **runtime_environment_secrets** for env vars).
- **Environments**: `environments/dev` and `environments/prod`, each with its own `main.tf`, `variables.tf`, and `terraform.tfvars`. Environment variables for the container are set per environment in tfvars (`runtime_environment_variables`; secrets via Secrets Manager/SSM in `runtime_environment_secrets`).
- **Compute**: AWS App Runner (no Kubernetes). App Runner provides load balancing, TLS, auto-scaling, and health checks.
- **Secrets**: Non-sensitive config in Terraform variables; sensitive values via AWS Secrets Manager or SSM and referenced in the App Runner module as `runtime_environment_secrets`.

## Observability

- **Metrics** (Prometheus): Exposed at `GET /metrics`.
  - `payments_transfer_requests_total{vendor, txhash_status}` — requests per vendor and txhash outcome.
  - `payments_transfer_latency_seconds{vendor}` — latency histogram per vendor.
  - `payments_txhash_confirmations_total{status}` — confirmed vs not found.
  - `payments_vendor_requests_total{vendor, result}` — success/failure/pending per vendor.
- **Logging**: Structured JSON to stdout (e.g. startup event); application logs can be extended with request IDs and txhash (avoid logging full PII) for audit.
- **DORA metrics** (approach):
  - **Deployment frequency**: From CI/CD (e.g. number of successful deploy jobs per day/week).
  - **Lead time (commit → deploy)**: From pipeline timestamps (commit time to job end).
  - **Change failure rate**: From pipeline (failed deploy or failed post-deploy tests / total deploys).
  - **MTTR**: From incident timestamps and deployment of a fix; can be mocked by a “recovery” deployment and measuring time to green.

These can be collected by a pipeline exporter (e.g. GitHub Actions metrics) or a DORA dashboard that queries the same metrics store and CI API.

## Deployment and Tests

- **Build**: Docker image built from `api/Dockerfile` (multi-stage Node build).
- **Deploy**: Terraform applies Kubernetes manifests; image is loaded into kind in CI or pulled from a registry in production.
- **Post-deploy tests** (required; fail the pipeline if they fail):
  - Call `POST /transfer` with valid txhash and `vendorA` → expect `txhashStatus: "confirmed"` and `vendorResponse.status: "success"`.
  - Call `POST /transfer` with invalid txhash → expect `txhashStatus: "not found"`.
- Script: `scripts/deploy-tests.sh`; invoked after deployment in CI (e.g. after port-forward or LB is available).

## Programmatic Access (Optional)

- **Trigger a transfer**: `scripts/trigger-transfer.sh [BASE_URL] amount vendor txhash` — calls `POST /transfer` and prints the JSON response.
- **Deploy a new vendor**: Add the new adapter in code and run the same IaC pipeline (Terraform + deploy); no separate “vendor service” is required unless you introduce one intentionally.
