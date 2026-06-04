import React, { useEffect, useState } from 'react';
import { AppSettings, DockPosition, ScrollDirection } from '@shared/types';
import './settings.css';

const SettingsApp: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [playingBookName, setPlayingBookName] = useState<string>('无');

  useEffect(() => {
    window.electronAPI?.getSettings().then(setSettings);
    
    window.electronAPI?.listWordBooks().then(books => {
      const active = books.find(b => b.isActive);
      if (active) setPlayingBookName(active.name);
    });

    const cleanup = window.electronAPI?.onSettingsUpdate((partial) => {
      setSettings(prev => prev ? { ...prev, ...partial } : null);
    });
    
    const unPlayback = window.electronAPI?.onPlaybackUpdate?.((data) => {
      if (data.bookName) setPlayingBookName(data.bookName);
    });

    return () => {
      if (cleanup) cleanup();
      if (unPlayback) unPlayback();
    };
  }, []);

  if (!settings) return <div className="settings-container loading">加载中...</div>;

  const handleUpdate = (partial: Partial<AppSettings>) => {
    setSettings(prev => prev ? { ...prev, ...partial } : null);
    window.electronAPI?.updateSettings(partial);
  };

  const handleDockChange = (position: DockPosition) => {
    handleUpdate({ dock: { ...settings.dock, position } });
  };

  const handleScrollChange = (key: 'direction' | 'speed', value: any) => {
    handleUpdate({ scroll: { ...settings.scroll, [key]: value } });
  };

  const handleDeepseekChange = (key: 'apiKey' | 'baseUrl' | 'model', value: string) => {
    handleUpdate({ deepseek: { ...settings.deepseek, [key]: value } });
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <h1>控制面板</h1>
      </header>
      
      <div className="settings-content">
        
        {/* Quick Actions */}
        <section className="settings-section">
          <h2>快捷操作</h2>
          
          <div className="setting-item" style={{ marginBottom: '15px' }}>
            <div className="setting-label">当前正在播放：</div>
            <div className="setting-control" style={{ fontWeight: 'bold', color: 'var(--primary-color, #4caf50)' }}>
              {playingBookName}
            </div>
          </div>
          
          <div className="quick-actions">
            <button className="btn primary" onClick={() => window.electronAPI?.togglePlayback()}>
              暂停 / 恢复滚动
            </button>
            <button className="btn secondary" onClick={() => window.electronAPI?.openWordBookWindow()}>
              打开词库管理
            </button>
          </div>
        </section>

        {/* Display Settings */}
        <section className="settings-section">
          <h2>外观与显示</h2>
          
          <div className="setting-item">
            <div className="setting-label">吸附位置</div>
            <div className="setting-control">
              <select value={settings.dock.position} onChange={(e) => handleDockChange(e.target.value as DockPosition)}>
                <option value="top">屏幕顶部</option>
                <option value="left">屏幕左侧</option>
                <option value="right">屏幕右侧</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">置顶显示</div>
            <div className="setting-control" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <input 
                type="checkbox" 
                checked={settings.dock.alwaysOnTop ?? true} 
                onChange={(e) => handleUpdate({ dock: { ...settings.dock, alwaysOnTop: e.target.checked } })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">背景颜色</div>
            <div className="setting-control">
              <input 
                type="color" 
                value={settings.theme?.backgroundColor || '#000000'} 
                onChange={(e) => handleUpdate({ theme: { ...(settings.theme || { backgroundColor: '#000000', backgroundOpacity: 0.85 }), backgroundColor: e.target.value } })}
                style={{ width: '50px', padding: '0', height: '30px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">背景透明度 ({Math.round((settings.theme?.backgroundOpacity ?? 0.85) * 100)}%)</div>
            <div className="setting-control">
              <input 
                type="range" 
                min="0.0" max="1.0" step="0.05" 
                value={settings.theme?.backgroundOpacity ?? 0.85} 
                onChange={(e) => handleUpdate({ theme: { ...(settings.theme || { backgroundColor: '#000000', backgroundOpacity: 0.85 }), backgroundOpacity: parseFloat(e.target.value) } })}
              />
            </div>
          </div>


          <div className="setting-item">
            <div className="setting-label">背景尺寸 ({settings.dock.thickness}px)</div>
            <div className="setting-control">
              <input 
                type="range" 
                min="20" max="150" step="1" 
                value={settings.dock.thickness} 
                onChange={(e) => handleUpdate({ dock: { ...settings.dock, thickness: parseInt(e.target.value) } })}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">单词颜色</div>
            <div className="setting-control">
              <input 
                type="color" 
                value={settings.theme?.wordColor || '#ffffff'} 
                onChange={(e) => handleUpdate({ theme: { ...settings.theme, wordColor: e.target.value } })}
                style={{ width: '50px', padding: '0', height: '30px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">解释颜色</div>
            <div className="setting-control">
              <input 
                type="color" 
                value={settings.theme?.meaningColor || '#dddddd'} 
                onChange={(e) => handleUpdate({ theme: { ...settings.theme, meaningColor: e.target.value } })}
                style={{ width: '50px', padding: '0', height: '30px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">词组间距缩放 ({settings.layout?.moduleSpacingScale || 1.0}x)</div>
            <div className="setting-control">
              <input 
                type="range" 
                min="0.5" max="3.0" step="0.1" 
                value={settings.layout?.moduleSpacingScale || 1.0} 
                onChange={(e) => handleUpdate({ layout: { ...(settings.layout || { moduleSpacingScale: 1.0, wordMeaningSpacingScale: 1.0 }), moduleSpacingScale: parseFloat(e.target.value) } })}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">单词翻译间距 ({settings.layout?.wordMeaningSpacingScale || 1.0}x)</div>
            <div className="setting-control">
              <input 
                type="range" 
                min="0.5" max="3.0" step="0.1" 
                value={settings.layout?.wordMeaningSpacingScale || 1.0} 
                onChange={(e) => handleUpdate({ layout: { ...(settings.layout || { moduleSpacingScale: 1.0, wordMeaningSpacingScale: 1.0 }), wordMeaningSpacingScale: parseFloat(e.target.value) } })}
              />
            </div>
          </div>
        </section>

        {/* Scroll Settings */}
        <section className="settings-section">
          <h2>滚动设置</h2>
          
          <div className="setting-item">
            <div className="setting-label">滚动方向</div>
            <div className="setting-control">
              <select value={settings.scroll.direction} onChange={(e) => handleScrollChange('direction', e.target.value as ScrollDirection)}>
                {settings.dock.position === 'top' ? (
                  <>
                    <option value="reverse">从左到右</option>
                    <option value="forward">从右到左</option>
                  </>
                ) : (
                  <>
                    <option value="reverse">从上到下</option>
                    <option value="forward">从下到上</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">滚动速度 ({settings.scroll.speed}x)</div>
            <div className="setting-control">
              <input 
                type="range" 
                min="0.1" max="3.0" step="0.1" 
                value={settings.scroll.speed} 
                onChange={(e) => handleScrollChange('speed', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section className="settings-section">
          <h2>AI 助手设置 (DeepSeek)</h2>
          
          <div className="setting-item">
            <div className="setting-label">API Key</div>
            <div className="setting-control">
              <input 
                type="password" 
                placeholder="sk-..." 
                value={settings.deepseek.apiKey} 
                onChange={(e) => handleDeepseekChange('apiKey', e.target.value)}
              />
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-label">Base URL</div>
            <div className="setting-control">
              <input 
                type="text" 
                value={settings.deepseek.baseUrl} 
                onChange={(e) => handleDeepseekChange('baseUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">模型 (Model)</div>
            <div className="setting-control">
              <input 
                type="text" 
                value={settings.deepseek.model} 
                onChange={(e) => handleDeepseekChange('model', e.target.value)}
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsApp;
