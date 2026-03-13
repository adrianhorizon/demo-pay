variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "ecr_repository_name" {
  type        = string
  description = "ECR repository name"
  default     = "payments-api"
}

variable "app_runner_service_name" {
  type        = string
  description = "App Runner service name"
  default     = "payments-api-dev"
}

variable "image_tag" {
  type        = string
  description = "Docker image tag to deploy"
  default     = "latest"
}

variable "runtime_environment_variables" {
  type        = map(string)
  description = "Environment variables for the API container"
  default = {
    NODE_ENV = "development"
  }
}

variable "runtime_environment_secrets" {
  type        = map(string)
  description = "Secrets Manager ARNs for env vars (key = env name, value = secret ARN)"
  default     = {}
  sensitive   = true
}

variable "app_runner_cpu" {
  type        = string
  default     = "1024"
  description = "App Runner CPU units"
}

variable "app_runner_memory" {
  type        = string
  default     = "2048"
  description = "App Runner memory in MB"
}

variable "auto_deployments_enabled" {
  type        = bool
  default     = true
  description = "Auto deploy when new image is pushed to ECR"
}
