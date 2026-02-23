-- Create a welcome notification for all existing users (demo)
INSERT INTO public.notifications (user_id, title, message, type)
SELECT id,
    'Welcome to AppFlux!',
    'Thanks for joining our community of indie developers. Get started by deploying your first app!',
    'success'
FROM auth.users ON CONFLICT DO NOTHING;