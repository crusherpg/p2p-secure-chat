import React, { useState } from 'react';
import SettingsModal from '../components/SettingsModal';

const Shell = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default Shell;
