import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokens, JwtPayload } from '@pet/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async issueTokens(
    subject: string,
    type: 'user' | 'admin',
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: subject, type, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        type,
        userId: type === 'user' ? subject : null,
        adminId: type === 'admin' ? subject : null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { tokenHash } });

    if (stored.type === 'user' && stored.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: stored.userId },
      });
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User not available');
      }
      return this.issueTokens(user.id, 'user', user.role);
    }

    if (stored.type === 'admin' && stored.adminId) {
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: stored.adminId },
      });
      if (!admin || admin.status !== 'active') {
        throw new UnauthorizedException('Admin not available');
      }
      return this.issueTokens(admin.id, 'admin', admin.role);
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
