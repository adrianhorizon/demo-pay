# Manual rápido – Payments API

## Levantar la API

**Local (Node):**
```bash
cd api && npm install && npm run start:dev
```

**Docker:**
```bash
docker compose up --build
```

La API queda en **http://localhost:8080**.

---

## Llamar a la API

| Qué | Cómo |
|-----|------|
| Estado | `curl http://localhost:8080/health` |
| Transfer (éxito) | `curl -X POST http://localhost:8080/transfer -H "Content-Type: application/json" -d '{"amount":100,"vendor":"vendorA","txhash":"0x1234567890abcdef"}'` |
| Transfer (txhash inválido) | `curl -X POST http://localhost:8080/transfer -H "Content-Type: application/json" -d '{"amount":100,"vendor":"vendorA","txhash":"invalid"}'` |
| Métricas | `curl http://localhost:8080/metrics` |

**Script:** `./scripts/trigger-transfer.sh http://localhost:8080 100 vendorA 0x123...`

---

## Tests

```bash
cd api && npm run test -- --watchman=false   # unitarias
cd api && npm run test:e2e -- --watchman=false
./scripts/terraform-validate.sh              # Terraform dev + prod
```

---

## Infra (Terraform)

La infra está en **`infra/`** (solo Terraform). Ver **[infra/README.md](infra/README.md)** e **[infra/terraform/README.md](infra/terraform/README.md)**.

```bash
cd infra/terraform/environments/dev
terraform init && terraform apply -var-file=terraform.tfvars
```

Prod: igual en `environments/prod`. Requiere AWS configurado.

**Error: "Service cannot be updated in the current state: OPERATION_IN_PROGRESS"**

App Runner no permite cambiar la configuración mientras hay un despliegue en curso. Espera 2–3 minutos y vuelve a ejecutar en el entorno:

```bash
cd infra/terraform/environments/dev
terraform apply -var-file=terraform.tfvars -auto-approve
```

El script `deploy-local.sh` ahora espera a que el servicio esté en estado RUNNING antes de aplicar; si aun así falla, usa el comando anterior tras esperar.

**Cancelar Terraform y volver a lanzar**

- **Cancelar** un `plan` o `apply` en curso: `Ctrl+C` en la terminal. Terraform termina; si cancelas en medio de un `apply`, algunos recursos pueden quedar creados y el estado desincronizado.
- **Volver a lanzar:** entra en el entorno y ejecuta de nuevo:
  ```bash
  cd infra/terraform/environments/dev
  terraform plan -var-file=terraform.tfvars
  terraform apply -var-file=terraform.tfvars
  ```
  Si el estado quedó raro tras un cancel, `plan` mostrará qué falta crear o actualizar; con `apply` lo corriges.
- **Empezar de cero** (borrar todo y recrear): desde el mismo directorio:
  ```bash
  terraform destroy -var-file=terraform.tfvars -auto-approve
  ./scripts/deploy-local.sh dev apply
  ```
  O solo `terraform apply` otra vez si no quieres destruir.

---

## Desplegar en AWS desde local (imagen al registry y App Runner)

Requisitos: AWS CLI configurado (`aws configure` o variables de entorno), Docker.

**Primera vez:** por defecto el estado es local (`backend.tf`). Para probar todo sin S3:

```bash
./scripts/deploy-local.sh dev apply
```
   Aplica Terraform (estado en `environments/dev/terraform.tfstate`), construye la imagen, la sube a ECR, dispara el deploy en App Runner y ejecuta los tests.

**Si quieres estado en S3:** crear el bucket con `infra/terraform/backend/` (ver README de esa carpeta). En el entorno, copiar `backend.tf.s3.example` → `backend.tf`, crear `backend.hcl` desde `backend.hcl.example` y ejecutar `terraform init -reconfigure -backend-config=backend.hcl`. Luego `./scripts/deploy-local.sh dev apply` usará S3 cuando exista `backend.hcl`.

**Siguientes veces** (solo nueva imagen, infra ya aplicada):

```bash
./scripts/deploy-local.sh dev
```

Para prod: `./scripts/deploy-local.sh prod` o `./scripts/deploy-local.sh prod apply`.

---

## Destruir la infra en local (destroy)

Para borrar todos los recursos del ambiente (App Runner, ECR, IAM, etc.) desde tu máquina:

**Requisitos:** AWS CLI configurado y el mismo backend que usaste al aplicar (local o S3 con `backend.hcl`).

**Con el script (recomendado):**

```bash
./scripts/destroy-local.sh dev
```

Para prod: `./scripts/destroy-local.sh prod`

El script hace: `terraform init` (con tu backend), espera a que App Runner esté en estado RUNNING si existe (AWS no permite destroy en medio de un despliegue), y luego `terraform destroy -var-file=terraform.tfvars -auto-approve`.

**A mano** (desde el directorio del entorno):

```bash
cd infra/terraform/environments/dev
terraform init
# Si usas S3: terraform init -backend-config=backend.hcl
terraform destroy -var-file=terraform.tfvars -auto-approve
```

Si falla con `OPERATION_IN_PROGRESS`, espera 2–3 minutos y vuelve a ejecutar `terraform destroy`.

---

## Si falla el deploy en GitHub Actions

Cuando el workflow de CI no logra desplegar (errores de AWS, timeout, etc.), puedes lanzar el mismo despliegue desde tu máquina con el script.

**Requisitos:** AWS CLI configurado (`aws configure` o `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) y Docker.

**Dev (infra ya existe en AWS):**

```bash
./scripts/deploy-local.sh dev
```

Hace: lee ECR y App Runner del estado de Terraform (local o S3), construye la imagen `linux/amd64`, la sube a ECR, dispara el deployment en App Runner, espera y ejecuta los tests de humo.

**Dev (crear infra + desplegar):**

```bash
./scripts/deploy-local.sh dev apply
```

**Prod:**

```bash
./scripts/deploy-local.sh prod
# o, si hace falta aplicar Terraform:
./scripts/deploy-local.sh prod apply
```

Opcional: `export AWS_REGION=us-east-1` si usas otra región. El script usa el estado en `infra/terraform/environments/<env>/`; si en CI usas S3, en local necesitas el mismo backend (crear `backend.hcl` con el bucket de estado) o usar el estado local si solo quieres probar el deploy de la imagen.
