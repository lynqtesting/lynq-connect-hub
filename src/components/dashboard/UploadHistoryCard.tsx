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
    <Card className="bg-card border-border hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center gap-2 p-4 sm:p-6">
        <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <CardTitle className="text-base sm:text-lg font-semibold">Upload History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent uploads
          </p>
        ) : (
          uploads.map((upload) => (
            <div 
              key={upload.id} 
              className="flex flex-col gap-1 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <h4 className="text-sm font-medium text-foreground truncate">{upload.title}</h4>
              <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                <span className="truncate">by {upload.author}</span>
                <span className="flex-shrink-0">{upload.date}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
