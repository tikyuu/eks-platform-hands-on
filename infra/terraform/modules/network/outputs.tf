output "private_app_subnet_ids" {
  description = "Private application subnet IDs keyed by Availability Zone."

  value = {
    for availability_zone, subnet in aws_subnet.private_app :
    availability_zone => subnet.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs keyed by Availability Zone."

  value = {
    for availability_zone, subnet in aws_subnet.public :
    availability_zone => subnet.id
  }
}

output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.this.id
}
