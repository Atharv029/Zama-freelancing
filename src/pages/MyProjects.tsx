import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye, DollarSign, Clock, Users } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { Link } from 'react-router-dom';
import { ProjectStatus } from '@/types/project';

export default function MyProjects() {
  const { address } = useAccount();
  const { projects, loading, refetch } = useProjects();
  const { writeContract, isPending } = useWriteContract();

  const myProjects = projects.filter(
    (p) => p.client.toLowerCase() === address?.toLowerCase()
  );

  const handleCancelProject = async (projectId: number) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'cancelProject',
        args: [BigInt(projectId)],
      } as any);

      toast.success('Cancelling project...');
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to cancel project');
    }
  };

  if (!address) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Projects</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Connect wallet to view your projects</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link to="/post-project">
          <Button>Post New Project</Button>
        </Link>
      </div>

      {myProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">You haven't posted any projects yet</p>
            <Link to="/post-project">
              <Button>Post Your First Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myProjects.map((project) => {
            const deadlineDate = new Date(Number(project.deadline) * 1000);
            const canCancel = project.status === ProjectStatus.Active && Number(project.bidCount) === 0;

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Project #{project.id}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">
                          {formatEther(project.minBudget)} - {formatEther(project.budget)} ETH
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Deadline</p>
                        <p className="font-semibold">{deadlineDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bids</p>
                        <p className="font-semibold">{Number(project.bidCount)}</p>
                      </div>
                    </div>
                  </div>

                  {project.winner && String(project.winner) !== '0x0000000000000000000000000000000000000000' && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Winner:</span>{' '}
                        <span className="font-mono font-semibold">
                          {String(project.winner).slice(0, 6)}...{String(project.winner).slice(-4)}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link to={`/project/${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    {canCancel && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelProject(project.id)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Project'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
