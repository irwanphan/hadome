import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  TextBox, 
  NumericTextBox 
} from '@progress/kendo-react-inputs';
import { 
  DatePicker 
} from '@progress/kendo-react-dateinputs';
import { 
  DropDownList 
} from '@progress/kendo-react-dropdowns';
import { 
  Grid, 
  GridColumn, 
  GridCellProps
} from '@progress/kendo-react-grid';
import { ReceiptData, ReceiptItem, AppSettings } from '../../types';
import { ReceiptService } from '../../services/receiptService';
import './ExpenseForm.css';

interface ExpenseFormProps {
  receipts: ReceiptData[];
  onSaveReceipt: (receipt: ReceiptData) => Promise<ReceiptData>;
  onUpdateReceipt: (id: string, updatedReceipt: Partial<ReceiptData>) => Promise<void>;
  settings: AppSettings;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  receipts, 
  onSaveReceipt, 
  onUpdateReceipt, 
  settings 
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState<Partial<ReceiptData>>({
    merchant: '',
    date: new Date(),
    total: 0,
    category: 'Other',
    items: [{ name: '', price: 0, quantity: 1 }]
  });
  
  const [newItem, setNewItem] = useState<ReceiptItem>({ name: '', price: 0, quantity: 1 });
  const [imageData, setImageData] = useState<string | null>(null);

  const categories = [
    'Food & Dining',
    'Groceries', 
    'Transportation',
    'Healthcare',
    'Shopping',
    'Utilities',
    'Entertainment',
    'Other'
  ];

  useEffect(() => {
    if (isEdit && id) {
      const receipt = receipts.find(r => r.id === id);
      if (receipt) {
        setFormData(receipt);
      }
    } else if (location.state?.receiptData) {
      // Coming from scan page
      const scannedData = location.state.receiptData;
      setFormData(scannedData);
      if (location.state.imageData) {
        setImageData(location.state.imageData);
      }
    }
  }, [id, isEdit, receipts, location.state]);

  const handleInputChange = (field: keyof ReceiptData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    
    // Recalculate total
    const total = updatedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    setFormData(prev => ({ ...prev, total }));
  };

  const addItem = () => {
    if (newItem.name.trim()) {
      const updatedItems = [...(formData.items || []), newItem];
      setFormData(prev => ({ ...prev, items: updatedItems }));
      
      // Recalculate total
      const total = updatedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setFormData(prev => ({ ...prev, total }));
      
      setNewItem({ name: '', price: 0, quantity: 1 });
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    
    // Recalculate total
    const total = updatedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    setFormData(prev => ({ ...prev, total }));
  };

  const handleSave = async () => {
    try {
      if (!formData.merchant || !formData.items || formData.items.length === 0) {
        alert('Please fill in all required fields');
        return;
      }

      const receiptData: ReceiptData = {
        id: isEdit ? id! : ReceiptService.generateReceiptId(),
        merchant: formData.merchant!,
        date: formData.date || new Date(),
        total: formData.total || 0,
        category: formData.category || 'Other',
        items: formData.items.filter(item => item.name.trim()),
        imageUrl: imageData || formData.imageUrl,
        rawText: formData.rawText,
        confidence: formData.confidence
      };

      if (isEdit) {
        await onUpdateReceipt(id!, receiptData);
      } else {
        await onSaveReceipt(receiptData);
      }

      navigate('/expenses');
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt');
    }
  };

  const ItemNameCell = (props: GridCellProps) => {
    const item = props.dataItem as ReceiptItem;
    const index = props.dataIndex;
    return (
      <td>
        <TextBox
          value={item.name}
          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
          placeholder="Item name"
        />
      </td>
    );
  };

  const ItemPriceCell = (props: GridCellProps) => {
    const item = props.dataItem as ReceiptItem;
    const index = props.dataIndex;
    return (
      <td>
        <NumericTextBox
          value={item.price}
          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
          format="c0"
          min={0}
        />
      </td>
    );
  };

  const ItemQuantityCell = (props: GridCellProps) => {
    const item = props.dataItem as ReceiptItem;
    const index = props.dataIndex;
    return (
      <td>
        <NumericTextBox
          value={item.quantity || 1}
          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
          min={1}
          max={999}
        />
      </td>
    );
  };

  const ItemTotalCell = (props: GridCellProps) => {
    const item = props.dataItem as ReceiptItem;
    const total = item.price * (item.quantity || 1);
    return (
      <td className="item-total">
        {ReceiptService.formatCurrency(total, settings.defaultCurrency)}
      </td>
    );
  };

  const ActionsCell = (props: GridCellProps) => {
    const index = props.dataIndex;
    return (
      <td className="actions-cell">
        <Button 
          icon="delete" 
          fillMode="flat"
          onClick={() => removeItem(index)}
          title="Remove item"
        />
      </td>
    );
  };

  return (
    <div className="expense-form-page">
      <div className="form-header">
        <h2>{isEdit ? 'Edit Receipt' : 'Add New Receipt'}</h2>
        <p>{isEdit ? 'Update receipt information' : 'Enter receipt details manually'}</p>
      </div>

      <div className="form-content">
        <Card className="receipt-info-card">
          <CardBody>
            <CardTitle>Receipt Information</CardTitle>
            <div className="form-fields">
              <div className="field-row">
                <div className="field-group">
                  <label>Merchant *</label>
                  <TextBox
                    value={formData.merchant || ''}
                    onChange={(e) => handleInputChange('merchant', e.target.value)}
                    placeholder="Enter merchant name"
                  />
                </div>
                
                <div className="field-group">
                  <label>Date *</label>
                  <DatePicker
                    value={formData.date || new Date()}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Category</label>
                  <DropDownList
                    data={categories}
                    value={formData.category || 'Other'}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  />
                </div>
                
                <div className="field-group">
                  <label>Total Amount</label>
                  <NumericTextBox
                    value={formData.total || 0}
                    onChange={(e) => handleInputChange('total', e.target.value)}
                    format="c0"
                    min={0}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="items-card">
          <CardBody>
            <CardTitle>Items</CardTitle>
            
            <div className="add-item-section">
              <div className="add-item-fields">
                <TextBox
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: String(e.target.value || '') }))}
                  placeholder="Item name"
                />
                <NumericTextBox
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value || 0 }))}
                  format="c0"
                  min={0}
                  placeholder="Price"
                />
                <NumericTextBox
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value || 1 }))}
                  min={1}
                  max={999}
                  placeholder="Qty"
                />
                <Button onClick={addItem} fillMode="solid">
                  Add Item
                </Button>
              </div>
            </div>

            <div className="items-grid">
              <Grid
                data={formData.items || []}
                style={{ height: '300px' }}
              >
                <GridColumn 
                  field="name" 
                  title="Item Name" 
                  width="200px"
                  cells={{ data: ItemNameCell }}
                />
                <GridColumn 
                  field="price" 
                  title="Price" 
                  width="120px"
                  cells={{ data: ItemPriceCell }}
                />
                <GridColumn 
                  field="quantity" 
                  title="Qty" 
                  width="80px"
                  cells={{ data: ItemQuantityCell }}
                />
                <GridColumn 
                  title="Total" 
                  width="120px"
                  cells={{ data: ItemTotalCell }}
                />
                <GridColumn 
                  title="Actions" 
                  width="80px"
                  cells={{ data: ActionsCell }}
                />
              </Grid>
            </div>
          </CardBody>
        </Card>

        {imageData && (
          <Card className="image-preview-card">
            <CardBody>
              <CardTitle>Receipt Image</CardTitle>
              <div className="image-preview">
                <img src={imageData} alt="Receipt" />
              </div>
            </CardBody>
          </Card>
        )}

        <div className="form-actions">
          <ButtonGroup>
            <Button onClick={() => navigate('/expenses')} fillMode="flat">
              Cancel
            </Button>
            <Button onClick={handleSave} fillMode="solid">
              {isEdit ? 'Update Receipt' : 'Save Receipt'}
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
