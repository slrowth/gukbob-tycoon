import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const STORAGE_KEY = '_sys_pref_v1';

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Load existing config
    try {
      const encoded = localStorage.getItem(STORAGE_KEY);
      if (encoded) {
        const jsonStr = atob(encoded);
        const config = JSON.parse(jsonStr);
        if (config.url) setUrl(config.url);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  const handleSave = () => {
    let cleanUrl = url.trim();

    if (!cleanUrl) {
      alert("URL을 입력해주세요.");
      return;
    }

    // Auto-fix URL protocol to prevent errors
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Save simple config
    const config = { url: cleanUrl };
    const jsonStr = JSON.stringify(config);
    const encoded = btoa(jsonStr); // Base64 Encode

    localStorage.setItem(STORAGE_KEY, encoded);
    
    // Cleanup old keys
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');

    alert("Google Sheet 연동이 저장되었습니다. 페이지를 새로고침합니다.");
    window.location.reload();
  };

  const handleClear = () => {
    if (confirm("저장된 설정을 삭제하시겠습니까?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('sb_url');
      localStorage.removeItem('sb_key');
      setUrl('');
      alert("삭제되었습니다. 페이지를 새로고침합니다.");
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border-4 border-gray-600 rounded-xl p-4 shadow-2xl relative animate-[fadeIn_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-600 pb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-500" />
            시스템 설정
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-800 p-3 rounded border border-gray-600 text-xs text-gray-300 leading-relaxed">
            <p className="mb-2 flex items-center gap-2 text-green-400 font-bold">
               <FileSpreadsheet size={14} /> 구글 스프레드시트 연동
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-400">
              <li>Google Apps Script로 배포된 <strong>웹 앱 URL</strong>을 입력하세요.</li>
              <li>배포 시 권한을 <strong>'모든 사용자(Everyone)'</strong>로 설정해야 합니다.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">Google Apps Script Web App URL</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full bg-black text-green-500 border-2 border-gray-700 rounded p-2 text-xs focus:border-green-500 outline-none font-mono break-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white py-3 rounded font-bold text-sm border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all flex justify-center items-center gap-2"
          >
            <Save size={16} />
            저장 및 리로드
          </button>
          
          <button 
            onClick={handleClear}
            className="px-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded border border-red-900"
            title="설정 초기화"
          >
            <Trash2 size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;