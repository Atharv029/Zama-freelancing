import { Badge } from '@/components/ui/badge';
import { ProjectStatus, BidStatus } from '@/types/project';

interface StatusBadgeProps {
  status: ProjectStatus | BidStatus;
  type?: 'project' | 'bid';
}

export default function StatusBadge({ status, type = 'project' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === 'bid') {
      switch (status) {
        case BidStatus.Submitted:
          return { label: 'Submitted', className: 'bg-blue-500 text-white' };
        case BidStatus.Revealed:
          return { label: 'Revealed', className: 'bg-primary text-primary-foreground' };
        case BidStatus.Selected:
          return { label: 'Selected', className: 'bg-green-500 text-white' };
        case BidStatus.Rejected:
          return { label: 'Rejected', className: 'bg-destructive text-destructive-foreground' };
        case BidStatus.Withdrawn:
          return { label: 'Withdrawn', className: 'bg-muted text-muted-foreground' };
        default:
          return { label: 'Unknown', className: 'bg-muted text-muted-foreground' };
      }
    }
    
    switch (status) {
      case ProjectStatus.Active:
        return { label: 'Active', className: 'bg-primary text-primary-foreground' };
      case ProjectStatus.Closed:
        return { label: 'Closed', className: 'bg-warning text-warning-foreground' };
      case ProjectStatus.Revealing:
        return { label: 'Revealing', className: 'bg-accent text-accent-foreground' };
      case ProjectStatus.Selecting:
        return { label: 'Selecting', className: 'bg-accent text-accent-foreground' };
      case ProjectStatus.Completed:
        return { label: 'Completed', className: 'bg-green-500 text-white' };
      case ProjectStatus.Cancelled:
        return { label: 'Cancelled', className: 'bg-destructive text-destructive-foreground' };
      case ProjectStatus.InProgress:
        return { label: 'In Progress', className: 'bg-yellow-500 text-white' };
      case ProjectStatus.Disputed:
        return { label: 'Disputed', className: 'bg-orange-500 text-white' };
      default:
        return { label: 'Unknown', className: 'bg-muted text-muted-foreground' };
    }
  };

  const { label, className } = getStatusConfig();

  return <Badge className={className}>{label}</Badge>;
}
