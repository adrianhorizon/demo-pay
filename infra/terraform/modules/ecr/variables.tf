variable "repository_name" {
  type        = string
  description = "Name of the ECR repository"
}

variable "image_tag_mutability" {
  type        = string
  default     = "MUTABLE"
  description = "MUTABLE or IMMUTABLE"
}

variable "force_delete" {
  type        = bool
  default     = false
  description = "Allow deletion with images"
}

variable "scan_on_push" {
  type        = bool
  default     = true
  description = "Enable image scan on push"
}

variable "lifecycle_policy" {
  type        = string
  default     = null
  description = "JSON lifecycle policy for the repository"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags for the ECR repository"
}
