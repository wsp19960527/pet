import type { BadgeDefinition } from './cloud-adoption.js';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    code: 'first_tip',
    name: '初次爱心',
    description: '完成第一笔打赏',
    icon: '💝',
  },
  {
    code: 'tip_master',
    name: '爱心达人',
    description: '累计打赏 10 笔',
    icon: '🌟',
  },
  {
    code: 'first_rescue',
    name: '救助先锋',
    description: '成功更新一次救助状态',
    icon: '🦸',
  },
  {
    code: 'cloud_parent',
    name: '云家长',
    description: '成为第一只动物的云家长',
    icon: '☁️',
  },
  {
    code: 'blessing_giver',
    name: '祝福使者',
    description: '送出第一条祝福',
    icon: '🎋',
  },
];

export type BadgeCode = (typeof BADGE_DEFINITIONS)[number]['code'];
