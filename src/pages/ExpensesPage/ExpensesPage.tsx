import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  GridColumn, 
  GridCellProps
} from '@progress/kendo-react-grid';
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
  DropDownList 
} from '@progress/kendo-react-dropdowns';
import { 
  DatePicker 
} from '@progress/kendo-react-dateinputs';
import { 
  TextBox 
} from '@progress/kendo-react-inputs';
import { 
  Dialog, 
  DialogActionsBar 
} from '@progress/kendo-react-dialogs';
import { ReceiptData, AppSettings } from '../../types';
import { ReceiptService } from '../../services/receiptService';
import './ExpensesPage.css';

interface ExpensesPageProps {
  receipts: ReceiptData[];
  onUpdateReceipt: (id: string, updatedReceipt: Partial<ReceiptData>) => Promise<void>;
  onDeleteReceipt: (id: string) => Promise<void>;
  settings: AppSettings;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ 
  receipts, 
  onUpdateReceipt, 
  onDeleteReceipt, 
  settings 
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(receipts.map(r => r.category)));
    return uniqueCategories.map(cat => ({ text: cat, value: cat }));
  }, [receipts]);

  const filteredData = useMemo(() => {
    let filtered = receipts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(receipt => receipt.category === categoryFilter);
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(receipt => receipt.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(receipt => receipt.date <= dateTo);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [receipts, searchTerm, categoryFilter, dateFrom, dateTo]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (event: any) => {
    setCategoryFilter(event.target.value);
  };

  const handleDateFromChange = (event: any) => {
    setDateFrom(event.target.value);
  };

  const handleDateToChange = (event: any) => {
    setDateTo(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setDateFrom(null);
    setDateTo(null);
  };

  const handleEdit = (receipt: ReceiptData) => {
    navigate(`/expense/${receipt.id}`);
  };

  const handleDelete = (receiptId: string) => {
    setReceiptToDelete(receiptId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (receiptToDelete) {
      await onDeleteReceipt(receiptToDelete);
      setShowDeleteDialog(false);
      setReceiptToDelete(null);
    }
  };

  const MerchantCell = (props: GridCellProps) => {
    const receipt = props.dataItem as ReceiptData;
    return (
      <td className="merchant-cell">
        <div className="merchant-info">
          <div className="merchant-name">{receipt.merchant}</div>
          <div className="merchant-category">{receipt.category}</div>
        </div>
      </td>
    );
  };

  const DateCell = (props: GridCellProps) => {
    const receipt = props.dataItem as ReceiptData;
    return (
      <td>
        {receipt.date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </td>
    );
  };

  const AmountCell = (props: GridCellProps) => {
    const receipt = props.dataItem as ReceiptData;
    return (
      <td className="amount-cell">
        {ReceiptService.formatCurrency(receipt.total, settings.defaultCurrency)}
      </td>
    );
  };

  const ItemsCell = (props: GridCellProps) => {
    const receipt = props.dataItem as ReceiptData;
    return (
      <td className="items-cell">
        <div className="items-preview">
          {receipt.items.slice(0, 2).map((item, index) => (
            <div key={index} className="item-preview">
              {item.name}
            </div>
          ))}
          {receipt.items.length > 2 && (
            <div className="more-items">+{receipt.items.length - 2} more</div>
          )}
        </div>
      </td>
    );
  };

  const ActionsCell = (props: GridCellProps) => {
    const receipt = props.dataItem as ReceiptData;
    return (
      <td className="actions-cell">
        <ButtonGroup>
          <Button 
            icon="edit" 
            fillMode="flat"
            onClick={() => handleEdit(receipt)}
            title="Edit"
          />
          <Button 
            icon="delete" 
            fillMode="flat"
            onClick={() => handleDelete(receipt.id)}
            title="Delete"
          />
        </ButtonGroup>
      </td>
    );
  };

  const totalAmount = filteredData.reduce((sum, receipt) => sum + receipt.total, 0);

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <h2>Expense Tracking</h2>
        <p>Manage and track your expenses from scanned receipts</p>
      </div>

      <div className="expenses-content">
        <Card className="summary-card">
          <CardBody>
            <CardTitle>Summary</CardTitle>
            <div className="summary-stats">
              <div className="stat">
                <div className="stat-value">{filteredData.length}</div>
                <div className="stat-label">Receipts</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {ReceiptService.formatCurrency(totalAmount, settings.defaultCurrency)}
                </div>
                <div className="stat-label">Total Amount</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {filteredData.length > 0 
                    ? ReceiptService.formatCurrency(totalAmount / filteredData.length, settings.defaultCurrency)
                    : ReceiptService.formatCurrency(0, settings.defaultCurrency)
                  }
                </div>
                <div className="stat-label">Average</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="filters-card">
          <CardBody>
            <CardTitle>Filters</CardTitle>
            <div className="filters-content">
              <div className="filter-row">
                <TextBox
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(String(e.target.value || ''))}
                  className="search-input"
                />
                <DropDownList
                  data={categories}
                  textField="text"
                  dataItemKey="value"
                  value={categoryFilter}
                  onChange={handleCategoryChange}
                  className="category-filter"
                />
              </div>
              <div className="filter-row">
                <DatePicker
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  placeholder="From Date"
                  className="date-filter"
                />
                <DatePicker
                  value={dateTo}
                  onChange={handleDateToChange}
                  placeholder="To Date"
                  className="date-filter"
                />
                <Button onClick={clearFilters} fillMode="flat">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="receipts-card">
          <CardBody>
            <CardTitle>Receipts</CardTitle>
            <Grid
              data={filteredData}
              style={{ height: '600px' }}
              className="receipts-grid"
            >
              <GridColumn 
                field="merchant" 
                title="Merchant" 
                width="200px"
                cells={{ data: MerchantCell }}
              />
              <GridColumn 
                field="date" 
                title="Date" 
                width="120px"
                cells={{ data: DateCell }}
              />
              <GridColumn 
                field="total" 
                title="Amount" 
                width="120px"
                cells={{ data: AmountCell }}
              />
              <GridColumn 
                field="items" 
                title="Items" 
                width="250px"
                cells={{ data: ItemsCell }}
              />
              <GridColumn 
                title="Actions" 
                width="100px"
                cells={{ data: ActionsCell }}
              />
            </Grid>
          </CardBody>
        </Card>
      </div>

      {showDeleteDialog && (
        <Dialog 
          title="Delete Receipt" 
          onClose={() => setShowDeleteDialog(false)}
        >
          <p>Are you sure you want to delete this receipt? This action cannot be undone.</p>
          <DialogActionsBar>
            <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button fillMode="solid" onClick={confirmDelete}>Delete</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </div>
  );
};

export default ExpensesPage;
