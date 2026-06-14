import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { customAlphabet } from 'nanoid';
import { CreateInvitationDto, JoinHouseholdDto, RevokeInvitationDto } from './dto/invitation.dto';

// Use a readable alphabet for tokens (no confusing chars like 0/O, 1/l)
const generateToken = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async createInvitation(dto: CreateInvitationDto, userId: string) {
    // Verify user is a member of the household
    const membership = await this.prisma.household.findFirst({
      where: {
        id: dto.householdId,
        users: {
          some: {
            id: userId
          }
        }
      }
    });

    if (!membership) {
      throw new NotFoundException('Household not found');
    }

    const token = generateToken();
    const expiresInMinutes = 10080; // 7 days (matching appConfig.invitation.expiresInMinutes)
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        token,
        householdId: dto.householdId,
        creatorId: userId,
        expiresAt,
      }
    });

    return { token: invitation.token, expiresAt: invitation.expiresAt };
  }

  async joinHousehold(dto: JoinHouseholdDto, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
      include: { household: true }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (invitation.status !== 'ACTIVE') {
      throw new BadRequestException('This invitation is no longer active');
    }

    if (new Date() > invitation.expiresAt) {
      // Lazily mark as expired if we catch it here
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      throw new BadRequestException('This invitation has expired');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.household.findFirst({
      where: {
        id: invitation.householdId,
        users: {
          some: {
            id: userId
          }
        }
      }
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this household');
    }

    // Transaction: Add user to household AND mark invitation as completed
    await this.prisma.$transaction([
      this.prisma.household.update({
        where: { id: invitation.householdId },
        data: {
          users: {
            connect: { id: userId }
          }
        }
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'COMPLETED' }
      })
    ]);

    return { householdName: invitation.household.name };
  }

  async revokeInvitation(dto: RevokeInvitationDto, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: dto.invitationId },
      include: { household: { include: { users: true } } }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is authorized to revoke (must be member of household)
    const isMember = invitation.household.users.some(u => u.id === userId);
    if (!isMember) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.prisma.invitation.update({
      where: { id: dto.invitationId },
      data: { status: 'REVOKED' }
    });

    return { success: true };
  }

  async getInvitationDetails(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        household: {
          include: {
            owner: { select: { name: true, email: true } }
          }
        },
        creator: { select: { name: true } }
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }
    
    if (invitation.status !== 'ACTIVE') {
      throw new BadRequestException('Invitation is not active');
    }
    
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      householdName: invitation.household.name,
      ownerName: invitation.household.owner?.name || 'Unknown',
      creatorName: invitation.creator.name || 'Unknown'
    };
  }
}
