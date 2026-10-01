output "private_app_subnet_ids" {
  description = "Private application subnet IDs keyed by Availability Zone."
  value       = module.network.private_app_subnet_ids
}

output "private_db_subnet_ids" {
  description = "Private database subnet IDs keyed by Availability Zone."
  value       = module.network.private_db_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs keyed by Availability Zone."
  value       = module.network.public_subnet_ids
}

output "vpc_id" {
  description = "ID of the VPC."
  value       = module.network.vpc_id
}
