output "ecr_repository_url" {
  value       = module.ecr.repository_url
  description = "ECR repository URL for pushing images"
}

output "app_runner_service_url" {
  value       = module.app_runner.service_url
  description = "App Runner service URL"
}

output "app_runner_service_id" {
  value       = module.app_runner.service_id
  description = "App Runner service ID"
}
