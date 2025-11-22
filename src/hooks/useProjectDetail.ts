import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { Project, Bid, ProjectStatus, BidStatus } from '@/types/project';

export function useProjectDetail(projectId: number | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchProjectDetail = useCallback(async () => {
    if (!publicClient || projectId === undefined) return;

    try {
      setLoading(true);

      // Fetch project details
      const projectData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'projects',
        args: [BigInt(projectId)],
      } as any) as any;

      // Fetch bidders for this project
      const bidders = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getProjectBidders',
        args: [BigInt(projectId)],
      } as any) as string[];

      // Fetch bid details for each bidder
      const bidPromises = bidders.map(async (bidder) => {
        const bidData = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'bids',
          args: [BigInt(projectId), bidder as `0x${string}`],
        } as any) as any;

        return {
          freelancer: bidData[0],
          commitment: bidData[1],
          proposalHash: bidData[2],
          submittedAt: bidData[3],
          amount: bidData[4],
          stake: bidData[5],
          secret: bidData[6],
          revealed: bidData[7],
          status: bidData[8] as BidStatus,
        } as Bid;
      });

      const fetchedBids = await Promise.all(bidPromises);

      setProject({
        id: projectId,
        client: String(projectData[0]),
        title: projectData[1],
        descHash: projectData[2],
        description: '',
        category: '',
        budget: projectData[3],
        minBudget: projectData[4],
        maxBudget: '',
        deadline: projectData[5],
        escrow: BigInt(0),
        winner: String(projectData[6]),
        winnerBid: '',
        status: projectData[7] as ProjectStatus,
        createdAt: projectData[8],
        bidCount: projectData[9],
        revealed: projectData[10],
      });

      setBids(fetchedBids);
    } catch (error) {
      console.error('Error fetching project detail:', error);
    } finally {
      setLoading(false);
    }
  }, [publicClient, projectId]);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  return { project, bids, loading, refetch: fetchProjectDetail };
}
