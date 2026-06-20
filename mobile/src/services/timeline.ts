import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ReportStatus, StrayReportDto } from '@/types';

export interface TimelineUpdate {
  id: string;
  reportId: string;
  authorId: string;
  status: ReportStatus;
  body: string;
  photoUrl: string | null;
  createdAt: string;
}

export const useTimeline = (reportId: string) =>
  useQuery({
    queryKey: ['timeline', reportId],
    queryFn: async () => {
      const res = await api.get<{ report: StrayReportDto; updates: TimelineUpdate[] }>(
        `/reports/${reportId}/timeline`,
      );
      return res.data;
    },
    enabled: !!reportId,
  });

export const usePostUpdate = (reportId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { status: ReportStatus; body: string; photoUrl?: string }) => {
      const res = await api.post(`/reports/${reportId}/updates`, vars);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timeline', reportId] }),
  });
};
