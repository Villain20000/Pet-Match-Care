import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/services/api';
import type { Species } from '@/types';

export type AdoptionState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCREENING'
  | 'HOME_CHECK_SCHEDULED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADOPTION_COMPLETED'
  | 'CLOSED';

export interface HomeEnvironment {
  hasYard: boolean;
  hasKids: boolean;
  hasOtherPets: boolean;
  hoursAlone: number;
}

export interface AdoptionApplication {
  id: string;
  petId: string;
  applicantId: string;
  state: AdoptionState;
  motivation: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  homeCheck: {
    scheduledAt: string;
    inspectorName: string;
    inspectorNotes: string | null;
    passed: boolean | null;
  } | null;
  audit: {
    id: string;
    fromState: AdoptionState;
    toState: AdoptionState;
    note: string | null;
    createdAt: string;
  }[];
  pet?: { id: string; name: string; imageUrl: string; species?: Species };
}

export interface DraftInput {
  petId: string;
  motivation: string;
  homeEnvironment: HomeEnvironment;
  questionnaire: Record<string, string | number | boolean>;
}

export const useMyApplications = () =>
  useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: async () => {
      const res = await api.get<{ count: number; applications: AdoptionApplication[] }>(
        '/adoption-applications/mine',
      );
      return res.data.applications;
    },
  });

export const useApplication = (id: string) =>
  useQuery({
    queryKey: ['applications', id],
    queryFn: async () => {
      const res = await api.get<{ application: AdoptionApplication }>(`/adoption-applications/${id}`);
      return res.data.application;
    },
    enabled: !!id,
  });

export const useCreateDraft = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DraftInput) => {
      const res = await api.post<{ success: boolean; application: AdoptionApplication }>(
        '/adoption-applications',
        input,
      );
      return res.data.application;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
};

export const useTransition = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { to: AdoptionState; note?: string; lastKnownUpdatedAt?: string }) => {
      const res = await api.post<{ success: boolean; application: AdoptionApplication }>(
        `/adoption-applications/${id}/transition`,
        vars,
      );
      return res.data.application;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const isStepUpRequired = (err: unknown): boolean =>
  (err as AxiosError)?.response?.status === 403 &&
  ((err as AxiosError).response?.data as { error?: string } | undefined)?.error === 'STEP_UP_REQUIRED';
