import { useParams } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProjectStatus, BidStatus } from '@/types/project';
import StatusBadge from '@/components/StatusBadge';
import { generateSecret, createCommitment, hashProposal, storeBidSecret, getBidSecret, storeProposal, getProposal } from '@/lib/bidCommitment';
import { Loader2, Clock, DollarSign, User, Calendar } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = id ? parseInt(id) : undefined;
  const { address } = useAccount();
  const { project, bids, loading, refetch } = useProjectDetail(projectId);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClient = address && project?.client.toLowerCase() === address.toLowerCase();
  const userBid = bids.find(b => b.freelancer.toLowerCase() === address?.toLowerCase());
  const canSubmitBid = project && project.status === ProjectStatus.Active && !userBid && !isClient;
  const canRevealBid = userBid && !userBid.revealed && project && project.status === ProjectStatus.Revealing;
  const canSelectWinner = isClient && project?.status === ProjectStatus.Selecting;
  const canReleasePayment = isClient && project?.status === ProjectStatus.InProgress;

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit bid clicked', { projectId, bidAmount, proposal, address });
    
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!projectId) {
      toast.error('Invalid project');
      return;
    }
    
    if (!bidAmount) {
      toast.error('Please enter bid amount');
      return;
    }
    
    if (!proposal) {
      toast.error('Please enter your proposal');
      return;
    }

    try {
      setIsSubmitting(true);
      const amountWei = parseEther(bidAmount);
      
      console.log('Amount in Wei:', amountWei.toString());
      
      // Validate bid amount is within range
      if (project && (amountWei < project.minBudget || amountWei > project.budget)) {
        toast.error(`Bid must be between ${formatEther(project.minBudget)} and ${formatEther(project.budget)} ETH`);
        setIsSubmitting(false);
        return;
      }

      const secret = generateSecret();
      const commitment = createCommitment(amountWei, secret);
      const proposalHashValue = hashProposal(proposal);

      console.log('Generated commitment:', commitment);
      console.log('Generated proposal hash:', proposalHashValue);

      // Store bid secret and proposal locally
      storeBidSecret(projectId, secret, bidAmount);
      storeProposal(projectId, address, proposal);

      console.log('Calling writeContract...');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitBid',
        args: [BigInt(projectId), commitment as `0x${string}`, proposalHashValue as `0x${string}`],
        value: amountWei,
      } as any);

      toast.success('Bid submitted! Remember to reveal after deadline.');
      setBidAmount('');
      setProposal('');
      setTimeout(() => refetch(), 3000);
    } catch (error: any) {
      console.error('Bid submission error:', error);
      toast.error(error?.shortMessage || error?.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealBid = async () => {
    if (!projectId) return;

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

  const handleSelectWinner = async (winnerAddress: string) => {
    if (!projectId) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'selectWinner',
        args: [BigInt(projectId), winnerAddress as `0x${string}`],
      } as any);

      toast.success('Selecting winner...');
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to select winner');
    }
  };

  const handleReleasePayment = async () => {
    if (!project || !project.winner) return;

    const winnerBid = bids.find(b => b.freelancer.toLowerCase() === project.winner.toLowerCase());
    if (!winnerBid) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'releasePayment',
        args: [BigInt(project.id)],
        value: winnerBid.amount,
      } as any);

      toast.success('Releasing payment...');
      setTimeout(() => refetch(), 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to release payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Project not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deadlineDate = new Date(Number(project.deadline) * 1000);
  const isPastDeadline = Date.now() > deadlineDate.getTime();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{project.title}</CardTitle>
              <div className="flex gap-2 items-center text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-mono">{project.client.slice(0, 6)}...{project.client.slice(-4)}</span>
              </div>
            </div>
            <StatusBadge status={project.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Budget Range</p>
                <p className="font-semibold">{formatEther(project.minBudget)} - {formatEther(project.budget)} ETH</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-semibold">{deadlineDate.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bids</p>
                <p className="font-semibold">{Number(project.bidCount)}</p>
              </div>
            </div>
          </div>

          {project.descHash && (
            <div>
              <h3 className="font-semibold mb-2">Description Hash</h3>
              <p className="text-sm text-muted-foreground font-mono break-all">{project.descHash}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Submission Form */}
      {canSubmitBid && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <Label htmlFor="amount">Bid Amount (ETH) - You will stake this amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  placeholder="Enter bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Must be between {formatEther(project.minBudget)} and {formatEther(project.budget)} ETH
                </p>
              </div>
              <div>
                <Label htmlFor="proposal">Proposal</Label>
                <Textarea
                  id="proposal"
                  placeholder="Describe your approach and add your contact info (email, phone, etc.)"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Add your contact info - it will only show to the project creator if they select you as winner.
                </p>
              </div>
              <Button type="submit" disabled={isSubmitting || isPending || isConfirming} className="w-full">
                {(isSubmitting || isPending || isConfirming) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Bid...
                  </>
                ) : (
                  'Submit Bid'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reveal Bid */}
      {canRevealBid && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Reveal Your Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The deadline has passed. Reveal your bid to participate in winner selection.
            </p>
            <Button onClick={handleRevealBid} disabled={isPending || isConfirming}>
              {(isPending || isConfirming) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revealing...
                </>
              ) : (
                'Reveal Bid'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bids List */}
      {bids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submitted Bids ({bids.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bids.map((bid, index) => {
                const isWinner = project.winner && project.winner.toLowerCase() === bid.freelancer.toLowerCase();
                const proposalText = isClient && isWinner ? getProposal(projectId!, bid.freelancer) : null;
                
                return (
                  <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sm">
                        {bid.freelancer.slice(0, 6)}...{bid.freelancer.slice(-4)}
                        {bid.freelancer.toLowerCase() === address?.toLowerCase() && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">You</span>
                        )}
                        {isWinner && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">Winner</span>
                        )}
                      </span>
                      <StatusBadge status={bid.status} type="bid" />
                    </div>
                    
                    {bid.revealed ? (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Amount:</span>{' '}
                          <span className="font-semibold">{formatEther(bid.amount)} ETH</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Stake:</span>{' '}
                          <span className="font-semibold">{formatEther(bid.stake)} ETH</span>
                        </p>
                        
                        {/* Show proposal only to project creator after winner selection */}
                        {proposalText && (
                          <div className="mt-3 p-3 bg-background border border-border rounded">
                            <p className="text-xs font-semibold text-primary mb-2">Proposal & Contact Info:</p>
                            <p className="text-sm whitespace-pre-wrap">{proposalText}</p>
                          </div>
                        )}
                        
                        {canSelectWinner && bid.status === BidStatus.Revealed && (
                          <Button
                            size="sm"
                            onClick={() => handleSelectWinner(bid.freelancer)}
                            disabled={isPending || isConfirming}
                            className="mt-2"
                          >
                            Select as Winner
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Bid not revealed yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Release Payment */}
      {canReleasePayment && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Release Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Winner selected. Release payment to complete the project.
            </p>
            <Button onClick={handleReleasePayment} disabled={isPending || isConfirming}>
              {(isPending || isConfirming) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing...
                </>
              ) : (
                'Release Payment'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
