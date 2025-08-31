-- Create storage bucket for profile pictures
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true);

-- Create policies for profile pictures
create policy "Profile pictures are publicly accessible"
on storage.objects
for select
using (bucket_id = 'profile-pictures');

create policy "Users can upload their own profile picture"
on storage.objects
for insert
with check (
  bucket_id = 'profile-pictures' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own profile picture"
on storage.objects
for update
using (
  bucket_id = 'profile-pictures' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own profile picture"
on storage.objects
for delete
using (
  bucket_id = 'profile-pictures' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Add profile_picture_url to profiles table
alter table public.profiles 
add column profile_picture_url text;

-- Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- Create policies for notifications
create policy "Users can view their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications
for update
using (auth.uid() = user_id);

-- Create trigger for notifications updated_at
create trigger update_notifications_updated_at
before update on public.notifications
for each row
execute function public.update_updated_at_column();