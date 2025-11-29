import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

interface UploadItem {
  id: string;
  title: string;
  author: string;
  date: string;
}

interface UploadHistoryCardProps {
  uploads: UploadItem[];
}

export function UploadHistoryCard({ uploads }: UploadHistoryCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2">
        <Upload className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-semibold">Upload History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent uploads
          </p>
        ) : (
          uploads.map((upload) => (
            <div key={upload.id} className="flex flex-col gap-1">
              <h4 className="text-sm font-medium text-foreground">{upload.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>by {upload.author}</span>
                <span>{upload.date}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
