import React, { useMemo } from 'react';
import { 
  Chart, 
  ChartSeries, 
  ChartSeriesItem, 
  ChartCategoryAxis, 
  ChartCategoryAxisItem,
  ChartValueAxis,
  ChartValueAxisItem,
  ChartLegend,
  ChartTooltip
} from '@progress/kendo-react-charts';
import { 
  Card, 
  CardBody, 
  CardTitle 
} from '@progress/kendo-react-layout';
import { 
  IconChartBar, 
  IconCalendar, 
  IconReceipt, 
  IconCalculator
} from '@tabler/icons-react';
import { ReceiptData, AppSettings, CategoryExpense } from '../../types';
import { ReceiptService } from '../../services/receiptService';
import './AnalyticsPage.css';

interface AnalyticsPageProps {
  receipts: ReceiptData[];
  settings: AppSettings;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ receipts, settings }) => {
  const analyticsData = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Monthly expenses
    const monthlyExpenses = receipts
      .filter(r => r.date >= currentMonth)
      .reduce((sum, r) => sum + r.total, 0);
    
    // Total expenses
    const totalExpenses = receipts.reduce((sum, r) => sum + r.total, 0);
    
    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>();
    receipts.forEach(receipt => {
      const existing = categoryMap.get(receipt.category) || { amount: 0, count: 0 };
      categoryMap.set(receipt.category, {
        amount: existing.amount + receipt.total,
        count: existing.count + 1
      });
    });
    
    const categoryBreakdown: CategoryExpense[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Monthly trend data
    const monthlyData = new Map<string, number>();
    receipts.forEach(receipt => {
      const monthKey = `${receipt.date.getFullYear()}-${String(receipt.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, existing + receipt.total);
    });
    
    const monthlyTrend = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('id-ID', { 
          month: 'short', 
          year: 'numeric' 
        }),
        amount
      }));
    
    // Recent receipts
    const recentReceipts = receipts
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
    
    return {
      totalExpenses,
      monthlyExpenses,
      categoryBreakdown,
      monthlyTrend,
      recentReceipts
    };
  }, [receipts]);

  const chartData = analyticsData.categoryBreakdown.map(item => ({
    category: item.category,
    value: item.amount,
    percentage: item.percentage
  }));

  const monthlyChartData = analyticsData.monthlyTrend.map(item => ({
    month: item.month,
    amount: item.amount
  }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Insights and trends from your expense data</p>
        </div>
        <div className="page-actions">
          <div className="date-range">
            <span className="date-label">Last updated:</span>
            <span className="date-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        <div className="stats-grid">
          <Card className="stat-card primary">
            <CardBody>
              <div className="stat-icon">
                <IconChartBar size={24} />
              </div>
              <div className="stat-content">
                <CardTitle>Total Expenses</CardTitle>
                <div className="stat-value">
                  {ReceiptService.formatCurrency(analyticsData.totalExpenses, settings.defaultCurrency)}
                </div>
                <div className="stat-subtitle">All time</div>
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card success">
            <CardBody>
              <div className="stat-icon">
                <IconCalendar size={24} />
              </div>
              <div className="stat-content">
                <CardTitle>This Month</CardTitle>
                <div className="stat-value">
                  {ReceiptService.formatCurrency(analyticsData.monthlyExpenses, settings.defaultCurrency)}
                </div>
                <div className="stat-subtitle">Current month</div>
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card info">
            <CardBody>
              <div className="stat-icon">
                <IconReceipt size={24} />
              </div>
              <div className="stat-content">
                <CardTitle>Total Receipts</CardTitle>
                <div className="stat-value">{receipts.length}</div>
                <div className="stat-subtitle">Receipts scanned</div>
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card warning">
            <CardBody>
              <div className="stat-icon">
                <IconCalculator size={24} />
              </div>
              <div className="stat-content">
                <CardTitle>Average Receipt</CardTitle>
                <div className="stat-value">
                  {ReceiptService.formatCurrency(
                    receipts.length > 0 ? analyticsData.totalExpenses / receipts.length : 0, 
                    settings.defaultCurrency
                  )}
                </div>
                <div className="stat-subtitle">Per receipt</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="charts-row">
          <Card className="chart-card">
            <CardBody>
              <CardTitle>Expenses by Category</CardTitle>
              <Chart style={{ height: '300px' }}>
                <ChartSeries>
                  <ChartSeriesItem 
                    type="pie" 
                    data={chartData}
                    field="value"
                    categoryField="category"
                    labels={{
                      visible: true
                    }}
                  />
                </ChartSeries>
                <ChartLegend visible={true} position="bottom" />
                <ChartTooltip />
              </Chart>
            </CardBody>
          </Card>

          <Card className="chart-card">
            <CardBody>
              <CardTitle>Monthly Trend</CardTitle>
              <Chart style={{ height: '300px' }}>
                <ChartSeries>
                  <ChartSeriesItem 
                    type="column" 
                    data={monthlyChartData}
                    field="amount"
                    categoryField="month"
                    color="#0078d4"
                  />
                </ChartSeries>
                <ChartCategoryAxis>
                  <ChartCategoryAxisItem />
                </ChartCategoryAxis>
                <ChartValueAxis>
                  <ChartValueAxisItem />
                </ChartValueAxis>
                <ChartTooltip />
              </Chart>
            </CardBody>
          </Card>
        </div>

        <div className="details-row">
          <Card className="category-breakdown-card">
            <CardBody>
              <CardTitle>Category Breakdown</CardTitle>
              <div className="category-list">
                {analyticsData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <div className="category-name">{category.category}</div>
                      <div className="category-count">{category.count} receipts</div>
                    </div>
                    <div className="category-amount">
                      <div className="amount">
                        {ReceiptService.formatCurrency(category.amount, settings.defaultCurrency)}
                      </div>
                      <div className="percentage">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="category-progress" 
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="recent-receipts-card">
            <CardBody>
              <CardTitle>Recent Receipts</CardTitle>
              <div className="recent-list">
                {analyticsData.recentReceipts.map((receipt, index) => (
                  <div key={index} className="recent-item">
                    <div className="recent-info">
                      <div className="recent-merchant">{receipt.merchant}</div>
                      <div className="recent-date">
                        {receipt.date.toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="recent-amount">
                      {ReceiptService.formatCurrency(receipt.total, settings.defaultCurrency)}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
