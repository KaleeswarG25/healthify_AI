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

  # Optional: Configure AWS credentials
  # access_key = var.aws_access_key_id
  # secret_key = var.aws_secret_access_key

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variable for AWS region (should be added to variables.tf)
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Optional variables for AWS credentials
variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  default     = ""
  sensitive   = true
}