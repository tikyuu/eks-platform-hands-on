resource "aws_subnet" "public" {
  for_each = var.public_subnets

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value.cidr_block

  tags = {
    Name = each.value.name
  }
}

resource "aws_subnet" "private_app" {
  for_each = var.private_app_subnets

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value.cidr_block

  tags = {
    Name = each.value.name
  }
}

resource "aws_subnet" "private_db" {
  for_each = var.private_db_subnets

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value.cidr_block

  tags = {
    Name = each.value.name
  }
}
