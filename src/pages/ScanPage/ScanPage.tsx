import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { 
  Button, 
  ButtonGroup 
} from '@progress/kendo-react-buttons';
import { 
  Card, 
  CardBody, 
  CardTitle 
} from '@progress/kendo-react-layout';
import { 
  Loader 
} from '@progress/kendo-react-indicators';
import { 
  Dialog, 
  DialogActionsBar 
} from '@progress/kendo-react-dialogs';
import { ReceiptService } from '../../services/receiptService';
import { ReceiptData, AppSettings } from '../../types';
import './ScanPage.css';

interface ScanPageProps {
  onReceiptScanned: (receipt: ReceiptData) => Promise<ReceiptData>;
  settings: AppSettings;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const ScanPage: React.FC<ScanPageProps> = ({ 
  onReceiptScanned, 
  settings, 
  showNotification 
}) => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Partial<ReceiptData> | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const videoConstraints = {
    width: 720,
    height: 1280, // Portrait orientation
    facingMode: "environment"
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 720,
        height: 1280
      });
      setCapturedImage(imageSrc);
      setShowPreview(true);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setShowPreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    try {
      setIsScanning(true);
      showNotification('Processing receipt...', 'info');

      // Convert data URL to File
      const response = await fetch(imageData);
      const blob = await response.blob();
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });

      // Perform OCR
      const ocrResult = await ReceiptService.scanReceipt(file, {
        language: settings.ocrLanguage === 'ind' ? 'ind+eng' : 'eng'
      });

      // Parse the text
      const parsedData = ReceiptService.parseReceiptText(ocrResult.text);
      
      // Auto-categorize if enabled
      if (settings.autoCategorize && parsedData.merchant && parsedData.items) {
        parsedData.category = ReceiptService.categorizeReceipt(
          parsedData.merchant, 
          parsedData.items
        );
      }

      setScanResult({
        ...parsedData,
        confidence: ocrResult.confidence,
        imageUrl: settings.saveImages ? imageData : undefined
      });

      showNotification('Receipt processed successfully!', 'success');
    } catch (error) {
      console.error('Error processing image:', error);
      showNotification('Error processing receipt. Please try again.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmSave = async () => {
    if (scanResult) {
      try {
        const receipt: ReceiptData = {
          id: ReceiptService.generateReceiptId(),
          date: scanResult.date || new Date(),
          merchant: scanResult.merchant || 'Unknown Merchant',
          total: scanResult.total || 0,
          category: scanResult.category || 'Other',
          items: scanResult.items || [],
          imageUrl: scanResult.imageUrl,
          rawText: scanResult.rawText,
          confidence: scanResult.confidence
        };

        await onReceiptScanned(receipt);
        navigate('/expenses');
      } catch (error) {
        console.error('Error saving receipt:', error);
        showNotification('Error saving receipt', 'error');
      }
    }
    setShowConfirmDialog(false);
    resetScan();
  };

  const resetScan = () => {
    setCapturedImage(null);
    setScanResult(null);
    setShowPreview(false);
    setShowConfirmDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetake = () => {
    resetScan();
  };

  const handleEditReceipt = () => {
    navigate('/expense/new', { 
      state: { 
        receiptData: scanResult,
        imageData: capturedImage 
      } 
    });
  };

  return (
    <div className="scan-page">
      <div className="scan-header">
        <h2>Scan Receipt</h2>
        <p>Capture or upload a receipt to automatically extract expense information</p>
      </div>

      <div className="scan-content">
        {!showPreview ? (
          <div className="scan-interface">
            <Card className="scan-card">
              <CardBody>
                <CardTitle>Choose Scanning Method</CardTitle>
                
                <ButtonGroup className="scan-mode-selector">
                  <Button 
                    fillMode={scanMode === 'camera' ? 'solid' : 'flat'}
                    onClick={() => setScanMode('camera')}
                  >
                    Camera
                  </Button>
                  <Button 
                    fillMode={scanMode === 'upload' ? 'solid' : 'flat'}
                    onClick={() => setScanMode('upload')}
                  >
                    Upload File
                  </Button>
                </ButtonGroup>

                {scanMode === 'camera' ? (
                  <div className="camera-section">
                    <div className="webcam-container">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="webcam"
                      />
                    </div>
                    <Button 
                      fillMode="solid"
                      onClick={capturePhoto}
                      className="capture-button"
                      disabled={isScanning}
                    >
                      {isScanning ? <Loader size="small" /> : 'Capture Photo'}
                    </Button>
                  </div>
                ) : (
                  <div className="upload-section">
                    <div className="upload-area">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                      <Button 
                        fillMode="solid"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                      >
                        {isScanning ? <Loader size="small" /> : 'Choose File'}
                      </Button>
                      <p>Supported formats: JPG, PNG, PDF</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="preview-section">
            <Card className="preview-card">
              <CardBody>
                <CardTitle>Receipt Preview</CardTitle>
                
                <div className="preview-content">
                  <div className="image-preview">
                    <img src={capturedImage!} alt="Captured receipt" />
                  </div>
                  
                  <div className="preview-actions">
                    <Button onClick={handleRetake}>Retake</Button>
                    <Button 
                      fillMode="solid"
                      onClick={() => capturedImage && processImage(capturedImage)}
                      disabled={isScanning}
                    >
                      {isScanning ? <Loader size="small" /> : 'Process Receipt'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {scanResult && (
          <div className="scan-result">
            <Card className="result-card">
              <CardBody>
                <CardTitle>Extracted Information</CardTitle>
                
                <div className="result-content">
                  <div className="result-field">
                    <label>Merchant:</label>
                    <span>{scanResult.merchant}</span>
                  </div>
                  
                  <div className="result-field">
                    <label>Date:</label>
                    <span>{scanResult.date?.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="result-field">
                    <label>Total:</label>
                    <span className="total-amount">
                      {ReceiptService.formatCurrency(scanResult.total || 0, settings.defaultCurrency)}
                    </span>
                  </div>
                  
                  <div className="result-field">
                    <label>Category:</label>
                    <span>{scanResult.category}</span>
                  </div>
                  
                  <div className="result-field">
                    <label>Items:</label>
                    <div className="items-list">
                      {scanResult.items?.map((item, index) => (
                        <div key={index} className="item">
                          <span>{item.name}</span>
                          <span>{ReceiptService.formatCurrency(item.price, settings.defaultCurrency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="result-field">
                    <label>Confidence:</label>
                    <span>{Math.round((scanResult.confidence || 0) * 100)}%</span>
                  </div>
                </div>
                
                <div className="result-actions">
                  <Button onClick={handleEditReceipt}>Edit Details</Button>
                  <Button 
                    fillMode="solid"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    Save Receipt
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <Dialog 
          title="Confirm Save" 
          onClose={() => setShowConfirmDialog(false)}
        >
          <p>Are you sure you want to save this receipt?</p>
          <DialogActionsBar>
            <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button fillMode="solid" onClick={handleConfirmSave}>Save</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
};

export default ScanPage;
