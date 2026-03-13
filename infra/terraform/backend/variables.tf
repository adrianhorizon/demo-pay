variable "aws_region" {
  type        = string
  description = "AWS region for the state bucket"
  default     = "us-east-1"
}

variable "state_bucket_name" {
  type        = string
  description = "Name of the S3 bucket for Terraform state (must be globally unique)"
}

variable "tags" {
  type        = map(string)
  description = "Tags for backend resources"
  default     = {}
}
