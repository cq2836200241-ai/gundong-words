import { uIOhook, UiohookKey } from 'uiohook-napi';
import { clipboard, Notification } from 'electron';
import { exec } from 'child_process';
import { WordBookPlaybackService } from '../services/wordBookPlayback';

export class GlobalHotkey {
  private wPressed: boolean = false;
  private wTimer: NodeJS.Timeout | null = null;
  private playbackService: WordBookPlaybackService;

  constructor(playbackService: WordBookPlaybackService) {
    this.playbackService = playbackService;
  }

  start() {
    uIOhook.on('keydown', (e) => {
      if (e.keycode === UiohookKey.W) {
        this.wPressed = true;
        if (this.wTimer) clearTimeout(this.wTimer);
        this.wTimer = setTimeout(() => { this.wPressed = false; }, 300);
      }
      
      if (e.keycode === UiohookKey.Space && this.wPressed) {
        this.wPressed = false;
        this.captureSelectedWord();
      }
    });

    uIOhook.on('keyup', (e) => {
      if (e.keycode === UiohookKey.W) this.wPressed = false;
    });

    uIOhook.start();
  }

  private async captureSelectedWord() {
    const oldText = clipboard.readText();
    
    // Use PowerShell to simulate Ctrl+C
    const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^c')`;
    exec(`powershell -command "${script}"`);
    
    setTimeout(async () => {
      const newText = clipboard.readText().trim();
      clipboard.writeText(oldText);
      
      if (/^[a-zA-Z\s\-]{1,45}$/.test(newText)) {
        await this.onWordCaptured(newText);
      }
    }, 200);
  }

  private async onWordCaptured(wordText: string) {
    const word = await this.playbackService.addWordToActiveBook(wordText);
    if (word) {
      new Notification({
        title: '单词已添加',
        body: `"${wordText}" 已被录入当前词库`
      }).show();
    }
  }
}
