# Backend Terraform (S3)

Crea el bucket S3 para guardar el **estado remoto** de los entornos dev y prod. Ejecutar **una vez** por cuenta/región.

## Uso

1. **Crear el bucket** (estado de este backend queda en local):

   ```bash
   cd infra/terraform/backend
   cp terraform.tfvars.example terraform.tfvars
   # Editar terraform.tfvars: state_bucket_name debe ser único globalmente (ej. mi-empresa-payments-api-tfstate)
   terraform init
   terraform apply -var-file=terraform.tfvars
   ```

2. **Anotar el nombre del bucket** (output `state_bucket_name`).

3. **Configurar dev y prod** para usar ese bucket:

   ```bash
   # Dev
   cd ../environments/dev
   cp backend.hcl.example backend.hcl
   # Editar backend.hcl: bucket = "<state_bucket_name del paso 1>"
   terraform init -backend-config=backend.hcl
   terraform apply -var-file=terraform.tfvars

   # Prod
   cd ../environments/prod
   cp backend.hcl.example backend.hcl
   # bucket = "<mismo state_bucket_name>"
   terraform init -backend-config=backend.hcl
   terraform apply -var-file=terraform.tfvars
   ```

- **backend.hcl** no se sube al repo (está en `.gitignore`); cada desarrollador/CI usa su propio archivo con el mismo bucket si comparten estado.
- El **state** de este proyecto `backend/` se deja en local (`terraform.tfstate` en `backend/`); también está en `.gitignore`.

## Recursos creados

- **S3**: versionado, cifrado AES256, bloqueo de acceso público.
