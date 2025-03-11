import { App,
  Plugin,
  PluginSettingTab,
  Setting } from "obsidian";

// Remember to rename these classes and interfaces

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default"
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload(): Promise<void> {
    console.log("loading plugin");
    await this.loadSettings();
    this.addSettingTab(new SampleSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    new Setting(containerEl);
  }
}
