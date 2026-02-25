
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
    getMedicalEvents,
    getEventStats,
    createMedicalEvent,
    deleteMedicalEvent,
    updateMedicalEvent,
    getUpcomingEvents,
    getMedicalEvent
} from '@/lib/medicalEvents';
import { MedicalEventFormData, MedicalEvent, EventFilters } from '@/types/medicalEvents';

export const useMedicalEvent = (eventId?: string) => {
    const { user } = useAuth();

    // Fetch single event
    const {
        data: event,
        isLoading,
        error
    } = useQuery({
        queryKey: ['medicalEvent', eventId],
        queryFn: () => eventId ? getMedicalEvent(eventId) : null,
        enabled: !!eventId && !!user?.uid,
    });

    return {
        event,
        isLoading,
        error
    };
};

export const useMedicalEvents = (filters?: EventFilters) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const enabled = !!user?.uid;
    const userId = user?.uid || '';

    // Fetch all events
    const {
        data: events = [],
        isLoading: isLoadingEvents,
        error: eventsError
    } = useQuery({
        queryKey: ['medicalEvents', userId, filters],
        queryFn: () => getMedicalEvents(userId, filters),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch stats
    const {
        data: stats,
        isLoading: isLoadingStats
    } = useQuery({
        queryKey: ['medicalEventsStats', userId],
        queryFn: () => getEventStats(userId),
        enabled,
        staleTime: 10 * 60 * 1000,
    });

    // Fetch upcoming specifically (lightweight)
    const {
        data: upcomingEvents = [],
        isLoading: isLoadingUpcoming
    } = useQuery({
        queryKey: ['upcomingEvents', userId],
        queryFn: () => getUpcomingEvents(userId, 5),
        enabled,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: MedicalEventFormData) => createMedicalEvent(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicalEvents', userId] });
            queryClient.invalidateQueries({ queryKey: ['medicalEventsStats', userId] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents', userId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MedicalEventFormData> }) =>
            updateMedicalEvent(id, data, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicalEvents', userId] });
            queryClient.invalidateQueries({ queryKey: ['medicalEventsStats', userId] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents', userId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteMedicalEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicalEvents', userId] });
            queryClient.invalidateQueries({ queryKey: ['medicalEventsStats', userId] });
            queryClient.invalidateQueries({ queryKey: ['upcomingEvents', userId] });
        },
    });

    return {
        events,
        stats,
        upcomingEvents,
        isLoading: isLoadingEvents || isLoadingStats,
        createEvent: createMutation.mutateAsync,
        updateEvent: updateMutation.mutateAsync,
        deleteEvent: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
