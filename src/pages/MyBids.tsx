import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Eye, Clock } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { getBidSecret } from '@/lib/bidCommitment';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectStatus, Bid } from '@/types/project';

interface UserBidWithProject {
  projectId: number;
  projectTitle: string;
  projectStatus: ProjectStatus;
  bid: Bid;
  deadline: Date;
}

export default function MyBids() {
  const { address } = useAccount();
  const { projects, loading, refetch } = useProjects();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [userBids, setUserBids] = useState<UserBidWithProject[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);

  useEffect(() => {
    const fetchUserBids = async () => {
      if (!address || !projects.length || !publicClient) {
        setLoadingBids(false);
        return;
      }

      try {

        const bidsPromises = projects.map(async (project) => {
          try {
            const bidData = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'bids',
              args: [BigInt(project.id), address as `0x${string}`],
            } as any) as any;

            // Check if bid exists (freelancer address is not zero)
            if (bidData[0] !== '0x0000000000000000000000000000000000000000') {
              return {
                projectId: project.id,
                projectTitle: project.title,
                projectStatus: project.status,
                deadline: new Date(Number(project.deadline) * 1000),
                bid: {
                  freelancer: bidData[0],
                  commitment: bidData[1],
                  proposalHash: bidData[2],
                  submittedAt: bidData[3],
                  amount: bidData[4],
                  stake: bidData[5],
                  secret: bidData[6],
                  revealed: bidData[7],
                  status: bidData[8],
                } as Bid,
              };
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        const results = await Promise.all(bidsPromises);
        const validBids = results.filter((bid): bid is UserBidWithProject => bid !== null);
        setUserBids(validBids);
      } catch (error) {
        console.error('Error fetching user bids:', error);
      } finally {
        setLoadingBids(false);
      }
    };

    fetchUserBids();
  }, [address, projects, publicClient]);

  const handleRevealBid = async (projectId: number) => {
    const stored = getBidSecret(projectId);
    if (!stored) {
      toast.error('Bid secret not found. Cannot reveal.');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'revealBid',
        args: [BigInt(projectId), parseEther(stored.amount), stored.secret as `0x${string}`],
      } as any);

      toast.success('Revealing bid...');
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reveal bid');
    }
  };

  if (!address) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Bids</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Connect wallet to view your bids</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || loadingBids) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Bids</h1>

      {userBids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">You haven't submitted any bids yet</p>
            <Link to="/">
              <Button>Browse Projects</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userBids.map((item) => {
            const isPastDeadline = Date.now() > item.deadline.getTime();
            const canReveal = !item.bid.revealed && isPastDeadline && item.projectStatus === ProjectStatus.Revealing;

            return (
              <Card key={item.projectId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{item.projectTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">Project #{item.projectId}</p>
                    </div>
                    <StatusBadge status={item.projectStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-semibold">
                        {new Date(Number(item.bid.submittedAt) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">{item.deadline.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <StatusBadge status={item.bid.status} type="bid" />
                    </div>
                  </div>

                  {item.bid.revealed ? (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Bid Amount:</span>{' '}
                        <span className="font-semibold">{formatEther(item.bid.amount)} ETH</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Stake:</span>{' '}
                        <span className="font-semibold">{formatEther(item.bid.stake)} ETH</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Bid not revealed yet
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link to={`/project/${item.projectId}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Project
                      </Button>
                    </Link>
                    {canReveal && (
                      <Button
                        size="sm"
                        onClick={() => handleRevealBid(item.projectId)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Revealing...
                          </>
                        ) : (
                          'Reveal Bid'
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
