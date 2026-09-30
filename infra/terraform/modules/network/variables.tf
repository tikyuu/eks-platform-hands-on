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
