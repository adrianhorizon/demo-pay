terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "payments-api"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "ecr" {
  source = "../../modules/ecr"

  repository_name      = var.ecr_repository_name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false
  scan_on_push         = true
  lifecycle_policy     = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
  tags = local.tags
}

module "app_runner" {
  source = "../../modules/app-runner"

  service_name        = var.app_runner_service_name
  environment         = "prod"
  ecr_repository_url  = module.ecr.repository_url
  image_tag           = var.image_tag

  runtime_environment_variables = var.runtime_environment_variables
  runtime_environment_secrets   = var.runtime_environment_secrets

  cpu    = var.app_runner_cpu
  memory = var.app_runner_memory

  auto_deployments_enabled = var.auto_deployments_enabled

  tags = local.tags
}

locals {
  tags = {
    Environment = "prod"
  }
}
