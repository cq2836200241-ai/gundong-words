import React, { useEffect, useState, useRef } from 'react';
import { AppSettings, DockPosition, ScrollDirection } from '@shared/types';
import gsap from 'gsap';
import './settings.css';

const SettingsApp: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [playingBookName, setPlayingBookName] = useState<string>('无');
  const [progress, setProgress] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

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

    const unProgress = window.electronAPI?.onPlaybackProgress?.((data) => {
      if (typeof data.progress === 'number') {
        setProgress(data.progress);
      }
    });

    return () => {
      if (cleanup) cleanup();
      if (unPlayback) unPlayback();
      if (unProgress) unProgress();
    };
  }, []);

  // GSAP Entrance Animation
  useEffect(() => {
    if (settings && containerRef.current) {
      const elements = containerRef.current.querySelectorAll('.settings-header, .settings-card');
      
      gsap.fromTo(elements, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", clearProps: "all" }
      );
    }
  }, [settings ? 'loaded' : 'loading']);

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
    <>
      {/* Titlebar Drag Area */}
      <div className="titlebar-drag-region">
        <div className="titlebar-title">设置</div>
      </div>

      <div className="settings-container" ref={containerRef}>
        {/* Quick Actions */}
        <section className="settings-section">
          <h2>快捷操作</h2>
          <div className="settings-card">
            <div className="setting-item" style={{ borderBottom: 'none', paddingBottom: '16px', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="setting-label">当前词库：</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-color)', fontSize: '15px' }}>{playingBookName}</span>
              </div>
              
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>已播放: {progress}%</span>
                <span>剩余: {100 - progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--accent-color)', transition: 'width 0.1s linear', borderRadius: '3px' }} />
              </div>
            </div>
            
            <div className="quick-actions" style={{ paddingBottom: '16px' }}>
              <button className="btn primary" onClick={() => window.electronAPI?.togglePlayback()}>
                暂停 / 恢复滚动
              </button>
              <button className="btn secondary" onClick={() => window.electronAPI?.openWordBookWindow()}>
                打开词库管理
              </button>
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section className="settings-section">
          <h2>外观与显示</h2>
          <div className="settings-card">
            
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
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.dock.alwaysOnTop ?? true} 
                    onChange={(e) => handleUpdate({ dock: { ...settings.dock, alwaysOnTop: e.target.checked } })}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">背景透明度</div>
              <div className="setting-control">
                <input 
                  type="range" 
                  min="0.0" max="1.0" step="0.05" 
                  value={settings.theme?.backgroundOpacity ?? 0.85} 
                  onChange={(e) => handleUpdate({ theme: { ...(settings.theme || { backgroundColor: '#000000', backgroundOpacity: 0.85 }), backgroundOpacity: parseFloat(e.target.value) } })}
                />
                <span className="value-display">{Math.round((settings.theme?.backgroundOpacity ?? 0.85) * 100)}%</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">背景颜色</div>
              <div className="setting-control">
                <div className="color-picker-wrapper">
                  <input 
                    type="color" 
                    value={settings.theme?.backgroundColor || '#000000'} 
                    onChange={(e) => handleUpdate({ theme: { ...(settings.theme || { backgroundColor: '#000000', backgroundOpacity: 0.85 }), backgroundColor: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">背景尺寸</div>
              <div className="setting-control">
                <input 
                  type="range" 
                  min="20" max="150" step="1" 
                  value={settings.dock.thickness[settings.dock.position]} 
                  onChange={(e) => handleUpdate({ dock: { ...settings.dock, thickness: { ...settings.dock.thickness, [settings.dock.position]: parseInt(e.target.value) } } })}
                />
                <span className="value-display">{settings.dock.thickness[settings.dock.position]}px</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">单词颜色</div>
              <div className="setting-control">
                <div className="color-picker-wrapper">
                  <input 
                    type="color" 
                    value={settings.theme?.wordColor || '#ffffff'} 
                    onChange={(e) => handleUpdate({ theme: { ...settings.theme, wordColor: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">解释颜色</div>
              <div className="setting-control">
                <div className="color-picker-wrapper">
                  <input 
                    type="color" 
                    value={settings.theme?.meaningColor || '#dddddd'} 
                    onChange={(e) => handleUpdate({ theme: { ...settings.theme, meaningColor: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">词组间距缩放</div>
              <div className="setting-control">
                <input 
                  type="range" 
                  min="0.5" max="3.0" step="0.1" 
                  value={settings.layout?.moduleSpacingScale || 1.0} 
                  onChange={(e) => handleUpdate({ layout: { ...(settings.layout || { moduleSpacingScale: 1.0, wordMeaningSpacingScale: 1.0 }), moduleSpacingScale: parseFloat(e.target.value) } })}
                />
                <span className="value-display">{settings.layout?.moduleSpacingScale || 1.0}x</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">单词翻译间距</div>
              <div className="setting-control">
                <input 
                  type="range" 
                  min="0.5" max="3.0" step="0.1" 
                  value={settings.layout?.wordMeaningSpacingScale || 1.0} 
                  onChange={(e) => handleUpdate({ layout: { ...(settings.layout || { moduleSpacingScale: 1.0, wordMeaningSpacingScale: 1.0 }), wordMeaningSpacingScale: parseFloat(e.target.value) } })}
                />
                <span className="value-display">{settings.layout?.wordMeaningSpacingScale || 1.0}x</span>
              </div>
            </div>

          </div>
        </section>

        {/* Scroll Settings */}
        <section className="settings-section">
          <h2>滚动设置</h2>
          <div className="settings-card">
            
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
              <div className="setting-label">滚动速度</div>
              <div className="setting-control">
                <input 
                  type="range" 
                  min="0.1" max="3.0" step="0.1" 
                  value={settings.scroll.speed} 
                  onChange={(e) => handleScrollChange('speed', parseFloat(e.target.value))}
                />
                <span className="value-display">{settings.scroll.speed.toFixed(1)}x</span>
              </div>
            </div>

          </div>
        </section>

        {/* AI Settings */}
        <section className="settings-section">
          <h2>AI 助手设置 (DeepSeek)</h2>
          <div className="settings-card">
            
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

          </div>
        </section>

      </div>
    </>
  );
};

export default SettingsApp;
