import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface UpdateProfileDto {
  name: string;
  image?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return user;
  }
}
