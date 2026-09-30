output "public_subnet_ids" {
  description = "Public subnet IDs keyed by Availability Zone."
  value       = module.network.public_subnet_ids
}

output "vpc_id" {
  description = "ID of the VPC."
  value       = module.network.vpc_id
}
