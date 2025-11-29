import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, FileCheck, MessageSquare, ClipboardList, BarChart3, ExternalLink } from 'lucide-react';
import { useAuthPersistence } from '@/hooks/useAuthPersistence';

// Mock data - replace with actual API calls
const mockResponses = [
  {
    id: '1',
    activity: 'Sales Fundamentals Quiz',
    type: 'Quiz',
    module: 'Sales Training 101',
    submittedAt: '2024-01-15',
    score: 92,
    status: 'Completed',
  },
  {
    id: '2',
    activity: 'Customer Feedback Poll',
    type: 'Poll',
    module: 'Customer Success',
    submittedAt: '2024-01-14',
    score: null,
    status: 'Submitted',
  },
  {
    id: '3',
    activity: 'Product Knowledge Assessment',
    type: 'Assessment',
    module: 'Product Training',
    submittedAt: '2024-01-12',
    score: 78,
    status: 'Completed',
  },
  {
    id: '4',
    activity: 'Q4 Goals Survey',
    type: 'Survey',
    module: 'Leadership Development',
    submittedAt: '2024-01-10',
    score: null,
    status: 'Submitted',
  },
  {
    id: '5',
    activity: 'Communication Skills Quiz',
    type: 'Quiz',
    module: 'Soft Skills Training',
    submittedAt: '2024-01-08',
    score: 85,
    status: 'Completed',
  },
];

const UserResponses = () => {
  const { user } = useAuthPersistence();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [responses, setResponses] = useState(mockResponses);

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === 'all' || response.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Quiz':
        return <FileCheck className="h-4 w-4" />;
      case 'Poll':
        return <BarChart3 className="h-4 w-4" />;
      case 'Assessment':
        return <ClipboardList className="h-4 w-4" />;
      case 'Survey':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileCheck className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-text-muted';
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        {status}
      </Badge>
    );
  };

  const handleDownloadCSV = () => {
    // CSV export logic
    const csvContent = [
      ['Activity', 'Type', 'Module', 'Submitted', 'Score', 'Status'],
      ...filteredResponses.map((r) => [
        r.activity,
        r.type,
        r.module,
        r.submittedAt,
        r.score?.toString() || 'N/A',
        r.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'responses.csv';
    a.click();
  };

  return (
    <DashboardLayout role="user">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Responses</h1>
            <p className="text-text-muted mt-1">
              Track your quiz, poll, assessment, and survey submissions
            </p>
          </div>
          <Button onClick={handleDownloadCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-surface border-border-default"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-bg-surface border-border-default">
              <SelectValue placeholder="Filter by Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="Sales Training 101">Sales Training 101</SelectItem>
              <SelectItem value="Customer Success">Customer Success</SelectItem>
              <SelectItem value="Product Training">Product Training</SelectItem>
              <SelectItem value="Leadership Development">Leadership Development</SelectItem>
              <SelectItem value="Soft Skills Training">Soft Skills Training</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Responses Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-bg-canvas border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredResponses.map((response) => (
                  <tr
                    key={response.id}
                    className="hover:bg-bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-text-primary">{response.activity}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-text-secondary">
                        {getTypeIcon(response.type)}
                        <span className="text-sm">{response.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-text-secondary">{response.module}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-text-secondary">{response.submittedAt}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-sm font-bold ${getScoreColor(response.score)}`}>
                        {response.score !== null ? `${response.score}%` : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(response.status)}</td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredResponses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted">No responses found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserResponses;
