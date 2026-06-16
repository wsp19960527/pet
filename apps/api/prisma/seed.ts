import { AnimalStatus, BADGE_DEFINITIONS } from '@pet/shared';
import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = [
  {
    code: 'beijing',
    name: '北京',
    centerLng: 116.4074,
    centerLat: 39.9042,
    zoom: 12,
    sortOrder: 1,
  },
  {
    code: 'shanghai',
    name: '上海',
    centerLng: 121.4737,
    centerLat: 31.2304,
    zoom: 12,
    sortOrder: 2,
  },
  {
    code: 'guangzhou',
    name: '广州',
    centerLng: 113.2644,
    centerLat: 23.1291,
    zoom: 12,
    sortOrder: 3,
  },
  {
    code: 'shenzhen',
    name: '深圳',
    centerLng: 114.0579,
    centerLat: 22.5431,
    zoom: 12,
    sortOrder: 4,
  },
  {
    code: 'hangzhou',
    name: '杭州',
    centerLng: 120.1551,
    centerLat: 30.2741,
    zoom: 12,
    sortOrder: 5,
  },
] as const;

async function main() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
    });
  }

  const passwordHash = await bcrypt.hash('admin123456', 12);

  await prisma.adminUser.upsert({
    where: { email: 'admin@pet.local' },
    update: {},
    create: {
      email: 'admin@pet.local',
      passwordHash,
      name: '超级管理员',
      role: 'super_admin',
      scopes: {},
    },
  });

  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { code: city.code },
      update: {
        name: city.name,
        centerLng: city.centerLng,
        centerLat: city.centerLat,
        zoom: city.zoom,
        sortOrder: city.sortOrder,
      },
      create: { ...city, enabled: true },
    });
  }

  const demoUser = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: { cityCode: 'beijing' },
    create: {
      phone: '13800000001',
      nickname: '演示用户',
      cityCode: 'beijing',
    },
  });

  const sampleAnimals = [
    {
      species: 'cat' as const,
      status: AnimalStatus.DISCOVERED,
      longitude: 116.3974,
      latitude: 39.9142,
      addressText: '东城区某胡同',
      description: '橘猫，亲人，疑似走失',
    },
    {
      species: 'cat' as const,
      status: AnimalStatus.CONTACTING,
      longitude: 116.4174,
      latitude: 39.8942,
      addressText: '朝阳区公园附近',
      description: '三花猫，较警惕',
    },
    {
      species: 'dog' as const,
      status: AnimalStatus.RESCUED,
      longitude: 116.3874,
      latitude: 39.9242,
      addressText: '西城区社区',
      description: '小型田园犬，已联系救助',
    },
    {
      species: 'dog' as const,
      status: AnimalStatus.FOSTERING,
      longitude: 116.4274,
      latitude: 39.9042,
      addressText: '海淀区救助站附近',
      description: '等待领养',
    },
    {
      species: 'cat' as const,
      status: AnimalStatus.ADOPTED,
      longitude: 116.4074,
      latitude: 39.8842,
      addressText: '丰台区',
      description: '已成功领养',
    },
  ];

  for (const animal of sampleAnimals) {
    const existing = await prisma.animal.findFirst({
      where: {
        creatorId: demoUser.id,
        addressText: animal.addressText,
      },
    });

    if (!existing) {
      await prisma.animal.create({
        data: {
          creatorId: demoUser.id,
          cityCode: 'beijing',
          species: animal.species,
          status: animal.status,
          longitude: animal.longitude,
          latitude: animal.latitude,
          addressText: animal.addressText,
          description: animal.description,
          tags: { health: 'unknown' },
          moderationStatus: 'approved',
        },
      });
    }
  }

  const seededAnimals = await prisma.animal.findMany({
    where: { creatorId: demoUser.id },
    select: { id: true, status: true, creatorId: true },
  });

  for (const animal of seededAnimals) {
    const logCount = await prisma.animalStatusLog.count({
      where: { animalId: animal.id },
    });
    if (logCount === 0) {
      await prisma.animalStatusLog.create({
        data: {
          animalId: animal.id,
          fromStatus: null,
          toStatus: animal.status,
          operatorId: animal.creatorId,
          note: '种子数据初始状态',
        },
      });
    }
  }

  const fosteringAnimal = seededAnimals.find(
    (a) => a.status === AnimalStatus.FOSTERING,
  );
  if (fosteringAnimal) {
    const existingProject = await prisma.crowdfundingProject.findFirst({
      where: { animalId: fosteringAnimal.id },
    });
    if (!existingProject) {
      await prisma.crowdfundingProject.create({
        data: {
          animalId: fosteringAnimal.id,
          creatorId: demoUser.id,
          title: '为小田园犬筹集绝育与疫苗费用',
          description: '救助站待领养，需完成绝育与疫苗后开放领养',
          goalAmountCents: 150000,
          usageDetail: [
            { label: '绝育手术', amountCents: 80000 },
            { label: '疫苗与驱虫', amountCents: 40000 },
            { label: '术后护理', amountCents: 30000 },
          ],
          status: 'active',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const careCount = await prisma.careUpdate.count({
      where: { animalId: fosteringAnimal.id },
    });
    if (careCount === 0) {
      await prisma.careUpdate.create({
        data: {
          animalId: fosteringAnimal.id,
          authorId: demoUser.id,
          content: '今天状态很好，吃了两罐湿粮，精神不错～',
          mediaUrls: [],
        },
      });
    }
  }

  const platformWallet = await prisma.wallet.findFirst({
    where: { ownerType: 'platform', ownerId: 'main' },
  });
  if (!platformWallet) {
    await prisma.wallet.create({
      data: { ownerType: 'platform', ownerId: 'main' },
    });
  }

  console.log('Seeded admin: admin@pet.local / admin123456');
  console.log(`Seeded ${CITIES.length} cities and sample animals in Beijing`);

  const samplePois = [
    {
      type: 'station' as const,
      name: '东城区流浪动物救助站',
      description: '提供临时收容与领养咨询',
      latitude: 39.9282,
      longitude: 116.4164,
      addressText: '东城区',
    },
    {
      type: 'volunteer' as const,
      name: '朝阳公园志愿喂猫点',
      description: '志愿者每日投喂',
      latitude: 39.9342,
      longitude: 116.4784,
      addressText: '朝阳区朝阳公园',
    },
    {
      type: 'hotspot' as const,
      name: '西单商圈流浪猫聚集点',
      description: '高频出现区域，请文明投喂',
      latitude: 39.9132,
      longitude: 116.3744,
      addressText: '西城区西单',
    },
  ];

  for (const poi of samplePois) {
    const existing = await prisma.mapPoi.findFirst({
      where: { name: poi.name, cityCode: 'beijing' },
    });
    if (!existing) {
      await prisma.mapPoi.create({
        data: { ...poi, cityCode: 'beijing', enabled: true },
      });
    }
  }

  let org = await prisma.organization.findFirst({
    where: { name: '北京爱心流浪动物救助协会' },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        creatorId: demoUser.id,
        cityCode: 'beijing',
        name: '北京爱心流浪动物救助协会',
        description: '专注城市流浪猫狗救助、绝育与领养推广',
        status: 'approved',
        members: {
          create: { userId: demoUser.id, role: 'owner' },
        },
      },
    });
  }

  const existingEvent = await prisma.event.findFirst({
    where: { title: '周末流浪动物领养日活动' },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        organizationId: org.id,
        cityCode: 'beijing',
        title: '周末流浪动物领养日活动',
        description: '欢迎领养代替购买，现场有兽医咨询',
        latitude: 39.9042,
        longitude: 116.4074,
        addressText: '朝阳区某宠物公园',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        capacity: 100,
        status: 'published',
      },
    });
  }

  console.log('Seeded POIs, organization and sample event');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
