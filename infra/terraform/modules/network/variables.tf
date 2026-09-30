variable "vpc" {
  description = "VPC settings."

  type = object({
    name       = string
    cidr_block = string
  })
}

variable "public_subnets" {
  description = "Public subnet settings keyed by Availability Zone."

  type = map(object({
    name       = string
    cidr_block = string
  }))
}

variable "private_app_subnets" {
  description = "Private application subnet settings keyed by Availability Zone."

  type = map(object({
    name       = string
    cidr_block = string
  }))
}

variable "private_db_subnets" {
  description = "Private database subnet settings keyed by Availability Zone."

  type = map(object({
    name       = string
    cidr_block = string
  }))
}
