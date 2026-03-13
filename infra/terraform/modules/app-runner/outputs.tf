output "service_id" {
  value       = aws_apprunner_service.this.service_id
  description = "App Runner service ID"
}

output "service_arn" {
  value       = aws_apprunner_service.this.arn
  description = "App Runner service ARN"
}

output "service_url" {
  value       = aws_apprunner_service.this.service_url
  description = "App Runner service URL"
}

output "status" {
  value       = aws_apprunner_service.this.status
  description = "Service status"
}
