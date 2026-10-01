resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = var.private_app_route_table_name
  }
}
