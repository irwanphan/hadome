import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardTitle 
} from '@progress/kendo-react-layout';
import { 
  Button, 
  ButtonGroup 
} from '@progress/kendo-react-buttons';
import { 
  Switch 
} from '@progress/kendo-react-inputs';
import { 
  DropDownList 
} from '@progress/kendo-react-dropdowns';
import { 
  Dialog, 
  DialogActionsBar 
} from '@progress/kendo-react-dialogs';
import { AppSettings } from '../../types';
import { StorageService } from '../../services/storageService';
import './SettingsPage.css';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [importData, setImportData] = useState<string>('');

  const currencyOptions = [
    { text: 'Indonesian Rupiah (IDR)', value: 'IDR' },
    { text: 'US Dollar (USD)', value: 'USD' },
    { text: 'Euro (EUR)', value: 'EUR' },
    { text: 'Singapore Dollar (SGD)', value: 'SGD' }
  ];

  const languageOptions = [
    { text: 'Indonesian + English', value: 'ind' },
    { text: 'English Only', value: 'eng' }
  ];

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
  };

  const handleSaveSettings = async () => {
    await onUpdateSettings(localSettings);
  };

  const handleResetSettings = () => {
    setLocalSettings(settings);
  };

  const handleExportData = async () => {
    try {
      const data = await StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-scanner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImportData = async () => {
    try {
      await StorageService.importData(importData);
      setShowImportDialog(false);
      setImportData('');
      window.location.reload(); // Reload to reflect imported data
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const handleClearAllData = async () => {
    try {
      await StorageService.clearAllData();
      setShowClearDialog(false);
      window.location.reload(); // Reload to reflect cleared data
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Configure your receipt scanner preferences</p>
      </div>

      <div className="settings-content">
        <Card className="general-settings-card">
          <CardBody>
            <CardTitle>General Settings</CardTitle>
            <div className="settings-form">
              <div className="setting-item">
                <label>Default Currency</label>
                <DropDownList
                  data={currencyOptions}
                  textField="text"
                  dataItemKey="value"
                  value={localSettings.defaultCurrency}
                  onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                />
              </div>

              <div className="setting-item">
                <label>OCR Language</label>
                <DropDownList
                  data={languageOptions}
                  textField="text"
                  dataItemKey="value"
                  value={localSettings.ocrLanguage}
                  onChange={(e) => handleSettingChange('ocrLanguage', e.target.value)}
                />
              </div>

              <div className="setting-item">
                <label>Auto-categorize receipts</label>
                <Switch
                  checked={localSettings.autoCategorize}
                  onChange={(e) => handleSettingChange('autoCategorize', e.target.value)}
                />
                <span className="setting-description">
                  Automatically categorize receipts based on merchant and items
                </span>
              </div>

              <div className="setting-item">
                <label>Save receipt images</label>
                <Switch
                  checked={localSettings.saveImages}
                  onChange={(e) => handleSettingChange('saveImages', e.target.value)}
                />
                <span className="setting-description">
                  Store receipt images with expense data (uses more storage)
                </span>
              </div>
            </div>

            <div className="settings-actions">
              <ButtonGroup>
                <Button onClick={handleSaveSettings} fillMode="solid">
                  Save Settings
                </Button>
                <Button onClick={handleResetSettings} fillMode="flat">
                  Reset
                </Button>
              </ButtonGroup>
            </div>
          </CardBody>
        </Card>

        <Card className="data-management-card">
          <CardBody>
            <CardTitle>Data Management</CardTitle>
            <div className="data-actions">
              <div className="data-action-item">
                <div className="action-info">
                  <h4>Export Data</h4>
                  <p>Download all your receipts and settings as a backup file</p>
                </div>
                <Button onClick={() => setShowExportDialog(true)}>
                  Export
                </Button>
              </div>

              <div className="data-action-item">
                <div className="action-info">
                  <h4>Import Data</h4>
                  <p>Restore receipts and settings from a backup file</p>
                </div>
                <Button onClick={() => setShowImportDialog(true)}>
                  Import
                </Button>
              </div>

              <div className="data-action-item">
                <div className="action-info">
                  <h4>Clear All Data</h4>
                  <p>Remove all receipts and reset settings (cannot be undone)</p>
                </div>
                <Button onClick={() => setShowClearDialog(true)} fillMode="flat">
                  Clear All
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="app-info-card">
          <CardBody>
            <CardTitle>About</CardTitle>
            <div className="app-info">
              <div className="info-item">
                <label>App Version</label>
                <span>1.0.0</span>
              </div>
              <div className="info-item">
                <label>Built with</label>
                <span>React + KendoReact</span>
              </div>
              <div className="info-item">
                <label>OCR Engine</label>
                <span>Tesseract.js</span>
              </div>
              <div className="info-item">
                <label>Storage</label>
                <span>Local Browser Storage</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <Dialog 
          title="Export Data" 
          onClose={() => setShowExportDialog(false)}
        >
          <p>This will download all your receipts and settings as a JSON file.</p>
          <DialogActionsBar>
            <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button fillMode="solid" onClick={handleExportData}>Export</Button>
          </DialogActionsBar>
        </Dialog>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <Dialog 
          title="Import Data" 
          onClose={() => setShowImportDialog(false)}
        >
          <div className="import-content">
            <p>Select a backup file to restore your data:</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="file-input"
            />
            {importData && (
              <div className="import-preview">
                <p>File loaded successfully. Click Import to restore data.</p>
              </div>
            )}
          </div>
          <DialogActionsBar>
            <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button 
              fillMode="solid"
              onClick={handleImportData}
              disabled={!importData}
            >
              Import
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}

      {/* Clear Data Dialog */}
      {showClearDialog && (
        <Dialog 
          title="Clear All Data" 
          onClose={() => setShowClearDialog(false)}
        >
          <p>Are you sure you want to delete all receipts and reset settings? This action cannot be undone.</p>
          <DialogActionsBar>
            <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
            <Button fillMode="solid" onClick={handleClearAllData}>Clear All</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
};

export default SettingsPage;
