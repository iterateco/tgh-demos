import * as Phaser from 'phaser';
export class Main extends Phaser.Scene {
  constructor() {
    super('main');
  }

  create() {
    const sceneKeys = Object.keys(this.scene.manager.keys).slice(1);

    // Navigate from url
    const searchParams = new URLSearchParams(location.search);
    const sceneKey = searchParams.get('scene');

    if (sceneKey && sceneKeys.includes(sceneKey)) {
      this.scene.switch(sceneKey);
      return;
    }


    // Menu options
    sceneKeys.forEach((sceneKey, index) => {
      const menuItem = this.add.text(50, 50 + index * 40, sceneKey, {
        fontSize: '20px',
        color: '#eee',
      });

      // Pointer events
      menuItem.setInteractive();

      menuItem.on('pointerover', () => {
        menuItem.setStyle({ fill: '#fff' });
      });

      menuItem.on('pointerout', () => {
        menuItem.setStyle({ fill: '#ccc' });
      });

      menuItem.on('pointerup', () => {
        location.href = `?scene=${sceneKey}`;
      });
    });
  }
}
