# Terraform – Payments API (App Runner)

Parte de **infra/** del repo. IaC con **módulos** y dos **ambientes** (dev / prod). Despliegue en **AWS App Runner** con imágenes en **ECR**.

## Estructura

```
infra/terraform/
├── backend/                  # Estado remoto: S3 (ejecutar una vez)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars.example
│   └── README.md
├── modules/
│   ├── ecr/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── app-runner/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   ├── backend.tf            # local por defecto; para S3: usar backend.tf.s3.example
│   │   ├── backend.tf.s3.example
│   │   ├── backend.hcl.example
│   │   └── outputs.tf
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       ├── backend.tf
│       ├── backend.tf.s3.example
│       ├── backend.hcl.example
│       └── outputs.tf
└── README.md
```

## Variables de entorno en App Runner

Cada ambiente define variables de entorno para el contenedor en `terraform.tfvars`:

- **runtime_environment_variables**: mapa clave-valor (ej. `NODE_ENV`, config no sensible).
- **runtime_environment_secrets**: mapa nombre de variable → ARN de secreto (Secrets Manager o SSM). Opcional.

La API usa `ConfigModule` (NestJS) y lee `NODE_ENV`, `PORT`, etc. desde el entorno.

## Pruebas Terraform

Validación de sintaxis y módulos en ambos ambientes (sin necesidad de credenciales AWS):

```bash
# Desde la raíz del repo
./scripts/terraform-validate.sh
```

Ejecuta `terraform init -backend=false` y `terraform validate` en `environments/dev` y `environments/prod`. El pipeline de CI ejecuta este script en cada push/PR.

## Uso

Desde la **raíz del repo** o desde `infra/terraform/`:

### Dev

```bash
cd infra/terraform/environments/dev
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Prod

```bash
cd infra/terraform/environments/prod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Estado: local o S3

Cada entorno tiene un `backend.tf` que por defecto usa **local** (`path = "terraform.tfstate"`). Así puedes trabajar sin configurar nada.

**Para usar S3** (estado remoto):

1. Crear el bucket una vez con [backend/](backend/README.md).
2. En el entorno (dev o prod): copiar `backend.tf.s3.example` sobre `backend.tf`, crear `backend.hcl` desde `backend.hcl.example` (poner el nombre del bucket) y ejecutar:
   ```bash
   terraform init -reconfigure -backend-config=backend.hcl
   terraform apply -var-file=terraform.tfvars
   ```

**Para volver a local:** restaurar en `backend.tf` el contenido con `backend "local"` (como en el repo) y ejecutar `terraform init -reconfigure`.

Detalle del paso 1 (bucket): [backend/README.md](backend/README.md). `backend.hcl` está en `.gitignore`.

**CI (GitHub Actions):** Para que el deploy en CI use S3 y el estado persista entre runs, configura en el *environment* (dev/prod) las variables: `TF_STATE_BUCKET`, `TF_STATE_KEY` (ej. `payments-api/dev/terraform.tfstate`), `TF_STATE_REGION`. Si no están definidas, el workflow usa backend local (estado solo en ese run).

## Desplegar una nueva imagen

1. Tras `terraform apply`, usa el output `ecr_repository_url` (ej. `123456789.dkr.ecr.us-east-1.amazonaws.com/payments-api-dev`).
2. Build y push (desde la **raíz del repo**):
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr_repository_url_sin_tag>
   docker build -t <ecr_repository_url>:latest ./api
   docker push <ecr_repository_url>:latest
   ```
3. **Dev**: con `auto_deployments_enabled = true` en tfvars, App Runner despliega al detectar el nuevo tag. Opcional: `aws apprunner start-deployment --service-identifier <service_id>`.
4. **Prod**: `auto_deployments_enabled = false`; tras el push, ejecutar `aws apprunner start-deployment` o usar el workflow de CI (workflow_dispatch → prod).

## Outputs

Tras `terraform apply`:

- `ecr_repository_url`: URL del repositorio ECR para hacer push de la imagen.
- `app_runner_service_url`: URL pública del servicio App Runner.
- `app_runner_service_id`: ID del servicio (para CLI/API).

---

### Desplegar imagen desde local y probar

Desde la raíz del repo, con AWS y Docker configurados:

```bash
./scripts/deploy-local.sh dev apply
```

Aplica Terraform en dev (si hace falta), construye la imagen de la API, la sube al ECR, dispara el deploy en App Runner y ejecuta los tests de despliegue contra la URL del servicio. Sin `apply` solo hace build, push y tests (asume que ya aplicaste Terraform). Ver [MANUAL.md](../../MANUAL.md#desplegar-en-aws-desde-local-imagen-al-registry-y-app-runner).

---

Ver también: [README principal del repo](../../README.md) (API, CI/CD, vendors).
