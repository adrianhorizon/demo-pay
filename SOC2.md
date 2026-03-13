# SOC 2 Alignment: Payments API Infrastructure

Este documento describe cómo la infraestructura de la API de pagos da soporte a principios alineados con SOC 2: **control de acceso**, **seguridad de datos**, **auditoría** y **respuesta a incidentes**. La implementación usa **AWS App Runner**, **ECR** e **infraestructura como código (Terraform)** en `infra/`; ver [infra/README.md](infra/README.md) e [infra/terraform/README.md](infra/terraform/README.md).

---

## 1. Control de acceso (IAM)

**Principio:** Solo identidades autorizadas acceden a sistemas y datos; acceso con mínimo privilegio y revisable.

**Soporte en la infra:**

- **App Runner**: Dos roles IAM definidos en Terraform (`infra/terraform/modules/app-runner/`):
  - **Access role**: permite a App Runner extraer imágenes de ECR (servicio `build.apprunner.amazonaws.com`). Política gestionada `AWSAppRunnerServicePolicyForECRAccess`.
  - **Instance role**: rol del contenedor en ejecución (`tasks.apprunner.amazonaws.com`); en producción puede limitarse a los permisos que la API necesite (p. ej. leer secretos en Secrets Manager/SSM).
- **CI/CD**: GitHub Actions usa credenciales acotadas al repo; en producción, OIDC o credenciales de corta duración y permisos mínimos para build y deploy.
- **Secrets**: Las variables sensibles no van en código; en Terraform se usan `runtime_environment_secrets` (ARN de Secrets Manager/SSM) para inyectar secretos en el contenedor. Solo el servicio App Runner recibe esas variables.

**Aplicación:** La API no implementa autenticación de usuario en este proyecto; en producción se añadiría autenticación (API keys, OAuth) y autorización (scope por vendor/rol), con identidades gestionadas en un IdP y mapeadas a IAM.

---

## 2. Seguridad de datos (cifrado, TLS, secretos)

**Principio:** Los datos se protegen en tránsito y en reposo; los secretos no se almacenan en claro en código ni en config.

**Soporte en la infra:**

- **Secretos**: En Terraform no se commitean valores sensibles. Por ambiente se usan `runtime_environment_variables` (config no sensible) y `runtime_environment_secrets` (ARN de Secrets Manager o SSM). App Runner resuelve los secretos en tiempo de ejecución; el instance role debe tener permisos IAM para acceder a esos recursos.
- **Cifrado en tránsito**: App Runner termina TLS en el servicio; el tráfico hacia el usuario es HTTPS. En producción, validar que no se expongan endpoints sin TLS.
- **Cifrado en reposo**: ECR y recursos gestionados por AWS usan cifrado por defecto. No hay volúmenes persistentes en la API actual; si se añaden, usar almacenamiento cifrado.

**Aplicación:** Config y secretos vienen del entorno (variables y secretos inyectados por App Runner). En logs se evita registrar PII o txhash completo cuando la política lo exija.

---

## 3. Auditoría (logging)

**Principio:** Los eventos relevantes para seguridad se registran y se retienen para detección y auditoría.

**Soporte en la infra:**

- **Logs de aplicación**: Salida estructurada (p. ej. JSON) a stdout en arranque; extensible a request ID y resultado de transfer. En producción: enviar stdout a un sistema centralizado (CloudWatch, Datadog, etc.) con retención y control de acceso.
- **Verificación de txhash**: El resultado se refleja en métricas Prometheus (`/metrics`): `payments_txhash_confirmations_total`, `payments_transfer_requests_total` por vendor y estado. Opcionalmente extender logs para cada verificación con request ID y resultado.
- **Cambios de infraestructura**: Todo el cambio de infra se hace vía Terraform y CI/CD; el historial de Git es la traza de qué cambió y cuándo. En producción, habilitar CloudTrail (y/o audit logs del servicio) para las llamadas que modifican recursos.
- **Acceso a sistemas**: CloudTrail e IAM permiten auditar quién desplegó o modificó recursos; los workflows de GitHub quedan registrados en el repo.

**Aplicación:** Añadir middleware o interceptores que registren cada `POST /transfer` con correlation ID, vendor, estado de txhash y código HTTP para que cada intento sea trazable.

---

## 4. Respuesta a incidentes

**Principio:** La organización puede detectar, responder y recuperarse de incidentes de seguridad y disponibilidad.

**Soporte en la infra:**

- **Salud del servicio**: La API expone `/health`; App Runner lo usa en el health check configurado en Terraform. Los fallos de salud permiten detectar problemas y que App Runner gestione la recuperación.
- **Observabilidad**: Métricas (latencia, tasa de error, confirmaciones de txhash) y logs permiten detectar anomalías y que el on-call trace requests (vendors, blockchain).
- **Despliegue y rollback**: CI/CD despliega una imagen versionada; el rollback es volver a desplegar una imagen anterior o revertir estado de Terraform. Usar tags de imagen y de Git para que el rollback sea auditable.
- **Documentación**: Este documento y [ARCHITECTURE.md](ARCHITECTURE.md) describen el sistema para que respuesta a incidentes entienda componentes, flujo de datos y dónde consultar logs y métricas. Uso rápido: [MANUAL.md](MANUAL.md).

**Aplicación:** Registrar en logs y métricas los errores y timeouts de blockchain y vendors para poder diagnosticar sin rediseñar el sistema.

---

## Resumen

| Área SOC 2        | Cómo lo soporta esta infra                                              |
|-------------------|-------------------------------------------------------------------------|
| Control de acceso | IAM (access + instance role) en App Runner, CI/CD con permisos acotados, secretos solo vía ARN en Terraform |
| Seguridad de datos| Secretos en Secrets Manager/SSM; TLS con App Runner; sin secretos en código |
| Auditoría         | Métricas y logs para txhash y transfers; Git + Terraform para cambios de infra; CloudTrail en producción |
| Respuesta a incidentes | Health check, métricas, logs, rollback vía deploy, documentación (ARCHITECTURE, SOC2, MANUAL) |

En producción conviene añadir: revisión formal de IAM, TLS en todos los puntos de entrada, backend de secretos dedicado, logging centralizado con retención y alertas/runbooks de on-call que referencien este diseño.
