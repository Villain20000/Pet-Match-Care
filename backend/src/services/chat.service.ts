import { PrismaClient } from '@prisma/client';
import { HttpError } from '@/middlewares/error';

const prisma = new PrismaClient();

export const chatService = {
  async listUserRooms(userId: string) {
    return prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async createOrGetRoom(userId: string, targetUserId: string, topic?: string) {
    if (userId === targetUserId) {
      throw new HttpError(400, 'INVALID_INPUT');
    }

    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    });

    if (existingRoom) {
      return existingRoom;
    }

    return prisma.chatRoom.create({
      data: {
        topic: topic || 'Direct Message',
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    });
  },

  async getMessages(userId: string, roomId: string) {
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!isParticipant) throw new HttpError(403, 'FORBIDDEN');

    return prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async sendMessage(userId: string, roomId: string, text: string) {
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!isParticipant) throw new HttpError(403, 'FORBIDDEN');

    const msg = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: userId,
        text,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return msg;
  },
};
