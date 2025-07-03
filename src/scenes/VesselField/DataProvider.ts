import Phaser from 'phaser';
import { EmotionalArchetype, Post } from '../../models';

export default class DataProvider {
  cache: Phaser.Cache.BaseCache;

  constructor(cache: Phaser.Cache.BaseCache) {
    this.cache = cache;

    for (const archetype of this.cache.get('emotional_archetypes')) {
      archetype.color = Phaser.Display.Color.HexStringToColor(archetype.color).color;
    }

    for (const post of this.cache.get('posts')) {
      for (const archetype of post.emotional_archetypes) {
        archetype.color = Phaser.Display.Color.HexStringToColor(archetype.color).color;
      }
    }
  }

  get emotionalArchetypes(): EmotionalArchetype[] {
    return this.cache.get('emotional_archetypes');
  }

  get posts(): Post[] {
    return this.cache.get('posts');
  }
}
