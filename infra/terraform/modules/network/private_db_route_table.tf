resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = var.private_db_route_table_name
  }
}
