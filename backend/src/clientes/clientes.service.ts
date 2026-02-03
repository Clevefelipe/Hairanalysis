import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { CreateClienteDto } from "./dto/create-cliente.dto";

@Injectable()
export class ClientesService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        nome: dto.nome,
      },
    });
  }

  async findAll() {
    return this.prisma.cliente.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.cliente.findUnique({
      where: { id },
    });
  }
}
