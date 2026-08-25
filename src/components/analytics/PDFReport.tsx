import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFReportProps {
  analytics: any;
  dateRange: string;
  chatbotName?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ analytics, dateRange, chatbotName }) => {
  const { toast } = useToast();

  const generatePDFReport = async () => {
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>CatchJar Analytics Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #3B82F6;
              margin: 0;
            }
            .header p {
              color: #666;
              margin: 10px 0 0 0;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .metric-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            .metric-value {
              font-size: 2em;
              font-weight: bold;
              color: #3B82F6;
              margin-bottom: 5px;
            }
            .metric-label {
              color: #666;
              font-size: 0.9em;
            }
            .section {
              margin-bottom: 40px;
            }
            .section h2 {
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 10px;
            }
            .chatbot-performance {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .performance-item {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
            }
            .performance-title {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 0.8em;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <p>Period: ${dateRange} ${chatbotName ? `• Chatbot: ${chatbotName}` : '• All Chatbots'}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${analytics.totalConversations}</div>
              <div class="metric-label">Total Conversations</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.totalLeads}</div>
              <div class="metric-label">Leads Generated</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.conversionRate.toFixed(1)}%</div>
              <div class="metric-label">Conversion Rate</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.totalMessages}</div>
              <div class="metric-label">Total Messages</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analytics.activeUsers}</div>
              <div class="metric-label">Active Users</div>
            </div>
          </div>
          
          <div class="section">
            <h2>Top Performing Chatbots</h2>
            <div class="chatbot-performance">
              ${analytics.topChatbots.map((bot: any) => `
                <div class="performance-item">
                  <div class="performance-title">${bot.name}</div>
                  <p>Conversations: ${bot.conversations}</p>
                  <p>Leads: ${bot.leads}</p>
                  <p>Conversion: ${bot.conversations > 0 ? ((bot.leads / bot.conversations) * 100).toFixed(1) : 0}%</p>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="section">
            <h2>Lead Sources Distribution</h2>
            ${analytics.leadSources.map((source: any) => `
              <div style="margin-bottom: 10px;">
                <strong>${source.source}:</strong> ${source.count} leads (${source.percentage.toFixed(1)}%)
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Generated by CatchJar Analytics Platform</p>
            <p>For more detailed insights, visit your dashboard at catchjar.com</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Downloaded",
        description: "Your analytics report has been downloaded as an HTML file. You can open it in any browser or convert to PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generatePDFReport}>
      <FileText className="mr-2 h-4 w-4" />
      Export HTML
    </Button>
  );
};

export default PDFReport;