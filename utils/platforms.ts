import { PlatformName, TargetPlatform } from '../types';

const PLATFORM_ALIASES: Record<string, TargetPlatform> = {
  Telegram: TargetPlatform.TELEGRAM,
  [TargetPlatform.TELEGRAM]: TargetPlatform.TELEGRAM,
  YouTube: TargetPlatform.YOUTUBE,
  [TargetPlatform.YOUTUBE]: TargetPlatform.YOUTUBE,
  VK: TargetPlatform.VK_POST,
  'VK (Пост)': TargetPlatform.VK_POST,
  [TargetPlatform.VK_POST]: TargetPlatform.VK_POST,
  Instagram: TargetPlatform.INSTAGRAM,
  [TargetPlatform.INSTAGRAM]: TargetPlatform.INSTAGRAM,
  Threads: TargetPlatform.THREADS,
  [TargetPlatform.THREADS]: TargetPlatform.THREADS
};

export const normalizePlatformName = (platform: string): PlatformName => {
  return PLATFORM_ALIASES[platform] ?? platform;
};
