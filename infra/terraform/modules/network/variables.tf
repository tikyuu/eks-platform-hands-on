variable "vpc" {
  description = "VPC settings."

  type = object({
    name       = string
    cidr_block = string
  })
}

variable "internet_gateway_name" {
  description = "Name tag for the Internet Gateway."
  type        = string
}

variable "public_route_table_name" {
  description = "Name tag for the public route table."
  type        = string
}

variable "private_app_route_table_name" {
  description = "Name tag for the private application route table."
  type        = string
}

variable "private_db_route_table_name" {
  description = "Name tag for the private database route table."
  type        = string
}

variable "nat_gateway_name" {
  description = "Name tag for the NAT Gateway."
  type        = string
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
