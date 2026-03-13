# Infraestructura

Código de infraestructura del proyecto Payments API.

| Carpeta | Contenido |
|---------|-----------|
| **terraform/** | IaC con Terraform: **backend** (S3 para estado remoto), módulos (ECR, App Runner), ambientes **dev** y **prod** para AWS App Runner. |

Ver **[terraform/README.md](terraform/README.md)** para uso, estado remoto, variables de entorno y despliegue.  
Crear bucket de estado (una vez): **[terraform/backend/README.md](terraform/backend/README.md)**.
