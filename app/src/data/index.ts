// Data layer — ALL data-fetching hooks and functions live in this folder.
//
// For a backend-stitched app, every wrapper around the SDK entity hooks
// (useSearchEntities / useFindEntityById / useCreateEntity / useUpdateEntity /
// useDeleteEntity from '@unifyapps/app-builder-sdk/hooks/object') is defined
// here — one hook per object (useTickets, useUsers, …) plus the mutation
// helpers. Components import them from '@/data' and NEVER call the SDK hooks
// directly. See the backend-integration skill.
export {}
