import { Download } from "lucide-react";
import { Button } from "./ui/Button";

interface DownloadReportProps {
  datasetId: string;
  filename: string;
}

export function DownloadReport({ datasetId, filename }: DownloadReportProps) {
  const handleDownload = async (format: 'json' | 'csv' | 'excel') => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload/${datasetId}/download?format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_report.${format === 'excel' ? 'csv' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="secondary"
        size="sm"
        icon={<Download className="w-4 h-4" />}
        onClick={() => handleDownload('csv')}
      >
        Download CSV
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<Download className="w-4 h-4" />}
        onClick={() => handleDownload('excel')}
      >
        Download Excel
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<Download className="w-4 h-4" />}
        onClick={() => handleDownload('json')}
      >
        Download JSON
      </Button>
    </div>
  );
}
