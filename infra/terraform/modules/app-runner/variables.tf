variable "service_name" {
  type        = string
  description = "Name of the App Runner service"
}

variable "environment" {
  type        = string
  description = "Environment name (dev, prod)"
}

variable "ecr_repository_url" {
  type        = string
  description = "ECR repository URL (without tag)"
}

variable "image_tag" {
  type        = string
  default     = "latest"
  description = "Image tag to deploy"
}

variable "container_port" {
  type        = number
  default     = 8080
  description = "Port the container listens on"
}

variable "runtime_environment_variables" {
  type        = map(string)
  default     = {}
  description = "Environment variables for the container (non-sensitive)"
}

variable "runtime_environment_secrets" {
  type        = map(string)
  default     = {}
  description = "ARNs of Secrets Manager secrets for env vars (sensitive)"
}

variable "cpu" {
  type        = string
  default     = "1024"
  description = "CPU units (256, 512, 1024, 2048, 4096)"
}

variable "memory" {
  type        = string
  default     = "2048"
  description = "Memory in MB (512, 1024, 2048, 3072, 4096)"
}

variable "auto_deployments_enabled" {
  type        = bool
  default     = false
  description = "Auto deploy on ECR image push"
}

variable "health_check_path" {
  type        = string
  default     = "/health"
  description = "Health check path"
}

variable "health_check_interval" {
  type        = number
  default     = 10
  description = "Health check interval in seconds"
}

variable "health_check_timeout" {
  type        = number
  default     = 5
  description = "Health check timeout in seconds"
}

variable "health_check_healthy_threshold" {
  type        = number
  default     = 1
  description = "Healthy threshold count"
}

variable "health_check_unhealthy_threshold" {
  type        = number
  default     = 5
  description = "Unhealthy threshold count"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags for resources"
}
