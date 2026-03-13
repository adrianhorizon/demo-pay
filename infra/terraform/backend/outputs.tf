output "state_bucket_name" {
  value       = aws_s3_bucket.state.id
  description = "Name of the S3 bucket for Terraform state"
}

output "state_bucket_arn" {
  value       = aws_s3_bucket.state.arn
  description = "ARN of the state bucket"
}
